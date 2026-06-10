import { createClient } from "@supabase/supabase-js";
import { getHomeRouteForRole } from "@/lib/roleRoutes";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function htmlResponse(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return htmlResponse(
      `<main style="font-family: Arial, sans-serif; padding: 32px;">
        <h1>Login failed</h1>
        <p>${escapeHtml(error?.message || "Could not create a session.")}</p>
        <a href="/login?email=${encodeURIComponent(email)}">Back to login</a>
      </main>`,
      401,
    );
  }

  let homeRoute = "/dashboard";

  try {
    const admin = getSupabaseAdminClient();
    const { data: account } = await admin
      .from("user_account")
      .select("role:role_id(role_name)")
      .eq("user_id", data.user.id)
      .maybeSingle();

    homeRoute = getHomeRouteForRole(account?.role?.role_name) ?? homeRoute;
  } catch {
    homeRoute = "/dashboard";
  }

  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const expiresAt = Math.round(Date.now() / 1000) + data.session.expires_in;
  const sessionPayload = {
    ...data.session,
    expires_at: expiresAt,
  };

  return htmlResponse(
    `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Signing in...</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 32px;">
        <p>Login succeeded. Opening your dashboard...</p>
        <script>
          localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(sessionPayload))});
          window.location.replace(${JSON.stringify(homeRoute)});
        </script>
      </body>
    </html>`,
  );
}
