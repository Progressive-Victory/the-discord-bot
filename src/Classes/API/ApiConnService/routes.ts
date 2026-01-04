export const Routes = {
  discordWarns: "/discord/warns" as const,

  discordWarn(warnId: string): `/discord/warns/${string}` {
    return `/discord/warns/${warnId}`;
  },

  discordEvents: "/discord/events" as const,

  latestDiscordEvent(
    eventDiscordId: string,
  ): `/discord/events/latest/${string}` {
    return `/discord/events/latest/${eventDiscordId}`;
  },

  discordEvent(id: number): `/discord/events/${string}` {
    return `/discord/events/${id}`;
  },

  discordEventAttendance(
    eventId: number,
  ): `/discord/events/${string}/attendance` {
    return `/discord/events/${eventId}/attendance`;
  },

  setting(name: string): `/settings/${string}` {
    return `/settings/${name}`;
  },

  discordStateRole(abbr: string): `/discord/state-roles/${string}` {
    return `/discord/state-roles/${abbr}`;
  },
};
