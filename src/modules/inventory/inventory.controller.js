const { ObjectId } = require("mongodb");
const {
  client,
  inventoryCollection,
  productCollection,
  transactionCollection,
} = require("../../models/db");
const { getSingleReport, deleteReport } = require("./inventory.service");
const userServices = require("../user/user.service");
const { toFixedNumber } = require("../../utils/utility");
const addItems = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const targetUser = await userServices.getUserDetails(user);
  const products = data?.products;

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ message: "Invalid products data" });
  }
  if (!products?.length) {
    return res.send({
      success: false,
      message: "Please add at least one product",
    });
  }
  if (!data?.supplier?.name) {
    return res.send({
      success: false,
      message: "Please add supplier information",
    });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const existingProducts = [];
      const newProducts = [];

      products.forEach((product) => {
        if (product.existing) {
          existingProducts.push(product);
        } else {
          newProducts.push(product);
        }
      });

      // Update existing products
      for (const product of existingProducts) {
        const { temp_id, quantity } = product;
        const existingProduct = await productCollection.findOne(
          { _id: new ObjectId(temp_id) },
          { session }
        );

        if (existingProduct) {
          await productCollection.updateOne(
            { _id: new ObjectId(temp_id) },
            { $inc: { quantity: quantity } },
            { session }
          );
        }
      }

      // Insert new products
      if (newProducts.length > 0) {
        await productCollection.insertMany(
          newProducts.map(({ temp_id, existing, isNew, ...product }) => {
            product.company_email = user?.company_email;
            product.created_by_email = user?.email;
            product.created_by_name = data?.name;
            product.created_at = data?.created_at;
            return product;
          }),
          { session }
        );
      }

      // Add to inventory collection

      const total = toFixedNumber(data?.total_cost?.total);
      const paid = toFixedNumber(data?.total_cost?.paid) || 0;
      const due = total - paid;
      const inventoryResult = await inventoryCollection.insertOne(
        {
          ...data,
          total_cost: {
            ...data?.total_cost,
            total: total,
            paid: paid,
            due: toFixedNumber(due),
          },
          company_email: user?.company_email,
          created_by_email: user?.email,
          created_by_name: user?.name,
          company: {
            name: targetUser?.company_name,
            location: targetUser?.company_location,
            email: targetUser?.company_email,
            phone: targetUser?.company_phone,
          },
        },
        { session }
      );
      if (!inventoryResult?.insertedId) {
        throw new Error("Something went wrong");
      }
      const invoiceId = inventoryResult.insertedId;

      // start a transaction
      if (data?.transaction_data && data?.transaction_data?.amount > 0) {
        const { amount, payment_description, payment_method } =
          data?.transaction_data;
        const transactionData = {
          supplier: {
            name: data?.supplier?.name,
            email: data?.supplier?.email,
          },
          company_email: user?.company_email,
          created_by_email: user?.email,
          created_by_name: user?.name,
          payment_method,
          amount,
          payment_description,
          transaction_desc: "purchases",
          transaction_type: "out",
          created_at: data?.created_at,
          invoice_id: invoiceId,
        };
        const transactionResult = await transactionCollection.insertOne(
          transactionData,
          { session }
        );

        if (!transactionResult?.insertedId) {
          throw new Error("Something went wrong! Invoice was not created.");
        }
      }
    });

    res.send({ success: true, message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Transaction failed:", error);
    res.send({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

const getItems = async (req, res) => {
  const user = req.user;
  const query = { company_email: user?.company_email };
  const cursor = inventoryCollection.find(query);
  const result = await cursor.toArray();

  if (!result) {
    return res.send({
      success: false,
      message: "No item found",
    });
  }
  return res.send({
    success: true,
    message: "Inventory fetched successfully",
    data: result,
  });
};

const getInventoryReport = async (req, res) => {
  const id = req.params.id;
  const result = await getSingleReport(id);
  if (!result) {
    return res.send({ success: false, message: "No Report Found" });
  }
  res.send({ success: true, message: "Report Found", data: result });
};
const deleteInventoryReport = async (req, res) => {
  const id = req.params.id;
  const result = await deleteReport(id);
  if (!result.deletedCount) {
    return res.send({ success: false, message: "No Report Found" });
  }
  res.send({ success: true, message: "Report deleted successfully" });
};

module.exports = {
  addItems,
  getItems,
  getInventoryReport,
  deleteInventoryReport,
};
