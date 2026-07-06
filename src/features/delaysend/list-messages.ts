import {
  ActionRowData,
  APIMessageTopLevelComponent,
  bold,
  ChatInputCommandInteraction,
  codeBlock,
  ComponentType,
  isJSONEncodable,
  JSONEncodable,
  MessageActionRowComponentBuilder,
  MessageActionRowComponentData,
  MessageFlags,
  TextDisplayComponentData,
  TopLevelComponentData,
  unorderedList,
} from "discord.js";
import { scheduledMessages } from "../../util/delaysend/state.js";

// Drill down into the component and extract its string representation
function componentToStr(
  component:
    | JSONEncodable<APIMessageTopLevelComponent>
    | TopLevelComponentData
    | ActionRowData<
        MessageActionRowComponentData | MessageActionRowComponentBuilder
      >
    | APIMessageTopLevelComponent,
) {
  if (isJSONEncodable(component)) {
    // Returns the contained value (not a JSON string as I assumed)
    component = component.toJSON();
  }
  switch (component.type) {
    case ComponentType.TextDisplay:
      return (component as TextDisplayComponentData).content;
    //TODO: We will want a way to show any Components message, not just ones with TextDisplays. 
    // Might need to just send each in a separate ephemeral message so Discord renders? 
    default:
      throw "Unimplemented component type";
  }
}

export async function listScheduledMessages(
  command: ChatInputCommandInteraction,
) {
  if (scheduledMessages.size === 0) {
    await command.reply({
      content: "There are no scheduled messages.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const messageList = unorderedList(
    scheduledMessages
      .values()
      .toArray()
      .map(
        (msg) =>
          `${bold(msg.id)} (${msg.pattern})\n${codeBlock(msg.payload.components?.map(componentToStr).join("\n\n") ?? "Unknown")}`,
      ),
  );
  console.debug(messageList);
  await command.reply({
    content: [
      "Currently Scheduled Messages:",
      messageList,
      // TODO: Here's where a (better) message preview would go
    ].join("\n"),
    flags: MessageFlags.Ephemeral,
  });
}
