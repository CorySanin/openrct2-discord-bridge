# openrct2-discord-bridge
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/CorySanin/openrct2-discord-bridge/docker-image.yml)](https://github.com/CorySanin/openrct2-discord-bridge/actions)
[![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/CorySanin/openrct2-discord-bridge)](https://github.com/CorySanin/openrct2-discord-bridge)
[![GitHub Release](https://img.shields.io/github/v/release/CorySanin/openrct2-discord-bridge)](https://github.com/CorySanin/openrct2-discord-bridge/releases/latest)
[![GitHub Release Date](https://img.shields.io/github/release-date-pre/CorySanin/openrct2-discord-bridge)](https://github.com/CorySanin/openrct2-discord-bridge/releases/latest)
[![GitHub Repo stars](https://img.shields.io/github/stars/CorySanin/openrct2-discord-bridge?style=flat)](https://github.com/CorySanin/openrct2-discord-bridge)
[![Docker Pulls](https://img.shields.io/docker/pulls/corysanin/openrct2-discord-bridge)](https://hub.docker.com/r/corysanin/openrct2-discord-bridge)
[![GitHub](https://img.shields.io/github/license/CorySanin/openrct2-discord-bridge)](/LICENSE)
[![Discord](https://img.shields.io/discord/225989349949308928?label=Discord)](https://ffa-tycoon.com/discord)

A plugin and Node app for OpenRCT2. Sends in-game chat to Discord and vice versa. Also sends alerts to Discord about various in-game events, such as the park rating dropping below a threshold for example.

## Setup

Modify config.json5 with the appropriate parameters and start the server/bot with `node index.js`. Make sure the plugin (`lib/discord-bridge.js`) is installed and start up an OpenRCT2 multiplayer server.

## Docker Setup

There are some additional steps for running this configuration in Docker. The plugin configuration needs to have the hostname set (see `config/openrct2/plugin.store.json` for an example). Then the OpenRCT2 configuration must be set to allow outbound traffic to the node server (see `config/openrct2/config.ini`). If you want to use Docker for both OpenRCT2 and the Discord bridge app, using Docker Compose can make your life a lot easier. See `docker-compose.yml` for an example on how that might look.
