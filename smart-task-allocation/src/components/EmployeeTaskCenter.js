"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function EmployeeTaskCenter() {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [availableSearch, setAvailableSearch] = useState("");
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
      const [tasksResponse, requestsResponse] = await Promise.all([
        fetch("/api/employee-tasks", { headers }),
        fetch("/api/task-requests", { headers }),
      ]);
      const tasksResult = await tasksResponse.json();
      const requestsResult = await requestsResponse.json();

      if (!tasksResponse.ok) {
        throw new Error(tasksResult.error || "Could not load employee tasks.");
      }

      if (!requestsResponse.ok) {
        throw new Error(requestsResult.error || "Could not load task requests.");
      }

      setAssignedTasks(tasksResult.assignedTasks ?? []);
      setAvailableTasks(tasksResult.availableTasks ?? []);
      setRequests(requestsResult.requests ?? []);
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

  const filteredAssignedTasks = useMemo(() => {
    if (statusFilter === "All") {
      return assignedTasks;
    }

    return assignedTasks.filter((assignment) => assignment.status === statusFilter);
  }, [assignedTasks, statusFilter]);

  const filteredAvailableTasks = useMemo(() => {
    const normalizedSearch = availableSearch.trim().toLowerCase();

    return availableTasks.filter((task) =>
      `${task.title} ${task.description ?? ""}`.toLowerCase().includes(normalizedSearch),
    );
  }, [availableTasks, availableSearch]);

  async function updateTaskStatus(assignmentId, status) {
    try {
      setError("");
      const response = await fetch("/api/employee-tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ assignmentId, status }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update task status.");
      }

      setMessage("Task status updated.");
      await loadData();
    } catch (statusError) {
      setError(statusError.message);
    }
  }

  async function requestTask(taskId) {
    try {
      setError("");
      const response = await fetch("/api/task-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ taskId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit task request.");
      }

      setMessage("Task assignment request submitted.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function cancelRequest(requestId) {
    if (!window.confirm("Cancel this task assignment request?")) {
      return;
    }

    try {
      setError("");
      const response = await fetch("/api/task-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ requestId, status: "Cancelled" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not cancel request.");
      }

      setMessage("Task assignment request cancelled.");
      await loadData();
    } catch (cancelError) {
      setError(cancelError.message);
    }
  }

  return (
    <div className="space-y-6">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#07183b]">Assigned Tasks</h2>
            <p className="mt-1 text-sm text-[#52627a]">Review work assigned to you and update progress.</p>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
          >
            <option>All</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="mt-5 grid gap-4">
          {filteredAssignedTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No assigned tasks found.
            </p>
          ) : null}

          {filteredAssignedTasks.map((assignment) => (
            <article key={assignment.assignment_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-bold text-[#07183b]">{assignment.task?.title}</h3>
                  <p className="mt-1 text-sm text-[#52627a]">{assignment.task?.description}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#57708f]">
                    {formatDateRange(assignment.task)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={assignment.status}
                    onChange={(event) => updateTaskStatus(assignment.assignment_id, event.target.value)}
                    className="h-10 rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
                  >
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#07183b]">Available Tasks</h2>
            <p className="mt-1 text-sm text-[#52627a]">Search open tasks and submit assignment requests.</p>
          </div>
          <input
            value={availableSearch}
            onChange={(event) => setAvailableSearch(event.target.value)}
            placeholder="Search available tasks"
            className="h-11 rounded-md border border-[#b8c4d8] px-3 text-sm outline-none lg:w-80"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredAvailableTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No available tasks found.
            </p>
          ) : null}

          {filteredAvailableTasks.map((task) => (
            <article key={task.task_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <h3 className="font-bold text-[#07183b]">{task.title}</h3>
              <p className="mt-1 text-sm text-[#52627a]">{task.description}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#57708f]">
                {formatDateRange(task)}
              </p>
              <button
                type="button"
                onClick={() => requestTask(task.task_id)}
                className="mt-4 h-10 rounded-md bg-[#0a2a66] px-4 text-sm font-bold text-white"
              >
                Request Assignment
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Assignment Requests</h2>
        <div className="mt-5 grid gap-4">
          {requests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No task assignment requests found.
            </p>
          ) : null}

          {requests.map((requestRow) => (
            <article key={requestRow.request_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold text-[#07183b]">{requestRow.task?.title}</h3>
                  <p className="mt-1 text-sm text-[#52627a]">{formatDateRange(requestRow.task)}</p>
                  <span className="mt-3 inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#0a2a66]">
                    {requestRow.status}
                  </span>
                </div>
                {requestRow.status === "Pending" ? (
                  <button
                    type="button"
                    onClick={() => cancelRequest(requestRow.request_id)}
                    className="h-10 rounded-md border border-[#b8c4d8] px-4 text-sm font-bold text-[#07183b]"
                  >
                    Cancel Request
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDateRange(task) {
  if (!task?.start_datetime || !task?.end_datetime) {
    return "No scheduled time";
  }

  return `${new Date(task.start_datetime).toLocaleString()} - ${new Date(task.end_datetime).toLocaleString()}`;
}
