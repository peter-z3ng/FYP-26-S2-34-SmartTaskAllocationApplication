import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export async function getAuthHeaders() {
  if (!isSupabaseConfigured()) {
    let demoEmail = "manager@workflow.test";

    if (typeof window !== "undefined") {
      const storedEmail = window.localStorage.getItem("workflowDemoEmail");
      const path = window.location.pathname;

      if (path.startsWith("/platformadmin")) {
        demoEmail = "platformadmin@workflow.test";
      } else if (path.startsWith("/useradmin")) {
        demoEmail = "useradmin@workflow.test";
      } else if (path.startsWith("/employee")) {
        demoEmail = "employee@workflow.test";
      } else if (storedEmail) {
        demoEmail = storedEmail;
      }
    }

    return {
      Authorization: `Bearer demo:${demoEmail}`,
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();

  return {
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
  };
}
