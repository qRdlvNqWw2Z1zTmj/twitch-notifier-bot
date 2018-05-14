# configuration

# example file
```json
{
	"configuration": {
		"commandPrefix": "!",
		"logfile": "./discord-twitch-bot.log",
		"authToken": "discord bot user's auth token",
		"adminUserId": "your discord user ID",
		"channelId": "discord channel id to notify when bot comes online", 
		"serverId": "not used, recommended to set to above channel's owning server",
		"nickname": "Example Twitch Notifier Bot",
		"currentGame": "Twitch Simulator 2018", 
		"twitch": {
			"interval": 300,
			"token": "your bot's twitch application's token"
		}
	}
}
```

## detailed descriptions
`commandPrefix`: a single character that you put in front of your command that is used to control the bot. List commands with the `<commandPrefix>help` command

`logfile`: a file where the bot will log everything that isn't a message to a channel the bot is in (but it will still log them to console!)

`authToken`: discordapp bot user's auth token

`adminUserId`: your userID from discord. you'll need this to control most of the bot.

`channelId`: channel to put some messages to (the twitch notifier system will not use this! that's set in use with the bot, see help command output for more)

`serverId`: server ID of above channel, not used, but set it for future compatibility

`nickname`: Bot's nickname, set on successful bot connection to discord.

`currentGame`: what "game" the bot is currently playing. Please keep it within Discord's TOS, as it's visible to anyone who can interact with the bot. We don't want another NotSoBot incident

`twitch`: section of things that control the twitch interfacing system:

- `interval`: interval in seconds that the bot will poll twitch's interface. WARNING: THIS IS DONE ONCE FOR EVERY STREAMER THE BOT KNOWS OF (but not for every server's list of streamers) SO PLEASE SET THIS WITH GREAT CARE. I will not help you unless it's 60 seconds or above, and even then I offer no support if you've been blacklisted by Twitch for incorrectly accessing their APIs.

- `token`: your Twitch bot user's TOKEN (not the secret or the client ID, it's in your URL bar in your bot's app page on the Twitch Developer site)
    
