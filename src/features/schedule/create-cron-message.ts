// This is being created/left in here as a starting point. Besides the inconvenient input method, this would be to fragile to rely upon.
// Ideally, for this to be a real feature, recurring messages would be stored in *a* db (not the main one) and this entire system would be made stateless (aside from the state croner holds; that would be recreated on restart)
// also it makes demo and troubleshooting the "real" one when the cron conversion breaks down
import {
  getScheduleInput,
  prepareScheduledMessage,
  registerScheduledMessage,
  replyEphemeral,
} from "@/util/schedule/helpers";
import { ChatInputCommandInteraction } from "discord.js";

export async function createCronMessage(
  interaction: ChatInputCommandInteraction,
  numRuns: number = 1,
) {
  const input = getScheduleInput(interaction);
  input.pattern = interaction.options.getString("cron")!; // Required field, so we can just assert and move on
  const prepared = await prepareScheduledMessage(interaction, numRuns, input);
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
    interaction,
    `Cron message created (\`${prepared.id}\`) for \`${prepared.task.nextRun()}\`.`,
  );
}
