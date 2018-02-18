#!/bin/bash
service="discord-twitch-bot"
restartdelay=5
processname="node"
processargs="$service.js"
cd ~/$service
screen -wipe >/dev/null
case "$1" in
	start)
		echo "$service started." | wall
		while true; do
			$processname $processargs
			sleep $restartdelay
		done
		rm $service.pid
		echo "$service stopped."  | wall
	;;
	*)
		mypid=`cat ~/$service/$service.pid 2>/dev/null`
		if [ -n "$mypid" ]; then
			reallymypid=`ps ax | grep -v grep | grep $mypid`
			if [ -n "$reallymypid" ]; then
				echo "$service is already running, pid '$mypid'"
			else
				echo "$service stale pidfile found" | wall
				rm ~/$service/$service.pid
				$0
			fi
		else
			echo "Starting $service..."
			screen -t $service -dmS $service $0 start &
			echo $! > $service.pid
		fi
	;;
esac
