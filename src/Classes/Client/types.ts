import { time, TimestampStyles, TimestampStylesString } from "discord.js";
import { ExtendedClient } from "./Client";

export const ExtraColor = {
  EmbedGray: 0x2b2d31,
  EmbedWhite: 0xf2f3f5,
};

declare global {
  interface Date {
    /**
     * Prints date to Discord Timestamp Styles
     * @param style - Discord TimestampStylesString
     * @returns date formatted fro a message
     * @see {@link https://discord.com/developers/docs/reference#message-formatting-timestamp-styles}
     */
    toDiscordString(
      style?: TimestampStylesString,
    ): `<t:${bigint}:${TimestampStylesString}>`;
  }
}

Date.prototype.toDiscordString = function (
  style: TimestampStylesString = TimestampStyles.ShortDateTime,
) {
  return time(this, style);
};

/**
 * This redefines relevant interfaces in discord.js to allow us to use
 * {@link ExtendedClient} wherever discord.js expects {@link Client}.
 */
declare module "discord.js" {
  interface BaseInteraction {
    client: ExtendedClient;
  }
  interface Component {
    client: ExtendedClient;
  }
  interface Message {
    client: ExtendedClient;
  }
  interface BaseChannel {
    client: ExtendedClient;
  }
  interface Role {
    client: ExtendedClient;
  }
  interface Guild {
    client: ExtendedClient;
  }
  interface User {
    client: ExtendedClient;
  }
  interface GuildMember {
    client: ExtendedClient;
  }
}
