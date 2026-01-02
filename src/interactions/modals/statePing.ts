import {
  Guild,
  MessageCreateOptions,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { Interaction } from "../../Classes/Interaction.js";
import {
  legacyStateMessageCreate,
  stateMessageCreate,
  statePingReply,
} from "../../features/state/ping.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { IDiscordStateRole } from "../../util/states/discordStateRole.js";
import { isStateAbbreviations } from "../../util/states/types.js";

/**
 * `statePing` is a modal interaction that provides state leads an interface
 * to send a message to their state's channel. It checks whether a channel is configured
 * for a given state, and if it does, sends the message to the channel.
 */
export const statePing = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: "sp",
  run: async (interaction) => {
    const { customId, client, fields, user } = interaction;
    const splitOn = client.splitCustomIdOn;

    let guild: Guild;
    if (interaction.inCachedGuild()) {
      guild = interaction.guild;
    } else if (interaction.inRawGuild()) {
      guild = await client.guilds.fetch(interaction.guildId);
    } else return;

    if (!splitOn) return;
    const args = customId.split(splitOn);

    const stateAbbreviation = args[1];
    const legacyOption = args[2] === "true";

    if (!isStateAbbreviations(stateAbbreviation)) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let state
    try {
      const { data }: { data: IDiscordStateRole } = (await apiConnService.get(Routes.discordStateRole(stateAbbreviation))) as { data: IDiscordStateRole }
      state = data
    } catch (err) {
      console.error(err)
      //@ts-expect-error can't type error args
      return interaction.reply(err.message)
    }

    const content = fields.getTextInputValue("message");
    const title = fields.getTextInputValue("title");
    const stateChannel =
      guild.channels.cache.get(state.memberChannelId) ??
      (await guild.channels.fetch(state.memberChannelId).catch(console.error));
    if (!(stateChannel && stateChannel.isSendable())) return;

    let stateMessageCreateOptions: MessageCreateOptions;

    if (legacyOption)
      stateMessageCreateOptions = legacyStateMessageCreate(
        state.teamRoleId,
        user.id,
        content,
        title,
      );
    else
      stateMessageCreateOptions = stateMessageCreate(
        state.memberRoleId,
        user.id,
        content,
        title,
      );

    const pingMessage = await stateChannel.send(stateMessageCreateOptions);

    await statePingReply(interaction, pingMessage, true);
  },
});
