const {
  saveSupplierToDB,
  getAllSupplier,
  getSingleSupplier,
  updateSupplierDetails,
  deleteSupplierFromDB,
} = require("./supplier.service");

const getSuppliers = async (req, res) => {
  const user = req.user;
  const result = await getAllSupplier(user);
  if (!result) {
    res.send({
      success: false,
      message: "No user found",
    });
  }
  res.send({
    success: true,
    message: "User fetched successfully",
    data: result,
  });
};

const addSupplier = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const result = await saveSupplierToDB(data, user);
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

const deleteSupplier = async (req, res) => {
  const supplierId = req.params.id;
  const result = await deleteSupplierFromDB(supplierId);
  if (!result.deletedCount) {
    return res.send({
      success: false,
      message: "Supplier cannot be deleted.",
    });
  }
  return res.send({
    success: true,
    message: "Supplier deleted successfully.",
    data: result,
  });
};

const getSupplier = async (req, res) => {
  const supplierId = req.params.id;
  const result = await getSingleSupplier(supplierId);
  if (!result) {
    return res.send({
      success: false,
      message: "Supplier not found.",
    });
  }
  return res.send({
    success: true,
    message: "Supplier found.",
    data: result,
  });
};

const updateSupplier = async (req, res) => {
  const data = req.body;
  const supplierId = req.params.id;
  const result = await updateSupplierDetails(data, supplierId);
  if (!result.modifiedCount) {
    return res.send({
      success: false,
      message: "Supplier cannot be updated.",
    });
  }
  return res.send({
    success: true,
    message: "Supplier updated successfully",
    data: result,
  });
};
module.exports = {
  addSupplier,
  getSuppliers,
  updateSupplier,
  getSupplier,
  deleteSupplier,
};
