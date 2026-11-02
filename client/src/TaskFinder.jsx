import { useState } from "react";

export default function TaskFinder() {
    const [status, setStatus] = useState("all");
    const [results, setResults] = useState([]);
    const [loadedStatus, setLoadedStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function loadTasks(event) {
        event.preventDefault();

        setLoading(true);
        setError("");
        setResults([]);
        setLoadedStatus(null);

        try {
            const query = new URLSearchParams({ status });
            const response = await fetch(`/api/tasks?${query}`);

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || "Could not load tasks.");
            }

            if (!Array.isArray(data)) {
                throw new Error("Unexpected response from the server.");
            }

            setResults(data);
            setLoadedStatus(status);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="task-finder">
            <h2>Find tasks</h2>

            <form className="add-form" onSubmit={loadTasks}>
                <label htmlFor="task-status">Status</label>

                <select
                    id="task-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    disabled={loading}
                >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                </select>

                <button className="primary-button" disabled={loading}>
                    {loading ? "Loading…" : "Load tasks"}
                </button>
            </form>

            {loading && <p role="status">Fetching tasks…</p>}
            {error && <p className="error-message" role="alert">{error}</p>}

            {loadedStatus !== null && (
                <>
                    <p className="feedback">
                        {results.length} result(s) · {loadedStatus}
                    </p>

                    {results.length === 0 ? (
                        <p className="feedback">No matching tasks.</p>
                    ) : (
                        <ul className="task-list">
                            {results.map((task) => (
                                <li className="task-item" key={task._id}>
                                    <span>{task.title}</span>
                                    <span className="feedback">
                                        {task.completed ? "Completed" : "Pending"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
}