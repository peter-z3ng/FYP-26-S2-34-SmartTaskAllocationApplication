"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function TeamManagement() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedTasks, setSelectedTasks] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadData() {
    try {
      const headers = await authHeaders();
      const [employeesResponse, tasksResponse] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/tasks", { headers }),
      ]);
      const employeesResult = await employeesResponse.json();
      const tasksResult = await tasksResponse.json();

      if (!employeesResponse.ok) {
        throw new Error(employeesResult.error || "Could not load employees.");
      }

      if (!tasksResponse.ok) {
        throw new Error(tasksResult.error || "Could not load tasks.");
      }

      setEmployees(employeesResult.employees);
      setTasks(tasksResult.tasks);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return employees.filter((employee) =>
      `${employee.username} ${employee.email}`.toLowerCase().includes(normalizedSearch),
    );
  }, [employees, search]);

  async function assignTask(employee) {
    const taskId = selectedTasks[employee.user_id];

    if (!taskId) {
      setError("Select a task first.");
      return;
    }

    try {
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          taskId,
          userId: employee.user_id,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not assign task.");
      }

      setMessage(`Task assigned to ${employee.username}.`);
      setError("");
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  return (
    <div className="space-y-6">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search employees"
        className="h-14 w-full rounded-full border border-[#ead9c4] bg-white px-8 text-lg text-[#07183b] shadow-sm outline-none placeholder:text-[#9c8f82]"
      />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a2a66]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {filteredEmployees.map((employee) => (
          <article key={employee.user_id} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#07183b]">{employee.username}</h2>
            <p className="mt-1 text-sm text-[#52627a]">{employee.email}</p>
            <span className="mt-3 inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#0a2a66]">
              {employee.account_status}
            </span>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedTasks[employee.user_id] ?? ""}
                onChange={(event) =>
                  setSelectedTasks((current) => ({
                    ...current,
                    [employee.user_id]: event.target.value,
                  }))
                }
                className="h-11 flex-1 rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
              >
                <option value="">Select task</option>
                {tasks.map((task) => (
                  <option key={task.task_id} value={task.task_id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => assignTask(employee)}
                className="h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white"
              >
                Assign
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
