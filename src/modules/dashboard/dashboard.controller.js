const {
  invoiceCollection,
  transactionCollection,
  inventoryCollection,
} = require("../../models/db");
const {
  toFixedNumber,
  toISOStringDate,
  getDurationDates,
} = require("../../utils/utility");
const { getCurrencies } = require("./dashboard.service");

const getDashboardData = async (req, res) => {
  try {
    const { company_email } = req.user;
    const { start_date, end_date, customer_phone, duration } = req.query || {};

    let invoiceQuery = { company_email: company_email };
    let transactionQuery = {
      company_email: company_email,
      transaction_desc: "sales",
    };
    if (req?.query?.customer_phone) {
      invoiceQuery["customer.phone"] = customer_phone;
      transactionQuery["customer.phone"] = customer_phone;
    }

    if (start_date && end_date) {
      invoiceQuery.created_at = {
        $gte: toISOStringDate(start_date),
        $lte: toISOStringDate(end_date),
      };
      transactionQuery.created_at = {
        $gte: toISOStringDate(start_date),
        $lte: toISOStringDate(end_date),
      };
    } else if (duration) {
      const dateRange = getDurationDates(duration);
      console.log(dateRange);
      if (dateRange) {
        invoiceQuery.created_at = dateRange;
        transactionQuery.created_at = dateRange;
      }
    }

    // Fetch invoices
    const invoiceData = await invoiceCollection
      .find(invoiceQuery)
      .sort({ created_at: -1 })
      .toArray();
    const transactionData = await transactionCollection
      .find(transactionQuery)
      .sort({ created_at: -1 })
      .toArray();

    // Calculate summary
    const total_payment = transactionData.reduce(
      (sum, txn) => sum + (txn.amount || 0),
      0
    );
    const transaction_count = transactionData.length;
    const invoice_count = invoiceData.length;

    let paid_invoice_count = 0;
    let unpaid_invoice_count = 0;
    let due_invoice_count = 0;
    let due_invoice_amount = 0;
    let total_paid_amount = 0;
    let total_invoice_amount = 0;
    let total_revenue_amount = 0;

    let invoiceStats = {};
    let paymentStats = {};
    let revenueStats = {};

    invoiceData.forEach((invoice) => {
      const costSummary = invoice.total_cost || {};

      // Extract month and year from `created_at`
      const invoiceDate = new Date(invoice.created_at);
      const month = invoiceDate.toLocaleString("en-US", { month: "short" });
      const year = invoiceDate.getFullYear();
      const monthYear = `${month}-${year}`;

      // Initialize month data if not exists
      if (!invoiceStats[monthYear]) {
        invoiceStats[monthYear] = {
          total_invoice_created: 0,
          total_invoice_amount: 0,
        };
      }
      if (!paymentStats[monthYear]) {
        paymentStats[monthYear] = { paid_amount: 0, due_amount: 0 };
      }
      if (!revenueStats[monthYear]) {
        revenueStats[monthYear] = { cost: 0, revenue: 0 };
      }

      // Update total invoice stats
      invoiceStats[monthYear].total_invoice_created += 1;
      invoiceStats[monthYear].total_invoice_amount += costSummary.total || 0;

      // Update revenue stats
      const revenue = costSummary.revenue || 0;
      const cost = (costSummary.total || 0) - revenue;
      revenueStats[monthYear].revenue += revenue;
      revenueStats[monthYear].cost += cost;
      total_revenue_amount += revenue;

      // Update payment stats
      total_invoice_amount += costSummary.total || 0;

      if (costSummary.status === "paid") {
        paid_invoice_count++;
        paymentStats[monthYear].paid_amount += costSummary.total_paid || 0;
        total_paid_amount += costSummary.total_paid || 0;
      } else if (costSummary.status === "unpaid") {
        unpaid_invoice_count++;
        paymentStats[monthYear].due_amount += costSummary.total_due || 0;
        due_invoice_amount += costSummary.total_due || 0;
      } else if (costSummary.status === "partially paid") {
        due_invoice_count++;
        paymentStats[monthYear].paid_amount += costSummary.total_paid || 0;
        paymentStats[monthYear].due_amount += costSummary.total_due || 0;
        total_paid_amount += costSummary.total_paid || 0;
        due_invoice_amount += costSummary.total_due || 0;
      }
    });

    // Convert objects to arrays for chart data & sort by date (latest first)
    const invoiceChartData = Object.keys(invoiceStats)
      .map((monthYear) => ({
        name: monthYear,
        total_invoice_created: invoiceStats[monthYear].total_invoice_created,
        total_invoice_amount: invoiceStats[monthYear].total_invoice_amount,
      }))
      .sort((a, b) => new Date(b.name) - new Date(a.name));

    const paymentChartData = Object.keys(paymentStats)
      .map((monthYear) => ({
        month: monthYear,
        paid_amount: paymentStats[monthYear].paid_amount,
        due_amount: paymentStats[monthYear].due_amount,
      }))
      .sort((a, b) => new Date(b.month) - new Date(a.month));

    const revenueChartData = Object.keys(revenueStats)
      .map((monthYear) => ({
        month: monthYear,
        cost: revenueStats[monthYear].cost,
        revenue: revenueStats[monthYear].revenue,
      }))
      .sort((a, b) => new Date(b.month) - new Date(a.month));

    // Prepare response data
    const data = {
      invoices: invoiceData?.slice(0, 5),
      transactions: transactionData?.slice(0, 5),
      summary: {
        invoice_count,
        total_payment,
        due_invoice_count: unpaid_invoice_count + due_invoice_count,
        due_invoice_amount,
        total_paid_amount,
        total_invoice_amount,
        total_revenue_amount,
        transaction_count,
        total_sell: total_payment + due_invoice_amount,
      },
      invoiceChartData: invoiceChartData.slice(0, 12),
      paymentChartData: paymentChartData.slice(0, 12),
      revenueChartData: revenueChartData.slice(0, 12),
    };

    return res.status(200).send({
      success: true,
      message: "Data fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).send({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};

const getAccountingData = async (req, res) => {
  const user = req.user;
  const { start_date, end_date, duration } = req.query || {};
  const query = { company_email: user?.company_email };

  if (start_date && end_date) {
    query.created_at = {
      $gte: toISOStringDate(start_date),
      $lte: toISOStringDate(end_date),
    };
  } else if (duration) {
    const dateRange = getDurationDates(duration);
    console.log(dateRange);
    if (dateRange) {
      query.created_at = dateRange;
    }
  }

  const transactionCursor = transactionCollection.find(query);
  const transactions = await transactionCursor.toArray();

  if (!transactions || transactions.length === 0) {
    return res.send({
      success: false,
      message: "No Data Found",
    });
  }
  const invoiceCursor = invoiceCollection.find(query);
  const invoices = await invoiceCursor.toArray();
  const inventoryCursor = inventoryCollection.find(query);
  const inventory = await inventoryCursor.toArray();

  let sales_paid_amount = 0;
  const total_sales_invoice_amount = invoices?.reduce((sum, invoice) => {
    sales_paid_amount =
      sales_paid_amount + (invoice?.total_cost?.total_paid || 0);
    return sum + (invoice?.total_cost?.total || 0);
  }, 0);

  let purchase_paid_amount = 0;
  const total_purchase_invoice_amount = inventory?.reduce((sum, invoice) => {
    purchase_paid_amount =
      purchase_paid_amount + (invoice?.total_cost?.paid || 0);
    return sum + (invoice?.total_cost?.total || 0);
  }, 0);

  let total_sales = 0;
  let total_purchase = 0;
  let other_costs = 0;

  let invoiceStats = {};

  transactions.forEach((transaction) => {
    // Extract month and year from `created_at`
    const invoiceDate = new Date(transaction.created_at);
    const month = invoiceDate.toLocaleString("en-US", { month: "short" });
    const year = invoiceDate.getFullYear();
    const monthYear = `${month}-${year}`;

    // Initialize month data if not exists
    if (!invoiceStats[monthYear]) {
      invoiceStats[monthYear] = {
        expense: 0,
        sales: 0,
      };
    }

    if (transaction.transaction_desc === "sales") {
      invoiceStats[monthYear].sales += transaction.amount || 0;
      total_sales += transaction.amount;
    } else if (transaction.transaction_desc === "purchases") {
      total_purchase += transaction.amount;
      invoiceStats[monthYear].expense += transaction.amount || 0;
    } else if (transaction.transaction_desc === "other") {
      other_costs += transaction.amount;
      invoiceStats[monthYear].expense += transaction.amount || 0;
    }
  });
  const total_expense = toFixedNumber(total_purchase + other_costs);
  const profit = toFixedNumber(total_sales - total_expense);
  const profit_percentage = toFixedNumber((profit / total_expense) * 100);

  const invoiceChartData = Object.keys(invoiceStats)
    .map((monthYear) => ({
      name: monthYear,
      sales: invoiceStats[monthYear].sales,
      expense: invoiceStats[monthYear].expense,
    }))
    .sort((a, b) => new Date(b.name) - new Date(a.name));

  res.send({
    success: true,
    message: "Data fetched successfully",
    data: {
      transactions,
      chartData: invoiceChartData.slice(0, 12),
      summary: {
        profit,
        profit_percentage,
        total_expense,
        total_sales,
        total_purchase,
        other_costs,
      },
      sales_purchase_summary: {
        sales_invoice_summary: {
          invoice_count: invoices?.length,
          total_invoice_amount: total_sales_invoice_amount,
          total_paid_amount: sales_paid_amount,
          total_due_amount: toFixedNumber(
            total_sales_invoice_amount - sales_paid_amount || 0
          ),
        },
        purchase_invoice_summary: {
          invoice_count: inventory?.length,
          total_invoice_amount: total_purchase_invoice_amount,
          total_paid_amount: purchase_paid_amount,
          total_due_amount: toFixedNumber(
            total_purchase_invoice_amount - purchase_paid_amount || 0
          ),
        },
      },
    },
  });
};

const getCurrenciesData = async (req, res) => {
  try {
    const result = await getCurrencies();
    return res.send({
      success: true,
      message: "Data Fetched Successfully",
      data: result,
    });
  } catch (error) {
    console.error("error fetching data", error);
  }
};

module.exports = { getDashboardData, getAccountingData, getCurrenciesData };
