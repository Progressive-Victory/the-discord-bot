import { ButtonBuilder, ButtonStyle, Guild, Snowflake } from "discord.js";
import { HydratedDocument } from "mongoose";
import { IWarn, WarningRecord } from "../../models/Warn.js";
import { IWarnSearch } from "../../models/WarnSearch.js";
import { AddSplitCustomId } from "../../util/index.js";
import { numberOfWarnEmbedsOnPage, WarnButtonsPrefixes } from "./types.js";

/**
 * Create move left button for viewing warnings
 * @param searchRecord - Warning Search document
 * @returns ButtonBuilder for the move left button
 */
export function leftButton(searchRecord: HydratedDocument<IWarnSearch>) {
  return new ButtonBuilder()
    .setCustomId(
      AddSplitCustomId(WarnButtonsPrefixes.viewWarningsLeft, searchRecord.id),
    )
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(searchRecord.pageStart === 0);
}

/**
 * Create move right button for viewing warnings
 * @param searchRecord - Warning Search document
 * @param records - Array of warn documents
 * @returns ButtonBuilder
 */
export function rightButton(
  searchRecord: HydratedDocument<IWarnSearch>,
  records: HydratedDocument<IWarn>[],
) {
  // button is disabled if the start page plus the number of warn embeds on page is greater than the number of records
  const isDisabled =
    searchRecord.pageStart + numberOfWarnEmbedsOnPage >= records.length;
  return new ButtonBuilder()
    .setCustomId(
      AddSplitCustomId(WarnButtonsPrefixes.viewWarningsRight, searchRecord.id),
    )
    .setEmoji("➡️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(isDisabled);
}

/**
 * Creates button for viewing page number
 * @param searchRecord - warn search document
 * @param records - Array of warn documents
 * @returns ButtonBuilder
 */
export function pageNumber(
  searchRecord: HydratedDocument<IWarnSearch>,
  records: HydratedDocument<IWarn>[],
) {
  const currentPage =
    (searchRecord.pageStart + numberOfWarnEmbedsOnPage) /
    numberOfWarnEmbedsOnPage;

  // round up the record length divided by the number of warn embeds on page
  const totalPages = Math.ceil(records.length / numberOfWarnEmbedsOnPage);

  return new ButtonBuilder()
    .setDisabled(true)
    .setCustomId("Button does not use ID")
    .setLabel(`${currentPage}/${totalPages}`)
    .setStyle(ButtonStyle.Primary);
}

/**
 * Provide a button to allow mods to view the warn history of another guild member
 * @param targetId - the Discord ID of the guild member to view the history of
 * @returns a {@link ButtonBuilder} containing the configuration for the warn history button
 */
export function modViewWarningHistory(targetId: Snowflake) {
  return viewWarnHistory().setCustomId(
    AddSplitCustomId(WarnButtonsPrefixes.modViewWarningHistory, targetId),
  );
}

/**
 * Provide a button to allow users to view the warn history of another guild member
 * @param targetId - the Discord ID of the guild member to view the history of
 * @param guild - the guild in which the target user is a member
 * @returns a {@link ButtonBuilder} containing the configuration for the warn history button
 */
export function userViewWarnHistory(targetId: Snowflake, guild: Guild) {
  return viewWarnHistory().setCustomId(
    AddSplitCustomId(
      WarnButtonsPrefixes.userViewWarningHistory,
      targetId,
      guild.id,
    ),
  );
}
/**
 * @returns a button used to trigger the event to view a user's warn history
 */
function viewWarnHistory() {
  return new ButtonBuilder()
    .setEmoji("🔎")
    .setLabel("View Warning History")
    .setStyle(ButtonStyle.Secondary);
}

/**
 * Button to update a Warning
 * @param record - the warning object witch to update
 * @returns {@link ButtonBuilder} object
 */
export function warnUpdateFromIssue(record: WarningRecord) {
  return updateWarn(record, WarnButtonsPrefixes.updateWarnById);
}

/**
 * Button to update a Warning
 * @param record - the warning object witch to update
 * @returns {@link ButtonBuilder} object
 */
export function warnUpdateFromLog(record: WarningRecord) {
  return updateWarn(record, WarnButtonsPrefixes.updateWarnById);
}

/**
 * @param record - The {@link WarningRecord} corresponding to the warning to update
 * @param code - The {@link WarnButtonsPrefixes} denoting the type of update to perform
 * @returns a button used to trigger the event to update a user's warning
 */
function updateWarn(record: WarningRecord, code: WarnButtonsPrefixes) {
  return new ButtonBuilder()
    .setCustomId(AddSplitCustomId(code, record.id))
    .setEmoji("📝")
    .setLabel("Update Reason")
    .setStyle(ButtonStyle.Secondary);
}

/**
 * provide dm button for users to appeal warns
 * @param record - record of the warning
 * @returns ButtonBuilder
 */
export function appealWarn(record: WarningRecord) {
  return new ButtonBuilder()
    .setCustomId(AddSplitCustomId(WarnButtonsPrefixes.appealWarn, record.id))
    .setLabel("Appeal")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Danger);
}

/**
 * update for DM appeal to give user feedback that appeal was submitted
 * @returns ButtonBuilder
 */
export function appealDmSubmitted() {
  return new ButtonBuilder()
    .setCustomId("Button does not use ID")
    .setLabel("Appeal Submitted")
    .setEmoji("📫")
    .setDisabled(true)
    .setStyle(ButtonStyle.Success);
}

/**
 * Provides a button used to denote the updating of a warning by ID
 * @param record - The {@link WarningRecord} that contains the information of the warning to update
 * @returns a {@link ButtonBuilder} instance that can be used to construct an update-warn-by-ID button
 */
export function updateWarnById(record: WarningRecord) {
  return new ButtonBuilder()
    .setCustomId(
      AddSplitCustomId(WarnButtonsPrefixes.updateWarnById, record.id),
    )
    .setLabel("Update Warning")
    .setEmoji("📝")
    .setStyle(ButtonStyle.Secondary);
}
