import { AddSplitCustomId, getGuildChannel } from "@/util";
import { Cron, scheduledJobs } from "croner";
import {
  ChatInputCommandInteraction,
  Guild,
  MessageCreateOptions,
  MessageFlags,
  TextChannel,
} from "discord.js";
import id from "zod/v4/locales/id.js";
import { messageMaxLength, titleMaxLength } from "./constants";

type ScheduledMessage = {
  id: string;
  guild: Guild;
  channelId: string;
  authorId: string;
  cronExpression: string;
  payload: MessageCreateOptions;
  task: Cron;
};

export const scheduledMessages = new Map<string, ScheduledMessage>();
export let id_ctr = 0; // counter for messages scheduled. should persist

export async function createScheduledMessage(
  interaction: ChatInputCommandInteraction,
  numRuns: number = 1,
) {
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  //const time = interaction.createdAt; // Needed for getting the users timezone for parsing the date
  console.log(interaction);
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

  const payload: MessageCreateOptions = {
    content: [title && `**${title}**`, body].filter(Boolean).join("\n\n"),
    // TODO: if useComponents, build components payload here
  };

  const id = AddSplitCustomId(
    interaction.channel?.name ?? "schedule",
    /* Date.now().toString() */ id_ctr++,
  );

  const task = new Cron(cronExpression, async () => await sendMessage(id), {
    timezone,
    maxRuns: numRuns,
    name: id,
    protect: true, // Makes sure only one instance runs at a time
  });

  console.log(scheduledJobs);
  scheduledMessages.set(id, {
    id,
    guild: interaction.guild!,
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

async function sendMessage(messageId: string) {
  console.log(`[schedule:${id}] Executing scheduled message`);
  const message = scheduledMessages.get(messageId); // Having it look itself up feels dumb and wrong, but idk
  if (!message) {
    console.error(`[schedule:${id}] Message not found`);
    return;
  }
  try {
    const channel = await getGuildChannel(message.guild, message.channelId);
    if (!channel || !("send" in channel)) return;
    await (channel as TextChannel).send(message.payload);
  } catch (error) {
    console.error(`[schedule:${id}] send failed`, error);
  }
  if (message.task.runsLeft() == 0) {
    scheduledMessages.delete(messageId);
    message.task.stop();
  }
}
