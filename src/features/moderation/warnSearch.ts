/*import { ActionRowBuilder, ButtonBuilder, italic } from "discord.js";
import { FilterQuery } from "mongoose";
import { Warn, WarningRecord } from "../../models/Warn.js";
import { WarningSearch, WarnSearch } from "../../models/WarnSearch.js";
import { leftButton, pageNumber, rightButton } from "./buttons.js";
import { viewWarningEmbeds } from "./embeds.js";
import { numberOfWarnEmbedsOnPage } from "./types.js";

/**
 * Render message for search of warnings
 * @param record - warning search document or document Id as a string
 * @param isMod - Whether the invoker was a mod
 * @param isRightMove - was the right move button pressed
 * @param isStart - is this the initiation of a search
 * @returns partial message object compatible with Interaction reply and update
 */
/*export async function warnSearch(
  record: WarnSearch | string,
  isMod: boolean,
  isRightMove: boolean = false,
  isStart: boolean = false,
) {
  let searchRecord: WarnSearch | null;

  // check if record is a string and resolve it to a document
  if (typeof record === "string")
    searchRecord = await WarningSearch.findById(record);
  else searchRecord = record;

  // if document is found show message to user. Message will not be shown under normal conditions
  if (!searchRecord) {
    return {
      content:
        "No search record found. Please let an admin know if you see this message",
    };
  }

  const { expireAfter, moderatorDiscordId, targetDiscordId } = searchRecord;

  const filter: FilterQuery<WarningRecord> = {};

  // check for search conditions then add them to the filter
  if (moderatorDiscordId) filter["moderator.discordId"] = moderatorDiscordId;

  if (targetDiscordId) filter["target.discordId"] = targetDiscordId;

  if (expireAfter) filter.expireAt = { $gte: expireAfter };

  // update the pageStart value based on isRightMove
  // if isStart is true not change is made
  if (!isStart) {
    if (isRightMove) searchRecord.pageStart += numberOfWarnEmbedsOnPage;
    else searchRecord.pageStart -= numberOfWarnEmbedsOnPage;
  }
  // save search record
  searchRecord.save();

  const now = Date.now();

  // Find and sort warning documents
  const records = (await Warn.find(filter)).toSorted((a, b) => {
    // checks if on of the records has expired
    const aExpired = a.expireAt.getTime() < now;
    const bExpired = b.expireAt.getTime() < now;

    if (!aExpired && bExpired) return -1;
    if (aExpired && !bExpired) return 1;

    // if none or both records are expired compare createdAt
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return {
    content: italic("Sorted by Active Status and Date Created"),
    embeds: await viewWarningEmbeds(records, isMod, searchRecord.pageStart),
    components:
      records.length <= numberOfWarnEmbedsOnPage
        ? []
        : [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              leftButton(searchRecord),
              pageNumber(searchRecord, records),
              rightButton(searchRecord, records),
            ),
          ],
  };
}*/
