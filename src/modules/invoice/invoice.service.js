const { ObjectId } = require("mongodb");
const {
  invoiceCollection,
  transactionCollection,
  DB,
  client,
} = require("../../models/db");

const saveInvoiceToDB = async (data) => {
  const result = await invoiceCollection.insertOne(data);
  return result;
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
  console.log(typeof amount);

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
    const { total, total_due, total_paid } = targetInvoice?.cost_summary;
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
