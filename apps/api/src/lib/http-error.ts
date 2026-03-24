export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class NotImplementedError extends HttpError {
  constructor(message = "Not implemented yet.") {
    super(501, message);
    this.name = "NotImplementedError";
  }
}
