const { invoiceCollection, transactionCollection } = require("../../models/db");

const getDashboardData = async (req, res) => {
  try {
    const { email } = req.user;
    const invoiceQuery = { user_email: email };
    const transactionQuery = { added_by: email };

    // Fetch invoices and transactions
    const invoiceData = await invoiceCollection
      .find(invoiceQuery)
      .sort({ _id: -1 })
      .toArray();
    const transactionData = await transactionCollection
      .find(transactionQuery)
      .sort({ _id: -1 })
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

    let uniqueCustomers = new Set();
    let invoiceStats = {};
    let paymentStats = {};
    let revenueStats = {};

    invoiceData.forEach((invoice) => {
      const costSummary = invoice.cost_summary || {};
      const customerId = invoice.customer?._id;

      if (customerId) {
        uniqueCustomers.add(customerId.toString());
      }

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
      invoices: invoiceData,
      transactions: transactionData,
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
        customer_count: uniqueCustomers.size,
      },
      invoiceChartData,
      paymentChartData,
      revenueChartData,
    };

    console.log(data);
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

module.exports = { getDashboardData };
