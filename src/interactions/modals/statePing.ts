import {
  Guild,
  MessageCreateOptions,
  ModalSubmitInteraction,
} from "discord.js";
import { Interaction } from "../../Classes/Interaction.js";
import {
  legacyStateMessageCreate,
  stateMessageCreate,
  statePingReply,
} from "../../features/state/ping.js";
import { States } from "../../models/State.js";
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
    // console.log(args[2],legacyOption)

    if (!isStateAbbreviations(stateAbbreviation)) return;

    const state = await States.findOne({
      guildId: guild.id,
      abbreviation: stateAbbreviation,
    }).catch(console.error);
    if (!(state && state.roleId && state.channelId)) return;

    const content = fields.getTextInputValue("message");
    const title = fields.getTextInputValue("title");
    const stateChannel =
      guild.channels.cache.get(state.channelId) ??
      (await guild.channels.fetch(state.channelId).catch(console.error));

    if (!(stateChannel && stateChannel.isSendable())) return;

    let stateMessageCreateOptions: MessageCreateOptions;

    if (legacyOption)
      stateMessageCreateOptions = legacyStateMessageCreate(
        state.roleId,
        user.id,
        content,
        title,
      );
    else
      stateMessageCreateOptions = stateMessageCreate(
        state.roleId,
        user.id,
        content,
        title,
      );

    const pingMessage = await stateChannel.send(stateMessageCreateOptions);

    await statePingReply(interaction, pingMessage);
  },
});
