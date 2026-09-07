const { Category, Service } = require("../models");

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Service, as: "services" }],
      order: [["name", "ASC"]],
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Service, as: "services" }],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const category = await Category.create({ name, description, image });

    return res.status(201).json({
      success: true,
      message: "Category created.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;

    await category.save();

    return res.json({
      success: true,
      message: "Category updated.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await category.destroy();

    return res.json({
      success: true,
      message: "Category deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
