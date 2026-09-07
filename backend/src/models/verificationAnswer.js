const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const VerificationAnswer = sequelize.define(
  "VerificationAnswer",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "verification_questions",
        key: "id",
      },
    },
    artisanId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "professionals",
        key: "id",
      },
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    aiScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    aiFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    passed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "verification_answers",
    timestamps: true,
  }
);

module.exports = VerificationAnswer;
