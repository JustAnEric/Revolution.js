import fetch from 'node-fetch';

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
  constructor () {}
  static async Bot () {
    console.log(`${Color.OkCyan}Internet Check: ${Color.EndC}${Color.Warning}Checking for valid internet...${Color.EndC}`)

    let succeeded = false
    try {
      const internetCheck = await fetch("http://revolution.ericplayzyt.repl.co/api/v1/internet", {
        method: "GET"
      })
      const checkResult = await internetCheck.json()
      if (checkResult.hasInternet === "true") {
        succeeded = true
      }
    } catch (e) {
      succeeded = false
    }
    
    if (succeeded) {
      return Bot
    } else {
      console.log(`${Color.OkCyan}Internet Check: ${Color.EndC}${Color.Fail}Failed to connect to Revolution. Please try again later.${Color.EndC}`)
    }
  }
}

class Bot {
  constructor (config) {
    this.token = config.token || null
    this.servers = config.servers || []
    this.events = {}
    this.serverCache = config.serverCache || {}
    this.bot = {
      "name": config.name || "Bot"
    }
  }
  listen (name, func) {
    this.events[name] = func
  }
  async run () {
    if (!this.token) {
      console.log(`${Color.Fail}Bot Runner: ${Color.EndC}${Color.Warning}Bot cannot be ran: token is not provided.`)
      return
    }
    const tokenCheck = await fetch("http://revolution.ericplayzyt.repl.co/api/v1/python/token_exists", {
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
    if (this.events["ready"]) { this.events.ready() }
    else if (this.events["connect"]) { this.events.connect() };
    setInterval(async () => {
      this.after_ping();
    }, 500) // POLLER REQUESTS TO THE WEBSITE ARE NOW DEPRECATED AND UNUSABLE.
  }

  async after_ping () {
    try {
      for (let c of this.servers) {
        const msgCheck = await fetch("http://revolution.ericplayzyt.repl.co/api/v1/get_server_messages", {
          method: "GET",
          headers: {
            id: c
          }
        })
        const msgResult = await msgCheck.json()
        if (!(c in this.serverCache)) {
          this.serverCache[c] = {"messages":msgResult.messages}
          return
        }
        const cacheMsgs = this.serverCache[c].messages
        const lastMsg = msgResult.messages[msgResult.messages.length - 1]
        
        if (JSON.stringify(msgResult.messages) === JSON.stringify(cacheMsgs) || lastMsg.sent_by === this.bot_name) {
          return
        }
        try {
          if (this.events["server_message"]) {
            this.events["server_message"](lastMsg)
          }
        } catch (e) {
          console.log(`${Color.Warning}Error while running event:\n${e.stack}${Color.EndC}`)
        }
        delete this.serverCache[c]
      }
    } catch (e) {
      console.log(`${Color.OkCyan}Failed to fetch messages:\n${e.stack}${Color.EndC}`)
    }
  }
  async send_message (server, message) {
    const sendReq = await fetch("http://revolution.ericplayzyt.repl.co/api/v1/servers/send_message", {
      method: "GET",
      headers: {
         id: server,
         message,
         sent_by: this.bot.name
      }
    })
    const sendRes = await sendReq.json()
    return sendRes
  }
}
