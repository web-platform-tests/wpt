#!/bin/bash
curl http://{{domains[]}}:{{ports[http][0]}}/fonts/Ahem.ttf > ~/Library/Fonts/Ahem.ttf
defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2JavaScriptCanOpenWindowsAutomatically -bool true
