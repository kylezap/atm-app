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

export class InvalidPinError extends HttpError {
  constructor(message = "Invalid PIN.") {
    super(403, message);
    this.name = "InvalidPinError";
  }
}

export class PinApiError extends HttpError {
  constructor(message = "Unable to verify PIN.") {
    super(502, message);
    this.name = "PinApiError";
  }
}

export class InvalidPinResponseError extends HttpError {
  constructor(message = "Unable to verify PIN.") {
    super(502, message);
    this.name = "InvalidPinResponseError";
  }
}
