export class UndefinedFactError extends Error {
  code: string
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.code = "UNDEFINED_FACT";
  }
}
