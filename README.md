# openrct2-discord-bridge

A plugin and Node app for OpenRCT2. Sends in-game chat to Discord and vice versa. Also sends alerts to Discord about various in-game events, such as the park rating dropping below a threshold for example.

## Setup

Modify config.json5 with the appropriate parameters and start the server/bot with `node index.js`. Make sure the plugin (`lib/discord-bridge.js`) is installed and start up an OpenRCT2 multiplayer server.

## Docker Setup

There are some additional steps for running this configuration in Docker. The plugin configuration needs to have the hostname set (see `config/openrct2/plugin.store.json` for an example). Then the OpenRCT2 configuration must be set to allow outbound traffic to the node server (see `config/openrct2/config.ini`). If you want to use Docker for both OpenRCT2 and the Discord bridge app, using Docker Compose can make your life a lot easier. See `docker-compose.yml` for an example on how that might look.
