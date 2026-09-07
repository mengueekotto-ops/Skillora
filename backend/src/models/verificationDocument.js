const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const VerificationDocument = sequelize.define(
  "VerificationDocument",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    verificationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "verifications",
        key: "id",
      },
    },
    documentType: {
      type: DataTypes.ENUM("ID_CARD", "PASSPORT", "CV", "CERTIFICATE", "PORTFOLIO", "BUSINESS_REGISTRATION", "VIDEO"),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aiResult: {
      type: DataTypes.JSON,
      defaultValue: { consistencyScore: 90, flags: [] },
    },
    reviewStatus: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "FLAGGED_FOR_ADMIN", "REJECTED"),
      defaultValue: "PENDING",
    },
  },
  {
    tableName: "verification_documents",
    timestamps: true,
  }
);

module.exports = VerificationDocument;
