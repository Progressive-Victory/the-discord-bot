import {
  getScheduleInput,
  prepareScheduledMessage,
  registerScheduledMessage,
  replyEphemeral,
} from "@/util/schedule/helpers";
import { parseDate } from "chrono-node";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";

export async function createScheduledMessage(
  trigger: ChatInputCommandInteraction,
) {
  const input = getScheduleInput(trigger);
  const dateParsed = parseDate(
    trigger.options.getString("when")!,
    { instant: trigger.createdAt }, // Includes user timezone info
    { forwardDate: true },
  );
  if (!dateParsed) {
    const badDate = trigger.options.getString("when");
    console.log(
      'Received "',
      badDate,
      "\" and I (chrono-node) didn't know what to do with it.",
    );
    await replyEphemeral(
      trigger,
      "Sorry, I couldn't understand what " +
        badDate +
        " means. Try reformatting or being more specific.",
    );
    return;
  }
  input.pattern = dateParsed;
  const prepared = await prepareScheduledMessage(trigger, 1, input);
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
    trigger,
    `Scheduled message created (${inlineCode(prepared.id)}) for ${inlineCode(prepared.task.nextRun()?.toLocaleString() ?? "Unknown")}.`,
  );
}
