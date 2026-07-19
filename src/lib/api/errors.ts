export class ApiError extends Error {
  statusCode: number;
  messages: string[];

  constructor(statusCode: number, messages: string[]) {
    super(messages.join(", "));
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.messages = messages;
  }
}
