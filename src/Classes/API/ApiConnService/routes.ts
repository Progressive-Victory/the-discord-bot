export const Routes = {
  discordWarns: "/discord/warns" as const,
  discordWarn(warnId: string): `/discord/warns/${string}` {
    return `/discord/warns/${warnId}`;
  },
};
