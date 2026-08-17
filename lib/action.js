import { ZodError } from "zod";

// Throw this inside an action for failures the user is meant to see:
// validation, not found, unauthorized. Anything else is treated as a bug.
export class ActionError extends Error {}

// Next.js replaces thrown error messages with a generic digest in production,
// so actions return their failures instead of throwing them across the wire.
function toErrorMessage(error) {
  if (error instanceof ActionError) return error.message;
  if (error instanceof ZodError) return error.issues[0].message;

  console.error(error);
  return "Something went wrong. Please try again.";
}

export function ok(data) {
  return { success: true, data };
}

export function fail(error) {
  return { success: false, error: toErrorMessage(error) };
}

// Server components call actions directly. They unwrap here and let
// app/error.jsx handle the failure.
export function unwrap(result) {
  if (!result.success) throw new Error(result.error);
  return result.data;
}
