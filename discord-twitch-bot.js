// Twitch Channel Checker Bot
// by DJ Arghlex#1729
// DEPENDENCIES
console.log("Loading dependencies")
var fs = require("fs") // built-in to nodejs
var Discord = require("discord.io") // install using npm install Woor/discord.io
var config = require("config") // install using npm
var https = require("https") // install using npm
console.log("Loading configuration")
var configuration = config.get("configuration")

// why the hell do i have to do this
global.twitchConfig = {}
global.twitchTempConfig = {}

// FUNCTIONS
console.log("Loading functions")

function writeLog(message, prefix, writeToFile) { // write a message with a prefix, by default mirroring to logfile
	prefix = typeof prefix !== "undefined" ? prefix : "Debug"; // by default put [Debug] in front of the message
	writeToFile = typeof writeToFile !== "undefined" ? writeToFile : true; // log everything to file by default
	wholeMessage = "[" + prefix + "] " + message
	console.log("  " + wholeMessage)
	if (writeToFile == true) {
		fs.appendFileSync(configuration.logfile, wholeMessage + "\n")
	}
	return
}

function streamManage(value, action, serverId, callback) { // update a server's stream notification preferences
	value = value.toLowerCase()
	writeLog("called manageTwitchModule action: " + action + ", value: " + value, "TwitchNotifier")
	if (action == "add") {
		if (/^[a-zA-Z0-9_]{4,25}$/.test(value)) { // make sure it seems valid to twitch
			if (twitchConfig["streamers"][value] === undefined) {
				twitchConfig["streamers"][value] = {}
			}
			twitchConfig["streamers"][value][serverId] = true
			fs.writeFileSync("./twitchConfig.json", JSON.stringify(twitchConfig))
			callback("added twitch streamer `" + value + "` to " + bot.servers[serverId].name + " (`" + serverId + "`)'s notify list")
			tickTwitchCheck()
		} else {
			callback(":sos: twitch username invalid! make sure you're only using the streamer's username (the thing at the end of their URL)")
		}
	} else if (action == "remove") {
		if (twitchConfig["streamers"][value] === undefined) {
			callback(":sos: twitch username not found in any server's list!")
			return
		}
		if (twitchConfig["streamers"][value][serverId] !== undefined) {
			delete twitchConfig["streamers"][value][serverId] //insert delet this meme here
			console.log(twitchConfig)
			fs.writeFileSync("./twitchConfig.json", JSON.stringify(twitchConfig))
			callback("removed twitch streamer `" + value + "` from " + bot.servers[serverId].name + " (`" + serverId + "`)'s notify list")
			tickTwitchCheck()
		} else {
			callback(":sos: twitch username not found in this server's list!")
		}
	} else if (action == "channel") {
		if (bot.channels[value].name !== undefined) { // shitty error checking
			twitchConfig["servers"][serverId] = value
			fs.writeFileSync("./twitchConfig.json", JSON.stringify(twitchConfig))
			callback("admin set " + bot.servers[serverId].name + " (`" + serverId + "`)'s notify channel to " + bot.channels[value].name + " (" + value + ")")
		} else {
			throw ("channel not on this server, or does not exist!")
		}
	} else {
		callback("called manageTwitchModule with invalid argument?? how did you do this?? <@" + configuration.adminUserId + "> please investigate")
	}
}

function checkTwitch(streamerName, streamerChannels, callback) { // check a twitch streamer's online status
	var opt;
	var apiPath;
	apiPath = "/kraken/streams/" + streamerName.trim() + "?junktimestamp=" + Math.round((new Date()).getTime() / 1000);
	opt = {
		host: "api.twitch.tv",
		path: apiPath,
		headers: {
			"Client-ID": configuration.twitch.token,
			"Accept": "application/vnd.twitchtv.v3+json",
			"User-Agent": "Discord Twitch-Notifier Bot v0.1 by DJ Arghlex#1729"
		}
	};
	https.get(opt, (res) => {
		var body = "";
		res.on("data", (chunk) => {
			body += chunk;
		});
		res.on("end", () => {
			var json;
			try {
				json = JSON.parse(body);
			} catch (err) {
				throw err;
				return;
			}
			if (json.status == 404) {
				callback(streamerName, streamerChannels, undefined);
			} else {
				callback(streamerName, streamerChannels, json);
			}
		});
	}).on("error", (err) => {
		throw "err";
		return;
	});
}

