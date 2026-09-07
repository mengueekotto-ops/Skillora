const User = require("../models/user");

const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    res.status(200).json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUsers,
};