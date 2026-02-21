const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Report = require("./models/Report");
const Adoption = require("./models/Adoption");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

mongoose.connect("mongodb://127.0.0.1:27017/animal_welfare")
  .then(() => console.log("MongoDB Connected"));

/* ADMIN LOGIN */
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const ADMIN_TOKEN = "admin-authenticated";

/* LOGIN */
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else res.json({ success: false });
});

/* ADMIN PROTECTION */
function verifyAdmin(req, res, next) {
  if (req.headers.authorization === ADMIN_TOKEN) {
    next();
  } else res.status(403).json({ message: "Admin only" });
}

/* CREATE REPORT */
app.post("/report", upload.single('photo'), async (req, res) => {
  const fs = require('fs');
  const logMsg = `\n--- REPORT REQUEST [${new Date().toISOString()}] ---\n` +
    `Headers: ${JSON.stringify(req.headers)}\n` +
    `Body: ${JSON.stringify(req.body)}\n` +
    `File: ${req.file ? req.file.filename : 'NONE'}\n` +
    `-------------------------------------------\n`;
  fs.appendFileSync(path.join(__dirname, 'server.log'), logMsg);

  try {
    const { name, location, details } = req.body;
    const photoUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

    const report = new Report({
      name: name || 'Anonymous',
      location: location || 'Not Specified',
      details: details || 'No details',
      photoUrl
    });

    await report.save();
    res.json({ message: "Report saved", report });
  } catch (err) {
    fs.appendFileSync(path.join(__dirname, 'server.log'), `ERROR: ${err.message}\n`);
    res.status(500).json({ error: err.message });
  }
});

/* GET REPORTS */
app.get("/reports", async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 });
  res.json(reports);
});

/* GET RESOLVED FOR ADOPTION */
app.get("/rescued", async (req, res) => {
  const dogs = await Report.find({ status: "Resolved" });
  res.json(dogs);
});

/* ADMIN: RESOLVE */
app.put("/resolve/:id", verifyAdmin, async (req, res) => {
  await Report.findByIdAndUpdate(req.params.id, { status: "Resolved" });
  res.json({ message: "Resolved" });
});

/* ADMIN: DELETE */
app.delete("/report/:id", verifyAdmin, async (req, res) => {
  await Report.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

/* ADOPTION REQUEST */
app.post("/adopt", async (req, res) => {
  const adoption = new Adoption(req.body);
  await adoption.save();
  res.json({ message: "Request submitted" });
});

/* ADMIN VIEW ADOPTION REQUESTS */
app.get("/adopt", verifyAdmin, async (req, res) => {
  const data = await Adoption.find();
  res.json(data);
});

app.listen(5000, () => console.log("Server running on port 5000"));