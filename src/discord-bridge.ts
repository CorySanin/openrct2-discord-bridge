/// <reference path="../types/openrct2.d.ts" />

const MINRATING = 400;
const NEWLINE = new RegExp('\n', 'g');
const PREFIX = new RegExp('^(!|/)');

function main() {
    let onlineOnly = context.sharedStorage.get('discord-bridge.onlineonly', true);
    if (!onlineOnly || network.mode === 'server') {
        let socket = network.createSocket();
        let name = context.sharedStorage.get('discord-bridge.name', null);
        let guild = context.sharedStorage.get('discord-bridge.guild', null);
        let channel = context.sharedStorage.get('discord-bridge.channel', null);
        let port = context.sharedStorage.get('discord-bridge.port', 35711);
        let host = context.sharedStorage.get('discord-bridge.host', '127.0.0.1');
        let connectionMessages = context.sharedStorage.get('discord-bridge.connectionMessages', false);
        let showChatCommands = context.sharedStorage.get('discord-bridge.showChatCommands', false);
        let status = {
            parkRating: false
        }
        let reconnect = false;
        let connect = () => {
            console.log(`Attempting to connect to ${host}:${port}`);
            socket.connect(port, host, doNothing);
        };
        let leavejoin = (type, player) => {
            socket.write(JSON.stringify({
                type: 'connect',
                body: {
                    player: getPlayer(player).name,
                    type
                }
            }));
        };

        socket.on('close', _ => reconnect = true);
        socket.on('error', _ => reconnect = true);
        socket.on('data', (data) => {
            let msg = JSON.parse(data);
            if (msg.type === 'handshake') {
                console.log('Connected.');
                reconnect = false;
                if (name || guild || channel || connectionMessages) {
                    let body = {};
                    if (name) {
                        body['name'] = name;
                    }
                    if (guild) {
                        body['guild'] = guild;
                    }
                    if (channel) {
                        body['channel'] = channel;
                    }
                    if (connectionMessages) {
                        body['connectionMessages'] = connectionMessages;
                    }

                    socket.write(JSON.stringify({
                        type: 'handshake',
                        body
                    }));
                }
            }
            else if (msg.type === 'chat') {
                network.sendMessage(`{PALELAVENDER}${('origin' in msg.body) ? `(${msg.body.origin}) ` : ''}${msg.body.author}: {WHITE}${msg.body.content.replace(NEWLINE, '{NEWLINE}')}`);
            }
        });

        context.subscribe('interval.day', () => {
            if (reconnect) {
                connect();
            }

            let ratingCheck = park.rating > MINRATING;
            if (status.parkRating && !ratingCheck) {
                socket.write(JSON.stringify({
                    type: 'message',
                    body: `Park rating dropped below ${MINRATING}`
                }));
            }
            status.parkRating = ratingCheck;
        });

        context.subscribe('network.join', (e) => {
            leavejoin('join', e.player);
        });

        context.subscribe('network.leave', (e) => {
            leavejoin('leave', e.player);
        });

        if (network.mode === 'server') {
            context.subscribe('network.chat', (e) => {
                if ((showChatCommands || !e.message.match(PREFIX)) && e.player !== 0) {
                    socket.write(JSON.stringify({
                        type: 'chat',
                        body: {
                            author: getPlayer(e.player).name,
                            content: e.message
                        }
                    }));
                }
            });
        }

        connect();
    }
}

function getPlayer(playerID: number): Player {
    if (playerID === -1) {
        return null;
    }
    var player: Player = null;
    var players = network.players;
    for (const p of players) {
        if (p.id === playerID) {
            player = p;
        }
    }
    return player;
}

function doNothing() {
    //Done!
}

registerPlugin({
    name: 'discord-bridge',
    version: '2.1.1',
    authors: ['Cory Sanin'],
    type: 'remote',
    licence: 'MIT',
    minApiVersion: 24,
    targetApiVersion: 65,
    main
});
