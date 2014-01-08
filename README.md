Google Calendar API's based AlarmClock 
===============

An Alarm Clock for RaspberryPi, using the Google Calendar API, based on NodeJS

[![Build Status](https://travis-ci.org/sandhose/gapi-alarmclock.png?branch=master)](https://travis-ci.org/sandhose/gapi-alarmclock)

===============

## Install

````sh
# First, clone the repo
git clone https://github.com/sandhose/gapi-alarmclock.git
cd gapi-alarmclock
# Then, install the dependicies
(sudo) npm install
# Install grunt-cli (if needed)
(sudo) npm install -g grunt-cli
# Build the client
grunt build
# And run the app!
node app
````

You can quit the app by sending `SIGINT` (*Ctrl + C*), or by sending a GET HTTP request to `http://[host]:9000/api/system/exit`

## Usage

At this time, there is no real interface, only an API.

````
GET  /api/google/oauth-url       -> return the connection url
GET  /api/google/calendar/list   -> return calendar list
POST /api/google/calendar        -> set current calendar (with post param {id: the calendar id})
GET  /api/google/calendar        -> get current calendar info
GET  /api/google/events          -> get next events on calendar
GET  /api/google/events/today    -> get today first events on calendar
GET  /api/google/events/tomorrow -> get tomorrow first events on calendar
````
