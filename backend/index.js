const pg = require("pg");
require("dotenv").config();
const bcrypt = require("bcrypt");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");

const port = 3000;

const allowedOrigins = [
  "http://localhost",
  "https://localhost",
  "https://localhost:3000",
  "http://localhost:3000",
  "http://localhost:8080",
  "https://localhost:8080",
];

const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  connectionTimeoutMillis: 5000,
});

console.log("Connecting...:");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Toegang geweigerd door CORS"));
      }
    },
  }),
);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.get("/authenticate/:username/:password", async (request, response) => {
  const username = request.params.username;
  const password = request.params.password;

  const query = "SELECT * FROM users WHERE user_name=$1";
  const values = [username];

  console.log(query, values);

  pool.query(query, values, async (error, results) => {
    if (error) {
      console.log(error);
      response.status(500).json({ error: "Internal server error" });
      return;
    }

    if (results.rows.length === 0) {
      console.log("No user found");
      response.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const user = results.rows[0];
    console.log(user);

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        console.log("Authentication successful");
        response
          .status(200)
          .json({ message: "Authentication successful", user: user });
      } else {
        console.log("invalid password");
        response.status(401).json({ error: "Invalid username or password" });
      }
    } catch (err) {
      console.log(err);
      response.status(500).json({ error: "Internal server error" });
    }
  });
});

async function addInitialUsers() {
  try {
    const hashedPassword1 = await bcrypt.hash(
      process.env.INITIAL_ADMIN_PASSWORD,
      10,
    );
    const hashedPassword2 = await bcrypt.hash(
      process.env.INITIAL_USER_PASSWORD,
      10,
    );

    await pool.query(
      "INSERT INTO users (user_name, password) VALUES ($1, $2), ($3, $4)",
      [
        process.env.INITIAL_ADMIN_NAME,
        hashedPassword1,
        process.env.INITIAL_USER_NAME,
        hashedPassword2,
      ],
    );
    console.log("Initial users added successfully");
  } catch (error) {
    console.error("Error adding initial users:", error.message);
  }
}

addInitialUsers();

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
