/// <reference path="../types/openrct2.d.ts" />

const MINRATING = 400;
const NEWLINE = new RegExp('\n', 'g');
const PREFIX = new RegExp('^(!|/)');

interface HandshakeBody {
    name?: string;
    guild?: string;
    channel?: string;
    connectionMessages?: string;
}

function main() {
    const onlineOnly = context.sharedStorage.get<boolean>('discord-bridge.onlineonly', true);
    if (!onlineOnly || network.mode === 'server') {
        const socket = network.createSocket();
        const name = context.sharedStorage.get<string | null>('discord-bridge.name', null);
        const guild = context.sharedStorage.get<string | null>('discord-bridge.guild', null);
        const channel = context.sharedStorage.get<string | null>('discord-bridge.channel', null);
        const port = context.sharedStorage.get<number>('discord-bridge.port', 35711);
        const host = context.sharedStorage.get<string>('discord-bridge.host', '127.0.0.1');
        const connectionMessages = context.sharedStorage.get('discord-bridge.connectionMessages', false);
        const showChatCommands = context.sharedStorage.get('discord-bridge.showChatCommands', false);
        const status = {
            parkRating: false
        }
        let reconnect = false;
        const connect = () => {
            console.log(`Attempting to connect to ${host}:${port}`);
            socket.connect(port, host, doNothing);
        };
        const leavejoin = (type: string, player: number) => {
            socket.write(JSON.stringify({
                type: 'connect',
                body: {
                    player: getPlayer(player)?.name,
                    type
                }
            }));
        };

        socket.on('close', _ => reconnect = true);
        socket.on('error', _ => reconnect = true);
        socket.on('data', (data) => {
            const msg = JSON.parse(data);
            if (msg.type === 'handshake') {
                console.log('Connected.');
                reconnect = false;
                if (name || guild || channel || connectionMessages) {
                    const body: HandshakeBody = {};
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

            const ratingCheck = park.rating > MINRATING;
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
                            author: getPlayer(e.player)?.name,
                            content: e.message
                        }
                    }));
                }
            });
        }

        connect();
    }
}

function getPlayer(playerID: number): Player | null {
    let player: Player | null = null;
    if (playerID === -1) {
        return player;
    }
    const players = network.players;
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
    version: '2.2.3',
    authors: ['Cory Sanin'],
    type: 'remote',
    licence: 'MIT',
    minApiVersion: 24,
    targetApiVersion: 110,
    main
});
