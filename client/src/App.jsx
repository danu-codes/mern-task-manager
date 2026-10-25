import { useEffect, useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const data = await response.json();
        setTasks(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            "Could not load tasks. Check that Express is running, then reload."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => controller.abort();
  }, []);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>My Task Manager</h1>

      {loading ? (
        <p role="status">Loading tasks…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} style={{ marginBottom: 12 }}>
              {task.title} — {task.completed ? "Completed" : "Pending"}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}