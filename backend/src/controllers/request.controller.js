const { ServiceRequest, User, Professional, Service, Notification } = require("../models");
const { updateVerificationProgression } = require("../services/verification.service");

const createRequest = async (req, res, next) => {
  try {
    const { professionalId, serviceId, description, location, scheduledDate } = req.body || {};

    if (!professionalId || !description) {
      return res.status(400).json({
        success: false,
        message: "Professional ID and request description are required.",
      });
    }

    const targetProf = await Professional.findByPk(professionalId, {
      include: [{ model: User, as: "user" }],
    });

    if (!targetProf) {
      return res.status(404).json({
        success: false,
        message: "Target professional profile not found.",
      });
    }

    const serviceRequest = await ServiceRequest.create({
      customerId: req.user.id,
      professionalId,
      serviceId,
      description,
      location: location || req.user.location,
      scheduledDate,
      status: "PENDING",
    });

    // Notify Professional
    await Notification.create({
      userId: targetProf.user.id,
      title: "New Service Request",
      message: `You have received a new service request from ${req.user.firstName} ${req.user.lastName}.`,
      type: "REQUEST",
    });

    return res.status(201).json({
      success: true,
      message: "Service request sent successfully.",
      data: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query || {};
    let where = {};

    if (status) where.status = status;

    if (req.user.role === "CUSTOMER" || req.user.role === "CLIENT") {
      where.customerId = req.user.id;
    } else if (req.user.role === "PROFESSIONAL" || req.user.role === "ARTISAN") {
      const prof = await Professional.findOne({ where: { userId: req.user.id } });
      if (!prof) {
        return res.json({ success: true, data: [] });
      }
      where.professionalId = prof.id;
    }

    const requests = await ServiceRequest.findAll({
      where,
      include: [
        { model: User, as: "customer", attributes: ["id", "firstName", "lastName", "email", "phone", "profileImage"] },
        {
          model: Professional,
          as: "professional",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "phone", "profileImage"] }],
        },
        { model: Service, as: "service" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: "customer", attributes: ["id", "firstName", "lastName", "email", "phone", "profileImage"] },
        {
          model: Professional,
          as: "professional",
          include: [{ model: User, as: "user", attributes: ["firstName", "lastName", "phone", "profileImage"] }],
        },
        { model: Service, as: "service" },
      ],
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    return res.json({
      success: true,
      data: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const allowedStatuses = ["PENDING", "ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: [${allowedStatuses.join(", ")}]`,
      });
    }

    const serviceRequest = await ServiceRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: "customer" },
        { model: Professional, as: "professional", include: [{ model: User, as: "user" }] },
      ],
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    serviceRequest.status = status;
    await serviceRequest.save();

    if (status === "COMPLETED") {
      const prof = serviceRequest.professional;
      if (prof) {
        prof.completedMissions = (prof.completedMissions || 0) + 1;
        await prof.save();
        await updateVerificationProgression(prof.id);
      }
    }

    const notifyUser = req.user.id === serviceRequest.customerId ? serviceRequest.professional.user.id : serviceRequest.customerId;
    await Notification.create({
      userId: notifyUser,
      title: `Mission Request Status Updated: ${status}`,
      message: `The status of your service request #${serviceRequest.id.substring(0, 8)} has changed to ${status}.`,
      type: "REQUEST_UPDATE",
    });

    return res.json({
      success: true,
      message: `Service request status updated to ${status}.`,
      data: serviceRequest,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRequest = async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findByPk(req.params.id);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    await serviceRequest.destroy();

    return res.json({
      success: true,
      message: "Service request deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
};
