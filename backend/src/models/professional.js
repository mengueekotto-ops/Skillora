const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Professional = sequelize.define(
  "Professional",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    artisanType: {
      type: DataTypes.ENUM("SINGLE", "GROUPED"),
      defaultValue: "SINGLE",
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    groupSize: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    groupRegNum: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    leadName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    education: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certifications: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    cvUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Optional verification status tracking: unverified, pending, verified, failed
    verificationStatus: {
      type: DataTypes.ENUM("unverified", "pending", "verified", "failed"),
      defaultValue: "unverified",
      field: "verification_status",
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "verification_date",
    },
    verificationScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      field: "verification_score",
    },
    verifiedBadge: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "verified_badge",
    },
    verificationAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "verification_attempts",
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    completedMissions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    walletBalance: {
      type: DataTypes.INTEGER,
      defaultValue: 350000, // FCFA
    },
    availability: {
      type: DataTypes.JSON,
      defaultValue: { isAvailable: true, schedule: "Mon-Fri 8:00 - 18:00" },
    },
  },
  {
    tableName: "professionals",
    timestamps: true,
  }
);

module.exports = Professional;
