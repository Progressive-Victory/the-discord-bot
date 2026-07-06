import { AddSplitCustomId, getGuildChannel } from "@/util";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { Cron } from "croner";
import {
  AllowedMentionsTypes,
  APIMessageTopLevelComponent,
  bold,
  ChannelType,
  ChatInputCommandInteraction,
  MessageCreateOptions,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  TextBasedChannel,
  TextChannel,
} from "discord.js";
import { messageMaxLength, titleMaxLength } from "./constants";
import { DelayedMessage, scheduledMessages } from "./state";

interface ScheduleInput {
  channel: TextBasedChannel;
  authorId: string;
  guild: DelayedMessage["guild"];
  title: string;
  body: string;
  pattern: string | Date;
  timezone: number;
  perms: PermissionsBitField;
  botPerms: PermissionsBitField;
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

// Deal with implicit permissions
// A user is prevented from specifying a channel they can't see,
// so this is mainly for the bot (in the edge case the bot doesn't have Admin)
function canSend(perms: PermissionsBitField) {
  return (
    perms.has(PermissionFlagsBits.ViewChannel) &&
    perms.has(PermissionFlagsBits.SendMessages)
  );
}

// Essentially a constructor for ScheduleInput from a ChatInputCommandInteraction
export function getDelayedInput(
  command: ChatInputCommandInteraction,
): ScheduleInput {
  const channel =
    command.options.getChannel<ChannelType.GuildText>("channel") ??
    command.channel!;
  const author = command.user;
  const perms = (channel as TextChannel).permissionsFor(author.id)!;
  const botPerms = (channel as TextChannel).permissionsFor(
    command.client.user.id,
  )!;
  console.debug(botPerms);
  return {
    channel,
    guild: command.guild!,
    authorId: author.id,
    title: command.options.getString("title")?.trim() ?? "",
    body: command.options.getString("message")?.trim() ?? "",
    pattern: command.options.getString("cron")?.trim() ?? "",
    timezone: command.createdAt.getTimezoneOffset(), // Will break on daylight savings. That's why I was trying Luxon, but it wasn't cooperating
    perms,
    botPerms,
  };
}

export function validateMessage(input: ScheduleInput) {
  if (!canSend(input.perms)) {
    return "You don't have permission to send messages in that channel.";
  }
  if (!canSend(input.botPerms)) {
    return `I don't have permission to send messages in that channel [${input.channel}]. Contact an administrator.`;
  }
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
  const components: APIMessageTopLevelComponent[] = [];
  if (input.title) {
    components.push({
      type: 10,
      content: bold(input.title),
    });
  }
  if (input.body) {
    components.push({
      type: 10,
      content: input.body,
    });
  }
  return {
    components,
    allowedMentions: input.perms.has(PermissionFlagsBits.MentionEveryone)
      ? undefined // If undefined, this defaults to all allowed in channel (MessagePayload.js:179)
      : {
          parse: [AllowedMentionsTypes.User], // @everyone and "mention all roles" are the same permission.
          // This does not account for roles with "allow anyone to mention". I am unsure how to handle that edge-case
        },
    flags: MessageFlags.IsComponentsV2,
  };
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
  const validationError = validateMessage(input);
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
    channelId: input.channel.id,
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
