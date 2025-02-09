const {
  saveRevenueToDB,
  getAllRevenue,
  getSingleRevenue,
  updateRevenueDetails,
  deleteRevenueFromDB,
} = require("./revenue.service");

const getRevenues = async (req, res) => {
  const user = req.user;
  const result = await getAllRevenue(user);
  if (!result) {
    res.send({
      success: false,
      message: "No revenue found",
    });
  }
  res.send({
    success: true,
    message: "Revenue fetched successfully",
    data: result,
  });
};

const addRevenue = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const result = await saveRevenueToDB(data, user);
  if (!result.insertedId) {
    return res.send({
      success: false,
      message: "Something went wrong",
    });
  }
  res.send({
    success: true,
    message: "Revenue added successfully",
  });
};

const deleteRevenue = async (req, res) => {
  const revenueId = req.params.id;
  const result = await deleteRevenueFromDB(revenueId);
  if (!result.deletedCount) {
    return res.send({
      success: false,
      message: "Revenue cannot be deleted.",
    });
  }
  return res.send({
    success: true,
    message: "Revenue deleted successfully.",
    data: result,
  });
};

const getRevenue = async (req, res) => {
  const revenueId = req.params.id;
  const result = await getSingleRevenue(revenueId);
  if (!result) {
    return res.send({
      success: false,
      message: "Revenue not found.",
    });
  }
  return res.send({
    success: true,
    message: "Revenue found.",
    data: result,
  });
};

const updateRevenue = async (req, res) => {
  const data = req.body;
  const revenueId = req.params.id;
  const result = await updateRevenueDetails(data, revenueId);
  if (!result.modifiedCount) {
    return res.send({
      success: false,
      message: "Revenue cannot be updated.",
    });
  }
  return res.send({
    success: true,
    message: "Revenue updated successfully",
    data: result,
  });
};
module.exports = {
  addRevenue,
  getRevenues,
  updateRevenue,
  getRevenue,
  deleteRevenue,
};
