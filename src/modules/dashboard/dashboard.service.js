const { DB } = require("../../models/db");

const currencyCollection = DB.collection("currencies");
const getCurrencies = async () => {
  const cursor = currencyCollection.find();
  const result = await cursor.toArray();
  console.log(result)
  return result;
};

module.exports = { getCurrencies };
