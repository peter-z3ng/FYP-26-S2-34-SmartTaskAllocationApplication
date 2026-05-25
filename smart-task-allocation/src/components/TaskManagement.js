"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const emptyTask = {
  taskId: "",
  title: "",
  description: "",
  status: "Open",
  startDatetime: "",
  endDatetime: "",
};

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadTasks() {
    try {
      const response = await fetch("/api/tasks", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load tasks.");
      }

      setTasks(result.tasks);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadTasks();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveTask(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: form.taskId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save task.");
      }

      setForm(emptyTask);
      await loadTasks();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete task.");
      }

      await loadTasks();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function editTask(task) {
    setForm({
      taskId: task.task_id,
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "Open",
      startDatetime: task.start_datetime ? task.start_datetime.slice(0, 16) : "",
      endDatetime: task.end_datetime ? task.end_datetime.slice(0, 16) : "",
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form onSubmit={saveTask} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">
          {form.taskId ? "Update Task" : "Create Task"}
        </h2>
        <div className="mt-5 space-y-4">
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Task title"
            required
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
          />
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Description"
            className="min-h-24 w-full rounded-md border border-[#b8c4d8] px-3 py-2 text-sm outline-none"
          />
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
          >
            <option>Open</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <input
            type="datetime-local"
            value={form.startDatetime}
            onChange={(event) => updateField("startDatetime", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
          />
          <input
            type="datetime-local"
            value={form.endDatetime}
            onChange={(event) => updateField("endDatetime", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
          />
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        <button className="mt-5 h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white">
          {form.taskId ? "Update Task" : "Create Task"}
        </button>
      </form>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Tasks</h2>
        <div className="mt-5 grid gap-4">
          {tasks.map((task) => (
            <article key={task.task_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold text-[#07183b]">{task.title}</h3>
                  <p className="mt-1 text-sm text-[#52627a]">{task.description}</p>
                  <span className="mt-3 inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#0a2a66]">
                    {task.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editTask(task)}
                    className="rounded-md border border-[#b8c4d8] px-3 py-2 text-sm font-bold"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.task_id)}
                    className="rounded-md bg-[#cf3033] px-3 py-2 text-sm font-bold text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
