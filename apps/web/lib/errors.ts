export class AppError extends Error {
  constructor(public readonly publicMessage: string, message?: string) {
    super(message ?? publicMessage);
    this.name = "AppError";
  }
}

export function toPublicErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    return error.publicMessage;
  }

  return "Something went wrong. Please try again.";
}
