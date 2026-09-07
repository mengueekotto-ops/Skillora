const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Verification = sequelize.define(
  "Verification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    artisanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "professionals",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("unverified", "pending", "verified", "failed"),
      defaultValue: "pending",
    },
    score: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Skillora AI Verification Engine",
    },
    adminDecision: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileCompletenessScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    technicalAssessmentScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    documentConsistencyScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    videoVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "verifications",
    timestamps: true,
  }
);

module.exports = Verification;
