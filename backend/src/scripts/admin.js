/**
 * Skillora admin account tool — the ONLY way to create administrators.
 *
 *   npm run admin -- list
 *   npm run admin -- create  --email you@domain.cm --first Juan --last Mengue
 *   npm run admin -- password --email you@domain.cm
 *   npm run admin -- disable --email old-admin@domain.cm
 *   npm run admin -- enable  --email you@domain.cm
 *
 * Passwords are typed at a hidden prompt (or passed via the ADMIN_PASSWORD
 * environment variable for automation). They are never printed or stored in code.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const readline = require("readline");
const bcrypt = require("bcryptjs");
const { connectDB, mongoose } = require("../config/database");
const { User } = require("../models");

const args = process.argv.slice(2);
const command = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const STRONG = [
  [/.{12,}/, "at least 12 characters"],
  [/[a-z]/, "a lower-case letter"],
  [/[A-Z]/, "an upper-case letter"],
  [/\d/, "a digit"],
  [/[^A-Za-z0-9]/, "a symbol"],
];

const weaknesses = (password) => STRONG.filter(([re]) => !re.test(password)).map(([, label]) => label);

/** Prompt without echoing what is typed. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(text);
      else if (text !== "\r\n" && text !== "\n") rl.output.write("*");
    };
    rl.question(question, (answer) => {
      rl.output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

async function readNewPassword() {
  if (process.env.ADMIN_PASSWORD) {
    const missing = weaknesses(process.env.ADMIN_PASSWORD);
    if (missing.length) throw new Error(`ADMIN_PASSWORD is too weak. It needs ${missing.join(", ")}.`);
    return process.env.ADMIN_PASSWORD;
  }
  for (;;) {
    const first = await askHidden("New admin password: ");
    const missing = weaknesses(first);
    if (missing.length) {
      console.log(`  ✗ Too weak. It needs ${missing.join(", ")}.`);
      continue;
    }
    const second = await askHidden("Repeat password: ");
    if (first !== second) {
      console.log("  ✗ Passwords do not match.");
      continue;
    }
    return first;
  }
}

const requireEmail = () => {
  const email = (opt("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid --email is required.");
  return email;
};

async function main() {
  if (!["list", "create", "password", "disable", "enable"].includes(command)) {
    console.log("Usage: npm run admin -- <list|create|password|disable|enable> [--email x] [--first A --last B]");
    process.exitCode = 1;
    return;
  }

  await connectDB();

  if (command === "list") {
    const admins = await User.find({ role: "ADMIN" }).select("email firstName lastName isActive createdAt");
    if (!admins.length) console.log("No admin accounts.");
    admins.forEach((a) =>
      console.log(`${a.isActive ? "✅ active  " : "⛔ disabled"}  ${a.email}  (${a.firstName} ${a.lastName})`)
    );
    return;
  }

  const email = requireEmail();
  const user = await User.findOne({ email });

  if (command === "create") {
    if (user) throw new Error(`An account already exists for ${email}. Use a different email.`);
    const firstName = (opt("first") || "").trim();
    const lastName = (opt("last") || "").trim();
    if (!firstName || !lastName) throw new Error("--first and --last are required.");
    const password = await readNewPassword();
    await User.create({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 12),
      role: "ADMIN",
      isActive: true,
    });
    console.log(`✅ Admin created: ${email}`);
    return;
  }

  if (!user || user.role !== "ADMIN") throw new Error(`No admin account found for ${email}.`);

  if (command === "password") {
    user.password = await bcrypt.hash(await readNewPassword(), 12);
    await user.save();
    console.log(`✅ Password changed for ${email}`);
  } else if (command === "disable" || command === "enable") {
    if (command === "disable") {
      const others = await User.countDocuments({ role: "ADMIN", isActive: true, _id: { $ne: user._id } });
      if (!others) throw new Error("Refusing to disable the last active admin. Create another admin first.");
    }
    user.isActive = command === "enable";
    await user.save();
    console.log(`${command === "enable" ? "✅ Enabled" : "⛔ Disabled"}: ${email}`);
  }
}

main()
  .catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
