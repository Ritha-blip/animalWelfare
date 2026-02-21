const mongoose = require("mongoose");

const AdoptionSchema = new mongoose.Schema({
  adopterName: String,
  adopterEmail: String,
  adopterPhone: String,
  dogId: String,
  dogName: String,
  reason: String,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Adoption", AdoptionSchema);