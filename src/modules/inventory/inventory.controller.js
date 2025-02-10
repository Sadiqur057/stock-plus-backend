const { ObjectId } = require("mongodb");
const {
  client,
  inventoryCollection,
  productCollection,
} = require("../../models/db");
const { getSingleReport, deleteReport } = require("./inventory.service");
const userServices = require("../user/user.service");
const addItems = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const targetUser = await userServices.getUserDetails(user);
  const products = data?.products;

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ message: "Invalid products data" });
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
      await inventoryCollection.insertOne(
        {
          ...data,
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
