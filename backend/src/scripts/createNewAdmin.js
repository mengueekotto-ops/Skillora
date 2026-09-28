require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/database");
const { User } = require("../models");

const seed = async () => {
  await connectDB();
  await User.init();

  const email = "newadmin@skillora.com";
  // The same password as the other seeded users in the database
  const password = "Password123!";
  const firstName = "New";
  const lastName = "Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "ADMIN";
    const hashed = await bcrypt.hash(password, 10);
    existing.password = hashed;
    await existing.save();
    console.log(`ℹ️ Updated existing user ${email} to ADMIN with password ${password}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    firstName,
    lastName,
    email,
    phone: "+237699000001",
    password: hashed,
    role: "ADMIN",
    isActive: true,
  });

  console.log(`✅ New Admin created:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
