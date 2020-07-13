#!/usr/bin/env osascript
set fullPathSafari to "/Applications/Safari Technology Preview.app"
tell application fullPathSafari to activate
delay 2
tell application "System Events"
    tell application process "Safari Technology Preview"
        keystroke "," using command down
        set frontmost to true
        tell window 1
            click button "Advanced" of toolbar 1
            delay 2
            set theCheckbox to checkbox 4 of group 1 of group 1 of it
            tell theCheckbox
                if not (its value as boolean) then click theCheckbox
            end tell
            delay 2
            keystroke "w" using command down
            delay 2
        end tell
        tell menu bar item "Develop" of menu bar 1
            click
            delay 2
            click menu item "Allow Remote Automation" of menu 1
            delay 2
        end tell
    end tell
end tell
tell application fullPathSafari to quit
