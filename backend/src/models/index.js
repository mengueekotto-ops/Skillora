const { sequelize } = require("../config/database");

const User = require("./user");
const Professional = require("./professional");
const Category = require("./category");
const Service = require("./service");
const ServiceRequest = require("./serviceRequest");
const Review = require("./review");
const Notification = require("./notification");
const Bookmark = require("./bookmark");
const Verification = require("./verification");
const VerificationQuestion = require("./verificationQuestion");
const VerificationAnswer = require("./verificationAnswer");
const VerificationDocument = require("./verificationDocument");

// Associations
User.hasOne(Professional, { foreignKey: "userId", as: "professionalProfile" });
Professional.belongsTo(User, { foreignKey: "userId", as: "user" });

Category.hasMany(Service, { foreignKey: "categoryId", as: "services" });
Service.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

Professional.hasMany(Service, { foreignKey: "professionalId", as: "services" });
Service.belongsTo(Professional, { foreignKey: "professionalId", as: "professional" });

User.hasMany(ServiceRequest, { foreignKey: "customerId", as: "serviceRequests" });
ServiceRequest.belongsTo(User, { foreignKey: "customerId", as: "customer" });

Professional.hasMany(ServiceRequest, { foreignKey: "professionalId", as: "assignedRequests" });
ServiceRequest.belongsTo(Professional, { foreignKey: "professionalId", as: "professional" });

Service.hasMany(ServiceRequest, { foreignKey: "serviceId", as: "requests" });
ServiceRequest.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

User.hasMany(Review, { foreignKey: "customerId", as: "givenReviews" });
Review.belongsTo(User, { foreignKey: "customerId", as: "customer" });

Professional.hasMany(Review, { foreignKey: "professionalId", as: "receivedReviews" });
Review.belongsTo(Professional, { foreignKey: "professionalId", as: "professional" });

ServiceRequest.hasOne(Review, { foreignKey: "requestId", as: "review" });
Review.belongsTo(ServiceRequest, { foreignKey: "requestId", as: "request" });

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Bookmark, { foreignKey: "userId", as: "bookmarks" });
Bookmark.belongsTo(User, { foreignKey: "userId", as: "user" });
Professional.hasMany(Bookmark, { foreignKey: "professionalId", as: "bookmarkedBy" });
Bookmark.belongsTo(Professional, { foreignKey: "professionalId", as: "professional" });

// Verification System Associations
Professional.hasMany(Verification, { foreignKey: "artisanId", as: "verifications" });
Verification.belongsTo(Professional, { foreignKey: "artisanId", as: "artisan" });

Verification.hasMany(VerificationQuestion, { foreignKey: "verificationId", as: "questions" });
VerificationQuestion.belongsTo(Verification, { foreignKey: "verificationId", as: "verification" });

VerificationQuestion.hasMany(VerificationAnswer, { foreignKey: "questionId", as: "answers" });
VerificationAnswer.belongsTo(VerificationQuestion, { foreignKey: "questionId", as: "question" });

Professional.hasMany(VerificationAnswer, { foreignKey: "artisanId", as: "assessmentAnswers" });
VerificationAnswer.belongsTo(Professional, { foreignKey: "artisanId", as: "artisan" });

Verification.hasMany(VerificationDocument, { foreignKey: "verificationId", as: "documents" });
VerificationDocument.belongsTo(Verification, { foreignKey: "verificationId", as: "verification" });

module.exports = {
  sequelize,
  User,
  Professional,
  Category,
  Service,
  ServiceRequest,
  Review,
  Notification,
  Bookmark,
  Verification,
  VerificationQuestion,
  VerificationAnswer,
  VerificationDocument,
};
