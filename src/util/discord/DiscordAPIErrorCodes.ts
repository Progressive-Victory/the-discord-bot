/**
 * Along with the HTTP error code, our API can also return more detailed error codes through a code key in the JSON error response. The response will also contain a message key containing a more friendly error string. Some of these errors may include additional details in the form of Error Messages provided by an errors object.
 * @see https://discord.com/developers/docs/topics/opcodes-and-status-codes#json
 */
export enum DiscordAPIErrorCodes {
  UnknownChannel = 10003,
  UnknownMember = 10007,
}