function callbackToDiscordChannel(streamerName, streamerChannels, res) { // process a twitch streamer's stream information and determine if a notification needs to be posted
	if (twitchTempConfig[streamerName] === undefined) {
		twitchTempConfig[streamerName] = {}
	}
	if (res && res.stream) { // stream is currently online
		if (!twitchTempConfig[streamerName].online) { // stream was not marked as being online
			twitchTempConfig[streamerName].online = true;
			writeLog(streamerName + " ONLINE!", "TwitchNotifier",false)
			if (streamerChannels.length === 0) {
				writeLog(streamerName + " ERR! nochannels", "TwitchNotifier")
				return
			}
			writeLog(streamerName + " new stream ONLINE, sending message")
			twitchTempConfig[streamerName]["displayname"] = res.stream.channel.display_name
			currentUnixTime = Math.round((new Date()).getTime() / 1000)
			embedContents = {
						"title": "Twitch streamer `" + twitchTempConfig[streamerName]["displayname"] + "` has begun streaming! Click here to watch!",
						"color": 0x9689b9,
						"type": "rich",
						"url": res.stream.channel.url,
						"description": "**" + res.stream.channel.status + "**\nPlaying: " + res.stream.game,
						"image": {
							"url": res.stream.preview.large + "?junktimestamp=" + currentUnixTime
						},
						"thumbnail": {
							"url": res.stream.channel.logo + "?junktimestamp=" + currentUnixTime
						},
						fields: [{
							"name": "Viewers",
							"value": res.stream.viewers,
							"inline": true
						}, {
							"name": "Followers",
							"value": res.stream.channel.followers,
							"inline": true
						}]
					}
			for (let i = 0; i < streamerChannels.length; i++) {
				bot.sendMessage({
					"to": streamerChannels[i],
					"embed": embedContents
				}, function(a) {
					if ( a !== null ) {
						writeLog("ERROR sendmessage: "+ a, "TwitchNotifier")
					}
				})
			}
		} else { // stream still online
			writeLog(streamerName + " still online, not sending", "TwitchNotifier",false)
		}
	} else { // stream isn't online
		writeLog(streamerName + " offline", "TwitchNotifier",false)
		if (twitchTempConfig[streamerName].online === true) {
			// stream just went offline after we had seen it as online
			streamerNameFancy = streamerName
			try {
				streamerNameFancy = twitchTempConfig[streamerName]["displayname"]
			}catch (err) {
				writeLog("WARNING: "+streamerName+" somehow fancyname was not stored, error: "+err,"TwitchNotifier")
				streamerNameFancy = streamerName
			}
			embedContents = { title: "Twitch streamer `"+streamerNameFancy+"` has stopped streaming...", "color": 0x9689b9}
			for (let i = 0; i < streamerChannels.length; i++) {
				bot.sendMessage({
					"to": streamerChannels[i],
					"embed": embedContents
				})
			}
			twitchTempConfig[streamerName].online = false
		}
	}
}

