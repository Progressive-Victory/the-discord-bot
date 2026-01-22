import {
  APIInteractionDataResolvedGuildMember,
  APIRole,
  DiscordAPIError,
  Guild,
  GuildBasedChannel,
  GuildChannelResolvable,
  GuildMember,
  GuildMemberResolvable,
  RESTJSONErrorCodes,
  Role,
  Snowflake,
  User,
} from "discord.js";
import { client } from "../index.js";

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
export function AddSplitCustomId(...args: (string | number | boolean)[]) {
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
      error.code === RESTJSONErrorCodes.UnknownMember
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
  let resolvedChannel: GuildBasedChannel | null | undefined =
    guild.channels.resolve(channel);
  resolvedChannel ??= undefined;
  if (resolvedChannel) return resolvedChannel ?? undefined;
  try {
    if (typeof channel === "string") {
      console.log("channel", channel);
      resolvedChannel = await guild.channels.fetch(channel);
    } else {
      console.log("channel", channel);
      resolvedChannel = await channel.fetch();
    }

    console.log(resolvedChannel);
    return resolvedChannel;
  } catch (error) {
    if (
      error instanceof DiscordAPIError &&
      error.code === RESTJSONErrorCodes.UnknownChannel
    ) {
      console.error(error);
    }
    throw error;
  }
}

export async function fetchMemberOrUser(id: Snowflake, guild: Guild) {
  return guild.members.fetch(id).catch(async (e) => {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.UnknownMember
    )
      throw e;
    return client.users.fetch(id);
  });
}

export function getNameToDisplay(user: GuildMember | User): string {
  return user instanceof GuildMember
    ? (user.nickname ?? user.displayName)
    : user instanceof User
      ? user.displayName
      : "[Deleted User]";
}
