const userServices = require("../user/user.service");
const {
  saveInvoiceToDB,
  getAllInvoices,
  getInvoiceDetails,
  createTransactionToDB,
} = require("./invoice.service");

const createInvoice = async (req, res) => {
  const user = req.user;
  const data = req.body;
  const targetUser = await userServices.getUserDetails(user);
  const updatedData = {
    company: {
      name: targetUser?.company_name,
      location: targetUser?.company_location,
      email: targetUser?.company_email,
      phone: targetUser?.company_phone,
    },
    customer: data?.customer,
    products: data?.products,
    created_by: targetUser.name,
    user_email: targetUser.email,
    cost_summary: {
      subtotal: data?.total_cost.subtotal,
      total: data?.total_cost.total,
      tax: data?.total_cost.tax,
      total_paid: 0,
      total_due: data?.total_cost?.total,
      status: "unpaid",
    },
    created_at: data?.created_at,
  };
  const result = await saveInvoiceToDB(updatedData);
  if (!result?.success) {
    return res.send(result);
  }
  res.status(200).send(result);
};

const getInvoices = async (req, res) => {
  const user = req.user;
  const result = await getAllInvoices(user);
  if (result.length < 0) {
    return res.send({
      success: false,
      message: "No Invoices Found",
    });
  }
  res.send({
    success: true,
    message: "Invoices fetched successfully",
    data: result,
  });
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

const createTransaction = async (req, res) => {
  const id = req.params.id;

  const data = req.body;

  const result = await createTransactionToDB(id, data);
  res.send(result);
};

module.exports = { createInvoice, getInvoices, getInvoice, createTransaction };
