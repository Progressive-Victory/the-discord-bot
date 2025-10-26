import { GuildScheduledEventStatus, Snowflake } from "discord.js";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IScheduledEvent extends Document {
  recurrence: boolean;
  eventUrl: string;
  thumbnailUrl: string;
  guildId: Snowflake;
  eventId: Snowflake;
  channelId?: Snowflake;
  createdAt: Date;
  description: string;
  creatorId: Snowflake;
  scheduledEnd?: Date;
  scheduledStart?: Date;
  name: string;
  status: GuildScheduledEventStatus;
  startedAt: Date;
  endedAt: Date;
  attendees: [Snowflake];
  userCount?: number;
  logMessageId: Snowflake;
}

const scheduledEventSchema = new Schema<IScheduledEvent>({
  recurrence: { type: Boolean },
  eventUrl: { type: String, required: true, immutable: true },
  thumbnailUrl: { type: String, required: true },
  guildId: { type: String, required: true, immutable: true },
  eventId: { type: String, required: true, immutable: true },
  channelId: { type: String },
  createdAt: { type: Date, required: true, immutable: true },
  description: { type: String },
  creatorId: { type: String, required: true, immutable: true },
  scheduledEnd: { type: Date },
  scheduledStart: { type: Date },
  name: { type: String, required: true },
  status: { type: Number, required: true },
  startedAt: { type: Date },
  endedAt: { type: Date },
  attendees: [{ type: String }],
  userCount: { type: Number },
  logMessageId: { type: String },
});

const modelName = "ScheduledEvent";

export const ScheduledEvent: Model<IScheduledEvent> =
  (mongoose.models as Record<string, Model<IScheduledEvent>>).ScheduledEvent ||
  mongoose.model<IScheduledEvent>(modelName, scheduledEventSchema);

export default ScheduledEvent;
