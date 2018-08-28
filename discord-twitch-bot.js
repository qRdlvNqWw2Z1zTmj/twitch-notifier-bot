// Twitch Channel Checker Bot
// by DJ Arghlex#1729

// DEPENDENCIES
console.log( "Loading dependencies" )
const fs = require( "fs" ) // built-in to nodejs
const Discord = require( "discord.io" ) // install using npm
const config = require( "config" ) // install using npm
const https = require( "https" ) // install using npm
const path = require( "path" ) // built-in to nodejs

console.log( "Loading configuration" )
const configuration = config.get( "configuration" )
const botName = "Twitch Notifier Bot"
const botAuthor = "DJ Arghlex#1729"
const botVersion = "0.3.5"

// why the hell do i have to do this
global.twitchConfig = {}
global.twitchTempConfig = {}

// FUNCTIONS
console.log( 'Loading functions' );
let wholeMessage;
// Core parts of the bot
function writeLog( message, prefix, writeToFile ) {
	if ( !prefix ) {
		prefix = '[Debug]'; // By default put [Debug] in front of the message
	}
	writeToFile = typeof writeToFile !== 'undefined' ? writeToFile : true; // Log everything to file by default
	wholeMessage = '[' + prefix + '] ' + message;
	console.log( '  ' + wholeMessage );
	if ( writeToFile === true ) {
		fs.appendFileSync( path.basename( __filename ) + '.log', wholeMessage + '\n' );
	}
}

function streamManage( value, action, serverId, callback ) { // update a server's stream notification preferences
	value = value.toLowerCase()
	writeLog( "called manageTwitchModule action: " + action + ", value: " + value, "TwitchNotifier" )
	if ( action == "add" ) {
		if ( /^[a-zA-Z0-9_]{4,25}$/.test( value ) ) { // make sure it seems valid to twitch
			if ( twitchConfig[ "streamers" ][ value ] === undefined ) {
				twitchConfig[ "streamers" ][ value ] = {}
			}
			twitchConfig[ "streamers" ][ value ][ serverId ] = true
			fs.writeFileSync( "./twitchConfig.json", JSON.stringify( twitchConfig ) )
			callback( "added twitch streamer `" + value + "` to `" + bot.servers[ serverId ].name + "`'s notify list" )
			tickTwitchCheck()
		} else {
			callback( ":sos: twitch username invalid! make sure you're only using the streamer's username (the thing at the end of their URL)" )
		}
	} else if ( action == "remove" ) {
		if ( twitchConfig[ "streamers" ][ value ] === undefined ) {
			callback( ":sos: twitch username not found in any server's list!" )
			return
		}
		if ( twitchConfig[ "streamers" ][ value ][ serverId ] !== undefined ) {
			delete twitchConfig[ "streamers" ][ value ][ serverId ] //insert delet this meme here
			console.log( twitchConfig )
			fs.writeFileSync( "./twitchConfig.json", JSON.stringify( twitchConfig ) )
			callback( "removed twitch streamer `" + value + "` from `" + bot.servers[ serverId ].name + "`'s notify list" )
			tickTwitchCheck()
		} else {
			callback( ":sos: twitch username not found in this server's list!" )
		}
	} else if ( action == "channel" ) {
		if ( bot.channels[ value ].name !== undefined ) { // shitty error checking
			twitchConfig[ "servers" ][ serverId ] = value
			fs.writeFileSync( "./twitchConfig.json", JSON.stringify( twitchConfig ) )
			callback( "admin set `" + bot.servers[ serverId ].name + "`'s notify channel to <#" + value + ">" )
		} else {
			throw ( "channel not on this server, or does not exist!" )
		}
	} else if ( action == "wipenotify" ) {
		twitchTempConfig = {}
		callback( "admin wiped twitchTempConfig! next `tickTwitchCheck()` will interpret currently live streams as newly-live!" )
	} else {
		callback( "called manageTwitchModule with invalid argument?? how did you do this?? <@" + configuration.adminUserId + "> please investigate" )
	}
}

