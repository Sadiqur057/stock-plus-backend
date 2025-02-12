const { ObjectId } = require("mongodb");
const {
  productCollection,
  client,
  attributeCollection,
} = require("../../models/db");
const { getProductDetails } = require("./product.controller");

const getAllProducts = async (user, filters) => {
  const { search, filter, sort, limit, page } = filters;
  const query = { company_email: user?.company_email };

  if (filter && filter !== "all") {
    if (filter === "stockOut") {
      query.quantity = { $eq: 0 };
    } else if (filter === "inStock") {
      query.quantity = { $ne: 0 };
    }
  }

  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }

  let sortOptions = { _id: -1 };

  if (sort === "price-asc") {
    sortOptions = { salePrice: 1 };
  } else if (sort === "price-desc") {
    sortOptions = { salePrice: -1 };
  } else if (sort === "quantity-asc") {
    sortOptions = { quantity: 1 };
  } else if (sort === "quantity-desc") {
    sortOptions = { quantity: -1 };
  } else if (sort === "date-desc") {
    sortOptions = { created_at: 1 };
  } else if (sort === "date-desc") {
    sortOptions = { created_at: -1 };
  }

  const skip = (page - 1) * limit;
  const cursor = productCollection
    .find(query)
    .sort(sortOptions)
    .skip(parseInt(skip))
    .limit(parseInt(limit));
  const result = await cursor.toArray();
  const totalDocuments = await productCollection.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    success: true,
    message: "product fetched successfully",
    data: result,
    pagination: {
      totalPages,
      totalDocuments,
    },
  };
};

const getSingleProduct = async (id) => {
  const query = { _id: new ObjectId(id) };
  const result = await productCollection.findOne(query);
  return result;
};

const deleteProduct = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await productCollection.deleteOne(filter);
  return result;
};

const updateExistingProductStock = async (data, productId) => {
  const filter = { _id: new ObjectId(productId) };
  const targetProduct = await productCollection.findOne(filter);
  const { quantity } = targetProduct || {};
  const updatedData = {
    quantity: Number(data?.quantity) + quantity,
  };
  const updatedDoc = {
    $set: updatedData,
  };
  const result = await productCollection.updateOne(filter, updatedDoc);

  if (!result?.modifiedCount) {
    return {
      success: false,
      message: "Product is not updated",
    };
  }
  return {
    success: true,
    message: "Product stock updated successfully",
  };
};

const updateExistingProduct = async (data, productId, user) => {
  const session = client.startSession();
  session.startTransaction();

  try {
    const filter = { _id: new ObjectId(productId) };
    const updatedData = {
      ...data,
      salePrice: Number(data?.salePrice),
      purchasePrice: Number(data?.purchasePrice),
      quantity: Number(data?.quantity),
    };

    const updatedDoc = {
      $set: updatedData,
    };

    if (data?.attributes.length) {
      const attributes = data.attributes;
      const attributeQuery = { company_email: user?.company_email };

      const existingAttributes = await attributeCollection
        .find(attributeQuery, { session })
        .toArray();

      const result = await handleNewAttributes({
        attributes,
        existingAttributes,
        user,
        session,
      });
      if (!result?.success) {
        throw new Error("Cannot be updated");
      }
    }

    await productCollection.updateOne(filter, updatedDoc, {
      session,
    });

    await session.commitTransaction();
    session.endSession();
    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    console.error("Transaction failed:", error);
    await session.abortTransaction();
    session.endSession();
    return {
      success: false,
      message: "Something went wrong! Please try again.",
      error: error.message,
    };
  }
};

const addNewProduct = async (data, user) => {
  const session = client.startSession();
  try {
    session.startTransaction();

    if (data?.attributes.length) {
      const attributes = data.attributes;
      const attributeQuery = { company_email: user?.company_email };

      const existingAttributes = await attributeCollection
        .find(attributeQuery, { session })
        .toArray();

      const result = await handleNewAttributes({
        attributes,
        existingAttributes,
        user,
        session,
      });
      if (!result?.success) {
        throw new Error("Cannot be updated");
      }
    }

    const productData = {
      ...data,
      salePrice: Number(data?.salePrice),
      purchasePrice: Number(data?.purchasePrice),
      quantity: Number(data?.quantity),
      company_email: user?.company_email,
      created_by_email: user?.email,
      created_by_name: user?.name,
    };

    const result = await productCollection.insertOne(productData, { session });
    console.log("lets", result);
    if (result?.insertedId) {
      await session.commitTransaction();
      session.endSession();
      return {
        success: true,
        message: "Product Added Successfully",
      };
    } else {
      throw new Error("Product insertion failed!");
    }
  } catch (error) {
    console.error("Transaction failed:", error);

    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      message: "Something went wrong! Please try again.",
      error: error.message,
    };
  }
};

const handleNewAttributes = async ({
  attributes,
  existingAttributes,
  user,
  session,
}) => {
  const existingKeys = new Set(existingAttributes?.map((attr) => attr?.name));
  const newAttributes = attributes?.filter(
    (attr) => !existingKeys.has(attr.key)
  );

  if (!newAttributes.length) {
    return { success: true };
  }

  if (newAttributes?.length > 0) {
    const result = await attributeCollection.insertMany(
      newAttributes.map((attr) => ({
        company_email: user?.company_email,
        created_by_email: user?.email,
        created_by_name: user?.name,
        name: attr.key,
        description: attr.value,
      })),
      { session }
    );
    if (result?.insertedIds) {
      return { success: true };
    }
  }
};

const productServices = {
  addNewProduct,
  getAllProducts,
  getSingleProduct,
  getProductDetails,
  deleteProduct,
  updateExistingProduct,
  updateExistingProductStock,
  handleNewAttributes,
};

module.exports = productServices;
