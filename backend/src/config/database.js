const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

const dbName = process.env.DB_NAME || "interlink";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbPort = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

const ensureDatabaseExists = async () => {
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();
  } catch (error) {
    console.warn("⚠️ Warning checking/creating database:", error.message);
  }
};

const connectDB = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log("✅ MariaDB/MySQL database connected successfully.");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
};