# Select Menus

[Select menus](https://discordjs.guide/message-components/select-menus.html) are a [message component](https://discordjs.guide/message-components/interactions.html#responding-to-component-interactions) interaction that creats a dropdown allowing the user to select one or more items in the menu.

## Types

The main type of a select menu is a `String`. However, Discord allows for four Auto-populating types:

- User - only users
- Role - only roles
- Mentionable - users and roles
- Channel - channels

## Creating an Interaction

Interactions start with the bot [sending the select menu](https://discordjs.guide/interactive-components/select-menus.html#building-string-select-menus). To receive this interaction upon it being used, follow the below steps:

1. Create an interaction object:
   - `customIdPrefix` - Is used to identify which interactions should be triggered
   - `run` - The function which is called on the trigger of the interaction

   ```ts
   // src/interactions/select_menus/string.ts
   import { StringSelectMenuInteraction } from "discord.js";
   import { Interaction } from "../../../Classes/index.js";

   export default new Interaction<StringSelectMenuInteraction>({
     customIdPrefix: "string",
     run: async (interaction) => {
       /* Some Code */
     },
   });
   ```

2. Export `default` the object you just made as a unique name in [`index.ts`](index.ts)

   ```ts
   // src/interactions/select_menus/index.ts
   export { default as string } from "./string.js";
   ```

3. In the root [`index.ts`](../../index.ts), make sure the following is present:

   ```ts
   // src/index.ts
   import { Client } from "./Classes/index.js";
   import * as selectMenus from "./interactions/select_menus/index.js";

   export const client = new Client({
     receiveMessageComponents: true, // enables the usage of message components
     splitCustomIDOn: "_", // allows the inclusion of additional information in a custom ID
     // `prefix_arg1_arg2` is converted to [prefix, arg1, arg2]
   });

   // Load selectMenus
   for (const selectMenu of Object.values(selectMenus))
     client.interactions.addSelectMenu(selectMenu);
   ```
