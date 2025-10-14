# Context Menus

[Context menus](https://discordjs.guide/interactions/context-menus.html) are an intuitive way to add addtional functionality to a bot. These commands have two types - `User` and `Message`.

## Create a Context Menu Command Object

1. Create a new file corresponding to the new Context Menu Command. You can define the following:
   - `builder` - The discord.js [Context Menu Builder](https://discordjs.dev/docs/packages/builders/main/ContextMenuCommandBuilder:Class). We typically define the following:
     - `name` - The name of the command
     - `type` - The type of the command (once again, either `User` or `Message`)
   - `execute` - The function that will be run on the command invocation
   - _Optional_ `guildIds` - An array of server IDs. _Only use if the command will be exclusive to a set of servers_.

   ```ts
   // src/commands/context_menu/user.ts
   import { ApplicationCommandType } from "discord.js";
   import { ContextMenuCommand } from "../../Classes/index.js";

   export default new ContextMenuCommand()
     .setBuilder((builder) =>
       builder.setName("user").setType(ApplicationCommandType.User),
     )
     .setExecute(async (interaction) => {
       /* Some Code */
     });
   ```

2. Export the defined command in [`index.ts`](../index.ts).

   ```ts
   // src/commands/index.ts
   export { default as user } from "./context_menu/user.js";
   ```

3. Register the commands with the client in the root [`index.ts`](../../index.ts).

   ```ts
   // src/index.ts
   import { Client } from "./Classes/index.js";
   import * as commands from "./commands/index.js";

   const client = new Client();

   // Load commands
   for (const command of Object.values(commands)) client.commands.add(command);
   ```