function checkTwitch( streamerName, streamerChannels, callback ) { // check a twitch streamer's online status
	var opt;
	var apiPath;
	apiPath = "/kraken/streams/" + streamerName.trim() + "?junktimestamp=" + Math.round( ( new Date() )
		.getTime() / 1000 );
	opt = {
		host: "api.twitch.tv"
		, path: apiPath
		, headers: {
			"Client-ID": configuration.twitch.token
			, "Accept": "application/vnd.twitchtv.v3+json"
			, "User-Agent": botName + " v" + botVersion + " by " + botAuthor
		}
	};
	https.get( opt, ( res ) => {
			var body = "";
			res.on( "data", ( chunk ) => {
				body += chunk;
			} );
			res.on( "end", () => {
				var json;
				try {
					json = JSON.parse( body )
				} catch ( err ) {
					writeLog("Twitch API returned error: " + err,"TwitchAPI")
					return
				}
				if ( json.status == 404 ) {
					writeLog("Twitch API returned 404 for streamer: " + streamerName,"TwitchAPI")
					return
				} else {
					callback( streamerName, streamerChannels, json )
				}
			} )
		} )
		.on( "error", ( err ) => {
			writeLog( "Error contacting Twitch API: " + err, "TwitchAPI" )
			return
		} );
}

function callbackToDiscordChannel( streamerName, streamerChannels, res ) { // process a twitch streamer's stream information and determine if a notification needs to be posted
	if ( twitchTempConfig[ streamerName ] === undefined ) {
		twitchTempConfig[ streamerName ] = {}
	}
	if ( res && res.stream ) { // stream is currently online
		if ( !twitchTempConfig[ streamerName ].online ) { // stream was not marked as being online
			twitchTempConfig[ streamerName ].online = true;
			writeLog( streamerName + " ONLINE!", "TwitchNotifier", false )
			if ( streamerChannels.length === 0 ) {
				writeLog( streamerName + " ERR! nochannels", "TwitchNotifier" )
				return
			}
			writeLog( streamerName + " new stream ONLINE, sending message" )
			twitchTempConfig[ streamerName ][ "displayname" ] = res.stream.channel.display_name
			currentUnixTime = Math.round( ( new Date() )
				.getTime() / 1000 )
			embedContents = {
				"title": "Twitch streamer `" + twitchTempConfig[ streamerName ][ "displayname" ] + "` has begun streaming! Click here to watch!"
				, "color": 0x9689b9
				, "type": "rich"
				, "url": res.stream.channel.url
				, "description": "**" + res.stream.channel.status + "**\nPlaying: " + res.stream.game
				, "image": {
					"url": res.stream.preview.large + "?junktimestamp=" + currentUnixTime
				}
				, "thumbnail": {
					"url": res.stream.channel.logo + "?junktimestamp=" + currentUnixTime
				}
				, footer: {
					icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/twitch-notifier.png"
					, text: botName
				}
				, fields: [ {
					"name": "Viewers"
					, "value": res.stream.viewers
					, "inline": true
				}, {
					"name": "Followers"
					, "value": res.stream.channel.followers
					, "inline": true
				} ]
			}
			for ( let i = 0; i < streamerChannels.length; i++ ) {
				bot.sendMessage( {
					"to": streamerChannels[ i ]
					, "embed": embedContents
				}, function( a ) {
					if ( a !== null ) {
						writeLog( "ERROR sendmessage: " + a, "TwitchNotifier" )
					}
				} )
			}
		} else { // stream still online
			//writeLog(streamerName + " still online, not sending", "TwitchNotifier",false)
		}
	} else { // stream isn't online
		//writeLog(streamerName + " offline", "TwitchNotifier",false)
		if ( twitchTempConfig[ streamerName ].online === true ) {
			writeLog( streamerName + " now offline", "TwitchNotifier" )
			// stream just went offline after we had seen it as online
			streamerNameFancy = streamerName
			try {
				streamerNameFancy = twitchTempConfig[ streamerName ][ "displayname" ]
			} catch ( err ) {
				writeLog( "TwitchNotifier " + streamerName + " somehow fancyname was not stored, error: " + err, "Warning" )
				streamerNameFancy = streamerName
			}
			embedContents = {
				footer: {
					icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/twitch-notifier.png"
					, text: botName
				}
				, title: "Twitch streamer `" + streamerNameFancy + "` has stopped streaming..."
				, "color": 0x9689b9
			}
			for ( let i = 0; i < streamerChannels.length; i++ ) {
				bot.sendMessage( {
					"to": streamerChannels[ i ]
					, "embed": embedContents
				} )
			}
			twitchTempConfig[ streamerName ].online = false
		}
	}
}

