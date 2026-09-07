const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const VerificationQuestion = sequelize.define(
  "VerificationQuestion",
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
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expectedAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weight: {
      type: DataTypes.INTEGER,
      defaultValue: 33,
    },
  },
  {
    tableName: "verification_questions",
    timestamps: true,
  }
);

module.exports = VerificationQuestion;
