const mongoose = require("mongoose");
const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: { type: String,  maxLength: 500 }, //changed max to maxLength since max only applies to number not strings
});

module.exports = mongoose.model("Comment", CommentSchema);
