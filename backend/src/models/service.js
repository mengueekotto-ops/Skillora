const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    professionalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "professionals",
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "services",
    timestamps: true,
  }
);

module.exports = Service;
