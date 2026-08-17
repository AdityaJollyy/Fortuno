import { ZodError } from "zod";

// Throw this for failures the user is meant to see: validation, not found,
// unauthorized. Anything else is a bug and gets a generic message.
export class ActionError extends Error {}

// Next.js replaces thrown error messages with a generic digest in production
// builds, so actions return their failures instead of throwing them.
// This turns a caught error into a message that is safe to show.
export function toErrorMessage(error) {
  if (error instanceof ActionError) return error.message;
  if (error instanceof ZodError) return error.issues[0].message;

  console.error(error);
  return "Something went wrong. Please try again.";
}
