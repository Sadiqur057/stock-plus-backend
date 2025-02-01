const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const productRoutes = require("./src/modules/product/product.route");
const authRoutes = require("./src/modules/auth/auth.route");
const userRoutes = require("./src/modules/user/user.route");
const invoiceRoutes = require("./src/modules/invoice/invoice.route");
const customerRoutes = require("./src/modules/customer/customer.route");
const attributeRoutes = require("./src/modules/attribute/attribute.route");

app.use(express.json());

const corsOptions = {
  origin: ["https://stock-plus-five.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

// app.use(cors(corsOptions));
app.use(cors());

app.use("/api", productRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", invoiceRoutes);
app.use("/api", customerRoutes);
app.use("/api", attributeRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Only start the server if this file is run directly
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
