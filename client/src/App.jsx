import { useEffect, useState } from "react";
import "./App.css";

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // DELETE returns no response body.
  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed. Check the server.");
  }

  return data;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const data = await apiRequest("/api/tasks", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setTasks(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
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

  async function runAction(action) {
    setError("");
    setBusy(true);

    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function addTask(event) {
    event.preventDefault();

    if (!title.trim() || busy) return;

    runAction(async () => {
      const created = await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: title.trim() }),
      });

      setTasks((current) => [created, ...current]);
      setTitle("");
    });
  }

  async function updateTask(id, values) {
    const updated = await apiRequest(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });

    setTasks((current) =>
      current.map((task) => (task._id === id ? updated : task))
    );
  }

  function saveEdit(event, task) {
    event.preventDefault();

    if (!editTitle.trim() || busy) return;

    runAction(async () => {
      await updateTask(task._id, { title: editTitle.trim() });
      setEditingId(null);
    });
  }

  function toggleTask(task) {
    runAction(() =>
      updateTask(task._id, {
        title: task.title,
        completed: !task.completed,
      })
    );
  }

  function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    runAction(async () => {
      await apiRequest(`/api/tasks/${task._id}`, {
        method: "DELETE",
      });

      setTasks((current) =>
        current.filter((item) => item._id !== task._id)
      );

      if (editingId === task._id) setEditingId(null);
    });
  }

  return (
  <main className="task-app">
    <header className="app-header">
      <h1>Task Manager</h1>
      <p>Manage your daily tasks.</p>
    </header>

    <section className="task-stats" aria-label="Task summary">
  <div className="stat-card">
    <span>Total tasks</span>
    <strong>{loading ? "—" : tasks.length}</strong>
  </div>

  <div className="stat-card">
    <span>Pending</span>
    <strong className="pending-count">
      {loading ? "—" : tasks.filter((task) => !task.completed).length}
    </strong>
  </div>

  <div className="stat-card">
    <span>Completed</span>
    <strong className="completed-count">
      {loading ? "—" : tasks.filter((task) => task.completed).length}
    </strong>
  </div>
</section>

    <form className="add-form" onSubmit={addTask}>
      <label className="sr-only" htmlFor="new-task">
        New task
      </label>

      <input
        id="new-task"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Enter a new task"
        maxLength={120}
        required
        disabled={busy || loading}
      />

      <button
        className="primary-button"
        disabled={busy || loading || !title.trim()}
      >
        Add task
      </button>
    </form>

    {error && <p className="error-message" role="alert">{error}</p>}
    {busy && <p className="feedback" role="status">Saving…</p>}

    {loading ? (
      <p className="feedback" role="status">Loading tasks…</p>
    ) : tasks.length === 0 ? (
      <p className="empty-message">No tasks yet. Add one above.</p>
    ) : (
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task._id} className="task-item">
            {editingId === task._id ? (
              <form
                className="edit-form"
                onSubmit={(event) => saveEdit(event, task)}
              >
                <label className="sr-only" htmlFor={`edit-${task._id}`}>
                  Edit task title
                </label>

                <input
                  id={`edit-${task._id}`}
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  maxLength={120}
                  required
                  autoFocus
                  disabled={busy}
                />

                <div className="task-actions">
                  <button
                    className="primary-button"
                    disabled={busy || !editTitle.trim()}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <label className="task-label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    disabled={busy}
                  />

                  <span className={task.completed ? "completed" : ""}>
                    {task.title}
                  </span>
                </label>

                <div className="task-actions">
                  <button
                    onClick={() => {
                      setEditingId(task._id);
                      setEditTitle(task.title);
                    }}
                    disabled={busy}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    )}
  </main>
);
}