// This is being created/left in here as a starting point. Besides the inconvenient input method, this would be too fragile to rely upon.
// To have a shippable recurring message feature, data would need to be stored such that all scheduled messages would persist after a server restart.
import {
  getScheduleInput,
  prepareScheduledMessage,
  registerScheduledMessage,
  replyEphemeral,
} from "@/util/schedule/helpers";
import { ChatInputCommandInteraction, inlineCode } from "discord.js";

export async function createCronMessage(
  trigger: ChatInputCommandInteraction,
  numRuns: number = 1,
) {
  const input = getScheduleInput(trigger);
  input.pattern = trigger.options.getString("cron")!; // Required field, so we can just assert and move on
  const prepared = await prepareScheduledMessage(trigger, numRuns, input);
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
    `Cron message created (${inlineCode(prepared.id)}) for ${inlineCode(prepared.task.nextRun()?.toLocaleString() ?? "Unknown")}.`,
  );
}
