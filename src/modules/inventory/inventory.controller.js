const { ObjectId } = require("mongodb");
const { DB, client } = require("../../models/db");

const inventoryCollection = DB.collection("inventory");
const productCollection = DB.collection("products");

const addItems = async (req, res) => {
  const data = req.body;
  const user = req.user;
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

module.exports = { addItems, getItems };
