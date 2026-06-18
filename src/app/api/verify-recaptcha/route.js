import { NextResponse } from "next/server";

const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

export async function POST(request) {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Google reCAPTCHA secret key is not configured." },
        { status: 503 },
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Google reCAPTCHA token is required." }, { status: 400 });
    }

    const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    if (remoteIp) {
      body.set("remoteip", remoteIp);
    }

    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const result = await verifyResponse.json();

    if (!verifyResponse.ok || !result.success) {
      return NextResponse.json(
        {
          error: "Google reCAPTCHA verification failed. Please try again.",
          codes: result["error-codes"] ?? [],
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
