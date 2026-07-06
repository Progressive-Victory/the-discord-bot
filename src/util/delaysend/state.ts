import { Cron } from "croner";
import { Guild, MessageCreateOptions } from "discord.js";

export type DelayedMessage = {
  id: string;
  guild: Guild;
  channelId: string;
  authorId: string;
  pattern: string | Date;
  payload: MessageCreateOptions;
  task: Cron;
};

export const scheduledMessages = new Map<string, DelayedMessage>();
