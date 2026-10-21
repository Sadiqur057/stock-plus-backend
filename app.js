const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: [".env.local", ".env"] });
const app = express();

const routes = require("./src/routes/route");
const { client } = require("./src/models/db");

app.use(express.json());

const corsOptions = {
  origin: ["https://stock-plus-five.vercel.app", "http://localhost:3000","https://stockpluspro.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cors());

app.use("/", routes);

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

  client
    .connect()
    .then(() => client.db("admin").command({ ping: 1 }))
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection failed:", err.message));
}

module.exports = app;
