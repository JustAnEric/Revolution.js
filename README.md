# Revolution.js
This is a NodeJS recreation of the working Revolution API.

Install our *Revolution.js Node library* by this command:
```npm
npm i revolution.js
```

## Usage and Examples
### Getting Started
#### Events Example
```js
// EVENTS
  
client.listen("ready", () => {
  console.log("Hello. The bot is online!")
});
  
client.listen("server_message", async (id, raw) => {
  console.log("A message has been sent by my users!");
  if (raw.message == ".super") {
    await bot.send_message(id, raw.message); //repeat the message back to the user of the server!
  }
});
  // EVENTS END
```

#### General Example
##### ES6
```js
// NESSACERY IMPORTS
import { Bot } from 'revolution.js';
// NESSACERY IMPORTS END

// BOT CLIENT  
const client = new Bot({
  token: process.env.token, // default: null; your token is here, authorizes your bot to our servers.
  channels: ["revolution~chat"]
});

await client.run()

// BOT CLIENT END
console.log(client)
// EVENTS
  
client.listen("ready", () => {
  console.log("Hello. The bot is online!")
});
  
client.listen("server_message", async (id, data) => {
  console.log("A message has been sent by my users!");
  if (data.content === ".super") {
    await data.channel.send(data.content); //repeat the message back to the user of the server!
  }
});
// EVENTS END
```

#### CommonJS
##### CommonJS
```js
const req = (async function () {
  // NESSACERY IMPORTS
  const { Bot } = await import('revolution.js');
  // NESSACERY IMPORTS END

  // BOT CLIENT  
  const client = new Bot({
    token: process.env.token, // default: null; your token is here, authorizes your bot to our servers.
    channels: ["revolution~chat"]
  });

  await client.run()

  // BOT CLIENT END
  console.log(client)
  // EVENTS
  
  client.listen("ready", () => {
    console.log("Hello. The bot is online!")
  });
  
  client.listen("server_message", async (id, data) => {
    console.log("A message has been sent by my users!");
    if (data.content === ".super") {
      await data.channel.send(data.content); //repeat the message back to the user of the server!
    }
  });
  // EVENTS END
})();
```

#### Commands
```js
const client = new Bot({
  token: process.env.token,
  name: 'Bot',
  channels: ["revolution~chat"],
  commands: true, // to enable commands
  prefix: "!", // the prefix you want,
  help: true // if you want a help command
});
```
## Migrating from Older Versions
### 1.2 to 1.3
* Getting the ID of the channel of a message has been changed from `message.channel` to `message.channel.id`
* Getting the content of a message is changed from `message.message` to `message.content`
* The `servers` argument in the Bot constructor has been changed to `channels`

### 1.0 to 1.2
* Instead of using `commands.Bot()`, the `Bot` class should be used directly