function tickTwitchCheck() { // iterate through stored twitch streamers list and check their stream's status
	//writeLog("Checking for stream state changes", "TwitchNotifier",false)
	for ( streamerName in twitchConfig[ "streamers" ] ) {
		//writeLog("streamer " + streamerName + " has " + Object.keys(twitchConfig["streamers"][streamerName]).length + " servers", "TwitchNotifier",false)
		if ( Object.keys( twitchConfig[ "streamers" ][ streamerName ] )
			.length === 0 ) {
			writeLog( "not checking and also removing " + streamerName, "TwitchNotifier", false )
			delete twitchConfig[ "streamers" ][ streamerName ]
			fs.writeFileSync( "./twitchConfig.json", JSON.stringify( twitchConfig ) )
		} else {
			//writeLog("check " + streamerName, "TwitchNotifier",false)
			streamerChannels = [] // flush every time
			for ( discordServer in twitchConfig[ "streamers" ][ streamerName ] ) {
				if ( bot.servers[discordServer] === undefined ) {
					// bot has old entries for a departed server
					writeLog("assocfail " + streamerName + " to " + discordServer + ", reason notjoined" ,"TwitchNotifier",false)
				} else {
					if ( twitchConfig[ "servers" ][ discordServer ] !== undefined ) {
						streamerChannels.push( twitchConfig[ "servers" ][ discordServer ] )
						//writeLog("assoc " + streamerName + " to " + bot.channels[twitchConfig["servers"][discordServer]].name + " channel in " + bot.servers[discordServer].name, "TwitchNotifier",false)
					} else {
						writeLog( "skip assoc " + streamerName + " to " + bot.servers[ discordServer ].name, "TwitchNotifier", false )
					}
				}
			}
			try {
				checkTwitch( streamerName, streamerChannels, callbackToDiscordChannel );
			} catch ( error ) {
				writeLog( "COULD NOT CHECK TWITCH STREAM! err: " + error, "Error" );
				bot.sendMessage( {
					to: configuration.channelId
					, message: ":sos: <@" + configuration.adminUserId + ">: An error occured! `tickTwitchCheck(): checkTwitch(" + streamerName + "): " + error + "`"
				} )
			}
		}
	}
}

