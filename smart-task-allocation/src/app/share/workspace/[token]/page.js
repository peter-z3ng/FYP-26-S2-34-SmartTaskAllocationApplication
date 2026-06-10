import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const statusStyles = {
  Open: "bg-[#579BFC] text-white",
  "In Progress": "bg-[#FDAB3D] text-white",
  Completed: "bg-[#00C875] text-white",
  Cancelled: "bg-[#DF2F4A] text-white",
};

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value ?? "",
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

async function getUsersById(supabase, userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];

  if (!ids.length) {
    return new Map();
  }

  const { data } = await supabase
    .from("user_account")
    .select("user_id, username, email")
    .in("user_id", ids);

  return new Map(
    (data ?? []).map((user) => [
      user.user_id,
      user.username || user.email || "Unknown user",
    ]),
  );
}

export default async function SharedWorkspacePage({ params }) {
  const { token } = await params;

  if (!isUuid(token)) {
    notFound();
  }

  const supabase = getSupabaseAdminClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspace")
    .select(
      "workspace_id, workspace_name, description, created_by, status, link_access, created_at",
    )
    .eq("share_token", token)
    .neq("link_access", "Private")
    .maybeSingle();

  if (workspaceError || !workspace) {
    notFound();
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("task")
    .select("*")
    .eq("workspace_id", workspace.workspace_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const usersById = await getUsersById(
    supabase,
    (tasks ?? []).flatMap((task) => [task.owner_id, task.assigned_to]),
  );

  return (
    <main className="min-h-screen bg-[#C7DDEB] p-4 text-[#07183b] md:p-8">
      <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-3xl border border-[#BBE1FA] bg-white shadow-sm">
        <header className="border-b border-[#d6deed] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">
                Shared workspace
              </p>
              <h1 className="mt-2 text-4xl font-black text-[#07183b]">
                {workspace.workspace_name}
              </h1>
              {workspace.description ? (
                <p className="mt-2 max-w-2xl text-sm font-medium text-[#52627a]">
                  {workspace.description}
                </p>
              ) : null}
            </div>
            <div className="rounded-full border border-[#c4ccdc] bg-[#f8faff] px-4 py-2 text-sm font-black text-[#07183b]">
              {workspace.link_access} access
            </div>
          </div>
        </header>

        <div className="overflow-x-auto px-6 py-6 md:px-8">
          <h2 className="text-2xl font-black text-[#579BFC]">To-Do</h2>
          <div className="mt-5 min-w-[1040px] overflow-hidden rounded-xl border border-[#d6deed] shadow-sm">
            <div className="grid grid-cols-[minmax(260px,1fr)_180px_180px_170px_150px_170px] border-b border-[#d6deed] bg-[#f8faff] text-sm font-black text-[#2f3442]">
              <div className="px-5 py-4">Task</div>
              <div className="px-5 py-4 text-center">Owner</div>
              <div className="px-5 py-4 text-center">Assigned to</div>
              <div className="px-5 py-4 text-center">Status</div>
              <div className="px-5 py-4 text-center">Priority</div>
              <div className="px-5 py-4 text-center">Due Date</div>
            </div>

            {(tasks ?? []).map((task) => (
              <div
                key={task.task_id}
                className="grid grid-cols-[minmax(260px,1fr)_180px_180px_170px_150px_170px] border-b border-[#d6deed] text-sm font-semibold text-[#2f3442] last:border-b-0"
              >
                <div className="px-5 py-4">{task.title}</div>
                <div className="px-5 py-4 text-center text-[#667085]">
                  {usersById.get(task.owner_id) ?? "Owner"}
                </div>
                <div className="px-5 py-4 text-center text-[#667085]">
                  {usersById.get(task.assigned_to) ?? "-"}
                </div>
                <div className="px-5 py-3 text-center">
                  <span
                    className={`inline-flex min-w-28 justify-center rounded-md px-4 py-2 text-xs font-black ${
                      statusStyles[task.status] ?? statusStyles.Open
                    }`}
                  >
                    {task.status ?? "Open"}
                  </span>
                </div>
                <div className="px-5 py-4 text-center text-[#667085]">
                  {task.priority ?? "Medium"}
                </div>
                <div className="px-5 py-4 text-center text-[#667085]">
                  {formatDate(task.end_datetime)}
                </div>
              </div>
            ))}

            {!tasks?.length ? (
              <div className="px-5 py-12 text-center text-sm font-medium text-[#667085]">
                No tasks are available in this shared workspace.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
