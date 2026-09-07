const { Service, Professional, User, Category } = require("../models");

const getAllServices = async (req, res, next) => {
  try {
    const { categoryId, professionalId, search } = req.query;
    const where = { status: "ACTIVE" };

    if (categoryId) where.categoryId = categoryId;
    if (professionalId) where.professionalId = professionalId;

    const services = await Service.findAll({
      where,
      include: [
        {
          model: Professional,
          as: "professional",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "location", "profileImage"] }],
        },
        { model: Category, as: "category" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        {
          model: Professional,
          as: "professional",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "location", "profileImage"] }],
        },
        { model: Category, as: "category" },
      ],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { categoryId, title, description, price, location } = req.body;

    const professional = await Professional.findOne({ where: { userId: req.user.id } });
    if (!professional) {
      return res.status(400).json({
        success: false,
        message: "You must complete your professional profile before adding services.",
      });
    }

    if (!title || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Service title and price are required.",
      });
    }

    const service = await Service.create({
      professionalId: professional.id,
      categoryId,
      title,
      description,
      price: Number(price),
      location: location || req.user.location,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Professional, as: "professional" }],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (service.professional.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another professional's service.",
      });
    }

    const { categoryId, title, description, price, location, status } = req.body;

    if (categoryId !== undefined) service.categoryId = categoryId;
    if (title) service.title = title;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (location !== undefined) service.location = location;
    if (status !== undefined) service.status = status;

    await service.save();

    return res.json({
      success: true,
      message: "Service updated successfully.",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Professional, as: "professional" }],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    if (service.professional.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    await service.destroy();

    return res.json({
      success: true,
      message: "Service deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
