import { getChatReadiness } from "@/lib/ai/chatReadiness";

export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

export function createChatHealthGet(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return function get() {
    const { status } = getChatReadiness(environment);
    return Response.json({ status }, { headers: RESPONSE_HEADERS });
  };
}

export const GET = createChatHealthGet();
