const { MongoClient, ServerApiVersion } = require("mongodb");

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x7pm4nr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.puy7l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

MongoClient.connect(uri, function(err, client) {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

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