function tickTwitchCheck() { // iterate through stored twitch streamers list and check their stream's status
	writeLog("Checking for stream state changes", "TwitchNotifier",false)
	for (streamerName in twitchConfig["streamers"]) {
		writeLog("streamer " + streamerName + " has " + Object.keys(twitchConfig["streamers"][streamerName]).length + " servers", "TwitchNotifier")
		if (Object.keys(twitchConfig["streamers"][streamerName]).length === 0) {
			writeLog("not checking and also removing " + streamerName, "TwitchNotifier")
			delete twitchConfig["streamers"][streamerName]
			fs.writeFileSync("./twitchConfig.json", JSON.stringify(twitchConfig))
		} else {
			writeLog("check " + streamerName, "TwitchNotifier",false)
			streamerChannels = [] // flush every time
			for (discordServer in twitchConfig["streamers"][streamerName]) {
				if (twitchConfig["servers"][discordServer] !== undefined) {
					streamerChannels.push(twitchConfig["servers"][discordServer])
					writeLog("assoc " + streamerName + " to " + bot.channels[twitchConfig["servers"][discordServer]].name + " channel in " + bot.servers[discordServer].name, "TwitchNotifier",false)
				} else {
					writeLog("skip assoc " + streamerName + " to " + bot.servers[discordServer].name, "TwitchNotifier",false)
				}
			}
			checkTwitch(streamerName, streamerChannels, callbackToDiscordChannel);
		}
	}
}

// DISCORD BOT INTERFACES
console.log("Starting Discord interface")
var bot = new Discord.Client({
	token: configuration.authToken,
	autorun: true
})

bot.on('ready', function() { // sets up and configures the bot's nicknames and stuff after the API initializes and is ready
	writeLog("User ID: " + bot.id + ", Bot User: " + bot.username, "Discord")
	writeLog("Add to your server using this link: ", "Discord");
	writeLog(" https://discordapp.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=0 ", "Discord");
	writeLog("*** Bot ready! ***", "Discord")
	bot.sendMessage({
		to: configuration.channelId,
		message: ":ok: <@" + configuration.adminUserId + ">: Twitch Notifier Discord Bot back online! Type `" + configuration.commandPrefix + "help` for a list of commands."
	})
	bot.setPresence({
		"game": {
			"name": configuration.currentGame
		}
	});
	bot.editNickname({
		serverID: configuration.serverId,
		userId: bot.id,
		nick: configuration.nickname
	})
	writeLog("Reading settings file...", "TwitchNotifier");
	var file = fs.readFileSync("./twitchConfig.json", { encoding: "utf-8" });
	twitchConfig = JSON.parse(file);
	// tick once on startup
	tickTwitchCheck();
	setInterval(tickTwitchCheck, configuration.twitch.interval * 1000);
})

