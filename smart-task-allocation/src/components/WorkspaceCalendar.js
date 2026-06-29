"use client";

import { useMemo, useState } from "react";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function startOfWeek(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay()); // back to Sunday
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatHour(hour) {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// A half-width overlay panel that grows out of its trigger button.
// (Closed via the trigger pill, which becomes a × while open.)
function OverlayPanel({ open, align, children }) {
  const isRight = align === "right";
  return (
    <div
      className={`absolute top-0 bottom-[30%] z-30 w-1/2 p-2 transition duration-200 ease-out ${
        isRight ? "right-0 origin-top-right" : "left-0 origin-top-left"
      } ${open ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-[0_24px_70px_rgba(13,30,76,0.22)] backdrop-blur-xl">
        {/* Title divider — the floating pill sits over this bar */}
        <div className="h-13 shrink-0 border-b border-[#E0E5E9]" />
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function WorkspaceCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  // Independent — both panels can be open at the same time.
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(weekStart),
    [weekStart],
  );

  const today = useMemo(() => new Date(), []);

  function goToPreviousWeek() {
    setWeekStart((current) => addDays(current, -7));
  }

  function goToNextWeek() {
    setWeekStart((current) => addDays(current, 7));
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Header: Tasks · month nav · Employee */}
      <div className="relative z-40 flex shrink-0 items-center justify-between gap-4 px-2 pb-5">
        <button
          type="button"
          onClick={() => setIsTasksOpen((current) => !current)}
          aria-label={isTasksOpen ? "Close tasks" : "Open tasks"}
          className={`flex items-center justify-center rounded-full border text-sm font-bold transition ${
            isTasksOpen
              ? "h-11 w-11 border-white bg-slate-200 text-[#0D1E4C]"
              : "border-white/60 bg-white/20 px-6 py-3 text-[#0D1E4C] hover:bg-white/70"
          }`}
        >
          {isTasksOpen ? <CloseIcon /> : "Tasks"}
        </button>

        <div className="flex items-center gap-3 text-lg font-bold text-[#0D1E4C]">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/60"
            aria-label="Previous week"
          >
            ‹
          </button>
          <span className="min-w-[7rem] text-center">{monthLabel}</span>
          <button
            type="button"
            onClick={goToNextWeek}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/60"
            aria-label="Next week"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsEmployeesOpen((current) => !current)}
          aria-label={isEmployeesOpen ? "Close employees" : "Open employees"}
          className={`flex items-center justify-center rounded-full border text-sm font-bold transition ${
            isEmployeesOpen
              ? "h-11 w-11 border-white bg-slate-200 text-[#0D1E4C]"
              : "border-white/60 bg-white/20 px-6 py-3 text-[#0D1E4C] hover:bg-white/70"
          }`}
        >
          {isEmployeesOpen ? <CloseIcon /> : "Employee"}
        </button>
      </div>

      {/* Calendar card */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/60 bg-white/40 backdrop-blur-3xl">
        <div className="h-full overflow-auto">
          {/* Day header row (sticky) */}
          <div
            className="sticky top-0 z-20 grid bg-gray-100"
            style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
          >
            {/* Spacer for the time-label column so SUN aligns with the grid */}
            <div aria-hidden="true" />
            {days.map((day, index) => {
              const isToday = isSameDay(day, today);
              return (
                <div key={day.toISOString()} className="py-2 text-center">
                  <p className="text-[11px] font-semibold tracking-wide text-[#98a2b3]">
                    {DAY_LABELS[index]}
                  </p>
                  <p
                    className={`mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-xl font-medium ${
                      isToday ? "bg-[#1E40AF] text-white" : "text-[#1f2937]"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div
            className="grid"
            style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
          >
            {HOURS.map((hour) => (
              <div key={hour} className="contents">
                {/* Time label column — no divider line */}
                <div className="relative h-14 pr-2 text-right">
                  {hour > 0 ? (
                    <span className="absolute -top-2 right-2 text-[11px] font-medium text-[#98a2b3]">
                      {formatHour(hour)}
                    </span>
                  ) : null}
                </div>
                {days.map((day) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`h-14 border-l border-[#E0E5E9] ${
                      hour > 0 ? "border-t" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks overlay — left half, grows from the Tasks button */}
      <OverlayPanel open={isTasksOpen} align="left">
        {/* Task list content goes here */}
        <p className="px-1 py-2 text-sm text-[#52627a]">No tasks yet.</p>
      </OverlayPanel>

      {/* Employee overlay — right half, grows from the Employee button */}
      <OverlayPanel open={isEmployeesOpen} align="right">
        {/* Employee list content goes here */}
        <p className="px-1 py-2 text-sm text-[#52627a]">No employees yet.</p>
      </OverlayPanel>
    </div>
  );
}
