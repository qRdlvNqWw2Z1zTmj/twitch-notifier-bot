# twitch-notifier-bot
Discord bot to notify multiple servers (in set channels) when a Twitch streamer goes live. Uses some code (and principles) from (<https://github.com/fuyuneko/discord-twitch-bot>)[fuyuneko's bot]

## installation

needs to be run on a linux machine (with bash and screen installed) for restart capability but can run anywhere nodejs and dependencies function properly.

install your dependencies:

```npm install Woor/discord.io#gateway_v6 https config```


## configuration

create an application and a bot user for your bot at discord: https://discordapp.com/developers/applications/me

register an application for your bot at twitch: https://dev.twitch.tv/dashboard/apps

copy the bot user's token form discord into `config/default.json`

and the ***token*** (not the client id or the secret!) to the twitch section in `config/default.json`

it's recommended (and required if you want support from me) that you keep the interval for checking above 60 seconds to prevent spamming twitch's API too heavily

edit the rest of `config/default.json` to your liking, setting your channel and user IDs and everything else properly

a side note: getting IDs for things requires you to turn on 'developer mode' in Discord, under the Appearance tab of User Settings. with this enabled, most things (channels, servers, users) will have an extra selection in their right-click menu you can get the IDs from.

## operation

start it, join it to the servers you want it on (by using the url printed to the bot's console), then run the commands:

```!setTwitchNotifyChannel <channel ID>``` - pointing to a specific channel for twitch notifications to be posted to. THIS IS REQUIRED or the bot will not function on that server! Also, it can only be done by the bot administrator, currently (this will be changed to allow server OWNERS to use this command.) **you have to specify the ID, not the fancy link to the channel. this is because i am terrible at making things user-friendly**

```!addstream <twitch user>``` - use the username on the end of the URL of their stream, not their user ID or their custom capitalized version or whatever

known caveat: currently anyone and everyone can tell the bot to start monitoring a user for a stream, so locking it to only being able to read from a certain channel and only allowing certain roles to message the channel is the only way to properly lock it down. this will not be changed because relying on discord's permissions system is probably a bit wiser.

## todo

(<https://github.com/DJArghlex/twitch-notifier-bot/issues/3>)[see #3]
