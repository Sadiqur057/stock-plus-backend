const { MongoClient, ServerApiVersion } = require("mongodb");

// mongodb+srv://<db_username>:<db_password>@cluster0.x7pm4nr.mongodb.net/

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x7pm4nr.mongodb.net/`;

console.log("MongoDB URI:", uri); // Log the URI to verify it's correct


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const DB = client.db("StockManagerDB");

module.exports = {
  client,
  DB,
  productCollection: DB.collection("products"),
  userCollection: DB.collection("users"),
  invoiceCollection: DB.collection("invoices"),
  customerCollection: DB.collection("customers"),
  attributeCollection: DB.collection("attributes"),
  transactionCollection: DB.collection("transactions"),
  revenueCollection: DB.collection("revenue"),
  inventoryCollection:DB.collection("inventory"),
  supplierCollection:DB.collection("supplier"),
};
