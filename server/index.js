import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await pool.query("SELECT * FROM users WHERE username=$1", [username]);
    if (data.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = data.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      "SECRET_KEY"
    );
    res.json({ message: "Login successful", token ,user_id:user.id});
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/reg", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
      [username, hash]
    );
    res.json({
      message: "User registered",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/saveconvo",async(req,res)=>{
  try {
    const messages=req.body
    for(const message in messages){
    await pool.query("INSERT INTO chats(text,mine,timestamp) VALUES ($1,$2,$3)",[message.text,message.mine,message.timestamp])
    }

    res.status(200).send("conversation saved successfully")
  } catch (error) {
    console.log(error)
  }
})




app.listen(3000, () => {
  console.log("server running on port 3000");
});
