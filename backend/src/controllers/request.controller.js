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

    const targetProf = await Professional.findById(professionalId).populate("userId");

    if (!targetProf) {
      return res.status(404).json({
        success: false,
        message: "Target professional profile not found.",
      });
    }

    const serviceRequest = await ServiceRequest.create({
      customerId: req.user._id,
      professionalId,
      serviceId: serviceId || null,
      description: description.trim(),
      location: location ? location.trim() : req.user.location,
      scheduledDate: scheduledDate || null,
      status: "PENDING",
    });

    // Notify Professional
    if (targetProf.userId) {
      await Notification.create({
        userId: targetProf.userId._id,
        title: "New Service Request",
        message: `You have received a new service request from ${req.user.firstName} ${req.user.lastName}.`,
        type: "REQUEST",
      });
    }

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
    const query = {};

    if (status && status !== "ALL") query.status = status.toUpperCase();

    if (req.user.role === "CUSTOMER" || req.user.role === "CLIENT") {
      query.customerId = req.user._id;
    } else if (req.user.role === "PROFESSIONAL" || req.user.role === "ARTISAN") {
      const prof = await Professional.findOne({ userId: req.user._id });
      if (!prof) {
        return res.json({ success: true, data: [] });
      }
      query.professionalId = prof._id;
    }

    const requests = await ServiceRequest.find(query)
      .populate("customerId", "firstName lastName email phone profileImage location")
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName phone profileImage location" },
      })
      .populate("serviceId", "title price image")
      .sort({ createdAt: -1 });

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
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate("customerId", "firstName lastName email phone profileImage location")
      .populate({
        path: "professionalId",
        populate: { path: "userId", select: "firstName lastName phone profileImage location" },
      })
      .populate("serviceId", "title price image");

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

    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate("customerId")
      .populate({
        path: "professionalId",
        populate: { path: "userId" },
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
      const prof = await Professional.findById(serviceRequest.professionalId._id || serviceRequest.professionalId);
      if (prof) {
        prof.completedMissions = (prof.completedMissions || 0) + 1;
        await prof.save();
        await updateVerificationProgression(prof._id);
      }
    }

    const targetUserId =
      req.user._id.toString() === serviceRequest.customerId._id.toString()
        ? serviceRequest.professionalId?.userId?._id
        : serviceRequest.customerId?._id;

    if (targetUserId) {
      await Notification.create({
        userId: targetUserId,
        title: `Mission Request Status Updated: ${status}`,
        message: `The status of your service request has changed to ${status}.`,
        type: "REQUEST_UPDATE",
      });
    }

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
    const serviceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

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
