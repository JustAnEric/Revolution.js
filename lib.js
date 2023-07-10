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
  constructor (bot, prefix) {
    this.bot = bot
    this.prefix = prefix
    this.commands = []
  }
  command (name, parameters, callback, config) {
    this.commands.push({name, parameters, callback, config})
  }
  static async Bot () {
    console.log(`${Color.Warning}Commands: ${Color.EndC}${Color.OkBlue}Commands.Bot is deprecated. Please use the Bot class directly.`)
    return Bot
  }
}

export class Bot {
  constructor (config) {
    this.token = config.token || null
    this.servers = config.servers || []
    this.events = []
    this.bot = {
      "name": config.name || "Bot"
    }
    this.endpoint = config.endpoint || "https://revolution-web.repl.co"
    this.socketURL = config.socketURL || "wss://revolution-web.repl.co"
    if (config.commands) {
      this.commands = new commands(this, config.prefix)
    }
  }
  listen (name, func) {
    this.events.push({"type": name, func})
  }
  removeListener (func) {
    this.events.splice(this.events.indexOf(func), 1)
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
    
    ws.on('open', () => {
      ws.send(JSON.stringify({'type':'follow', 'channels': this.servers, "token": this.token}));
      console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.OkGreen}Running bot in servers: ${Color.EndC}${Color.OkBlue}${this.servers.join(", ")}${Color.EndC}`)
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
      }
    });
  }
  async send_message (channel, message) {
    const sendReq = await fetch(this.endpoint + "/api/v1/servers/send_message", {
      method: "GET",
      headers: {
        id: channel,
        message,
        sent_by: this.bot.name,
        token: this.token
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
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
          const command = bot.commands.commands.filter(c => c.name === commandName)[0]
          let result = {}
          for (let [i, param] of Object.entries(parameters)) {
            if (i > command.parameters.length - 1) break
            result[command.parameters[i]] = param
          }
          command.callback(new Message(obj, this), result)
}

export class Message {
  constructor (obj, bot) {
    this.message = obj.message
    this.sent_by = obj.sent_by
    this.channel = new Channel(obj.channel, bot)
    this.bot = bot
  }
}

export class Channel {
  constructor (id, bot) {
    this.id = id
    this.bot = bot
  }
  async send_message (message) {
    const sendReq = await fetch(this.endpoint + "/api/v1/servers/send_message", {
      method: "GET",
      headers: {
        id: this.id,
        message,
        sent_by: bot.bot.name,
        token: bot.token
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
  async fetch_messages () {
    const sendReq = await fetch(this.endpoint + "/api/v1/get_server_messages", {
      method: "GET",
      headers: {
        id: this.id
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
}