const { ObjectId } = require("mongodb");
const {
  invoiceCollection,
  transactionCollection,
  client,
  productCollection,
  revenueCollection,
} = require("../../models/db");
const { toFixedNumber } = require("../../utils/utility");

const saveInvoiceToDB = async (data, user) => {
  if (!data?.products || data?.products.length === 0) {
    return { success: false, message: "Please add at least one product." };
  }

  if (!data?.customer?.name || !data?.customer?.phone) {
    return { success: false, message: "Please add customer Information" };
  }


  const session = client.startSession();

  try {
    session.startTransaction();

    const productIds = data?.products.map((p) => new ObjectId(p._id));
    const existingProducts = await productCollection
      .find({ _id: { $in: productIds } }, { session })
      .toArray();

    const productMap = new Map(
      existingProducts.map((p) => [p._id.toString(), p])
    );

    let totalRevenue = 0;

    for (const product of data?.products) {
      const existingProduct = productMap.get(product._id);
      if (existingProduct && existingProduct.quantity < product.quantity) {
        throw new Error(
          `Insufficient stock for ${product.productName}. Available: ${existingProduct.quantity}, Required: ${product.quantity}`
        );
      }
    }

    for (const product of data?.products) {
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
      company_email: user?.company_email,
      created_by_email: user?.email,
      created_by_name: user?.name,
      customer_name: data?.customer?.name,
      customer_email: data?.customer?.email,
      products: data?.products,
    };

    const revenueResult = await revenueCollection.insertOne(revenueData, {
      session,
    });
    if (data?.transaction_data && data?.transaction_data?.amount > 0) {
      const { amount, payment_description, payment_method } =
        data?.transaction_data;
      const transactionData = {
        customer: { name: data?.customer?.name, email: data?.customer?.email },
        company_email: user?.company_email,
        created_by_email: user?.email,
        created_by_name: user?.name,
        payment_method,
        amount,
        transaction_desc: "sales",
        transaction_type: 'in',
        payment_description,
        created_at: data?.created_at,
      };
      const transactionResult = await transactionCollection.insertOne(
        transactionData,
        { session }
      );

      if (!transactionResult?.insertedId) {
        throw new Error("Something went wrong! Invoice was not created.");
      }
    }

    if (!revenueResult?.insertedId) {
      throw new Error("Something went wrong! Invoice was not created.");
    }

    const result = await invoiceCollection.insertOne(
      (({ transaction_data, ...rest }) => rest)(data),
      { session }
    );

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
  const query = { company_email: user?.company_email };
  const cursor = invoiceCollection.find(query).sort({ _id: -1 });
  const result = await cursor.toArray();
  return result;
};

const getInvoiceDetails = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await invoiceCollection.findOne(filter);
  return result;
};

const deleteInvoiceFromDB = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await invoiceCollection.deleteOne(filter);
  return result;
};

const createTransactionToDB = async (id, data, user) => {
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
            total_paid: toFixedNumber(total_paid + amount),
            total_due: toFixedNumber(total_due - amount),
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

    const formattedDate = new Date().toLocaleString();
    const transactionData = {
      customer: { name, email },
      company_email: user?.company_email,
      created_by_email: user?.email,
      created_by_name: user?.name,
      payment_method: data?.data?.payment_method,
      amount: data?.data?.amount,
      payment_description: data?.data?.payment_description,
      created_at: formattedDate,
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
  deleteInvoiceFromDB,
};
module.exports = invoiceServices;
