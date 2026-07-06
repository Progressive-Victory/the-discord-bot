import {
  getDelayedInput,
  prepareScheduledMessage as prepareDelayedMessage,
  registerScheduledMessage as registerDelayedMessage,
  replyEphemeral,
} from "@/util/delaysend/helpers";
import { parseDate } from "chrono-node";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";

export async function createDelayedMessage(
  command: ChatInputCommandInteraction,
) {
  const input = getDelayedInput(command);
  const dateParsed = parseDate(
    command.options.getString("when")!,
    { instant: command.createdAt }, // Includes user timezone info
    { forwardDate: true },
  );
  if (!dateParsed) {
    const badDate = command.options.getString("when");
    console.log(
      'Received "',
      badDate,
      "\" and I (chrono-node) didn't know what to do with it.",
    );
    await replyEphemeral(
      command,
      "Sorry, I couldn't understand what " +
        badDate +
        " means. Try reformatting or being more specific.",
    );
    return;
  }
  input.pattern = dateParsed;
  const prepared = await prepareDelayedMessage(command, 1, input);
  if (!prepared) {
    return;
  }

  registerDelayedMessage(
    prepared.input,
    prepared.id,
    prepared.payload,
    prepared.task,
  );

  await replyEphemeral(
    command,
    `Delayed message created (${inlineCode(prepared.id)}) for ${inlineCode(prepared.task.nextRun()?.toLocaleString() ?? "Unknown")}.`,
  );
}
