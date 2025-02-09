const {
  saveAttributeToDB,
  getAllAttribute,
  getSingleAttribute,
  updateAttributeDetails,
  deleteAttributeFromDB,
} = require("./attribute.service");

const getAttributes = async (req, res) => {
  const user = req.user;
  const result = await getAllAttribute(user);
  if (!result) {
    res.send({
      success: false,
      message: "No attribute found",
    });
  }
  res.send({
    success: true,
    message: "Attribute fetched successfully",
    data: result,
  });
};

const addAttribute = async (req, res) => {
  const data = req.body;
  const user = req.user;
  const result = await saveAttributeToDB(data, user);
  if (!result.insertedId) {
    return res.send({
      success: false,
      message: "Attribute cannot be added",
    });
  }
  res.send({
    success: true,
    message: "Attribute added successfully",
  });
};

const deleteAttribute = async (req, res) => {
  const attributeId = req.params.id;
  const result = await deleteAttributeFromDB(attributeId);
  if (!result.deletedCount) {
    return res.send({
      success: false,
      message: "Attribute cannot be deleted.",
    });
  }
  return res.send({
    success: true,
    message: "Attribute deleted successfully.",
    data: result,
  });
};

const getAttribute = async (req, res) => {
  const attributeId = req.params.id;
  const result = await getSingleAttribute(attributeId);
  if (!result) {
    return res.send({
      success: false,
      message: "Attribute not found.",
    });
  }
  return res.send({
    success: true,
    message: "Attribute found.",
    data: result,
  });
};

const updateAttribute = async (req, res) => {
  const data = req.body;
  const attributeId = req.params.id;
  const result = await updateAttributeDetails(data, attributeId);
  if (!result.modifiedCount) {
    return res.send({
      success: false,
      message: "Attribute cannot be updated.",
    });
  }
  return res.send({
    success: true,
    message: "Attribute updated successfully",
    data: result,
  });
};
module.exports = {
  addAttribute,
  getAttributes,
  updateAttribute,
  getAttribute,
  deleteAttribute,
};
