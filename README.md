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
  
server.listen("ready", () => {
  console.log("Hello. The bot is online!")
});
  
server.listen("server_message", async (id, raw) => {
  console.log("A message has been sent by my users!");
  if (raw.message == ".super") {
    await bot.send_message(id, raw.message); //repeat the message back to the user of the server!
  }
});
  // EVENTS END
```

#### General Example
CommonJS:
```js
const req = (async function () {
  // NESSACERY IMPORTS
  const { Bot } = await import('revolution.js');
  // NESSACERY IMPORTS END

  // BOT CLIENT  
  const client = new Bot({
    token: process.env.token, // default: null; your token is here, authorizes your bot to our servers.
    name: 'Bot', // default: Bot; your bot name is here, will be included in different messages your bot sends.
    channels: ["revolution~chat"]
  });

  await client.run()

  // BOT CLIENT END
  console.log(client)
  // EVENTS
  
  server.listen("ready", () => {
    console.log("Hello. The bot is online!")
  });
  
  server.listen("server_message", async (id, data) => {
    console.log("A message has been sent by my users!");
    if (data.content === ".super") {
      await data.channel.send(data.content); //repeat the message back to the user of the server!
    }
  });
  // EVENTS END
})();
```

ES6
```js
// NESSACERY IMPORTS
import { Bot } from 'revolution.js';
// NESSACERY IMPORTS END

// BOT CLIENT  
const client = new Bot({
  token: process.env.token, // default: null; your token is here, authorizes your bot to our servers.
  name: 'Bot', // default: Bot; your bot name is here, will be included in different messages your bot sends.
  channels: ["revolution~chat"]
});

await client.run()

// BOT CLIENT END
console.log(client)
// EVENTS
  
server.listen("ready", () => {
  console.log("Hello. The bot is online!")
});
  
server.listen("server_message", async (id, data) => {
  console.log("A message has been sent by my users!");
  if (data.content === ".super") {
    await data.channel.send(data.content); //repeat the message back to the user of the server!
  }
});
// EVENTS END
```

## Migrating from Older Versions
### 1.2 to 1.3
* Getting the ID of the channel of a message has been changed from `message.channel` to `message.channel.id`
* Getting the content of a message is changed from `message.message` to `message.content`
* The `servers` argument in the Bot constructor has been changed to `channels`

### 1.0 to 1.2
* Instead of using `commands.Bot()`, the `Bot` class should be used directly
