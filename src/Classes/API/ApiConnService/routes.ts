export const Routes = {
  discordWarns: "/discord/warns" as const,

  discordWarn(warnId: string): `/discord/warns/${string}` {
    return `/discord/warns/${warnId}`;
  },

  discordEvents: "/discord/events" as const,

  latestDiscordEventByDiscordId(
    eventDiscordId: string,
  ): `/discord/events/latest/${string}` {
    return `/discord/events/latest/${eventDiscordId}`;
  },

  discordEventPatch(id: number): `/discord/events/${string}` {
    return `/discord/events/${id}`;
  },

  discordEventAttendancePost(
    eventId: number,
    preventRedundant: boolean,
  ): `/discord/events/${string}/attendance?prevent_redundant=${string}` {
    return `/discord/events/${eventId}/attendance?prevent_redundant=${preventRedundant}`;
  },

  getSettingValue(name: string): `/settings/${string}` {
    return `/settings/${name}`;
  },

  getAttendance(eventId: number): `/discord/events/${string}/attendance` {
    return `/discord/events/${eventId}/attendance`;
  },

  updateSettingValue(name: string): `/settings/${string}` {
    return `/settings/${name}`;
  },

  discordStateRole(abbr: string): `/discord/state-roles/${string}` {
    return `/discord/state-roles/${abbr}`;
  },
};
