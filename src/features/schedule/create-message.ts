import { AddSplitCustomId, getGuildChannel } from "@/util";
import {
  ChatInputCommandInteraction,
  MessageCreateOptions,
  MessageFlags,
  TextChannel,
} from "discord.js";
import cron, { ScheduledTask } from "node-cron";
import { titleMaxLength, messageMaxLength } from "./constants";

type ScheduledEntry = {
  id: string;
  guildId: string;
  payload: MessageCreateOptions;
  channelId: string;
  authorId: string;
  cronExpression: string;
  task: ScheduledTask;
};

export const scheduledMessages = new Map<string, ScheduledEntry>();
export let id_ctr = 0;
export async function createScheduledMessage(
  interaction: ChatInputCommandInteraction,
) {
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  //const useComponents = interaction.options.getBoolean("usecomponents") ?? false;
  const title = interaction.options.getString("title")?.trim() ?? "";
  const body = interaction.options.getString("message")?.trim() ?? "";

  // tmp
  const cronExpression = interaction.options.getString("cron")?.trim() ?? "";
  const timezone = "UTC";
  const channelId = interaction.channelId;

  if (!title && !body) {
    await interaction.reply({
      content: "Provide at least a title or message.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (title.length > titleMaxLength || body.length > messageMaxLength) {
    await interaction.reply({
      content: "Title or message exceeds max length.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!cron.validate(cronExpression)) {
    await interaction.reply({
      content: "Invalid cron expression.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const payload: MessageCreateOptions = {
    content: [title && `**${title}**`, body].filter(Boolean).join("\n\n"),
    // TODO: if useComponents, build components payload here
  };

  const id = AddSplitCustomId("schedule", /* Date.now().toString() */ id_ctr++);

  const task = cron.schedule(
    cronExpression,
    async () => {
      console.log(`[schedule:${id}] Executing scheduled message`);
      try {
        const channel = await getGuildChannel(interaction.guild!, channelId);
        if (!channel || !("send" in channel)) return;
        await (channel as TextChannel).send(payload);
      } catch (error) {
        console.error(`[schedule:${id}] send failed`, error);
      }
    },
    { timezone },
  );
  console.log(task);
  scheduledMessages.set(id, {
    id,
    guildId: interaction.guildId!,
    channelId,
    authorId: interaction.user.id,
    cronExpression,
    payload,
    task,
  });

  await interaction.reply({
    content: `Scheduled message created (\`${id}\`) with cron \`${cronExpression}\`.`,
    flags: MessageFlags.Ephemeral,
  });
}
