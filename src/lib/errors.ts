import { NextResponse } from "next/server";

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400
): NextResponse<StandardErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleApiError(err: unknown): NextResponse<StandardErrorResponse> {
  if (err instanceof AppError) {
    return createErrorResponse(err.code, err.message, err.statusCode);
  }

  // Always mask raw internal stack traces and server errors from the client
  console.error("Unhandled API error:", err);
  return createErrorResponse(
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred. Please try again later.",
    500
  );
}
