---
name: connect-vpn
description: Connect to the company VPN through Tunnelblick on macOS. Use when the user asks to connect, start, or turn on the VPN, including "連 VPN", or when private-network operations fail.
---

# Connect VPN

Connect to company VPN using Tunnelblick via AppleScript.

## Steps

1. Connect:

```bash
osascript -e 'tell application "Tunnelblick" to connect "openvpn-non-oncall-sportydog.net"'
```

2. Wait 5 seconds, then verify:

```bash
osascript -e 'tell application "Tunnelblick" to get state of first configuration where name = "openvpn-non-oncall-sportydog.net"'
```

3. If result is `CONNECTED`, report success. Otherwise retry verification once after 5 more seconds. If still not connected, report failure.
