// An input error: the tool cannot read the file at all, or the file breaks a limit. The message is shown to the user
// and the exit code is 2.
export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
  }
}
