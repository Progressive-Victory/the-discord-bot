import { ChatInputCommand } from "@/Classes";
import {
  ApplicationCommandOptionChoiceData,
  ChatInputCommandInteraction,
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
} from "discord.js";

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
        .setAutocomplete(false)
        .setMaxLength(100),
    ),
  execute: async (interaction) => {
    console.debug("[Debug] Event Search Started");
    if (!interaction.inCachedGuild()) return;
    // await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const events = findEventsMatchingQuery(interaction);

    await replyMessageEvents(interaction, events);
  },
  autocomplete: async (interaction) => {
    if (!interaction.isAutocomplete() || !interaction.inCachedGuild()) return;

    const focus = interaction.options.getFocused(true);
    const events = interaction.guild.scheduledEvents;

    let filtered: ApplicationCommandOptionChoiceData<string>[] = [];
    let list: Collection<
      string,
      GuildScheduledEvent<GuildScheduledEventStatus>
    >;
    switch (focus.name) {
      // autocomplete for id option
      case "id":
        list =
          events.cache.filter(
            (event) =>
              event.id.includes(focus.value) ||
              event.name.toLowerCase().includes(focus.value.toLowerCase()),
          ) ??
          events.cache.sort(
            (eventA, eventB) =>
              eventA.createdAt.getTime() - eventB.createdAt.getTime(),
          );
        filtered = list.map((event) => ({
          name: event.name,
          value: event.id,
        }));
        break;
      // autocomplete for name option
      case "name":
        list =
          events.cache.filter((event) =>
            event.name.toLowerCase().includes(focus.value.toLowerCase()),
          ) ??
          events.cache.sort(
            (eventA, eventB) =>
              eventA.createdAt.getTime() - eventB.createdAt.getTime(),
          );
        filtered = list.map((event) => ({
          name: event.name,
          value: event.name,
        }));
        break;

      default:
        break;
    }
    await interaction.respond(filtered.slice(0, 24)).catch(console.error);
  },
});

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

function findEventsMatchingQuery(
  interaction: ChatInputCommandInteraction<"cached">,
) {
  const id = interaction.options.getString("id");
  const name = interaction.options.getString("name");
  const dates = interaction.options.getString("date-range");
  const { startDate, endDate } = parse_dates(dates);
  const out = interaction.guild.scheduledEvents.cache.filter((v) => {
    return (
      (name === null &&
        id === null &&
        startDate === null &&
        endDate === null) ||
      (id !== null && v.id.includes(id) && id !== "") ||
      (name !== null &&
        v.name.toLowerCase().includes(name.toLowerCase()) &&
        name !== "") ||
      (startDate !== null &&
        endDate !== null &&
        endDate >= startDate &&
        v.scheduledStartAt !== null &&
        v.scheduledStartAt.setUTCHours(0, 0, 0, 0) >=
          startDate.setUTCHours(0, 0, 0, 0) &&
        v.scheduledStartAt.setUTCHours(0, 0, 0, 0) <=
          endDate.setUTCHours(0, 0, 0, 0))
    );
  });
  return out;
}

const max_num_events = 20;
async function replyMessageEvents(
  interaction: ChatInputCommandInteraction,
  events: Collection<string, GuildScheduledEvent<GuildScheduledEventStatus>>,
) {
  if (events.size === 0) {
    await interaction.reply({
      content: "No Matching events were found",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  let out = "";
  if (events.size > max_num_events) {
    out += heading(
      `Showing top ${max_num_events} results:\n`,
      HeadingLevel.Two,
    );
  }

  events.forEach(
    (scheduledEvent) =>
      (out +=
        hyperlink(escapeMarkdown(scheduledEvent.name), scheduledEvent.url) +
        "\n"),
  );

  await interaction.reply({
    content: out,
    flags: MessageFlags.Ephemeral,
  });
}
