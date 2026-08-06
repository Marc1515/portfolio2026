import { buildRecruiterPrompt } from "@/lib/ai/promptBuilder";
import { AIProviderError, createAIProvider } from "@/lib/ai/provider";
import { MAX_REQUEST_BODY_LENGTH, parseChatRequest } from "@/lib/ai/validation";
import type {
  ChatErrorCode,
  ChatErrorResponse,
  ChatResponse,
} from "@/types/chat";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function errorResponse(error: ChatErrorCode, status: number) {
  return Response.json({ error } satisfies ChatErrorResponse, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

export async function POST(request: Request) {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return errorResponse("invalid_request", 400);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength > MAX_REQUEST_BODY_LENGTH
  ) {
    return errorResponse("invalid_request", 400);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("invalid_request", 400);
  }

  if (rawBody.length === 0 || rawBody.length > MAX_REQUEST_BODY_LENGTH) {
    return errorResponse("invalid_request", 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return errorResponse("invalid_request", 400);
  }

  const chatRequest = parseChatRequest(body);
  if (!chatRequest) {
    return errorResponse("invalid_request", 400);
  }

  try {
    const provider = await createAIProvider();
    const message = await provider.generate(
      buildRecruiterPrompt(chatRequest.locale, chatRequest.messages),
    );

    return Response.json({ message } satisfies ChatResponse, {
      headers: RESPONSE_HEADERS,
    });
  } catch (error) {
    if (error instanceof AIProviderError) {
      return errorResponse("provider_unavailable", 503);
    }

    return errorResponse("internal_error", 500);
  }
}
