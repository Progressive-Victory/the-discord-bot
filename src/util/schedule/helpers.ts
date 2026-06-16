import { AddSplitCustomId, getGuildChannel } from "@/util";
import { Cron } from "croner";
import {
  ChatInputCommandInteraction,
  MessageCreateOptions,
  MessageFlags,
  TextChannel,
} from "discord.js";
// import { FixedOffsetZone, IANAZone } from "luxon";
import { messageMaxLength, titleMaxLength } from "./constants";
import { ScheduledMessage, scheduledMessages } from "./state";

type ScheduleInput = {
  channelId: string;
  authorId: string;
  guild: ScheduledMessage["guild"];
  title: string;
  body: string;
  pattern: string | Date;
  timezone: number;
};

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

  /*   // Fucked up and evil line of code, but I'm not sure how else to do it
  const zone: IANAZone = FixedOffsetZone.instance(time.getTimezoneOffset());
  // Does not even work. Coerces into simplest state (UTC+6) which croner can't
  //  handle (It needs proper IANA zone e.g. Europe/Stockholm) */
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
    content: [input.title && `**${input.title}**`, input.body]
      .filter(Boolean)
      .join("\n\n"),
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
 * @param interaction - The "message" that triggered the bot
 * @param numRuns - The number of times the message will be sent. For practical 
 *    purposes, this will almost always be 1
 * @returns
 */
export async function prepareScheduledMessage(
  interaction: ChatInputCommandInteraction,
  numRuns: number,
  input: ScheduleInput,
) {
  if (!interaction.inGuild()) {
    await replyEphemeral(
      interaction,
      "This command can only be used in a server.",
    );
    return null;
  }
  const validationError = validateScheduleInput(input);
  if (validationError) {
    await replyEphemeral(interaction, validationError);
    return null;
  }

  const payload = buildScheduledPayload(input);
  const id = AddSplitCustomId(
    interaction.channel?.name ?? "schedule",
    Date.now().toString(), // Should probably be a snowflake
  );
  const task = createScheduledTask(id, input.pattern, input.timezone, numRuns);

  return { input, payload, id, task };
}

// Add message to our central message map
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
    if (!channel || !("send" in channel)) return;
    await (channel as TextChannel).send(message.payload);
  } catch (error) {
    console.error(`[schedule:${messageId}] send failed`, error);
  }

  if (message.task.runsLeft() == 0) {
    scheduledMessages.delete(messageId);
    message.task.stop();
  }
}
