# Events

Client Events are how the bot interacts with Discord. The PV bot has a built-in event handler provided by `discord.js`. For each event we want the PV bot to handle, we need to register a corresponding event handler. The following is an example of how to add the `messageCreate` event to the bot:

1. Create a new `Event` object:

- `name` - is the name of the client event. The full list can be found in the [discord.js documentation](https://discord.js.org/docs/packages/discord.js/14.19.3/ClientEvents:Interface).
- `once` - by default `false`. This property allows the `Event` to be limited to run only once.
- `execute` - the function which runs on the occurence of the event.

```ts
// src/events/messageCreate.ts
import { Events, Message } from "discord.js";
import { Client, Event } from "../Classes";

export default new Event({
  name: Events.MessageCreate,
  once: false,
  execute: (message: Message) => {
    /* Some Code*/
  },
});
```

2. In `index.ts`, export the object you just created as `default` using the name of the event:

```ts
// src/events/index.ts
export { default as messageCreate } from "./messageCreate";
```

3. In the entry point (`src/index.ts`) make sure the following is present. This registers the event handlers with the client:

```ts
// src/index.ts
import { Client } from "./Classes";
import * as events from "./events";

export const client = new Client();

// Load Events
for (const event of Object.values(events)) client.events.add(event);
```
