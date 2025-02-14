const { ObjectId } = require("mongodb");
const {
  inventoryCollection,
  client,
  transactionCollection,
} = require("../../models/db");
const { toFixedNumber } = require("../../utils/utility");

const getSingleReport = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await inventoryCollection.findOne(filter);
  return result;
};

const deleteReport = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await inventoryCollection.deleteOne(filter);
  return result;
};

const saveInventoryTransactionToDB = async (id, data, user) => {
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

    const targetInvoice = await inventoryCollection.findOne(filter, {
      session,
    });

    console.log("invoice found");

    if (!targetInvoice) {
      await session.abortTransaction();
      return { success: false, message: "Invoice not found." };
    }

    const { name, email, phone } = targetInvoice?.supplier;
    const { due, paid } = targetInvoice?.total_cost;
    if (amount > due) {
      await session.abortTransaction();
      return {
        success: false,
        message: "Payment cannot exceed the due amount.",
      };
    }

    const updatedStatus = amount === due ? "paid" : "partially paid";

    const updateResult = await inventoryCollection.updateOne(
      filter,
      {
        $set: {
          total_cost: {
            ...targetInvoice?.total_cost,
            paid: toFixedNumber(paid + amount),
            due: toFixedNumber(due - amount),
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
      supplier: { name, email, phone },
      company_email: user?.company_email,
      created_by_email: user?.email,
      created_by_name: user?.name,
      payment_method: data?.data?.payment_method,
      amount: data?.data?.amount,
      payment_description: data?.data?.payment_description,
      created_at: formattedDate,
      transaction_desc: "purchases",
      transaction_type: "out",
      invoice_id: id,
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
module.exports = {
  getSingleReport,
  deleteReport,
  saveInventoryTransactionToDB,
};
