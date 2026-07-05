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
  everyone: boolean;
}

export function replyEphemeral(
  command: ChatInputCommandInteraction,
  content: string,
) {
  return command.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

// Essentially a constructor for ScheduleInput from a ChatInputCommandInteraction
export function getScheduleInput(
  command: ChatInputCommandInteraction,
): ScheduleInput {
  return {
    channelId: command.options.getChannel("channel")?.id ?? command.channelId,
    guild: command.guild!,
    authorId: command.user.id,
    title: command.options.getString("title")?.trim() ?? "",
    body: command.options.getString("message")?.trim() ?? "",
    pattern: command.options.getString("cron")?.trim() ?? "",
    timezone: command.createdAt.getTimezoneOffset(), // Will break on daylight savings. That's why I was trying Luxon, but it wasn't cooperating
    everyone:
      command.memberPermissions?.has(PermissionFlagsBits.MentionEveryone) ??
      false,
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
    allowedMentions: input.everyone
      ? undefined // If undefined, defaults to all allowed in channel  (MessagePayload.js:179)
      : {
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
 * @param command - The "message" that triggered the bot
 * @param numRuns - The number of times the message will be sent. For practical
 *    purposes, this will almost always be 1
 * @returns
 */
export async function prepareScheduledMessage(
  command: ChatInputCommandInteraction,
  numRuns: number,
  input: ScheduleInput,
) {
  if (!command.inGuild()) {
    await replyEphemeral(command, "This command can only be used in a server.");
    return null;
  }
  const validationError = validateScheduleInput(input);
  if (validationError) {
    await replyEphemeral(command, validationError);
    return null;
  }

  const payload = buildScheduledPayload(input);
  const id = AddSplitCustomId(
    command.channel?.name ?? "schedule",
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
