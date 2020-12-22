/// <reference path="../types/openrct2.d.ts" />

const MINRATING = 400;

function main() {
    let onlineOnly = context.sharedStorage.get('discord-bridge.onlineonly', true);
    if (!onlineOnly || network.mode === 'server') {
        let socket = network.createSocket();
        let name = context.sharedStorage.get('discord-bridge.name', null);
        let port = context.sharedStorage.get('discord-bridge.port', 35711);
        let host = context.sharedStorage.get('discord-bridge.host', '127.0.0.1');
        let status = {
            parkRating: false
        }
        let reconnect = false;
        let connect = () => {
            console.log(`Attempting to connect to ${host}:${port}`);
            socket.connect(port, host, doNothing);
        };
        socket.on('close', (hadError) => reconnect = true);
        socket.on('error', (hadError) => reconnect = true);
        socket.on('data', (data) => {
            let msg = JSON.parse(data);
            if(msg.type === 'handshake'){
                reconnect = false;
                if (name) {
                    socket.write(JSON.stringify({
                        type: 'id',
                        body: name
                    }));
                }
            }
            else if(msg.type === 'chat'){
                network.sendMessage(`${msg.body.author}: ${msg.body.content}`);
            }
        });

        context.subscribe('interval.day', () => {
            if(reconnect){
                connect();
            }

            let ratingCheck = park.rating > MINRATING;
            if(status.parkRating && !ratingCheck){
                socket.write(JSON.stringify({
                    type: 'message',
                    body: `Park rating dropped below ${MINRATING}`
                }));
            }
            status.parkRating = ratingCheck;
        })

        if (network.mode === 'server') {
            context.subscribe('network.chat', (e) => {
                if (e.message.substring(0,1) !== '!' && e.player !== 0) {
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
    version: '1.0.0',
    authors: ['Cory Sanin'],
    type: 'remote',
    licence: 'MIT',
    main
});