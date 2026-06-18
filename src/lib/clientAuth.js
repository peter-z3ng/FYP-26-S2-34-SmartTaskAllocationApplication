import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

const DEMO_EMAIL_TO_USER_ID = {
  "demo-platform@optima.test": "demo-platform",
  "demo-useradmin@optima.test": "demo-useradmin",
  "demo-manager@optima.test": "demo-manager",
  "demo-employee@optima.test": "demo-employee",
  "demo-employee-2@optima.test": "demo-employee-2",
  "demo-employee-3@optima.test": "demo-employee-3",
  "demo-employee-4@optima.test": "demo-employee-4",
  "demo-employee-5@optima.test": "demo-employee-5",
  "demo-employee-6@optima.test": "demo-employee-6",
  "demo-employee-7@optima.test": "demo-employee-7",
  "demo-employee-10@optima.test": "demo-employee-10",
  "demo-employee-11@optima.test": "demo-employee-11",
};

export async function getAuthHeaders() {
  if (!isSupabaseConfigured()) {
    let demoUserId = "demo-manager";

    if (typeof window !== "undefined") {
      const storedToken = window.localStorage.getItem("workflowDemoToken");
      if (storedToken) {
        return {
          Authorization: `Bearer ${storedToken}`,
        };
      }

      const storedUserId = window.localStorage.getItem("workflowDemoUserId");
      const storedEmail = window.localStorage.getItem("workflowDemoEmail");
      const path = window.location.pathname;

      if (storedUserId) {
        demoUserId = storedUserId;
      } else if (path.startsWith("/platformadmin")) {
        demoUserId = "demo-platform";
      } else if (path.startsWith("/useradmin")) {
        demoUserId = "demo-useradmin";
      } else if (path.startsWith("/employee")) {
        demoUserId = "demo-employee";
      } else if (storedEmail) {
        demoUserId = DEMO_EMAIL_TO_USER_ID[storedEmail.toLowerCase()] ?? "demo-manager";
      }
    }

    return {
      Authorization: `Bearer demo:${demoUserId}`,
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();

  return {
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
  };
}
