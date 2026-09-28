const { safeRegex } = require("../utils/regex.util");
const { Service, Professional, User, Category } = require("../models");

const getAllServices = async (req, res, next) => {
  try {
    const { categoryId, professionalId, search } = req.query;
    const query = { status: "ACTIVE" };

    if (categoryId) query.categoryId = categoryId;
    if (professionalId) query.professionalId = professionalId;

    if (search) {
      const reg = safeRegex(search);
      query.$or = [{ title: reg }, { description: reg }, { location: reg }];
    }

    const services = await Service.find(query)
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName location profileImage" },
      })
      .populate("categoryId")
      .sort({ createdAt: -1 });

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
    const service = await Service.findById(req.params.id)
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName location profileImage" },
      })
      .populate("categoryId");

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
    const { categoryId, title, description, price, location, image, gallery } = req.body;

    const professional = await Professional.findOne({ userId: req.user._id });
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
      professionalId: professional._id,
      categoryId: categoryId || null,
      title: title.trim(),
      description: description ? description.trim() : null,
      price: Number(price) || 0,
      location: location ? location.trim() : req.user.location,
      image: image || null,
      gallery: Array.isArray(gallery) ? gallery : [],
      status: "ACTIVE",
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
    const service = await Service.findById(req.params.id).populate("professionalId");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const ownerUserId = service.professionalId ? service.professionalId.userId.toString() : null;
    const isOwner = ownerUserId && req.user._id.toString() === ownerUserId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Cannot update another professional's service.",
      });
    }

    const { categoryId, title, description, price, location, status, image, gallery } = req.body;

    if (categoryId !== undefined) service.categoryId = categoryId;
    if (title) service.title = title.trim();
    if (description !== undefined) service.description = description ? description.trim() : null;
    if (price !== undefined) service.price = Number(price);
    if (location !== undefined) service.location = location ? location.trim() : null;
    if (status !== undefined) service.status = status;
    if (image !== undefined) service.image = image;
    if (gallery !== undefined) service.gallery = Array.isArray(gallery) ? gallery : service.gallery;

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
    const service = await Service.findById(req.params.id).populate("professionalId");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const ownerUserId = service.professionalId ? service.professionalId.userId.toString() : null;
    const isOwner = ownerUserId && req.user._id.toString() === ownerUserId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    await Service.findByIdAndDelete(service._id);

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
