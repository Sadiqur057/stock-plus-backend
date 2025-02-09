const {
  saveTransactionToDB,
  getAllTransaction,
  getSingleTransaction,
  updateTransactionDetails,
  deleteTransactionFromDB,
} = require("./transaction.service");

const getTransactions = async (req, res) => {
  const user = req.user;
  const result = await getAllTransaction(user);
  if (!result) {
    res.send({
      success: false,
      message: "No transaction found",
    });
  }
  res.send({
    success: true,
    message: "Transaction fetched successfully",
    data: result,
  });
};

const addTransaction = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const result = await saveTransactionToDB(data, user);
  if (!result.insertedId) {
    return res.send({
      success: false,
      message: "Transaction cannot be added",
    });
  }
  res.send({
    success: true,
    message: "Transaction added successfully",
  });
};

const deleteTransaction = async (req, res) => {
  const transactionId = req.params.id;
  const result = await deleteTransactionFromDB(transactionId);
  if (!result.deletedCount) {
    return res.send({
      success: false,
      message: "Transaction cannot be deleted.",
    });
  }
  return res.send({
    success: true,
    message: "Transaction deleted successfully.",
    data: result,
  });
};

const getTransaction = async (req, res) => {
  const transactionId = req.params.id;
  const result = await getSingleTransaction(transactionId);
  if (!result) {
    return res.send({
      success: false,
      message: "Transaction not found.",
    });
  }
  return res.send({
    success: true,
    message: "Transaction found.",
    data: result,
  });
};

const updateTransaction = async (req, res) => {
  const data = req.body;
  const transactionId = req.params.id;
  const result = await updateTransactionDetails(data, transactionId);
  if (!result.modifiedCount) {
    return res.send({
      success: false,
      message: "Transaction cannot be updated.",
    });
  }
  return res.send({
    success: true,
    message: "Transaction updated successfully",
    data: result,
  });
};
module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  getTransaction,
  deleteTransaction,
};
