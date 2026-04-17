export const Routes = {
  discordWarns: "/discord/warns" as const,

  discordWarn(warnId: string): `/discord/warns/${string}` {
    return `/discord/warns/${warnId}`;
  },

  discordEvents: "/discordEvents" as const,

  latestDiscordEvent(
    eventDiscordId: string,
  ): `/discordEvents/byDiscordId/${string}/latest` {
    return `/discordEvents/byDiscordId/${eventDiscordId}/latest`;
  },

  discordEvent(id: number): `/discordEvents/${string}` {
    return `/discordEvents/${id}`;
  },

  discordEventAttendance(
    eventId: number,
  ): `/discordEvents/${string}/attendance` {
    return `/discordEvents/${eventId}/attendance`;
  },

  setting(name: string): `/settings/${string}` {
    return `/settings/${name}`;
  },

  discordStateRole(abbr: string): `/discord/state-roles/${string}` {
    return `/discord/state-roles/${abbr}`;
  },
};
