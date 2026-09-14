const { Category, Service } = require("../models");

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    const enriched = await Promise.all(
      categories.map(async (c) => {
        const cObj = c.toObject();
        cObj.services = await Service.find({ categoryId: c._id });
        return cObj;
      })
    );

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const cObj = category.toObject();
    cObj.services = await Service.find({ categoryId: category._id });

    return res.json({
      success: true,
      data: cObj,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      image: image || null,
    });

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
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;
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
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

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
