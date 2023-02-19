var MINRATING = 400;
var NEWLINE = new RegExp('\n', 'g');
var PREFIX = new RegExp('^(!|/)');
function main() {
    var onlineOnly = context.sharedStorage.get('discord-bridge.onlineonly', true);
    if (!onlineOnly || network.mode === 'server') {
        var socket_1 = network.createSocket();
        var name_1 = context.sharedStorage.get('discord-bridge.name', null);
        var guild_1 = context.sharedStorage.get('discord-bridge.guild', null);
        var channel_1 = context.sharedStorage.get('discord-bridge.channel', null);
        var port_1 = context.sharedStorage.get('discord-bridge.port', 35711);
        var host_1 = context.sharedStorage.get('discord-bridge.host', '127.0.0.1');
        var connectionMessages_1 = context.sharedStorage.get('discord-bridge.connectionMessages', false);
        var showChatCommands_1 = context.sharedStorage.get('discord-bridge.showChatCommands', false);
        var status_1 = {
            parkRating: false
        };
        var reconnect_1 = false;
        var connect_1 = function () {
            console.log("Attempting to connect to ".concat(host_1, ":").concat(port_1));
            socket_1.connect(port_1, host_1, doNothing);
        };
        var leavejoin_1 = function (type, player) {
            socket_1.write(JSON.stringify({
                type: 'connect',
                body: {
                    player: getPlayer(player).name,
                    type: type
                }
            }));
        };
        socket_1.on('close', function (_) { return reconnect_1 = true; });
        socket_1.on('error', function (_) { return reconnect_1 = true; });
        socket_1.on('data', function (data) {
            var msg = JSON.parse(data);
            if (msg.type === 'handshake') {
                console.log('Connected.');
                reconnect_1 = false;
                if (name_1 || guild_1 || channel_1 || connectionMessages_1) {
                    var body = {};
                    if (name_1) {
                        body['name'] = name_1;
                    }
                    if (guild_1) {
                        body['guild'] = guild_1;
                    }
                    if (channel_1) {
                        body['channel'] = channel_1;
                    }
                    if (connectionMessages_1) {
                        body['connectionMessages'] = connectionMessages_1;
                    }
                    socket_1.write(JSON.stringify({
                        type: 'handshake',
                        body: body
                    }));
                }
            }
            else if (msg.type === 'chat') {
                network.sendMessage("{PALELAVENDER}".concat(('origin' in msg.body) ? "(".concat(msg.body.origin, ") ") : '').concat(msg.body.author, ": {WHITE}").concat(msg.body.content.replace(NEWLINE, '{NEWLINE}')));
            }
        });
        context.subscribe('interval.day', function () {
            if (reconnect_1) {
                connect_1();
            }
            var ratingCheck = park.rating > MINRATING;
            if (status_1.parkRating && !ratingCheck) {
                socket_1.write(JSON.stringify({
                    type: 'message',
                    body: "Park rating dropped below ".concat(MINRATING)
                }));
            }
            status_1.parkRating = ratingCheck;
        });
        context.subscribe('network.join', function (e) {
            leavejoin_1('join', e.player);
        });
        context.subscribe('network.leave', function (e) {
            leavejoin_1('leave', e.player);
        });
        if (network.mode === 'server') {
            context.subscribe('network.chat', function (e) {
                if ((showChatCommands_1 || !e.message.match(PREFIX)) && e.player !== 0) {
                    socket_1.write(JSON.stringify({
                        type: 'chat',
                        body: {
                            author: getPlayer(e.player).name,
                            content: e.message
                        }
                    }));
                }
            });
        }
        connect_1();
    }
}
function getPlayer(playerID) {
    if (playerID === -1) {
        return null;
    }
    var player = null;
    var players = network.players;
    for (var _i = 0, players_1 = players; _i < players_1.length; _i++) {
        var p = players_1[_i];
        if (p.id === playerID) {
            player = p;
        }
    }
    return player;
}
function doNothing() {
}
registerPlugin({
    name: 'discord-bridge',
    version: '2.1.1',
    authors: ['Cory Sanin'],
    type: 'remote',
    licence: 'MIT',
    minApiVersion: 24,
    targetApiVersion: 65,
    main: main
});
