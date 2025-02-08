const productRoutes = require("../modules/product/product.route");
const authRoutes = require("../modules/auth/auth.route");
const userRoutes = require("../modules/user/user.route");
const invoiceRoutes = require("../modules/invoice/invoice.route");
const customerRoutes = require("../modules/customer/customer.route");
const attributeRoutes = require("../modules/attribute/attribute.route");
const transactionRoutes = require("../modules/transaction/transaction.route");
const dashboardRoutes = require("../modules/dashboard/dashboard.route");

const router = require("express").Router();

const routes = [
  {
    path: "/api",
    routes: authRoutes
  },
  {
    path: "/api",
    routes: userRoutes
  },
  {
    path: "/api",
    routes: productRoutes
  },
  {
    path: "/api",
    routes: invoiceRoutes
  },
  {
    path: "/api",
    routes: customerRoutes
  },
  {
    path: "/api",
    routes: attributeRoutes
  },
  {
    path: "/api",
    routes: transactionRoutes
  },
  {
    path: "/api",
    routes: dashboardRoutes
  },
]

routes.forEach(route => {
  router.use(route.path, route.routes);
});

module.exports = router;