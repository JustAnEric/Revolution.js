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
  constructor (endpoint) {
    this.endpoint = endpoint
  }
  static async Bot () {
    return Bot
  }
}

class Bot {
  constructor (config) {
    this.token = config.token || null
    this.servers = config.servers || []
    this.events = {}
    this.bot = {
      "name": config.name || "Bot"
    }
    this.endpoint = config.endpoint || "https://revolution-web.repl.co"
    this.socketURL = config.socketURL || "wss://revolution-web.repl.co"
  }
  listen (name, func) {
    this.events[name] = func
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
    console.log(`${Color.OkCyan}Bot Runner: ${Color.EndC}${Color.OkGreen}Running bot in servers: ${Color.EndC}${Color.OkBlue}${this.servers.join(", ")}${Color.EndC}`)

    const ws = new WebSocket(this.socketURL);

    ws.on("unexpected-response", (req, res) => {
      console.error(res)
    })

    ws.on('error', console.error);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({'type':'follow', 'channels': this.servers, "token": this.token}));
      try {
        if (this.events["ready"]) {
          this.events["ready"]()
        } else if (this.events["connect"]) {
          this.events["connect"]()
        }
      } catch (e) {
        console.log(`${Color.Warning}Error while running event:\n${e.stack}${Color.EndC}`)
      }
    });

    ws.on('message', (data) => {
      const obj = JSON.parse(data)
      if (obj.type === "messageCreate") {
        try {
          if (this.events["server_message"]) {
            this.events["server_message"]({"message": obj.message, "sent_by": obj.sent_by, "channel": obj.channel})
          }
        } catch (e) {
          console.log(`${Color.Warning}Error while running event:\n${e.stack}${Color.EndC}`)
        }
      }
    });
  }
  async send_message (server, message) {
    const sendReq = await fetch(this.endpoint + "/api/v1/servers/send_message", {
      method: "GET",
      headers: {
        id: server,
        message,
        sent_by: this.bot.name,
        token: this.token
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
}
