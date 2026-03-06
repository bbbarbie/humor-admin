import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GenerateRequestBody = {
  prompt?: unknown;
  size?: unknown;
  count?: unknown;
};

type OpenAiImageData = {
  b64_json?: string;
  url?: string;
};

type OpenAiGenerateResponse = {
  data?: OpenAiImageData[];
  error?: {
    message?: string;
  };
};

async function requireSuperadmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: NextResponse.json({ error: `Failed to verify profile: ${profileError.message}` }, { status: 500 }),
    };
  }

  if (profile?.is_superadmin !== true) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true };
}

function toDataUrl(base64Png: string): string {
  return `data:image/png;base64,${base64Png}`;
}

export async function POST(request: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as GenerateRequestBody;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const size =
    body.size === "1024x1024" || body.size === "1024x1536" || body.size === "1536x1024"
      ? body.size
      : "1024x1024";
  const count = typeof body.count === "number" && [1, 2, 3, 4].includes(body.count) ? body.count : 2;

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it to enable Generate Image mode." },
      { status: 503 },
    );
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  const openAiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      n: count,
      response_format: "b64_json",
    }),
  });

  const responseJson = (await openAiResponse.json().catch(() => ({}))) as OpenAiGenerateResponse;

  if (!openAiResponse.ok) {
    const reason = responseJson.error?.message || "Image generation failed.";
    return NextResponse.json({ error: reason }, { status: openAiResponse.status });
  }

  const data = responseJson.data ?? [];
  const images = data
    .map((item, index) => {
      const url = item.url || (item.b64_json ? toDataUrl(item.b64_json) : "");
      if (!url) return null;
      return {
        id: `${Date.now()}-${index + 1}`,
        url,
      };
    })
    .filter((item): item is { id: string; url: string } => Boolean(item));

  if (!images.length) {
    return NextResponse.json({ error: "No generated images were returned." }, { status: 502 });
  }

  return NextResponse.json({ images });
}
