import { GuildMember, Snowflake } from "discord.js";
import { HydratedDocument, Model, Schema, model } from "mongoose";
import { defaultNumberOfDaysBeforeExpiration } from "../features/moderation/types.js";
import { IUser, user } from "./index.js";

export interface IWarn {
  guildId: Snowflake;
  guildName: string;
  target: IUser;
  moderator: IUser;
  updater?: IUser;
  reason: string;
  expireAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type WarningRecord = HydratedDocument<IWarn>;

interface WarnModel extends Model<IWarn> {
  createWarning(
    target: GuildMember,
    officer: GuildMember,
    reason?: string,
    days?: number,
  ): Promise<WarningRecord>;
}

const noReason = "No Reason Given";
const warn = new Schema<IWarn, WarnModel>(
  {
    guildId: {
      type: String,
      required: true,
      immutable: true,
    },
    target: user(true, true),
    moderator: user(true, true),
    updater: user(false, false),
    reason: {
      type: String,
      required: true,
      default: noReason,
    },
    expireAt: {
      type: Date,
      required: true,
      default: setDate(),
    },
    updatedAt: { type: Date, default: new Date() },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
    statics: {
      /**
       * Create new warning
       * @param target - guild member targeted for warn
       * @param officer - moderator issuing the warn
       * @param reason - of the warn
       * @param days - time the warn will last
       * @returns the record of the warn
       */
      createWarning(
        target: GuildMember,
        officer: GuildMember,
        reason: string,
        days?: number,
      ) {
        return this.create({
          guildId: target.guild.id,
          guildName: target.guild.name,
          target: {
            discordId: target.id,
            username: target.user.username,
          },
          moderator: {
            discordId: officer.id,
            username: officer.user.username,
          },
          reason: reason,
          expireAt: setDate(days),
        });
      },
    },
  },
);

export const Warn = model<IWarn, WarnModel>("warn", warn, "warnings");

/**
 *
 * @param days - number of days to set the date
 * @returns New Date
 */
export function setDate(days: number = defaultNumberOfDaysBeforeExpiration) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
