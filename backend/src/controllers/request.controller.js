const { ServiceRequest, Professional, Service, Notification } = require("../models");
const { updateVerificationProgression } = require("../services/verification.service");
const { releaseHeldPaymentsForRequest, flagRefundsForRequest } = require("../services/payment.service");
const { isAdmin, isSameId } = require("../utils/ownership.util");

/**
 * Which status changes each party may make, keyed by current status.
 * The customer confirms completion (it releases payment); the artisan runs the job.
 */
const CUSTOMER_TRANSITIONS = {
  PENDING: ["CANCELLED"],
  ACCEPTED: ["CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
};

const PROFESSIONAL_TRANSITIONS = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
};

const ALL_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const populateRequest = (query) =>
  query
    .populate("customerId", "firstName lastName email phone profileImage location")
    .populate({
      path: "professionalId",
      populate: { path: "userId", select: "firstName lastName phone profileImage location" },
    })
    .populate("serviceId", "title price image");

/** Returns "CUSTOMER", "PROFESSIONAL", "ADMIN" or null for the user's relation to a request. */
const getParty = (user, serviceRequest) => {
  if (isAdmin(user)) return "ADMIN";
  const customerId = serviceRequest.customerId?._id || serviceRequest.customerId;
  if (isSameId(customerId, user._id)) return "CUSTOMER";
  const proUserId = serviceRequest.professionalId?.userId?._id || serviceRequest.professionalId?.userId;
  if (isSameId(proUserId, user._id)) return "PROFESSIONAL";
  return null;
};

const createRequest = async (req, res, next) => {
  try {
    const { professionalId, serviceId, description, location, scheduledDate } = req.body || {};

    if (!professionalId || !description || !String(description).trim()) {
      return res.status(400).json({
        success: false,
        message: "Professional ID and request description are required.",
      });
    }

    const targetProf = await Professional.findById(professionalId).populate("userId");
    if (!targetProf || !targetProf.userId || targetProf.userId.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Target professional profile not found.",
      });
    }

    if (isSameId(targetProf.userId._id, req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own services.",
      });
    }

    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service || !isSameId(service.professionalId, targetProf._id)) {
        return res.status(400).json({
          success: false,
          message: "This service does not belong to the selected professional.",
        });
      }
    }

    const serviceRequest = await ServiceRequest.create({
      customerId: req.user._id,
      professionalId: targetProf._id,
      serviceId: serviceId || null,
      description: String(description).trim(),
      location: location ? String(location).trim() : req.user.location,
      scheduledDate: scheduledDate || null,
      status: "PENDING",
    });

    await Notification.create({
      userId: targetProf.userId._id,
      title: "New Service Request",
      message: `You have received a new service request from ${req.user.firstName} ${req.user.lastName}.`,
      type: "REQUEST",
    });

    return res.status(201).json({
      success: true,
      message: "Service request sent successfully.",
      data: await populateRequest(ServiceRequest.findById(serviceRequest._id)),
    });
  } catch (error) {
    next(error);
  }
};

const getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query || {};
    const query = {};

    if (status && status !== "ALL") query.status = String(status).toUpperCase();

    if (req.user.role === "PROFESSIONAL") {
      // Artisans see both jobs they received and services they booked themselves
      const prof = await Professional.findOne({ userId: req.user._id });
      query.$or = [{ customerId: req.user._id }];
      if (prof) query.$or.push({ professionalId: prof._id });
    } else if (!isAdmin(req.user)) {
      query.customerId = req.user._id;
    }

    const requests = await populateRequest(ServiceRequest.find(query)).sort({ createdAt: -1 });

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
    const serviceRequest = await populateRequest(ServiceRequest.findById(req.params.id));

    if (!serviceRequest || !getParty(req.user, serviceRequest)) {
      // 404 for both cases so request ids cannot be probed
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
    const status = String((req.body || {}).status || "").toUpperCase();

    if (!ALL_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: [${ALL_STATUSES.join(", ")}]`,
      });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate("customerId")
      .populate({ path: "professionalId", populate: { path: "userId" } });

    const party = serviceRequest ? getParty(req.user, serviceRequest) : null;
    if (!serviceRequest || !party) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    if (party !== "ADMIN") {
      const transitions = party === "CUSTOMER" ? CUSTOMER_TRANSITIONS : PROFESSIONAL_TRANSITIONS;
      const allowed = transitions[serviceRequest.status] || [];
      if (!allowed.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `You cannot change this request from ${serviceRequest.status} to ${status}.`,
        });
      }
    }

    const previousStatus = serviceRequest.status;
    serviceRequest.status = status;
    await serviceRequest.save();

    if (status === "COMPLETED" && previousStatus !== "COMPLETED") {
      const prof = await Professional.findById(serviceRequest.professionalId._id);
      if (prof) {
        prof.completedMissions = (prof.completedMissions || 0) + 1;
        await prof.save();
        await updateVerificationProgression(prof._id);
      }
      // Customer confirmed the work: release escrowed money to the artisan
      await releaseHeldPaymentsForRequest(serviceRequest._id);
    }

    if (["CANCELLED", "REJECTED"].includes(status)) {
      await flagRefundsForRequest(serviceRequest._id);
    }

    const targetUserId =
      party === "CUSTOMER"
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
      data: await populateRequest(ServiceRequest.findById(serviceRequest._id)),
    });
  } catch (error) {
    next(error);
  }
};

const deleteRequest = async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    const party = serviceRequest ? getParty(req.user, serviceRequest) : null;

    if (!serviceRequest || !party) {
      return res.status(404).json({
        success: false,
        message: "Service request not found.",
      });
    }

    // Customers may only remove requests that never started; history is kept otherwise.
    const deletable = ["PENDING", "CANCELLED", "REJECTED"].includes(serviceRequest.status);
    if (party !== "ADMIN" && !(party === "CUSTOMER" && deletable)) {
      return res.status(403).json({
        success: false,
        message: "This service request can no longer be deleted.",
      });
    }

    await ServiceRequest.findByIdAndDelete(serviceRequest._id);

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
