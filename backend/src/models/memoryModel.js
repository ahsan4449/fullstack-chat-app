import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Type of memory
    type: {
      type: String,
      enum: ["event", "fact", "preference", "reminder"],
      required: true,
    },
    // What the memory is about (e.g. "interview", "birthday", "meeting")
    entity: {
      type: String,
      required: true,
    },
    // The detail (e.g. "Monday", "at 3pm", "prefers Python")
    value: {
      type: String,
      required: true,
    },
    // Parsed absolute date if the memory has a temporal component
    resolvedDate: {
      type: Date,
      default: null,
    },
    // The original text snippet that triggered this memory
    rawText: {
      type: String,
      required: true,
    },
    // How important is this memory
    importance: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    // Reminder fields
    reminderSet: {
      type: Boolean,
      default: false,
    },
    reminderFired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Memory = mongoose.model("Memory", memorySchema);
export default Memory;
