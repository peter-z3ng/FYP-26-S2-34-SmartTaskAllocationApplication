import { NextResponse } from "next/server";
import { loadPublishedFeedback } from "@/lib/publicFeedback";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitValue = Number(searchParams.get("limit"));
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : undefined;
    const feedback = await loadPublishedFeedback(limit);

    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
