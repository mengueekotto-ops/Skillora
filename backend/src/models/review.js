const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Review = sequelize.define(
  "Review",
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
    serviceRequestId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "service_requests",
        key: "id",
      },
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 1.0,
        max: 5.0,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    qualityRating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
    professionalismRating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
    communicationRating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
    punctualityRating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
    reliabilityRating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
  },
  {
    tableName: "reviews",
    timestamps: true,
  }
);

module.exports = Review;
