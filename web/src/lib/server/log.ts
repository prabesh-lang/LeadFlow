import "server-only";

/** Safe server-side logging: never log secrets; keep messages short in production. */
export function logSessionOrDataError(context: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (process.env.NODE_ENV === "development") {
    console.error(`[LeadFlow:${context}]`, err);
  } else {
    console.error(`[LeadFlow:${context}]`, msg);
  }
}
