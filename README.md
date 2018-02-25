# twitch-notifier-bot
Discord bot to notify multiple servers (in set channels) when a Twitch streamer goes live.

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

edit the rest of `config/default.json` to your liking, setting your IDs and everything properly

a side note: getting IDs for things requires you to turn on 'developer mode' in Discord, under the Appearance tab of User Settings

## operation

start it, join it to the servers you want it on (by using the url printed to the bot's console), then run the commands:

```!setTwitchNotifyChannel <channel ID>``` - pointing to a specific channel for twitch notifications to be posted to. THIS IS REQUIRED or the bot will not function on that server! Also, it can only be done by the bot administrator, currently (this will be changed to allow server OWNERS to use this command.)

```!addstream <twitch user>``` - use the username on the end of the URL of their stream, not their user ID or their capitalized version

known caveat: currently anyone and everyone can tell the bot to start monitoring a user for a stream, so locking it to only being able to read from a certain channel and only allowing certain roles to message the channel is the only way to properly lock it down. this will not be changed because relying on discord's permissions system is probably a bit wiser.

## todo

- setTwitchNotifyChannel server admin allowed to use

- setTwitchNotifyChannel warning for setting channel that allows `@everyone` to message there

- mixer support????

- ~~add/remove stream group-based permission~~ cancelled in favor of allowing a server admin to configure it without a bunch of mucking about

- online notification/add and remove stream commands locked to server's notify channel

- proper storage handling of streamer/server config