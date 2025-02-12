const { toFixedNumber } = require("../../utils/utility");
const userServices = require("../user/user.service");
const {
  saveInvoiceToDB,
  getAllInvoices,
  getInvoiceDetails,
  createTransactionToDB,
  deleteInvoiceFromDB,
} = require("./invoice.service");

const createInvoice = async (req, res) => {
  const user = req.user;
  const data = req.body;
  const targetUser = await userServices.getUserDetails(user);

  const { total_cost } = data || {};
  const discount = toFixedNumber(total_cost?.discount || 0);
  const subtotal = toFixedNumber(total_cost?.subtotal || 0);
  const tax = toFixedNumber(total_cost?.tax || 0);
  const total = toFixedNumber(total_cost?.total || 0);
  const total_paid = data?.transaction_data?.amount || 0;
  const total_due = toFixedNumber(total - total_paid);

  const status =
    total_due === 0
      ? "paid"
      : total_due === total
      ? "unpaid"
      : "partially paid";

  const updatedData = {
    company: {
      name: targetUser?.company_name,
      location: targetUser?.company_location,
      email: targetUser?.company_email,
      phone: targetUser?.company_phone,
    },
    customer: data?.customer,
    products: data?.products,
    company_email: user?.company_email,
    created_by_email: user?.email,
    created_by_name: user?.name,
    cost_summary: {
      subtotal,
      total,
      tax,
      discount,
      total_paid,
      total_due,
      status,
    },
    created_at: data?.created_at,
    transaction_data: data?.transaction_data,
  };

  const result = await saveInvoiceToDB(updatedData, user);
  if (!result?.success) {
    return res.send(result);
  }
  res.status(200).send(result);
};

const getInvoices = async (req, res) => {
  const user = req.user;
  const params = req.query;
  const result = await getAllInvoices(user, params);
  res.send(result);
};

const getInvoice = async (req, res) => {
  const id = req.params.id;
  const result = await getInvoiceDetails(id);
  if (!result) {
    return res.send({
      success: false,
      message: "Invoice Now Found",
    });
  }
  res.send({
    success: true,
    message: "Invoice fetched successfully",
    data: result,
  });
};

const deleteInvoice = async (req, res) => {
  const id = req.params.id;
  const result = await deleteInvoiceFromDB(id);
  if (!result.deletedCount) {
    return res.send({
      success: false,
      message: "Invoice Now Found",
    });
  }
  res.send({
    success: true,
    message: "Invoice deleted successfully",
  });
};

const createTransaction = async (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const data = req.body;

  const result = await createTransactionToDB(id, data, user);
  res.send(result);
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  createTransaction,
  deleteInvoice,
};
