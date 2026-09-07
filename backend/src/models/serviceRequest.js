const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ServiceRequest = sequelize.define(
  "ServiceRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    professionalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "professionals",
        key: "id",
      },
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "services",
        key: "id",
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ),
      defaultValue: "PENDING",
    },
  },
  {
    tableName: "service_requests",
    timestamps: true,
  }
);

module.exports = ServiceRequest;
