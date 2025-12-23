import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { Interaction } from "../../../Classes/Interaction.js";
import {
  numberRegex,
  WarnModalPrefixes,
} from "../../../features/moderation/types.js";
import { setDate } from "../../../models/Warn.js";
import { apiConnService } from "../../../util/api/ApiConnService.js";

/**
 * `warnUpdatedById` is a modal interaction which allows mods to update a warning by ID. It:
 * <ul>
 *     <li>Updates the warning in MongoDB</li>
 *     <li>Notifies the mod that the warning has been updated via an embed</li>
 *     <li>If there is a channel for warning audit logs, logs the event</li>
 * </ul>
 */
export const warnUpdatedById = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: WarnModalPrefixes.updateById,

  run: async (interaction: ModalSubmitInteraction) => {
    const { customId, client } = interaction;
    const reason = interaction.fields.getTextInputValue("reason");
    const modalDuration = interaction.fields.getTextInputValue("duration");
    const warnId = customId.split(client.splitCustomIdOn!)[1];
    const url = new URL(process.env.API_HOST_ADDR + "/discord/warns");

    let duration: number | undefined;
    let expireAt: Date | undefined;
    if (numberRegex.test(modalDuration)) {
      duration = Number(modalDuration);
      expireAt = setDate(duration);
    }

    const res = await apiConnService.sendRequest(
      url,
      "PATCH",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify({
        warn_id: warnId,
        reason: reason === "" ? undefined : reason,
        expireAt,
      }),
    );

    if (res.status === 200) {
      interaction.reply({
        content: "Update applied successfully.",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      interaction.reply({
        content:
          "Update failed to apply. Send the following error to an administrator:\n" +
          res.status +
          (await res.text()),
      });
    }

    /*const record = await Warn.findById(warnId);
    if (!record || !guild) return;

    const [target, mod] = await Promise.all([
      getMember(guild, record.target.discordId),
      getMember(guild, record.moderator.discordId),
    ]);

    if (!target || !mod) return;

    let updater = member ?? undefined;
    if (!updater) return;
    else if (!(updater instanceof GuildMember))
      updater = await getMember(guild, updater?.user.id);
    if (!updater) return;
    const reason = interaction.fields.getTextInputValue("reason");

    record.reason = reason;

    const modalDuration = interaction.fields.getTextInputValue("duration");
    let duration: number | undefined;
    if (numberRegex.test(modalDuration)) {
      duration = Number(modalDuration);
      record.expireAt = setDate(duration);
    }
    record.updater = {
      discordId: interaction.user.id,
      username: interaction.user.username,
    };
    record.updatedAt = new Date();
    record.save();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      modViewWarningHistory(target.id),
    );

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [warnLogUpdateEmbed(record, mod, target, updater)],
      components: [row],
    });

    const setting = await GuildSetting.findOne({ guildId: guild?.id });

    if (setting?.warn.logChannelId) {
      const channel = await getGuildChannel(guild, setting.warn.logChannelId);
      if (channel?.isSendable()) {
        channel.send({
          embeds: [warnLogUpdateEmbed(record, mod, target, updater)],
          components: [row],
        });
      }
    }*/
  },
});
