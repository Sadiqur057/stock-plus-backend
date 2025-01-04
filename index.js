const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x7pm4nr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const DB = client.db("StockManagerDB");
    const productCollection = DB.collection("products");

    app.get("/products", async (req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      return res.send({
        success: true,
        message: "Successfully fetched data",
        data: result
      });
    });
    app.post("/add-product", async (req, res) => {
      const data = req.body;

      if (!data?.productName || !data?.company || !data?.quantity) {
        return res.send({
          success: false,
          message: "Please fill all the required field",
        });
      }

      const result = await productCollection.insertOne(data);
      console.log(result);
      if (result?.insertedId) {
        return res.send({
          success: true,
          message: "Product Added Successfully",
          data: data,
        });
      } else {
        return res.send({
          success: false,
          message: "Something went wrong! Please try again.",
        });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
