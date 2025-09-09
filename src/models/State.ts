import { Snowflake } from "discord.js";
import { HydratedDocument, model, Schema } from "mongoose";
import { StateAbbreviation } from "../util/states/types.js";

export interface IState {
  guildId: Snowflake;
  name: string;
  abbreviation: StateAbbreviation;
  channelId?: Snowflake;
  roleId?: Snowflake;
  team: {
    roleId?: Snowflake;
    channelId?: Snowflake;
  };
}

export type StateRecord = HydratedDocument<IState>;

const state = new Schema<IState>({
  guildId: {
    type: String,
    required: true,
    immutable: true,
  },
  name: {
    type: String,
    required: true,
    immutable: true,
  },
  abbreviation: {
    type: String,
    required: true,
    immutable: true,
  },
  channelId: String,
  roleId: String,
  team: {
    roleId: String,
    channelId: String,
  },
});

export const States = model<IState>("state", state, "states");
