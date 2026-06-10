const DEFAULT_MODEL = "gpt-4.1-mini";

function extractOutputText(responseJson) {
  if (typeof responseJson?.output_text === "string") {
    return responseJson.output_text;
  }

  const content = responseJson?.output
    ?.flatMap((item) => item.content ?? [])
    ?.map((item) => item.text)
    ?.filter(Boolean)
    ?.join("\n");

  return content || "";
}

function parseJsonText(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch?.[1] ?? trimmed;

  return JSON.parse(jsonText);
}

export function isOptimusAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateOptimusActionNotes(report) {
  const fallbackNotes = report.insights ?? [];

  if (!isOptimusAiConfigured()) {
    return { notes: fallbackNotes, provider: "local" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are Optimus AI for a smart task allocation platform. Return concise, practical manager action notes as JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Create 4 to 6 action notes. Use clear business language. Each note must be under 120 characters. Return exactly: {\"notes\":[\"...\"]}",
              report: {
                totals: report.totals,
                rates: report.rates,
                employeeLoad: (report.employeeLoad ?? []).slice(0, 8),
                localInsights: fallbackNotes,
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed with ${response.status}`);
    }

    const responseJson = await response.json();
    const parsed = parseJsonText(extractOutputText(responseJson));
    const notes = Array.isArray(parsed.notes)
      ? parsed.notes.map((note) => String(note).trim()).filter(Boolean).slice(0, 6)
      : [];

    return {
      notes: notes.length ? notes : fallbackNotes,
      provider: notes.length ? "openai" : "local",
    };
  } catch (error) {
    console.warn("Optimus AI fallback:", error.message);
    return { notes: fallbackNotes, provider: "local" };
  }
}

export async function generateOptimusWorkspaceAction({ action, tasks, assignments, localResult }) {
  if (!isOptimusAiConfigured()) {
    return { ...localResult, provider: "local" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are Optimus AI. Analyze task allocation data and return JSON only for a manager dashboard.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Return JSON with title, message, and items. items must be [{label,value}]. Keep text concise.",
              action,
              tasks: tasks.slice(0, 20),
              assignments: assignments.slice(0, 30),
              localResult,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed with ${response.status}`);
    }

    const responseJson = await response.json();
    const parsed = parseJsonText(extractOutputText(responseJson));

    return {
      title: parsed.title || localResult.title,
      message: parsed.message || localResult.message,
      items: Array.isArray(parsed.items) && parsed.items.length ? parsed.items : localResult.items,
      provider: "openai",
    };
  } catch (error) {
    console.warn("Optimus AI workspace fallback:", error.message);
    return { ...localResult, provider: "local" };
  }
}
