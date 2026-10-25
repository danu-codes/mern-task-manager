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
  <div className="app-layout">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="Taskspace home">
        <span className="brand-icon">✓</span>
        Taskspace
      </a>

      <div className="workspace-label">WORKSPACE</div>

      <div className="nav-item active">
        <span>▦</span>
        All tasks
        <span className="nav-count">{tasks.length}</span>
      </div>

      <div className="sidebar-note">
        <span className="note-icon">✦</span>
        <h3>Small steps. Real progress.</h3>
        <p>Make room for what matters. One completed task at a time.</p>
      </div>

      <div className="profile">
        <div className="avatar">D</div>
        <div>
          <strong>Danu’s workspace</strong>
          <span>Personal task manager</span>
        </div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <span>Workspace <span className="breadcrumb-divider">/</span> All tasks</span>
        <span className="workspace-badge">Personal workspace</span>
      </header>

      <div className="page-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">A LITTLE FOCUS GOES A LONG WAY</p>
            <h1>Make today count<span>.</span></h1>
            <p className="page-description">
              Capture your ideas, organize your work, and keep moving forward.
            </p>
          </div>

          <span className="date-label">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </section>

        <section className="stats-grid" aria-label="Task overview">
          <article className="stat-card">
            <span className="stat-icon purple">▦</span>
            <div>
              <p>Total tasks</p>
              <strong>{loading ? "—" : tasks.length}</strong>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon amber">◷</span>
            <div>
              <p>In progress</p>
              <strong>
                {loading ? "—" : tasks.filter((task) => !task.completed).length}
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <div>
              <p>Completed</p>
              <strong>
                {loading ? "—" : tasks.filter((task) => task.completed).length}
              </strong>
            </div>
          </article>
        </section>

        <section className="task-panel">
          <div className="panel-heading">
            <div>
              <h2>Your tasks</h2>
              <p>A clear plan starts with one task.</p>
            </div>
            <span className="task-count">{tasks.length} tasks</span>
          </div>

          <form className="add-form" onSubmit={addTask}>
            <label className="sr-only" htmlFor="new-task">
              New task
            </label>
            <span className="input-plus" aria-hidden="true">+</span>
            <input
              id="new-task"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What would you like to get done?"
              maxLength={120}
              required
              disabled={busy || loading}
            />
            <button
              className="button button-primary"
              disabled={busy || loading || !title.trim()}
            >
              <span aria-hidden="true">+</span> Add task
            </button>
          </form>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="list-label">
            <span>TASK</span>
            <span>{busy ? "Saving changes…" : "STATUS & ACTIONS"}</span>
          </div>

          {busy && (
            <span className="sr-only" role="status">
              Saving changes…
            </span>
          )}

          {loading ? (
            <div className="empty-state" role="status">
              <span className="loader" />
              <h3>Getting your tasks ready</h3>
              <p>Just a moment while we load your workspace.</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✓</span>
              <h3>A fresh start</h3>
              <p>Add your first task above and give your day some direction.</p>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className={`task-card ${task.completed ? "is-complete" : ""}`}
                >
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
                      <div className="edit-actions">
                        <button
                          className="button button-primary"
                          disabled={busy || !editTitle.trim()}
                        >
                          Save
                        </button>
                        <button
                          className="button button-secondary"
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
                      <label className="task-main">
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task)}
                          disabled={busy}
                        />
                        <span className="task-title">{task.title}</span>
                      </label>

                      <div className="task-actions">
                        <span
                          className={`status-badge ${
                            task.completed ? "status-completed" : "status-pending"
                          }`}
                        >
                          <span className="status-dot" />
                          {task.completed ? "Completed" : "Pending"}
                        </span>

                        <button
                          className="action-button"
                          onClick={() => {
                            setEditingId(task._id);
                            setEditTitle(task.title);
                          }}
                          disabled={busy}
                          aria-label={`Edit ${task.title}`}
                        >
                          Edit
                        </button>

                        <button
                          className="action-button action-delete"
                          onClick={() => deleteTask(task)}
                          disabled={busy}
                          aria-label={`Delete ${task.title}`}
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

          <footer className="panel-footer">
            <span>
              {tasks.filter((task) => task.completed).length} of {tasks.length}{" "}
              completed
            </span>
            <span>You’ve got this. Keep going.</span>
          </footer>
        </section>

        <p className="page-footer">
          Built for a clearer mind and a more focused day.
        </p>
      </div>
    </main>
  </div>
);
}