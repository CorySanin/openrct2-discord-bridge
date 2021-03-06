if (typeof (registerPlugin) === "undefined") {
    const fs = require('fs');
    const JSON5 = require('json5');
    const Server = require('net').Server;
    const Discord = require('discord.js');
    const server = new Server();
    const client = new Discord.Client();
    let clients = 0;

    fs.readFile('config/config.json5', (err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            let config = JSON5.parse(data);
            let connections = {};

            if (!('port' in config)) {
                config.port = 35711;
            }

            async function sendChatToDiscord(msg, channel = config.channel) {
                (await client.guilds.fetch(config.guild)).channels.resolve(channel).send(msg, {
                    disableMentions: 'all'
                });
            }

            function sendChatToOtherServers(msg, originServer) {
                let message = JSON.stringify(msg);
                for (conId in connections) {
                    if (connections[conId] !== originServer && connections[conId].channel === originServer.channel) {
                        connections[conId].socket.write(message);
                    }
                }
            }

            server.on('connection', (socket) => {
                clients++;
                let id = Date.now();
                let servername = 'unknown server';
                let conobj = connections[id] = {
                    socket,
                    channel: config.channel
                };
                socket.on('data', (data) => {
                    try {
                        let msg = JSON5.parse(data);
                        if (msg.type === 'id') { //deprecated
                            servername = msg.body.replace('(', '').replace(')', '');
                        }
                        else if (msg.type === 'handshake') {
                            if('name' in msg.body){
                                servername = msg.body.name.replace('(', '').replace(')', '');
                            }
                            if('channel' in msg.body){
                                conobj.channel = msg.body.channel;
                            }
                        }
                        else if (msg.type === 'chat') {
                            msg.body.origin = servername;
                            sendChatToDiscord(`**${msg.body.author}** *(${msg.body.origin})*\n${msg.body.content}`, conobj.channel);
                            sendChatToOtherServers(msg, conobj);
                        }
                        else if (msg.type === 'message') {
                            sendChatToDiscord(`*(${servername})*\n${msg.body}`, conobj.channel);
                        }
                    }
                    catch (ex) {
                        console.log(`Error parsing json: ${ex}\nInput json: ${data.toString()}`);
                    }
                });
                socket.on('close', had_error => {
                    clients--;
                    delete connections[id];
                });
                socket.write(JSON.stringify({
                    type: "handshake"
                }));
            });
            server.on('error', (err) => {
                console.log(err);
            });

            client.on('message', async msg => {
                if (!msg.author.bot && msg.guild) {
                    let message = {
                        type: 'chat',
                        body: {
                            author: msg.author.username,
                            content: msg.content
                        }
                    };
                    for (let conId in connections) {
                        if (connections[conId].channel === msg.channel.id) {
                            connections[conId].socket.write(JSON.stringify(message));
                        }
                    }
                }
            });

            client.on('ready', () => {
                console.log(`Bot logged in as ${client.user.username}`);
            });

            client.login(config.botToken);

            server.listen(config.port, '0.0.0.0', () => {
                console.log(`Discord Bridge server listening on ${config.port}`);
            });
        }
    });
}