bot.on('message', function(user, userId, channelId, message, event) { // message handling system
	serverId = bot.channels[channelId]["guild_id"]
	server = bot.servers[serverId].name
	channel = "#" + bot.channels[channelId].name
	
	command = message.split(" ", 1).join(" ").toLowerCase()
	argument = message.split(" ").slice(1).join(" ")
	
	writeLog("<" + user + "> " + message, "Channel - " + server + "/" + channel, false) // don't log channels to file
	
	if (command == configuration.commandPrefix + "ping") { // send a message to the channel as a ping-testing thing.
		bot.sendMessage({
			to: channelId,
			message: ":heavy_check_mark: <@" + userId + ">: Pong!"
		})
	} else if (command == configuration.commandPrefix + "help") { // help page
		message = ":question::book: <@" + userId.toString() + ">: __**Help Page**__\n"
		message += "`" + configuration.commandPrefix + "help` - This output\n"
		message += "`" + configuration.commandPrefix + "ping` - Returns pong\n"
		message += "`" + configuration.commandPrefix + "addstream` - Adds a stream to notify a channel with.\n"
		message += "`" + configuration.commandPrefix + "removestream` - Removes a stream to check.\n"
		if (userId.toString() == configuration.adminUserId) {
			message += "\n**Bot Administrative Commands (usable only by <@" + configuration.adminUserId + ">)**\n"
			message += "`" + configuration.commandPrefix + "setTwitchNotifyChannel <string>` - Sets Twitch stream online/offline notifications channel\n"
			message += "`" + configuration.commandPrefix + "setCurrentGame <string>` - Sets 'Playing' message to <string>\n"
			message += "`" + configuration.commandPrefix + "setNickname <string>` - Sets server nickname to <string>\n"
			message += "`" + configuration.commandPrefix + "setCmdPrefix <string>` - Sets prefix character(s) to <string> (resets to default after restart)\n"
			message += "`" + configuration.commandPrefix + "restart` - Restarts the bot.\n"
		} else {
			message += "~~`" + configuration.commandPrefix + "setTwitchNotifyChannel <string>` - Sets Twitch stream online/offline notifications channel~~ (ask <@" + configuration.adminUserId + ">!)\n"
		}
		message += "\nOpen source! Check out <https://github.com/ArghArgh200/twitch-notifier-bot>!\n"
		message += "Donate to help cover running costs. <https://arghlex.net/?page=donate>\n"
		message += "Add this bot to your server! <https://discordapp.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=0>"
		bot.sendMessage({
			to: channelId,
			message: message
		})
		writeLog("Sent help page", "Discord")
	} else if (command == configuration.commandPrefix + "addstream") {
		try {
			streamManage(argument, "add", serverId, function(embeddedObject) {
				bot.sendMessage({
					to: channelId,
					"message": embeddedObject
				})
			})
		} catch (err) {
			bot.sendMessage({
				to: channelId,
				message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ntwitchNotifier(): streamManage(add): `" + err + "`"
			})
		}
	} else if (command == configuration.commandPrefix + "removestream") {
		try {
			streamManage(argument, "remove", serverId, function(embeddedObject) {
				bot.sendMessage({
					to: channelId,
					"message": embeddedObject
				})
			})
		} catch (err) {
			bot.sendMessage({
				to: channelId,
				message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ntwitchNotifier(): streamManage(remove): `" + err + "`"
			})
		}
	} else if (command == configuration.commandPrefix + "restart") { // public
		writeLog("Restart command given by admin", "Administrative")
		bot.sendMessage({
			to: channelId,
			message: ":wave:"
		}, function(error, response) {
			writeLog("Restarting!", "Shutdown")
			process.exit(0)
		})
	}
	if (userId.toString() == configuration.adminUserId) { //admin commands, usable everywhere but only by admin
		if (command == configuration.commandPrefix + "setcurrentgame") {
			try {
				bot.setPresence({
					"game": {
						"name": argument.toString()
					}
				})
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:ok: **Current game set to:** `" + argument.toString() + "`"
				})
				writeLog("Currently Playing Game set to: " + argument.toString(), "Discord")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n discordSetGame(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		} else if (command == configuration.commandPrefix + "settwitchnotifychannel") {
			try {
				streamManage(argument, "channel", serverId, function(embeddedObject) {
					bot.sendMessage({
						to: channelId,
						"message": embeddedObject
					})
				})
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\n(): streamManage(channel): `" + err + "`"
				})
			}
		} else if (command == configuration.commandPrefix + "setcmdprefix") {
			try {
				configuration.commandPrefix = argument.toString()
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:ok: **Command prefix set to:** `" + configuration.commandPrefix + "`\nThis will reset to default if bot restarts."
				})
				bot.setPresence({
					"game": {
						"name": configuration.currentGame
					}
				});
				writeLog("Command prefix changed to: " + configuration.commandPrefix, "Discord")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n discordSetCmdPrefix(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		} else if (command == configuration.commandPrefix + "setnickname") {
			try {
				bot.editNickname({
					serverID: serverId,
					userID: bot.id,
					nick: argument.toString()
				})
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:ok: **Bot's nickname on this server (" + server + ") set to:** `" + argument.toString() + "`"
				})
				writeLog("Nickname on " + server + " changed to: " + argument.toString(), "Discord")
			} catch (err) {
				bot.sendMessage({
					to: channelId,
					message: "<@" + configuration.adminUserId + ">:\n:sos: **An error occured!**\n discordSetNickname(): `" + err + '`'
				})
				writeLog(err, "Error")
			}
		}
	}
})
bot.on('disconnect', function(errMessage, code) { // disconnect handling, just hard-exits on disconnection, shell script will restart the bot after 5 seconds
	writeLog("Disconnected from server! Code: " + code + ", Reason: " + errMessage, "Error")
	process.exit(1)
});
