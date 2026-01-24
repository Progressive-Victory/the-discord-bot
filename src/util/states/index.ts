import { GuildMember, GuildTextBasedChannel, Role } from "discord.js";
import { statesConfig } from "./types";

/**
 * Get states from a member
 * @param member - target member
 * @returns array of states
 */
export function getStatesFromMember(member: GuildMember) {
  const { roles } = member;
  return statesConfig.filter((s) =>
    roles.cache.filter((r) => r.name.toLowerCase() === s.abbreviation),
  );
}

/**
 * Get a state from a channel
 * @param channel - target text channel
 * @returns A state
 */
export function getStateFromChannel(channel: GuildTextBasedChannel) {
  const { name } = channel;
  return statesConfig.find(
    (s) => s.name.toLowerCase().replace(" ", "-") === name,
  );
}

/**
 * Get a state from a role
 * @param role - target role to get state from
 * @returns A state
 */
export function getStateFromRole(role: Role) {
  const { name } = role;
  return statesConfig.find((s) => s.abbreviation === name.toLowerCase());
}
