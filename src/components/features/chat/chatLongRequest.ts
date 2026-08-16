export const LONG_REQUEST_NOTICE_THRESHOLD = 700;

export function isLongRecruiterRequest(content: string): boolean {
  return content.trim().length >= LONG_REQUEST_NOTICE_THRESHOLD;
}

export function shouldShowLongRequestNotice(options: {
  input: string;
  pendingContent?: string;
  isLoading: boolean;
  hasRequestError: boolean;
}): boolean {
  const activeLongRequest =
    options.isLoading && isLongRecruiterRequest(options.pendingContent ?? "");

  return (
    activeLongRequest ||
    (!options.hasRequestError && isLongRecruiterRequest(options.input))
  );
}
