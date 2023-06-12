#!/usr/bin/python3

import sys
import time
import telepot
import json
import requests
import subprocess

with open("/etc/mupibox/mupiboxconfig.json") as file:
    config = json.load(file)

url = 'http://mupibox:5005/local'
state = requests.get(url).json()

TOKEN = config['telegram']['token']
bot = telepot.Bot(TOKEN)
chat_id = config['telegram']['chatId']

while state['playing']:
    msg = state['album'] + "\n" + state['currentTrackname'] + "\nTrack: " + str(state['currentTracknr']) + "/" + str(state['totalTracks'])
    bot.sendMessage(chat_id, msg)
    subprocess.run(["sudo", "rm", "/tmp/telegram_screen.png"])
    subprocess.run(["sudo", "DISPLAY=:0", "scrot", "/tmp/telegram_screen.png"])
    bot.sendPhoto(chat_id, open('/tmp/telegram_screen.png', 'rb'))
    time.sleep(60)
    state = requests.get(url).json()
    







