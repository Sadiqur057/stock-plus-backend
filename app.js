const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const productRoutes = require("./src/modules/product/product.route");
const authRoutes = require("./src/modules/auth/auth.route");
const userRoutes = require("./src/modules/user/user.route");
app.use(express.json());

const corsOptions = {
  origin: ["https://stock-plus-five.vercel.app", "http://localhost:3000",],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use("/api", productRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
