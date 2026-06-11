import { createClient } from "@supabase/supabase-js";
import { validateDemoLogin } from "@/lib/demoSupabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_SESSION_KEY = "optima-demo-session";

function getStoredDemoSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredDemoSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore unavailable storage in local demo mode.
  }
}

function getDemoBrowserClient() {
  return {
    auth: {
      async signInWithPassword({ email, password }) {
        const result = validateDemoLogin(email, password);

        if (!result.error && result.data.session) {
          setStoredDemoSession(result.data.session);
        }

        return result;
      },
      async getSession() {
        return { data: { session: getStoredDemoSession() }, error: null };
      },
      async updateUser() {
        return { data: { user: getStoredDemoSession()?.user ?? null }, error: null };
      },
      async signOut() {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(DEMO_SESSION_KEY);
        }

        return { error: null };
      },
    },
  };
}

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return getDemoBrowserClient();
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
