import {
  APIInteractionDataResolvedGuildMember,
  APIRole,
  DiscordAPIError,
  Guild,
  GuildChannelResolvable,
  GuildMember,
  GuildMemberResolvable,
  Role,
} from "discord.js";
import { Types } from "mongoose";
import { client } from "../index.js";
import { DiscordAPIErrorCodes } from "./discord/DiscordAPIErrorCodes.js";

/**
 * Check is full GuildMember object is present
 * @param data - object to test
 * @returns If data is a GuildMember or no
 */
export function isGuildMember(
  data: GuildMember | APIInteractionDataResolvedGuildMember | null,
): data is GuildMember {
  return data instanceof GuildMember;
}
/**
 * Check is full GuildMember object is present
 * @param data - object to test
 * @returns If data is a GuildMember or no
 */
export function isRole(data: Role | APIRole | null): data is Role {
  return data instanceof Role;
}

/**
 *
 * @param args - strings
 * @returns string with arguments separated by client.splitCustomIdOn
 */
export function AddSplitCustomId(
  ...args: (string | number | boolean | Types.ObjectId)[]
) {
  if (!client.splitCustomIdOn) {
    throw Error("client.splitCustomIdOn not set in index");
  }
  let output = args[0].toString();
  for (let index = 1; index < args.length; index++) {
    output = output.concat(client.splitCustomIdOn, args[index].toString());
  }
  return output;
}

/**
 * Get member from user Resolvable object
 * @param guild - guild to find from
 * @param member - user resolvable object
 * @returns Guild Member
 */
export async function getMember(guild: Guild, member: GuildMemberResolvable) {
  try {
    if (member instanceof GuildMember) return member.fetch();
    return (
      guild.members.resolve(member) ?? (await guild?.members.fetch(member))
    );
  } catch (error) {
    if (
      error instanceof DiscordAPIError &&
      error.code === DiscordAPIErrorCodes.UnknownMember
    ) {
      return undefined;
    }
    throw error;
  }
}

/**
 * @param guild - The guild to retrieve the channel from
 * @param channel - The identifier of the channel to retrieve
 * @returns `undefined` if the channel ID doesn't exist
 */
export async function getGuildChannel(
  guild: Guild,
  channel: GuildChannelResolvable,
) {
  let resolvedChannel = guild.channels.resolve(channel) ?? null;
  if (resolvedChannel) return resolvedChannel ?? undefined;
  try {
    if (typeof channel === "string") {
      resolvedChannel = await guild.channels.fetch(channel);
    } else {
      resolvedChannel = await channel.fetch();
    }
  } catch (error) {
    if (
      error instanceof DiscordAPIError &&
      error.code === DiscordAPIErrorCodes.UnknownChannel
    ) {
      return undefined;
    }
    throw error;
  }
}
