const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  details: { type: String, required: true },
  photoUrl: { type: String },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Report", ReportSchema);