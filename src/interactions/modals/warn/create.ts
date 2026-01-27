import { Interaction } from "@/Classes/Interaction";
import {
  warnDMContainer,
  warnModContainer,
} from "@/features/moderation/warn-render";
import { fetchSetting } from "@/util/api/fetchSettings";
import { warnSearchManger } from "@/util/api/pvapi";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  DiscordAPIError,
  Message,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";

/**
 * `warnCreate` is a modal interaction which allows mods to send warnings to guild members. It:
 * <ul>
 *     <li>Persists the warnings for a user in MongoDB</li>
 *     <li>Sends the warned user a notification</li>
 *     <li>Notifies the mod that the warning has been issued</li>
 *     <li>If there is a channel for warning audit logs, logs the event</li>
 * </ul>
 */
export const warnCreate = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: "nw",
  run: async (interaction: ModalSubmitInteraction) => {
    if (!interaction.inCachedGuild()) return;
    const { member, fields } = interaction;
    const targetMember = fields.getSelectedMembers("member")?.first();
    if (!targetMember) return;

    const reason = fields.getTextInputValue("reason");

    const duration = 30;
    const expires = new Date();
    expires.setHours(expires.getHours() + duration * 24);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_res, newWarn, targetDM, logChannel] = await Promise.all([
      interaction.deferReply({ flags: MessageFlags.Ephemeral }),
      warnSearchManger.createWarn({
        moderatorId: member.id,
        targetId: targetMember.id,
        reason,
        expires,
      }),
      targetMember.createDM().catch((e) => {
        if (e instanceof DiscordAPIError) return null;
        throw e;
      }),
      fetchSetting("warn_log_channel_id").then(async (u) => {
        const channel = await interaction.guild.channels
          .fetch(u.data)
          .catch((e) => {
            if (e instanceof DiscordAPIError) return null;
            throw e;
          });
        if (channel?.isSendable()) {
          return channel;
        }
        return null;
      }),
    ]);
    let sentToUser: boolean = true;
    if (targetDM) {
      targetDM
        .send({
          flags: MessageFlags.IsComponentsV2,
          components: [warnDMContainer(newWarn)],
        })
        .catch((e) => {
          if (e instanceof DiscordAPIError) {
            sentToUser = false;
          } else {
            throw e;
          }
        });
    }
    const modContainer = await warnModContainer(
      newWarn,
      interaction.guild,
      sentToUser,
    );
    let message: Message<true> | null = null;
    if (logChannel) {
      message = await logChannel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [modContainer],
        allowedMentions: {},
      });
    }

    if (message) {
      await interaction.editReply({
        content: "The warn has been successfully been issued. ",
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("View Warn")
              .setStyle(ButtonStyle.Link)
              .setURL(message.url),
          ),
        ],
      });
    } else {
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [modContainer],
        allowedMentions: {},
      });
    }
  },
});
