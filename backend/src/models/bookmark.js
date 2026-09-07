const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Bookmark = sequelize.define(
  "Bookmark",
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
    professionalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "professionals",
        key: "id",
      },
    },
  },
  {
    tableName: "bookmarks",
    timestamps: true,
  }
);

module.exports = Bookmark;
