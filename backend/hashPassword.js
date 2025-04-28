const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: process.env.DB_PORT,
});

const hashPassword = async () => {
  const plainTextPassword = "hashedpassword"; // Replace with the plain text password in your database
  const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

  try {
    await pool.query(
      "UPDATE users SET password = $1 WHERE username = $2",
      [hashedPassword, "testuser"] // Replace "testuser" with the username in your database
    );
    console.log("✅ Password hashed and updated successfully!");
  } catch (err) {
    console.error("🔥 Error updating password:", err.message);
  } finally {
    pool.end();
  }
};

hashPassword();