#!/bin/zsh
# Run a JavaScript file in the active tab of Chrome's front window and print the result.
# Needs Chrome > View > Developer > Allow JavaScript from Apple Events.
# usage: chrome-js.sh script.js
JS=$(cat "$1")
osascript - "$JS" <<'AS'
on run argv
tell application "Google Chrome" to execute active tab of front window javascript (item 1 of argv)
end run
AS
