"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function TeamManagement() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedTasks, setSelectedTasks] = useState({});
  const [selectedAutoTask, setSelectedAutoTask] = useState("");
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
      const [employeesResponse, tasksResponse, requestsResponse, assignmentsResponse] = await Promise.all([
        fetch("/api/employees", { headers }),
        fetch("/api/tasks", { headers }),
        fetch("/api/task-requests", { headers }),
        fetch("/api/task-assignments", { headers }),
      ]);
      const employeesResult = await employeesResponse.json();
      const tasksResult = await tasksResponse.json();
      const requestsResult = await requestsResponse.json();
      const assignmentsResult = await assignmentsResponse.json();

      if (!employeesResponse.ok) {
        throw new Error(employeesResult.error || "Could not load employees.");
      }

      if (!tasksResponse.ok) {
        throw new Error(tasksResult.error || "Could not load tasks.");
      }

      if (!requestsResponse.ok) {
        throw new Error(requestsResult.error || "Could not load task requests.");
      }

      if (!assignmentsResponse.ok) {
        throw new Error(assignmentsResult.error || "Could not load assignment history.");
      }

      setEmployees(employeesResult.employees);
      setTasks(tasksResult.tasks);
      setRequests(requestsResult.requests ?? []);
      setAssignments(assignmentsResult.assignments ?? []);
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
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  async function autoAssignTask() {
    if (!selectedAutoTask) {
      setError("Select a task for automatic assignment.");
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
          taskId: selectedAutoTask,
          mode: "auto",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not automatically assign task.");
      }

      setMessage(`Task automatically assigned to ${result.employee?.username ?? "an eligible employee"}.`);
      setError("");
      setSelectedAutoTask("");
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  async function reviewRequest(requestId, status) {
    try {
      const response = await fetch("/api/task-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ requestId, status }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update request.");
      }

      setMessage(`Task request ${status.toLowerCase()}.`);
      setError("");
      await loadData();
    } catch (reviewError) {
      setError(reviewError.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#07183b]">Automatic Assignment</h2>
            <p className="mt-1 text-sm text-[#52627a]">
              Select a task and let the system recommend the first eligible employee.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedAutoTask}
              onChange={(event) => setSelectedAutoTask(event.target.value)}
              className="h-11 min-w-72 rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
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
              onClick={autoAssignTask}
              className="h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white"
            >
              Auto Assign
            </button>
          </div>
        </div>
      </section>

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

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Employees</h2>
        <p className="mt-1 text-sm text-[#52627a]">
          Search employees and manually assign tasks after availability and eligibility checks.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {filteredEmployees.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No employee records found.
            </p>
          ) : null}

          {filteredEmployees.map((employee) => (
            <article key={employee.user_id} className="rounded-lg border border-[#d8e0ee] p-4">
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
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Task Assignment Requests</h2>
        <div className="mt-5 grid gap-4">
          {requests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No task assignment requests found.
            </p>
          ) : null}

          {requests.map((requestRow) => (
            <article key={requestRow.request_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-bold text-[#07183b]">{requestRow.task?.title}</h3>
                  <p className="mt-1 text-sm text-[#52627a]">
                    Requested by {requestRow.user?.username ?? requestRow.user?.email}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#0a2a66]">
                    {requestRow.status}
                  </span>
                </div>
                {requestRow.status === "Pending" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reviewRequest(requestRow.request_id, "Approved")}
                      className="h-10 rounded-md bg-[#0a2a66] px-4 text-sm font-bold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewRequest(requestRow.request_id, "Rejected")}
                      className="h-10 rounded-md border border-[#b8c4d8] px-4 text-sm font-bold text-[#07183b]"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Task Allocation History</h2>
        <div className="mt-5 grid gap-4">
          {assignments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No allocation history found.
            </p>
          ) : null}

          {assignments.map((assignment) => (
            <article key={assignment.assignment_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-[#07183b]">{assignment.task?.title}</h3>
                  <p className="text-sm text-[#52627a]">
                    Assigned to {assignment.user?.username ?? assignment.user?.email}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#0a2a66]">
                    {assignment.status}
                  </span>
                  <p className="mt-1 text-xs text-[#57708f]">
                    {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
