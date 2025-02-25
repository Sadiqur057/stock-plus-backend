const { ObjectId } = require("mongodb");
const {
  invoiceCollection,
  transactionCollection,
  client,
  productCollection,
  revenueCollection,
} = require("../../models/db");
const {
  toFixedNumber,
  getDurationDates,
  toISOStringDate,
} = require("../../utils/utility");

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

    const updatedRevenue = totalRevenue - data?.total_cost?.discount;
    const total_cost = data?.total_cost?.total;
    const revenue_percentage = (updatedRevenue / total_cost) * 100;

    data.total_cost.revenue = updatedRevenue;
    data.total_cost.revenue_percentage = Number(revenue_percentage.toFixed(2));

    const revenueData = {
      total_cost,
      revenue: updatedRevenue,
      revenue_percentage: Number(revenue_percentage.toFixed(2)),
      created_at: data?.created_at,
      company_email: user?.company_email,
      created_by_email: user?.email,
      created_by_name: user?.name,
      customer: data?.customer,
      products: data?.products,
    };

    const revenueResult = await revenueCollection.insertOne(revenueData, {
      session,
    });

    const invoiceResult = await invoiceCollection.insertOne(
      (({ transaction_data, ...rest }) => rest)(data),
      { session }
    );

    if (!invoiceResult?.insertedId) {
      throw new Error("Something went wrong! Invoice was not created.");
    }

    if (data?.transaction_data && data?.transaction_data?.amount > 0) {
      const { amount, payment_description, payment_method } =
        data?.transaction_data;
      const transactionData = {
        customer: {
          name: data?.customer?.name,
          email: data?.customer?.email,
          phone: data?.customer?.phone,
        },
        company_email: user?.company_email,
        created_by_email: user?.email,
        created_by_name: user?.name,
        payment_method,
        amount,
        transaction_desc: "sales",
        transaction_type: "in",
        payment_description,
        created_at: data?.created_at,
        invoice_id: invoiceResult?.insertedId.toString(),
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

const getAllInvoices = async (user, params) => {
  const {
    limit,
    page,
    start_date,
    end_date,
    customer_phone,
    duration,
    status,
  } = params || {};

  let query = { company_email: user?.company_email };

  if (params?.customer_phone) {
    query["customer.phone"] = customer_phone;
  }

  if (status && status !== "all") {
    query["total_cost.status"] = status;
  }

  if (start_date && end_date) {
    query.created_at = {
      $gte: toISOStringDate(start_date),
      $lte: toISOStringDate(end_date),
    };
  } else if (duration) {
    const dateRange = getDurationDates(duration);
    if (dateRange) {
      query.created_at = dateRange;
    }
  }
  const skip = (page - 1) * limit;
  const cursor = invoiceCollection
    .find(query)
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .sort({ created_at: -1 });
  const result = await cursor.toArray();
  const totalDocuments = await invoiceCollection.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / limit);
  if (!result) {
    return {
      data: result,
      success: false,
      message: "No Invoice found.",
    };
  }

  let paid_amount = 0;
  const total_invoice_amount = result?.reduce((sum, invoice) => {
    paid_amount = paid_amount + (invoice?.total_cost?.total_paid || 0);
    return sum + (invoice?.total_cost?.total || 0);
  }, 0);

  const updatedData = {
    invoices: result,
    invoice_summary: {
      invoice_count: result?.length,
      total_invoice_amount: total_invoice_amount,
      total_paid_amount: paid_amount,
      total_due_amount: toFixedNumber(total_invoice_amount - paid_amount || 0),
    },
    pagination: {
      totalDocuments,
      totalPages,
    },
  };
  return {
    success: true,
    message: "Invoices fetched successfully",
    data: updatedData,
  };
};

const getInvoiceDetails = async (id) => {
  const filter = { _id: new ObjectId(id) };
  const result = await invoiceCollection.findOne(filter);
  if (!result) {
    return {
      success: false,
      message: "Invoice Now Found",
    };
  }
  const transactionQuery = { invoice_id: id };
  const transactionData = await transactionCollection
    .find(transactionQuery)
    .sort({ created_at: -1 })
    .toArray();
  const transactions = transactionData.map((transaction) => {
    return {
      _id: transaction?._id,
      amount: transaction?.amount,
      created_at: transaction?.created_at,
      payment_method: transaction?.payment_method,
    };
  });
  const updatedData = {
    invoice: result,
    transactions,
  };
  return {
    success: true,
    message: "Invoice fetched successfully",
    data: updatedData,
  };
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

    const { name, email, phone } = targetInvoice?.customer;
    const { total_due, total_paid } = targetInvoice?.total_cost;

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
          total_cost: {
            ...targetInvoice?.total_cost,
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
      customer: { name, email, phone },
      company_email: user?.company_email,
      created_by_email: user?.email,
      created_by_name: user?.name,
      payment_method: data?.data?.payment_method,
      amount: data?.data?.amount,
      payment_description: data?.data?.payment_description,
      created_at: formattedDate,
      transaction_desc: "sales",
      transaction_type: "in",
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

const invoiceServices = {
  saveInvoiceToDB,
  getAllInvoices,
  getInvoiceDetails,
  createTransactionToDB,
  deleteInvoiceFromDB,
};
module.exports = invoiceServices;
