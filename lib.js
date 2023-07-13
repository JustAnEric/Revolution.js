import fetch from 'node-fetch';
import WebSocket from 'ws';

const Color = {
  Header: '\x1b[95m',
  OkBlue: '\x1b[94m',
  OkCyan: '\x1b[96m',
  OkGreen: '\x1b[92m',
  Warning: '\x1b[93m',
  Fail: '\x1b[91m',
  EndC: '\x1b[0m',
  Bold: '\x1b[1m',
  Underline: '\x1b[4m'
}

export class commands {
  constructor (bot, prefix, help) {
    this.bot = bot
    this.prefix = prefix
    this.help = help
    this.commands = []
  }
  command (name, parameters, config, callback) {
    this.commands.push({name, parameters, config, callback})
  }
  static async Bot () {
    console.log(`${Color.Warning}Commands: ${Color.EndC}${Color.OkBlue}Commands.Bot is deprecated. Please use the Bot class directly.`)
    return Bot
  }
}

export class Bot {
  constructor (config) {
    this.token = config.token || null
    if (config.servers) {
      console.log(`${Color.Warning}Bot: ${Color.EndC}${Color.OkBlue}config.servers is deprecated. Please use config.channels.`)
    }
    this.channels = config.channels || config.servers || []
    this.events = []
    this.bot = {
      "name": config.name || "Bot"
    }
    this.endpoint = config.endpoint || "https://revolution-web.repl.co"
    this.socketURL = config.socketURL || "wss://revolution-web.repl.co"
    this.cache = {}
    if (config.commands) {
      this.commands = new commands(this, config.prefix, config.help)
    }
    this.retry = config.retry
  }
  listen (name, func) {
    this.events.push({"type": name, func})
  }
  removeListener (func) {
    this.events.splice(this.events.indexOf(func), 1)
  }
  ignoreType (type) {
    for (let event of this.events) {
      if (event.type === type) {
        this.events.splice(this.events.indexOf(event.func), 1)
      }
    }
  }
  resetListeners () {
    this.events = []
  }
  async run () {
    if (!this.token) {
      console.log(`${Color.Fail}Bot Runner: ${Color.EndC}${Color.Warning}Bot cannot be ran: token is not provided.`)
      return
    }
    const tokenCheck = await fetch(this.endpoint + "/api/v1/python/token_exists", {
      method: "GET",
      headers: {
        token: this.token
      }
    })
    const tokenResult = await tokenCheck.json()
    if (tokenResult.token_exists !== "true") {
      console.log(`${Color.Fail}Bot Runner: ${Color.EndC}${Color.Warning}Bot cannot be ran: token is invalid.`)
      return
    }

    console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.Warning}Connecting to the server...`)
    
    const ws = new WebSocket(this.socketURL);

    ws.on("unexpected-response", (req, res) => {
      console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.Fail}Failed to connect to Revolution due to an unexpected response. Please try again later.${Color.EndC}`)
      console.error(res)
    })

    ws.on('error', console.error);

    ws.on('close', () => {
      console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.Warning}The connection closed.${Color.EndC}`)
      this.events.filter(c => c.type === "close").forEach(c => c.func())
      if (this.retry) {
        this.run()
      }
    });
    
    ws.on('open', async () => {
      ws.send(JSON.stringify({"type": "login", "token": this.token}))
      ws.send(JSON.stringify({"type": "follow", "channels": this.channels, "token": this.token}));
      console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.OkGreen}Running bot in channels: ${Color.EndC}${Color.OkBlue}${this.channels.join(", ")}${Color.EndC}`)
      try {
        this.events.filter(c => c.type === "ready" || c.type === "connect").forEach(c => c.func())
      } catch (e) {
        console.log(`${Color.Warning}Error while running event:\n${e.stack}${Color.EndC}`)
      }
    });

    ws.on('message', (data) => {
      const obj = JSON.parse(data)
      if (obj.type === "messageCreate") {
        try {
          this.events.filter(c => c.type === "server_message").forEach(c => c.func(new Message(obj, this)))
        } catch (e) {
          console.log(`${Color.Warning}Error while running event:\n${e.stack}${Color.EndC}`)
        }
        if (this.commands && obj.message.startsWith(this.commands.prefix)) {
          process_commands(this, obj)
        }
      } else if (obj.type === "serverInfo") {
        this._bot.cache[obj.server.serverid] = obj.server
      }
    });
  }
  command (...args) {
    if (this.commands) {
      this.commands.command(...args)
    } else {
      console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.Fail}The bot client doesn't have commands enabled. Please enable it by setting config.commands to true.${Color.EndC}`)
    }
  }
  async send_message (channel, message) {
    const sendReq = await fetch(this.endpoint + "/api/v1/servers/send_message", {
      method: "GET",
      headers: {
        id: channel,
        message,
        "sent-by": this.bot.name,
        token: this.token
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
  fetch_channel (id) {
    return new Channel(id, bot)
  }
  fetch_server (id) {
    return new Server(id, bot)
  }
}

const process_commands = (bot, obj) => {
          const commandParts = obj.message.split(" ");
          const commandName = commandParts[0].split(bot.commands.prefix)[1]
          const parameters = [];
  
          let arg = "";
          let isArgument = false;
  
          for (let i = 1; i < commandParts.length; i++) {
            if (commandParts[i].startsWith("\"") && !isArgument) {
              isArgument = true;
              arg += commandParts[i].substring(1);
            } else if (commandParts[i].endsWith("\"") && isArgument) {
              isArgument = false;
              arg += ` ${commandParts[i].substring(0, commandParts[i].length-1)}`;
              parameters.push(arg);
              arg = "";
            } else if (isArgument) {
              arg += ` ${commandParts[i]}`;
            } else {
              parameters.push(commandParts[i]);
            }
          }
  if (commandName === "help" && bot.commands.help) {
    const message = new Message(obj, bot)
    message.reply("<b>Commands:</b><br/>" + bot.commands.commands.map(c => bot.commands.prefix + c.name + (c.config && c.config.description ? "- <i>" + c.config.description + "</i>" : "")).join("<br/>"))
    return
  }
  const command = bot.commands.commands.filter(c => c.name === commandName)[0]
  if (!command) return
  if (command.config && command.config.keywordOnly) {
    command.callback(new Message(obj, bot), parameters)
  } else {
    let result = {}
    for (let [i, param] of Object.entries(parameters)) {
      if (i > command.parameters.length - 1) break
      result[command.parameters[i]] = param
    }
    command.callback(new Message(obj, bot), result)
  }
}

export class Message {
  constructor (obj, bot) {
    this.content = obj.message
    let server = null
    const serverID = obj.channel.split("~")[0]
    if (serverID in bot.cache) {
      server = new Server(bot.cache[serverID], bot)
    } else {
      server = new PartialServer(serverID, bot)
    }
    this.sent_by = from_cache(bot, obj.author_id, new PartialMember({"bot": !!obj.bot, "name": obj.sent_by, "id", obj.author_id, "server": server}))
    this.timestamp = new Date(obj.timestamp)
    this.channel = new Channel(obj.channel, bot)
    this._bot = bot
    this.partial = false
  }
  async reply (message) {
    const sendReq = await fetch(this._bot.endpoint + "/api/v1/servers/send_message", {
      method: "GET",
      headers: {
        id: this.channel.id,
        message,
        "sent-by": this._bot.bot.name,
        token: this._bot.token
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
}

export class Channel {
  constructor (id, bot, server) {
    this.id = id
    this._bot = bot
    const serverID = this.id.split("~")[0]
    if (server) {
      this.server = server
    } else if (serverID in bot.cache) {
      this.server = new Server(bot.cache[serverID], bot)
    } else {
      this.server = new PartialServer(serverID, bot)
    }
    this.partial = false
  }
  async send (message) {
    const sendReq = await fetch(this._bot.endpoint + "/api/v1/servers/send_message", {
      method: "GET",
      headers: {
        id: this.id,
        message,
        "sent-by": this._bot.bot.name,
        token: this._bot.token
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
  async fetch_messages () {
    const sendReq = await fetch(this._bot.endpoint + "/get_new_messages/s/" + this.id, {
      method: "GET"
    })
    const sendRes = await sendReq.json()
    return sendRes.messages.map(msg => new Message(msg, this._bot))
  }
}

export class PartialServer {
  constructor (id, bot) {
    this.id = id
    this._bot = bot
    this.partial = true
  }
  async fetch () {
    const sendReq = await fetch(this._bot.endpoint + "/api/v1/get_server", {
      method: "GET",
      headers: {
        id: this.id
      }
    })
    const sendRes = await sendReq.json()
    this._bot.cache[this.id] = sendRes
    return new Server(sendRes, this._bot)
  }
}

export class Server {
  constructor (data, bot) {
    this.name = data.name
    this.id = data.serverid
    this.abbr = data.abbr
    this.icon = data.imgurl
    this.color = data.color
    this.channels = data.channels.map(c => new Channel(this.id + "~" + c, bot, this))
    this.roles = data.roles
    this.emojis = data.emojis
    this.emotes = data.emotes
    this.members = data.users_chatted.map(c => from_cache(bot, c.id, new PartialMember({"name": c.name, "id": c.id, "server": this})))
    this.partial = false
    this._bot = bot
  }
  async fetch () {
    const sendReq = await fetch(this._bot.endpoint + "/api/v1/get_server", {
      method: "GET",
      headers: {
        id: this.id
      }
    })
    const sendRes = await sendReq.json()
    this._bot.cache[this.id] = sendRes
    return new Server(sendRes, this._bot)
  }
}

class PartialMember {
  constructor (data, bot) {
    this.bot = data.bot
    this.name = data.name
    this.id = data.id
    this.server = data.server
    this._bot = bot
    this.partial = true
  }
  fetch () {
    const sendReq = await fetch(this._bot.endpoint + "/api/v1/get_user", {
      method: "GET",
      headers: {
        id: this.id
      }
    })
    const sendRes = await sendReq.json()
    this._bot.cache[this.id] = sendRes
    return new Member(sendRes, this.server, this._bot)
  }
}

export class Member {
  constructor (data, server, bot) {
    this.bot = data.bot
    this.name = data.name
    this.discriminator = data.discriminator
    this.description = data.description
    this.id = data.id
    this.server = server
    this._bot = bot
    this.partial = true
  }
}

const from_cache = (bot, id, data) => {
  if (id in bot.cache) {
    return bot.cache[id]
  } else {  
    return data
  }
}