require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/database");
const { User } = require("../models");

const seed = async () => {
  await connectDB();
  await User.init();

  const email = (process.env.ADMIN_EMAIL || "admin@skillora.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin1234!";
  const firstName = process.env.ADMIN_FIRST_NAME || "Super";
  const lastName = process.env.ADMIN_LAST_NAME || "Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "ADMIN") {
      existing.role = "ADMIN";
      await existing.save();
      console.log(`ℹ️  Updated existing user ${email} to role ADMIN.`);
    } else {
      console.log(`ℹ️  Admin account already exists: ${email}`);
    }
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    firstName,
    lastName,
    email,
    phone: "+237600000000",
    password: hashed,
    role: "ADMIN",
    isActive: true,
  });

  console.log(`✅ Admin seeded: ${email} with password: ${password}`);
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
