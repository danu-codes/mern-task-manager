require("dotenv").config({
  path: require("node:path").join(__dirname, ".env"),
});

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "10kb" }));

// Define the structure of a task stored in MongoDB.
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema, "tasks");

// Validate IDs before querying MongoDB.
app.param("id", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  next();
});

// Validate incoming data explicitly.
function validateTask(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Send a JSON object.",
    });
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 120
  ) {
    return res.status(400).json({
      message: "Title must contain 1–120 characters.",
    });
  }

  if (
    body.completed !== undefined &&
    typeof body.completed !== "boolean"
  ) {
    return res.status(400).json({
      message: "Completed must be true or false.",
    });
  }

  next();
}

// READ: retrieve every task.
app.get("/api/tasks", async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});

// CREATE: save a new task.
app.post("/api/tasks", validateTask, async (req, res) => {
  const task = await Task.create({
    title: req.body.title.trim(),
    completed: req.body.completed ?? false,
  });

  res.status(201).json(task);
});

// UPDATE: edit the title and/or completion status.
app.patch("/api/tasks/:id", validateTask, async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  task.title = req.body.title.trim();

  if (req.body.completed !== undefined) {
    task.completed = req.body.completed;
  }

  await task.save();
  res.json(task);
});

// DELETE: remove a task.
app.delete("/api/tasks/:id", async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// Express 5 forwards rejected async route promises here.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON." });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large." });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid task data." });
  }

  console.error("API error:", err.name);
  res.status(500).json({ message: "Server error. Please try again." });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env.");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Startup failed. Check MONGODB_URI, MongoDB availability, and network access.",
      error.name
    );
    process.exit(1);
  }
}

startServer();