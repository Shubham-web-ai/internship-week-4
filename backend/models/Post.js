
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    likes: {
      type: Number,
      default: 0
    },
    likedBy: {
      type: [String],
      default: []
    },
    comments: {
      type: [
        {
          username: String,
          text: String
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