function botManagement ( argument, callback ) { // do server/bot management stuff

	const returnedEmbedObject = {
		footer: {
			icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/twitch-notifier.png"
			, text: botName
		}
		, title: 'empty title'
		, description: 'empty description'
		, fields: []
	};
	let arguments = argument.split(' ')

	if (arguments[0] == 'server') { //server-specific management command

		if (arguments.length < 2 ) { // make sure we have enough arguments (not counting the main command, there's 'server', the ID, and the subcommand, and the possibility of an argument for nicknames on another)
			throw 'Please specify a server ID and a server-specific command'
		}

		// create a list of servers to quickly check against
		let servers = []
		for ( server in bot.servers ) {
			servers.push(bot.servers[server].id)
		}
		if (!servers.includes(arguments[1])) { // and now we check against our self-made list
			throw 'Server ID not found in bot server list.'
		}
		
		servername = bot.servers[ arguments[1] ].name 

		// main logic for commands

		if (arguments[2] == 'setnick') { // set nickname
			newnick = arguments.slice(3).join(' ')
			
			bot.editNickname( {
				serverID: serverId
				, userID: bot.id
				, nick: newnick
			} )

			writeLog('Overwrote command prefix to `'+arguments.slice(1).join(' ')+'`', 'Management')
			returnedEmbedObject.title = 'Success!'
			returnedEmbedObject.description = 'Set bot\'s nickname on *' + bot.servers[ arguments[1] ].name + '* to `'+ newnick +'`.'
			callback(returnedEmbedObject)
			return

		} else if (arguments[2] == "leave") { // forces bot to leave a server
			bot.leaveServer(arguments[1])

			writeLog('Left server `'+servername+'`', 'Management')
			returnedEmbedObject.title = 'Success!'
			returnedEmbedObject.description = 'Left server *servername*'
			callback(returnedEmbedObject)
			return

		} else if (arguments[2] == "getadmininfo") { // gets the information of the server owner
			serverownerid = bot.servers[ arguments[1] ].owner_id
			serverowner = bot.users[serverownerid].username + "#" + bot.users[serverownerid].discriminator

			writeLog('Retrieved server owner information for `'+servername+", info: "+serverowner+", ID: "+serverownerid,"Management")

			returnedEmbedObject.title = 'Owner of server *'+ servername + "*"
			returnedEmbedObject.description = "**"+serverowner+"**, ID: `"+serverownerid+"`"
			callback(returnedEmbedObject)
			return
		}


	} else if (arguments[0] == 'broadcast') {
		for (server in bot.servers) {
			const returnedEmbedObject = {
				timestamp
				, footer: {
					icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/twitch-notifier.png"
					, text: botName
				}
				, title: 'Message from Bot Administrator <@' + configuration.adminUserId + '> (DJ Arghlex#1729)'
				, description: arguments.slice(1).join(' ')
				, fields: []
			};
			bot.sendMessage( {
				to: bot.servers[server]['guild_id']
				, embed: returnedEmbedObject
			} );
		}


	} else if (arguments[0] == 'listservers') {
		returnedEmbedObject.title = 'Server Listing'
		returnedEmbedObject.description = 'Listing of all servers bot is connected to.'
		for (server in bot.servers) {
			returnedEmbedObject.fields.push( {
				name: bot.servers[server].name
				, value: bot.servers[server].id
				, inline: true
			} );
		}
		writeLog('Sent server list.','Management')
		callback(returnedEmbedObject)
		return


	} else if (arguments[0] == 'setgame') { // currentgame
		bot.setPresence( {
			'game': {
				'name': arguments.slice(1)
			}
		} )
		writeLog( 'Currently Playing Game set to: ' + arguments.slice(1).join(' '), 'Management' )

		writeLog('Overwrote command prefix to `'+arguments.slice(1).join(' ')+'`', 'Management')
		returnedEmbedObject.title = 'Success!'
		returnedEmbedObject.description = 'Set the Now Playing message to `'+ arguments.slice(1).join(' ') +'`. This change will revert when the bot next restarts.'
		callback(returnedEmbedObject)
		return


	} else if (arguments[0] == 'setcmdprefix') { // cmd prefix temp override
		if (arguments[1] !== undefined && arguments[1].length > 0 ) {

			throw 'author\'s note: okay, well, this is actually broken because of the way the configuration is loaded and subsequently handled. if you really need to change it just change it in the config.'
			//const newprefix = arguments[1].substr(0,1)
			//configuration.commandPrefix = newprefix

			//writeLog('Overwrote command prefix to `'+newprefix+'`', 'Management')
			//returnedEmbedObject.title = 'Success!'
			//returnedEmbedObject.description = 'Globally set the command prefix to `'+ newprefix +'`. This change will revert when the bot next restarts.'
			//callback(returnedEmbedObject)
			//return
		} else {
			throw 'New command prefix was invalid.'
		}


	} else if (arguments[0] == 'help') { // help sub-page
		const returnedEmbedObject = { // totally overwrites the one set outside the logic above. this is intentional.
			timestamp
			, footer: {
				icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/twitch-notifier.png"
				, text: botName
			}
			, author: {
				name: 'Bot Mgmt Help'
				, icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/help-page.png"
			}
			, title: 'Bot Management Help Sub-Page'
			, description: 'Only usable by bot owner: <@' + configuration.adminUserId + '>'
			, fields: []
		};
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement help'
			, value: 'This output'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement broadcast <string>'
			, value: 'Sends a message to the default channel of every Discord the bot is on'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement setgame <string>'
			, value: 'Temporarily sets the current game the bot is "playing" to <string>'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement setcmdprefix <char>'
			, value: 'Temporarily sets the command prefix to <char>'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement listservers'
			, value: 'Lists servers the bot is on'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement server <serverID> leave'
			, value: 'Forces the bot to leave <serverID>'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement server <serverID> setnick <nickname>'
			, value: 'Changes the bot\'s nickname on <serverID>'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'botmanagement server <serverID> getadmininfo'
			, value: 'Retrieves information of the owner of <serverID> (username, 4-number character, and userID)'
			, inline: true
		} );
		callback (returnedEmbedObject)
	} else {
		throw 'Please specify a command.'
	}
}

