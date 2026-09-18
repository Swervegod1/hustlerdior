import "server-only";
import { ZodError } from "zod";
import { HttpError, privateHeaders } from "./http";
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: privateHeaders },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return Response.json(
      { error: "Please check the information and try again." },
      { status: 400, headers: privateHeaders },
    );
  // Never echo provider errors, API responses, photos, recipient details or credentials.
  return Response.json(
    { error: "This service is temporarily unavailable. Please try again." },
    { status: 503, headers: privateHeaders },
  );
}
