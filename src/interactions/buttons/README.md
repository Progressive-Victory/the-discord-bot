# Buttons

[Buttons](https://discordjs.guide/interactive-components/buttons.html) are an interactive component that can be used to create an interaction event.

## Creating a Button Interaction

Interactions start with the bot [sending the button](https://discordjs.guide/interactive-components/buttons.html). To receive this interaction upon it being used, follow the below steps:

1. Create an interaction object:

    - `customIdPrefix` - Is used to identify which interactions should be triggered
    - `run` - The function which is called on the occurrence of the interaction

    ```ts
    // src/interactions/button/button.ts
    import { ButtonInteraction } from "discord.js";
    import { Interaction } from "../../../Classes/index.js";

    export default new Interaction<ButtonInteraction>({
      customIdPrefix: "button",
      run: async (interaction) => {
        /* Some Code */
      },
    });
    ```

2. Export `default` the object you just made as a unique name in [`index.ts`](index.ts)

    ```ts
    // src/interactions/button/index.ts
    export { default as string } from "./button.js";
    ```

3. In the root [`index.ts`](../../index.ts), make sure the following is present:

    ```ts
    // src/index.ts
    import { Client } from "./Classes/index.js";
    import * as buttons from "./interactions/buttons/index.js";

    export const client = new Client({
      receiveMessageComponents: true, // enables the usage of message components
      splitCustomIDOn: "_", // allows the inclusion of additional information in a custom ID
      // `prefix_arg1_arg2` is converted to [prefix, arg1, arg2]
    });

    // Load buttons
    for (const button of Object.values(buttons))
      client.interactions.addButton(button);
    ```