// DISCORD BOT INTERFACES
console.log( "Starting Discord interface" )
const bot = new Discord.Client( {
	token: configuration.authToken
	, autorun: true
} )
bot.on( 'ready', function() { // sets up and configures the bot's nicknames and stuff after the API initializes and is ready
	writeLog( "User ID: " + bot.id + ", Bot User: " + bot.username, "Discord" )
	writeLog( "Add to your server using this link: ", "Discord" );
	writeLog( " https://discordapp.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=67160064", "Discord" );
	writeLog( "*** Bot ready! ***", "Discord" )
	bot.setPresence( {
		"game": {
			"name": configuration.currentGame
		}
	} );
	writeLog( "Reading settings file...", "TwitchNotifier" );
	const file = fs.readFileSync( "./twitchConfig.json", {
		encoding: "utf-8"
	} );
	twitchConfig = JSON.parse( file );
	// tick once on startup
	tickTwitchCheck();
	setInterval( tickTwitchCheck, configuration.twitch.interval * 1000 );
} )
bot.on( 'message', function( user, userId, channelId, message, event ) { // message handling system
	if ( bot.channels[ channelId ] == undefined ) {
		writeLog("Ignoring PM from "+user, "Discord", false)
		return
	}
	serverId = bot.channels[ channelId ][ "guild_id" ]
	server = bot.servers[ serverId ].name
	channel = "#" + bot.channels[ channelId ].name
	command = message.split( " ", 1 )
		.join( " " )
		.toLowerCase()
	argument = message.split( " " )
		.slice( 1 )
		.join( " " )
	writeLog( "<" + user + "> " + message, "Channel - " + server + "/" + channel, message.startsWith( configuration.commandPrefix ) ) // log everything to stdout, but log command usage to file
	if ( command == configuration.commandPrefix + 'ping' ) { // send a message to the channel as a ping-testing thing.
		bot.sendMessage( {
			to: channelId
			, message: ':heavy_check_mark: <@' + userId + '>: Pong!'
		} )
	} else if ( command == configuration.commandPrefix + 'ping-embed' ) { // send a embed to the channel as a ping-testing thing.
		bot.sendMessage( {
			to: channelId
			, 'embed': {
				'title': 'Pong!'
				, 'description': ':heavy_check_mark: Pong!'
				, 'color': 0x0a8bd6
				, 'url': 'https://github.com/DJArghlex/discord-twitch-bot'
				, 'fields': [ {
					'name': 'Hey ' + user + '!'
					, 'value': 'It works!'
					, 'inline': true
				} ]
			}
		}, function( err, resp ) {
			if ( err ) {
				bot.sendMessage( {
					to: channelId
					, message: ':sos: <@' + userId + '>: Embedded pong failed! Reason: `' + err + '` `' + resp + '`'
				} )
			}
		} )
	} else if ( command === configuration.commandPrefix + 'help' ) { // Help page
		const returnedEmbedObject = {
			footer: {
				icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/twitch-notifier.png"
				, text: botName + ' v' + botVersion + ' by ' + botAuthor
			}
			, author: {
				name: 'Help'
				, icon_url: "https://raw.githubusercontent.com/DJArghlex/twitch-notifier-bot/master/icons/help-page.png"
			}
			, title: 'Help Page'
			, description: '**' + botName + ' v' + botVersion + ' by ' + botAuthor + '** - Direct complaints to `/dev/null`\n    Source available on GitHub: <https://github.com/DJArghlex/discord-twitch-bot>\n    Support development by doing something nice for someone in your life\n    Add this bot to your server! <https://discordapp.com/oauth2/authorize?client_id=' + bot.id + '&scope=bot&permissions=67160064>'
			, fields: []
		};
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'help'
			, value: 'This output'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'ping'
			, value: 'Returns a pong'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + 'ping-embed'
			, value: 'Returns a fancy pong'
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + "addstream <twitch user>"
			, value: "Adds a Twitch stream to notify a channel with."
			, inline: true
		} );
		returnedEmbedObject.fields.push( {
			name: configuration.commandPrefix + "removestream <twitch user>"
			, value: "Removes a Twitch stream to check."
			, inline: true
		} );
		if ( userId.toString() === configuration.adminUserId ) {
			returnedEmbedObject.fields.push( {
				name: '__**Administrative Commands**__'
				, value: 'Only usable by <@' + configuration.adminUserId + ">"
			} );
			returnedEmbedObject.fields.push( {
				name: configuration.commandPrefix + "setTwitchNotifyChannel <channel ID>"
				, value: "Sets Twitch stream online/offline notifications channel"
				, inline: true
			} );
			returnedEmbedObject.fields.push( {
				name: configuration.commandPrefix + "forgetNotifyStatus"
				, value: "wipes twitchTempConfig for diagnostic purposes"
				, inline: true
			} );
			returnedEmbedObject.fields.push( {
				name: configuration.commandPrefix + 'restart'
				, value: 'Restarts the bot.'
				, inline: true
			} );
			returnedEmbedObject.fields.push( {
				name: configuration.commandPrefix + 'botmanagement help'
				, value: 'Bot Management Help Sub-page'
				, inline: true
			} );
		} else {
			returnedEmbedObject.fields.push( {
				name: "~~" + configuration.commandPrefix + "setTwitchNotifyChannel <string>~~"
				, value: "~~Sets Twitch stream online/offline notifications channel~~ (ask <@" + configuration.adminUserId + ">!)"
				, inline: true
			} );
		}
		bot.sendMessage( {
			to: channelId
			, embed: returnedEmbedObject
		} );
		writeLog( 'Sent help page', 'Discord' );
	} else if ( command == configuration.commandPrefix + "addstream" ) {
		try {
			streamManage( argument, "add", serverId, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId
					, "message": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId
				, message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ntwitchNotifier(): streamManage(add): `" + err + "`"
			} )
		}
	} else if ( command == configuration.commandPrefix + "removestream" ) {
		try {
			streamManage( argument, "remove", serverId, function( embeddedObject ) {
				bot.sendMessage( {
					to: channelId
					, "message": embeddedObject
				} )
			} )
		} catch ( err ) {
			bot.sendMessage( {
				to: channelId
				, message: ":sos: <@" + configuration.adminUserId + ">! An error occured:\ntwitchNotifier(): streamManage(remove): `" + err + "`"
			} )
		}
	} else if ( command === configuration.commandPrefix + 'restart' ) { // public
		writeLog( 'Restart command given by admin', 'Administrative' )
		bot.sendMessage( {
			to: channelId
			, message: ':wave:'
		}, function( error, response ) {
			writeLog( 'Restarting!', 'Shutdown' )
			process.exit( 0 )
		} )
	}
	if ( userId.toString() == configuration.adminUserId ) { //admin commands
		if ( command === configuration.commandPrefix + 'botmanagement' ) {
			try {
				botManagement( argument, embeddedObject => {
					bot.sendMessage( {
						to: channelId
						, embed: embeddedObject
					} );
				} );
				writeLog( 'BotAdmin ran botManagement('+argument+') successfully', 'Discord' )
			} catch ( err ) {
				bot.sendMessage( {
					to: channelId
					, message: '<@' + configuration.adminUserId + '>:\n:sos: **An error occured!**\n discordBotManage(): `' + err + '`'
				} )
				writeLog( err, 'Error' )
			}
		}
	}
} );

bot.on( 'disconnect', function( errMessage, code ) { // disconnect handling, reconnects unless shut down by restart
	writeLog( 'Disconnected from Discord! Code: ' + code + ', Reason: ' + errMessage, 'Error' )
	setTimeout(bot.connect, 15000) // waits 15 seconds before attempting to reconnect
} );

bot.once( 'ready', () => {
	bot.sendMessage( {
		to: configuration.channelId
		, message: ':ok: ' + botName + ' `v' + botVersion + '` by '+ botAuthor +' Back online! Type `' + configuration.commandPrefix + 'help` for a list of commands.'
	} );
} );
