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
    const data = await pool.query("SELECT * FROM chatbot.users WHERE username=$1", [username]);
    if (data.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = data.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { user_id: user.user_id },
      "SECRET_KEY"
    );
    res.json({ message: "Login successful", token ,user_id:user.user_id});
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing token" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM chatbot.users");
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
      "INSERT INTO chatbot.users (username, password) VALUES ($1, $2) RETURNING user_id, username",
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

app.get("/getuser", auth, async(req,res)=>{
  try {
    const user_id=req.user.user_id
    const result= await pool.query("SELECT * FROM chatbot.users WHERE user_id=$1",[user_id])
    res.json({
      user:result.rows[0]
    }
      
    )
  } catch (error) {
    console.log("error sending user",error)
  }
})

app.post("/savemessage", async (req,res)=>{
  try {
    const message= req.body
    const result=await pool.query("INSERT INTO chatbot.messages(user_id,chat_id,text,role) VALUES ($1,$2,$3,$4)",[message.user_id,message.chat_id,message.text,message.role])
    res.json({message:"message saved successfully"})
    res.status(200)
  } catch (error) {
    console.log(error)
  }
})
app.post("/savechat", auth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { title } = req.body
    const result = await pool.query(
      "INSERT INTO chatbot.chats (user_id, title) VALUES ($1, $2) RETURNING chat_id, created_at",
      [user_id, title]
    )
    res.json({
      message: "Chat saved successfully",
      chat: result.rows[0],
      user_id:user_id
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Database error", details: error.message })
  }
})

app.patch("/updatetitle", async (req,res)=>{
  try {
    const {chat_id,newtitle}=req.body
    console.log(chat_id,newtitle)
    const result=await pool.query("UPDATE chatbot.chats SET title=$1 WHERE chat_id=$2 RETURNING chat_id",[newtitle,chat_id])
    res.json({
      message:"chat updated successfully",
      chat_id:chat_id
    })
  } catch (error) {
    console.log(error)
  }
})

app.get("/getchats",auth, async (req,res)=>{
  try {
    const user_id  = req.user.user_id;
    const chats=await pool.query("SELECT * FROM chatbot.chats WHERE user_id=$1",[user_id])
    res.json({
      chats:chats.rows,
      message:"chats received successfully"
    })
  } catch (error) {
    console.log(error)
  }
})

app.get("/getchat", async (req,res)=>{
  try {
    const { chat_id } = req.query;
    const chat= await pool.query("SELECT * FROM chatbot.messages WHERE chat_id=$1",[chat_id])
    res.json({
      message: "chat found",
      chat: chat.rows
    })    
  } catch (error) {
    console.log(error)
  }
})

app.listen(3000, () => {
  console.log("server running on port 3000");
});