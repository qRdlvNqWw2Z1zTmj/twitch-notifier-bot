# new-ed-info

Discord bot to notify multiple servers (in set channels) when a Twitch streamer goes live. Uses some code (and principles) from [fuyuneko's bot](<https://github.com/fuyuneko/discord-twitch-bot>)

## Features

- Active development! Wow!
- Actual functionality!
- Friendly to Twitch APIs, even if they're not!
- Free!
- Open-sourced and auditable by the end user!
- Did I mention? It's free! Apparently I've got the market cornered!

## Installation

**If this is too much horsing around for a single Discord bot, I run an instance of the bot myself. [Here's the invite link.](<https://discordapp.com/oauth2/authorize?client_id=411338896178282499&scope=bot&permissions=104321088>) AS SOON AS YOU GET IT INVITED INTO YOUR SERVER, PLEASE CONTACT ME FOR THE FINAL SETUP PROCESS. This will no longer be required when I finally get around to implementing the Discord permissions support in the next major version. Keep an eye on this repository for news on that particular front.**

1. Install basic system utilities

You need tmux or screen, and bash. That's pretty much it.

2. Install node

https://nodejs.org/en/download/current/

*Note: I run the bot under the latest releases (at time of writing that is v10.9.0) of node, but the LTS release should do just fine.*

3. Install your dependencies:

```npm install Woor/discord.io#gateway_v6 config https```

Uses the following libraries:
- [Woor's fork of izy521's `discord.io`](<https://github.com/Woor/discord.io/tree/gateway_v6>)
- [`config`](<https://www.npmjs.com/package/config>)
- [`https`](<https://www.npmjs.com/package/https>)
- node's internal library `fs`
- node's internal library `path`

## Configuration

1. Create an application **and a bot user** for your bot at [Discord's developer applications portal](<https://discordapp.com/developers/applications/me>) then copy in the token to the bot's configuration.

2. Twitch
- Register an application for your bot at twitch: https://dev.twitch.tv/dashboard/apps
- Copy the ***token*** (not the client id or the secret!) to the twitch section in `config/default.json`
- Keep the interval for checking above 60 seconds to prevent spamming twitch's API too heavily. If you have it set any lower than that, you will not see support of any kind from me.



3. Edit the rest of `config/default.json` to your liking, setting your channel and user IDs, nicknames, current game and everything else properly.

*Note: Getting IDs for things requires you to turn on 'developer mode' in Discord, under the Appearance tab of User Settings. With this enabled, most things (channels, servers, users) will have an extra selection in their right-click menu you can get the IDs from.*

## Operation
1. Start it in a detachable screen/tmux session, using `nodejs discord-twitch-bot.js` inside your multiplexer of choice.
2. Join it to the servers you want it on (by using the url printed to the bot's console)
3. Configure its permissions, making sure it can only recieve messages from those you trust not to mess with the subscribed streams list
4. Run the commands:
- ```!setTwitchNotifyChannel <channel ID>``` - Make sure the ID here is pointing to a specific channel for Twitch notifications to be posted to. THIS IS REQUIRED or the bot will not function on that server, regardless of how many times you tell it to add or remove streamers from its list! Also, it can only be done by the bot administrator. (This will be improved, and allow anyone with the Administrator permission in Discord to mess with it.) **You have to specify the ID, not the fancy link to the channel.**
- ```!addstream <twitch user>``` - Use the username on the end of the URL of their stream, not their user ID or their custom capitalized version.
5. ~~screech in anger/horror/revulsion as Twitch's APIs cause it to crash repeatedly~~
6. You're good to go!

*Known caveat: currently the bot has no way of checking for administrative permissions on Discord, so anyone who shares a channel and can message to that channel with the bot in it can control the subscribed streamers list. This will be corrected in the next major version of the bot.* 

See the `!help` and `!botmanagement help` commands for further usage.

## [To-do](<https://github.com/DJArghlex/twitch-notifier-bot/issues?q=label%3Aenhancement+>)
