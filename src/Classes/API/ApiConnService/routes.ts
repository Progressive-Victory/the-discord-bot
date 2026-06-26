export const Routes = {
  discordEvents: "/discordEvents" as const,

  discordWarns: "/discord/warns" as const,

  users: "/users" as const,

  discordEvent(id: number): `/discordEvents/${string}` {
    return `/discordEvents/${id}`;
  },
  discordEventAttendance(
    eventId: number,
  ): `/discordEvents/${string}/attendance` {
    return `/discordEvents/${eventId}/attendance`;
  },

  discordWarn(warnId: string): `/discord/warns/${string}` {
    return `/discord/warns/${warnId}`;
  },

  discordStateRole(abbr: string): `/discord/state-roles/${string}` {
    return `/discord/state-roles/${abbr}`;
  },
  latestDiscordEvent(
    eventDiscordId: string,
  ): `/discordEvents/byDiscordId/${string}/latest` {
    return `/discordEvents/byDiscordId/${eventDiscordId}/latest`;
  },

  setting(name: string): `/settings/${string}` {
    return `/settings/${name}`;
  },
};
