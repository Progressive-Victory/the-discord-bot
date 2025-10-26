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
        .setAutocomplete(false)
        .setMaxLength(100),
    ),
  execute: async (interaction) => {
    console.log("execute");

    if (interaction.isChatInputCommand()) {
      await interaction.reply({
        content: "working on it",
        flags: MessageFlags.Ephemeral,
      });

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

async function directMessageEvents(
  interaction: ChatInputCommandInteraction,
  events: any[] | null,
) {
  if (events === null || events.length === 0) {
    await interaction.followUp({
      content: "No Matching events were found",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  let out = "";
  for (const e of events) {
    out += e.toString() + "\n";
  }
  out =
    "https://discord.com/events/928709707542175814/1358172077739475155\n" +
    "https://discord.com/events/928709707542175814/1385692666163101857\n" +
    "https://discord.com/events/928709707542175814/1386794434599063582\n" +
    "https://discord.com/events/928709707542175814/1388367613918449674\n" +
    "https://discord.com/events/928709707542175814/1388414764144787467\n" +
    "https://discord.com/events/928709707542175814/1388627932850688120\n" +
    "https://discord.com/events/928709707542175814/1390144053915553963\n" +
    "https://discord.com/events/928709707542175814/1390341173394276515\n" +
    "https://discord.com/events/928709707542175814/1390373083608776825\n" +
    "https://discord.com/events/928709707542175814/1391182193501540382\n" +
    "https://discord.com/events/928709707542175814/1391208766606671993\n" +
    "https://discord.com/events/928709707542175814/1391850918575739101\n" +
    "https://discord.com/events/928709707542175814/1391930689926201424\n" +
    "https://discord.com/events/928709707542175814/1392089960294912000\n" +
    "https://discord.com/events/928709707542175814/1392305558194749530\n" +
    "https://discord.com/events/928709707542175814/1392557936538288238\n" +
    "https://discord.com/events/928709707542175814/1392671321682477149\n" +
    "https://discord.com/events/928709707542175814/1392976319909728419\n" +
    "https://discord.com/events/928709707542175814/1393021486478004396\n" +
    "https://discord.com/events/928709707542175814/1393266546465570926\n" +
    "https://discord.com/events/928709707542175814/1393331735361486929\n" +
    "https://discord.com/events/928709707542175814/1394031664426123285\n" +
    "https://discord.com/events/928709707542175814/1394031776435011657\n" +
    "https://discord.com/events/928709707542175814/1394468183511138345\n" +
    "https://discord.com/events/928709707542175814/1394885150818566265\n" +
    "https://discord.com/events/928709707542175814/1398060278368702514\n" +
    "https://discord.com/events/928709707542175814/1398729459288510474\n" +
    "https://discord.com/events/928709707542175814/1398729574787055707\n" +
    "https://discord.com/events/928709707542175814/1398746588418932936\n" +
    "https://discord.com/events/928709707542175814/1399103833547739166\n" +
    "https://discord.com/events/928709707542175814/1400610530317697225\n" +
    "https://discord.com/events/928709707542175814/1403943247449165844\n" +
    "https://discord.com/events/928709707542175814/1407372767057154161\n" +
    "https://discord.com/events/928709707542175814/1408863862958325810\n" +
    "https://discord.com/events/928709707542175814/1409350975717900408\n" +
    "https://discord.com/events/928709707542175814/1411110559566397570\n" +
    "https://discord.com/events/928709707542175814/1411157005904642088\n" +
    "https://discord.com/events/928709707542175814/1419418747776532622\n" +
    "https://discord.com/events/928709707542175814/1423111214694793216\n" +
    "https://discord.com/events/928709707542175814/1423444904897413171\n" +
    "https://discord.com/events/928709707542175814/1424487372732633253\n" +
    "https://discord.com/events/928709707542175814/1425364623044902984\n" +
    "https://discord.com/events/928709707542175814/1425663728644395078\n" +
    "https://discord.com/events/928709707542175814/1425982327124656381\n" +
    "https://discord.com/events/928709707542175814/1426057374094987386\n" +
    "https://discord.com/events/928709707542175814/1426302030640840825\n" +
    "https://discord.com/events/928709707542175814/1426714685008511096\n" +
    "https://discord.com/events/928709707542175814/1426920827093254205\n" +
    "https://discord.com/events/928709707542175814/1427048930385858762\n" +
    "https://discord.com/events/928709707542175814/1427051557287100458\n" +
    "https://discord.com/events/928709707542175814/1427085859181826168\n" +
    "https://discord.com/events/928709707542175814/1427794987973873724\n" +
    "https://discord.com/events/928709707542175814/1429278709830914068\n" +
    "https://discord.com/events/928709707542175814/1429624015051292672\n" +
    "https://discord.com/events/928709707542175814/1430696389133733998\n";
  const messages = Math.ceil(out.length / 1980);
  for (let i = 0; i < messages; i++) {
    const msg = out;
    const trimmed = msg.slice(i * 1980, i * 1980 + 1980);
    await interaction.followUp({
      content: trimmed,
      flags: MessageFlags.Ephemeral,
    });
  }
}
