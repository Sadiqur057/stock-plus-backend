const { ObjectId } = require("mongodb");
const {
  invoiceCollection,
  transactionCollection,
  client,
  productCollection,
  revenueCollection,
} = require("../../models/db");

const saveInvoiceToDB = async (data) => {
  if (!data.products || data.products.length === 0) {
    return { success: false, message: "Please add at least one product." };
  }

  if (!data?.customer?.name) {
    return { success: false, message: "Please add customer Information" };
  }

  const session = client.startSession();

  try {
    session.startTransaction();

    const productIds = data.products.map((p) => new ObjectId(p._id));
    const existingProducts = await productCollection
      .find({ _id: { $in: productIds } }, { session })
      .toArray();

    const productMap = new Map(
      existingProducts.map((p) => [p._id.toString(), p])
    );

    let totalRevenue = 0;

    for (const product of data.products) {
      const existingProduct = productMap.get(product._id);
      if (existingProduct && existingProduct.quantity < product.quantity) {
        throw new Error(
          `Insufficient stock for ${product.productName}. Available: ${existingProduct.quantity}, Required: ${product.quantity}`
        );
      }
    }

    for (const product of data.products) {
      if (productMap.has(product._id)) {
        await productCollection.updateOne(
          { _id: new ObjectId(product._id) },
          { $inc: { quantity: -product.quantity } },
          { session }
        );
      }

      const existingProduct = productMap.get(product._id);
      if (existingProduct) {
        const profitPerUnit = product.salePrice - existingProduct.purchasePrice;
        totalRevenue += profitPerUnit * product.quantity;
      }
    }

    const updatedRevenue = totalRevenue - data?.cost_summary?.discount;
    const total_cost = data?.cost_summary?.total;
    const revenue_percentage = (updatedRevenue / total_cost) * 100;

    data.cost_summary.revenue = updatedRevenue;
    data.cost_summary.revenue_percentage = Number(
      revenue_percentage.toFixed(2)
    );

    const revenueData = {
      total_cost,
      revenue: updatedRevenue,
      revenue_percentage: Number(revenue_percentage.toFixed(2)),
      created_at: data?.created_at,
      created_by: data?.user_email,
      company_email: data?.company?.email,
    };

    const revenueResult = await revenueCollection.insertOne(revenueData, {
      session,
    });

    if (!revenueResult?.insertedId) {
      throw new Error("Something went wrong! Invoice was not created.");
    }

    const result = await invoiceCollection.insertOne(data, { session });

    if (!result?.insertedId) {
      throw new Error("Something went wrong! Invoice was not created.");
    }

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Success! Invoice created successfully.",
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

const getAllInvoices = async (user) => {
  const query = { user_email: user?.email };
  const cursor = invoiceCollection.find(query).sort({ _id: -1 });
  const result = await cursor.toArray();
  return result;
};

const getInvoiceDetails = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await invoiceCollection.findOne(filter);
  return result;
};

const createTransactionToDB = async (id, data) => {
  if (!ObjectId.isValid(id)) {
    return { success: false, message: "Invalid invoice ID." };
  }
  const { amount } = data?.data;

  if (typeof amount !== "number" || amount <= 0) {
    return { success: false, message: "Invalid payment amount." };
  }

  const session = client.startSession();
  try {
    session.startTransaction();

    const filter = { _id: new ObjectId(id) };

    const targetInvoice = await invoiceCollection.findOne(filter, { session });

    if (!targetInvoice) {
      await session.abortTransaction();
      return { success: false, message: "Invoice not found." };
    }

    const { name, email } = targetInvoice?.customer;
    const { total_due, total_paid } = targetInvoice?.cost_summary;
    const { created_by, user_email } = targetInvoice;

    if (amount > total_due) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Payment cannot exceed the due amount.",
      };
    }

    const updatedStatus = amount === total_due ? "paid" : "partially paid";

    const updateResult = await invoiceCollection.updateOne(
      filter,
      {
        $set: {
          cost_summary: {
            ...targetInvoice?.cost_summary,
            total_paid: total_paid + amount,
            total_due: total_due - amount,
            status: updatedStatus,
          },
        },
      },
      { session }
    );

    if (!updateResult.modifiedCount) {
      await session.abortTransaction();
      return { success: false, message: "Transaction update failed." };
    }

    const formattedData = new Date().toLocaleString();
    const transactionData = {
      customer: { name, email },
      added_by: user_email,
      user_name: created_by,
      payment_method: data?.data?.payment_method,
      amount: data?.data?.amount,
      payment_description: data?.data?.payment_description,
      created_at: formattedData,
    };

    const transactionResult = await transactionCollection.insertOne(
      transactionData,
      { session }
    );

    if (!transactionResult.insertedId) {
      await session.abortTransaction();
      return { success: false, message: "Transaction record creation failed." };
    }

    await session.commitTransaction();
    return { success: true, message: "Payment successful." };
  } catch (error) {
    await session.abortTransaction();
    return {
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    };
  } finally {
    session.endSession();
  }
};

const invoiceServices = {
  saveInvoiceToDB,
  getAllInvoices,
  getInvoiceDetails,
  createTransactionToDB,
};
module.exports = invoiceServices;
