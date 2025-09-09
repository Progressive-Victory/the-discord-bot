import { Snowflake } from "discord.js";

export interface IUser {
  discordId: Snowflake;
  username: string;
}

/**
 * @param required - {@link SchemaTypeOptions.required}
 * @param immutable - {@link SchemaTypeOptions.immutable}
 * @returns an {@link IUser} for use with MongoDB operations
 */
export function user(required: boolean = false, immutable: boolean = false) {
  return {
    discordId: {
      type: String,
      required,
      immutable,
    },
    username: {
      type: String,
      required,
      immutable,
    },
  };
}
