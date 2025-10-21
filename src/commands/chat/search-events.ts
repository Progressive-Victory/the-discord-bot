import {
  ChatInputCommandInteraction,
  Guild,
  GuildScheduledEvent,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";

export const searchEvents = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("search-events")
    .setDescription("Find events that match criteria")
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("find by id")
        .setAutocomplete(true)
        .setMaxLength(30),
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("find by name")
        .setAutocomplete(true)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option
        .setName("date-range")
        .setDescription("find by range of dates; ex: mm/dd/yyyy-mm/dd/yyyy")
        .setMaxLength(100),
    ),
  execute: async (interaction) => {
    console.log("execute");

    if (interaction.isChatInputCommand()) {
      // await interaction.deferReply({ ephemeral: true });

      const events = await findEventsMatchingQuery(
        interaction,
        interaction.guild,
      );

      directMessageEvents(interaction, events);
    }
  },
  autocomplete: async (interaction) => {
    if (interaction.isAutocomplete()) {
      const focus = interaction.options.getFocused(true);
      const all_events = interaction.guild
        ? await fast_fetch_events(interaction.guild)
        : [];
      if (focus.name === "id" && all_events !== undefined) {
        const filtered = all_events
          .filter((event) => event.id.startsWith(focus.value))
          .map((event) => ({
            name: event.id,
            value: event.id,
          }));
        await interaction.respond(filtered).catch(console.error);
      } else if (focus.name === "name" && all_events !== undefined) {
        const filtered = all_events
          .filter((event) => event.name.startsWith(focus.value))
          .map((event) => ({
            name: event.name,
            value: event.name,
          }));
        if (filtered.length > 25) filtered.length = 25;
        await interaction.respond(filtered).catch(console.error);
      } else {
        // not a valid autocomplete
        await interaction.respond([]).catch(console.error);
      }
    }
  },
});

let prevEventCacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 mintue

interface IDateResult {
  startDate: Date | null;
  endDate: Date | null;
}

function parse_dates(str: string | null): IDateResult {
  if (!str)
    return {
      startDate: null,
      endDate: null,
    };
  const args: string[] = str.split("-");
  return {
    startDate: new Date(args[0]),
    endDate: new Date(args[1]),
  };
}

async function fast_fetch_events(guild: Guild): Promise<GuildScheduledEvent[]> {
  if (
    Date.now() - prevEventCacheTimestamp < CACHE_DURATION &&
    guild.scheduledEvents.cache.size > 0
  ) {
    return guild.scheduledEvents.cache.map((event) => event);
  } else {
    const events = await guild.scheduledEvents.fetch();
    prevEventCacheTimestamp = Date.now();
    return events.map((event) => event);
  }
}

async function findEventsMatchingQuery(
  interaction: ChatInputCommandInteraction,
  guild: Guild | null,
): Promise<GuildScheduledEvent[] | null> {
  if (guild === null) {
    return null;
  }
  const id = interaction.options.getString("id");
  const name = interaction.options.getString("name");
  const dates = interaction.options.getString("date-range");
  const { startDate, endDate } = parse_dates(dates);
  const events_list = await fast_fetch_events(guild);
  const out = events_list.filter((v) => {
    return (
      (name === null &&
        id === null &&
        startDate === null &&
        endDate === null) ||
      (id !== null && v.id.includes(id) && id !== "") ||
      (name !== null && v.name.includes(name) && name !== "") ||
      (startDate !== null &&
        endDate !== null &&
        endDate > startDate &&
        v.scheduledStartAt !== null &&
        v.scheduledStartAt >= startDate &&
        v.scheduledStartAt <= endDate)
    );
  });
  return out;
}

async function directMessageEvents(
  interaction: ChatInputCommandInteraction,
  events: any[] | null,
) {
  if (events === null || events.length === 0) {
    await interaction.reply({
      content: "No Matching events were found",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  let out = "";
  for (const e of events) {
    out += e.toString() + "\n";
  }
  await interaction.reply({
    content: out,
    flags: MessageFlags.Ephemeral,
  });
}
