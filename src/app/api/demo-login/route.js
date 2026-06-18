import { NextResponse } from "next/server";
import {
  getDemoAccountByEmail,
  getDemoHomeRouteForAccount,
  validateDemoLogin,
} from "@/lib/demoSupabase";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const loginResult = validateDemoLogin(cleanEmail, password);

    if (loginResult.error) {
      return NextResponse.json({ error: loginResult.error.message }, { status: 401 });
    }

    const account = getDemoAccountByEmail(cleanEmail);
    const homeRoute = getDemoHomeRouteForAccount(account);

    if (!homeRoute) {
      return NextResponse.json({ error: "This demo account role does not have a home." }, { status: 400 });
    }

    return NextResponse.json({
      accessToken: loginResult.data.session.access_token,
      email: account.email,
      homeRoute,
      userId: account.user_id,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
