const pg = require("pg");
const bcrypt = require("bcrypt");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");

const port = 3000;

const pool = new pg.Pool({
  user: "secadv",
  host: "db",
  database: "pxldb",
  password: "ilovesecurity",
  port: 5432,
  connectionTimeoutMillis: 5000,
});

console.log("Connecting...:");

app.use(cors());
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

app.post("/register", async (request, response) => {
  const { username, password } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = "INSERT INTO users (user_name, password) VALUES ($1, $2)";
  const values = [username, hashedPassword];

  pool.query(query, values, (error, result) => {
    if (error) {
      response.status(500).json({ error: "Internal server error" });
    } else {
      response.status(201).json({ message: "User registered successfully" });
    }
  });
});

async function addInitialUsers() {
  try {
    const hashedPassword1 = await bcrypt.hash("insecureandlovinit", 10);
    const hashedPassword2 = await bcrypt.hash("iwishihadbetteradmins", 10);

    await pool.query(
      "INSERT INTO users (user_name, password) VALUES ($1, $2), ($3, $4)",
      ["pxl-admin", hashedPassword1, "george", hashedPassword2],
    );
    console.log("Initial users added successfully");
  } catch (error) {
    console.error("Error adding initial users:", error.message);
  }
}

addInitialUsers();

//async function insertUsersFromFile(filePath) {
//  try {
//    const data = fs.readFileSync(filePath, "utf8");
//    const lines = data.split("\n");
//
//    for (const line of lines) {
//      const [username, hashedPassword] = line.split(",");
//
//      await pool.query(
//        "INSERT INTO users (user_name, password) VALUES ($1, $2)",
//        [username, hashedPassword],
//      );
//    }
//
//   console.log("Users inserted successfully");
//  } catch (error) {
//    console.error("Error inserting users:", error.message);
//  } finally {
//    pool.end();
//  }
//}

//insertUsersFromFile("users_data.txt");

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
