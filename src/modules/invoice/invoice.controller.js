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
  const discount = data?.total_cost.discount || 0;
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
      subtotal: Number(data?.total_cost.subtotal.toFixed(2)),
      total: Number(data?.total_cost?.total.toFixed(2)),
      tax: Number(data?.total_cost?.tax.toFixed(2)),
      discount: Number(discount.toFixed()),
      total_paid: 0,
      total_due:
        Number(data?.total_cost?.total.toFixed(2)) -
        Number(discount.toFixed(2)),
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
  let paid_invoice_count = 0;
  const total_invoice_amount = result?.reduce((sum, invoice) => {
    if (invoice?.cost_summary?.status === "paid") {
      paid_invoice_count++;
    }
    return sum + (invoice?.cost_summary?.total || 0);
  }, 0);
  const updatedData = {
    invoices: result,
    invoice_summary: {
      invoice_count: result?.length,
      total_invoice_amount: total_invoice_amount,
      paid_invoice_count: paid_invoice_count,
      due_invoice_count: result?.length - paid_invoice_count,
    },
  };
  console.log("cel", updatedData);
  if (result.length < 0) {
    return res.send({
      success: false,
      message: "No Invoices Found",
    });
  }
  res.send({
    success: true,
    message: "Invoices fetched successfully",
    data: updatedData,
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

  const data = req.body;

  const result = await createTransactionToDB(id, data);
  res.send(result);
};

module.exports = { createInvoice, getInvoices, getInvoice, createTransaction,deleteInvoice };
