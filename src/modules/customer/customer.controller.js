const {
  saveCustomerToDB,
  getAllCustomer,
  getSingleCustomer,
  updateCustomerDetails,
  deleteCustomerFromDB,
} = require("./customer.service");

const getCustomers = async (req, res) => {
  const user = req.user;
  const params = req.query;
  const result = await getAllCustomer(user, params);
  res.send(result);
};

const addCustomer = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const result = await saveCustomerToDB(data, user);
  if (!result.insertedId) {
    return res.send({
      success: false,
      message: "User cannot be added",
    });
  }
  res.send({
    success: true,
    message: "User added successfully",
  });
};

const deleteCustomer = async (req, res) => {
  const customerId = req.params.id;
  const result = await deleteCustomerFromDB(customerId);
  if (!result.deletedCount) {
    return res.send({
      success: false,
      message: "Customer cannot be deleted.",
    });
  }
  return res.send({
    success: true,
    message: "Customer deleted successfully.",
    data: result,
  });
};

const getCustomer = async (req, res) => {
  const customerId = req.params.id;
  const result = await getSingleCustomer(customerId);
  if (!result) {
    return res.send({
      success: false,
      message: "Customer not found.",
    });
  }
  return res.send({
    success: true,
    message: "Customer found.",
    data: result,
  });
};

const updateCustomer = async (req, res) => {
  const data = req.body;
  const customerId = req.params.id;
  const result = await updateCustomerDetails(data, customerId);
  if (!result.modifiedCount) {
    return res.send({
      success: false,
      message: "Customer cannot be updated.",
    });
  }
  return res.send({
    success: true,
    message: "Customer updated successfully",
    data: result,
  });
};
module.exports = {
  addCustomer,
  getCustomers,
  updateCustomer,
  getCustomer,
  deleteCustomer,
};
