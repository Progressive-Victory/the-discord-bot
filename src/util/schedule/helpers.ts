import { AddSplitCustomId, getGuildChannel } from "@/util";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { Cron } from "croner";
import {
  AllowedMentionsTypes,
  bold,
  ChatInputCommandInteraction,
  MessageCreateOptions,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { messageMaxLength, titleMaxLength } from "./constants";
import { ScheduledMessage, scheduledMessages } from "./state";

interface ScheduleInput {
  channelId: string;
  authorId: string;
  guild: ScheduledMessage["guild"];
  title: string;
  body: string;
  pattern: string | Date;
  timezone: number;
}

export function replyEphemeral(
  interaction: ChatInputCommandInteraction,
  content: string,
) {
  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

export function getScheduleInput(
  interaction: ChatInputCommandInteraction,
): ScheduleInput {
  const time = interaction.createdAt;
  return {
    channelId: interaction.channelId,
    guild: interaction.guild!,
    authorId: interaction.user.id,
    title: interaction.options.getString("title")?.trim() ?? "",
    body: interaction.options.getString("message")?.trim() ?? "",
    pattern: interaction.options.getString("cron")?.trim() ?? "",
    timezone: time.getTimezoneOffset(), // Will break on utc. That's why I was trying Luxon, but it wasn't cooperating
  };
}

export function validateScheduleInput(
  input: Pick<ScheduleInput, "title" | "body">,
) {
  if (!input.title && !input.body) {
    return "Provide at least a title or message.";
  }
  if (
    input.title.length > titleMaxLength ||
    input.body.length > messageMaxLength
  ) {
    return "Title or message exceeds max length.";
  }
  return undefined;
}

export function buildScheduledPayload(
  input: ScheduleInput,
): MessageCreateOptions {
  return {
    content: [input.title && bold(input.title), input.body]
      .filter(Boolean)
      .join("\n\n"),
    allowedMentions: {
      parse: [AllowedMentionsTypes.User, AllowedMentionsTypes.Role],
    },
  };
  // TODO: COMPONENTS V2
}

export function createScheduledTask(
  id: string,
  pattern: string | Date,
  timezone: number,
  numRuns: number = 1,
) {
  return new Cron(pattern, async () => await executeScheduledMessage(id), {
    utcOffset: timezone,
    maxRuns: numRuns == -1 ? undefined : numRuns,
    name: id,
    protect: true,
  });
}

/**
 *
 * @param trigger - The "message" that triggered the bot
 * @param numRuns - The number of times the message will be sent. For practical
 *    purposes, this will almost always be 1
 * @returns
 */
export async function prepareScheduledMessage(
  trigger: ChatInputCommandInteraction,
  numRuns: number,
  input: ScheduleInput,
) {
  if (!trigger.inGuild()) {
    await replyEphemeral(trigger, "This command can only be used in a server.");
    return null;
  }
  const validationError = validateScheduleInput(input);
  if (validationError) {
    await replyEphemeral(trigger, validationError);
    return null;
  }
  console.debug(trigger.memberPermissions);
  if (!trigger.memberPermissions.has(PermissionFlagsBits.MentionEveryone)) {
    await replyEphemeral(trigger, "You are missing the required permissions.");
    return null;
  }

  const payload = buildScheduledPayload(input);
  const id = AddSplitCustomId(
    trigger.channel?.name ?? "schedule",
    DiscordSnowflake.generate().toString(),
  );
  const task = createScheduledTask(id, input.pattern, input.timezone, numRuns);

  return { input, payload, id, task };
}

export function registerScheduledMessage(
  input: ScheduleInput,
  id: string,
  payload: MessageCreateOptions,
  task: Cron,
) {
  scheduledMessages.set(id, {
    id,
    guild: input.guild,
    channelId: input.channelId,
    authorId: input.authorId,
    pattern: input.pattern,
    payload,
    task,
  });
}

export async function executeScheduledMessage(messageId: string) {
  // Still feel like there's gotta be a better way for this than a lookup into the scheduledMessages map
  const message = scheduledMessages.get(messageId);
  if (!message) {
    console.error(`[schedule:${messageId}] Message not found`);
    return;
  }

  console.log(`[schedule:${messageId}] Executing scheduled message`);
  try {
    const channel = await getGuildChannel(message.guild, message.channelId);
    if (!channel?.isSendable()) return;
    await (channel as TextChannel).send(message.payload);
  } catch (error) {
    console.error(`[schedule:${messageId}] send failed`, error);
  }

  if (message.task.runsLeft() == 0) {
    scheduledMessages.delete(messageId);
    message.task.stop();
  }
}
