import {
  getScheduleInput,
  prepareScheduledMessage,
  registerScheduledMessage,
  replyEphemeral,
} from "@/util/schedule/helpers";
import { parseDate } from "chrono-node";
import { ChatInputCommandInteraction } from "discord.js";

export async function createScheduledMessage(
  interaction: ChatInputCommandInteraction,
  numRuns: number = 1,
) {
  const input = getScheduleInput(interaction);
  const dateParsed = parseDate(
    interaction.options.getString("when")!,
    { instant: interaction.createdAt }, // This should handle embedding the timezone without separately specifying it
    { forwardDate: true },
  );
  if (!dateParsed) {
    const badDate = interaction.options.getString("when");
    console.log(
      'Received "',
      badDate,
      "\" and I (chrono-node) didn't know what to do with it.",
    );
    await replyEphemeral(
      interaction,
      "Sorry, I couldn't understand what " +
        badDate +
        " means. Try reformatting or being more specific.",
    );
    return;
  }
  input.pattern = dateParsed;
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
    `Scheduled message created (\`${prepared.id}\`) for \`${prepared.task.nextRun()}\`.`,
  );
}
