const express = require("express");

const app = express();
const PORT = 5000;

const tasks = [
  {
    id: 1,
    title: "Connect React to Express",
    completed: false,
  },
  {
    id: 2,
    title: "Inspect the API response",
    completed: false,
  },
  {
    id: 3,
    title: "Create the React interface",
    completed: true,
  },
];

app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});