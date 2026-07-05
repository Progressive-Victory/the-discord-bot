import {
  getScheduleInput,
  prepareScheduledMessage,
  registerScheduledMessage,
  replyEphemeral,
} from "@/util/schedule/helpers";
import { parseDate } from "chrono-node";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";

export async function createScheduledMessage(
  command: ChatInputCommandInteraction,
) {
  const input = getScheduleInput(command);
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
  const prepared = await prepareScheduledMessage(command, 1, input);
  if (!prepared) {
    return;
  }

  registerScheduledMessage(
    prepared.input,
    prepared.id,
    prepared.payload,
    prepared.task,
  );

  await replyEphemeral(
    command,
    `Scheduled message created (${inlineCode(prepared.id)}) for ${inlineCode(prepared.task.nextRun()?.toLocaleString() ?? "Unknown")}.`,
  );
}
