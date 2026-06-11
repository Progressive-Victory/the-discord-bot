import { ChatInputCommand } from "@/Classes";
import {
  ApplicationCommandOptionChoiceData,
  Collection,
  escapeMarkdown,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  heading,
  HeadingLevel,
  hyperlink,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  Snowflake,
} from "discord.js";

const MAX_NUM_EVENTS = 20;

export const searchEvents = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("search-events")
    .setDescription("Find events that match criteria")
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("find by name")
        .setAutocomplete(true)
        .setMaxLength(100)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("date-range")
        .setDescription("find by range of dates; ex: mm/dd/yyyy-mm/dd/yyyy")
        .setAutocomplete(false)
        .setMaxLength(100)
        .setRequired(false),
    ),
  execute: async (interaction) => {
    console.debug("[Debug] Event Search Started");
    if (!interaction.inCachedGuild()) return;

    const name = interaction.options.getString("name", true).toLowerCase();
    const dates = interaction.options.getString("date-range");
    const { startDate, endDate } = parse_dates(dates);

    let events = interaction.guild.scheduledEvents.cache;

    // Check if name is the event Id
    const event = events.get(name);

    if (event) {
      await interaction.reply({
        content: hyperlink(escapeMarkdown(event.name), event.url),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    events = events.filter(
      (v) =>
        v.name.toLowerCase().includes(name) &&
        (!startDate ||
          !endDate ||
          !v.scheduledStartAt ||
          (v.scheduledStartAt >= startDate && v.scheduledStartAt <= endDate)),
    );

    // Check that 1 or more events are found
    if (events.size < 1) {
      await interaction.reply({
        content: "No Matching events were found",
      });
      return;
    }

    // sort collection and map it to string
    let contentMap: string[] = events
      .sort(sortEventByDate)
      .map((e) =>
        heading(hyperlink(escapeMarkdown(e.name), e.url), HeadingLevel.Three),
      );

    // Add header when over MAX_NUM_EVENTS of events
    if (contentMap.length > MAX_NUM_EVENTS) {
      contentMap = [
        `${heading(`Showing top ${MAX_NUM_EVENTS} results:`, HeadingLevel.Two)}`,
      ]
        .concat(contentMap)
        .slice(0, MAX_NUM_EVENTS);
    }
    await interaction.reply({
      content: contentMap.join("\n"),
    });
  },
  autocomplete: async (interaction) => {
    if (!interaction.isAutocomplete() || !interaction.inCachedGuild()) return;

    const focus = interaction.options.getFocused(true);
    const events = interaction.guild.scheduledEvents.cache;

    let filtered: ApplicationCommandOptionChoiceData<string>[] = [];
    let list: Collection<
      Snowflake,
      GuildScheduledEvent<GuildScheduledEventStatus>
    >;
    switch (focus.name) {
      // autocomplete for name option
      case "name":
        list =
          events.filter((event) =>
            event.name.toLowerCase().includes(focus.value.toLowerCase()),
          ) ?? events.sort(sortEventByDate);
        filtered = list.map((event) => ({
          name: event.name,
          value: event.id,
        }));
        break;

      default:
        break;
    }
    await interaction.respond(filtered.slice(0, 24)).catch(console.error);
  },
});

function parse_dates(str: string | null) {
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

function sortEventByDate(
  eventA: GuildScheduledEvent,
  eventB: GuildScheduledEvent,
) {
  if (eventA.scheduledStartAt && eventB.scheduledStartAt) {
    return eventA.scheduledStartAt.getTime() - eventB.createdAt.getTime();
  } else {
    return eventA.createdAt.getTime() - eventB.createdAt.getTime();
  }
}
