# Revolution.js
This is a NodeJS recreation of the working Revolution API.

Install our *Revolution.js Node library* by this command:
```npm
npm i revolution.js
```

## Usage and Examples
### Getting Started
Events Example:
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

General Example:
```js
const req = (async function () {
  // NESSACERY IMPORTS
  const { Bot } = import('revolution.js');
  // NESSACERY IMPORTS END

  // BOT CLIENT  
  const client = new Bot({
    token: process.env.token, // default: null; your token is here, authorizes your bot to our servers.
    name: 'Bot', // default: Bot; your bot name is here, will be included in different messages your bot sends.
    servers: ["revolution"]
  });

  await client.run()

  // BOT CLIENT END
  console.log(client)
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
})();
```
