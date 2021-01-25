if (typeof (registerPlugin) === "undefined") {
    const fs = require('fs');
    const JSON5 = require('json5');
    const Server = require('net').Server;
    const Discord = require('discord.js');
    const server = new Server();
    const client = new Discord.Client();
    const DISCORDDESTINATIONSTRING = /^\(([^()]+)\)/g;
    const MESSAGEORIGINSTRING = /\*\(([^()]+)\)\*\n/g;
    let BOTMENTION = new RegExp(`^<@!?-1>`);
    let clients = 0;

    fs.readFile('config/config.json5', (err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            let config = JSON5.parse(data);
            let connections = {};
            let connectionsByName = {};

            if (!('port' in config)) {
                config.port = 35711;
            }

            async function sendChatToDiscord(msg) {
                (await client.guilds.fetch(config.guild)).channels.resolve(config.channel).send(msg, {
                    disableMentions: 'all'
                });
            }

            function sendChatToOtherServers(msg, originServer) {
                let message = JSON.stringify(msg);
                for (conid in connections) {
                    if (conid !== originServer) {
                        connections[conid].write(message);
                    }
                }
            }

            server.on('connection', (socket) => {
                clients++;
                let id = Date.now();
                connections[id] = socket;
                let servername = 'unknown server';
                socket.on('data', (data) => {
                    try {
                        let msg = JSON5.parse(data);
                        if (msg.type === 'id') {
                            servername = msg.body.replace('(', '').replace(')', '');
                            connectionsByName[servername] = socket;
                        }
                        else if (msg.type === 'chat') {
                            msg.body.origin = servername;
                            sendChatToDiscord(`**${msg.body.author}** *(${msg.body.origin})*\n${msg.body.content}`);
                        }
                        else if (msg.type === 'message') {
                            sendChatToDiscord(`*(${servername})*\n${msg.body}`);
                        }
                    }
                    catch (ex) {
                        console.log(`Error parsing json: ${ex}\nInput json: ${data.toString()}`);
                    }
                });
                socket.on('close', had_error => {
                    clients--;
                    delete connections[id];
                    delete connectionsByName[servername];
                });
                socket.write(JSON.stringify({
                    type: "handshake"
                }));
            });
            server.on('error', (err) => {
                console.log(err);
            });

            client.on('message', async msg => {
                if (!msg.author.bot && msg.guild && msg.channel.id === config.channel) {
                    let message = {
                        type: 'chat',
                        body: {
                            author: msg.author.username,
                            content: msg.content
                        }
                    };
                    if (msg.reference || msg.content.startsWith('(')) {
                        let server = null;
                        if (msg.reference) {
                            let repliedTo = msg;
                            while (repliedTo.reference) {
                                repliedTo = await msg.channel.messages.fetch(repliedTo.reference.messageID);
                            }
                            repliedTo = MESSAGEORIGINSTRING.exec(repliedTo.content);
                            if (repliedTo && repliedTo.length > 1) {
                                server = repliedTo[1];
                            }
                        }
                        else {
                            let repliedTo = DISCORDDESTINATIONSTRING.exec(msg.content);
                            if (repliedTo && repliedTo.length > 1) {
                                server = repliedTo[1];
                                message.body.content = msg.content.replace(DISCORDDESTINATIONSTRING, '').trim();
                            }
                        }
                        if (server && server in connectionsByName) {
                            connectionsByName[server].write(JSON.stringify(message));
                        }
                    }
                    else if(clients === 1 || msg.content.match(BOTMENTION)){
                        message.body.content = msg.content.replace(BOTMENTION, '').trim();
                        message = JSON.stringify(message);
                        for (conid in connections) {
                            connections[conid].write(message);
                        }
                    }
                }
            });

            client.on('ready', () => {
                BOTMENTION = new RegExp(`^<@!?${client.user.id}>`);
                console.log(`Bot logged in as ${client.user.username}`);
            });

            client.login(config.botToken);

            server.listen(config.port, '0.0.0.0', () => {
                console.log(`Discord Bridge server listening on ${config.port}`);
            });
        }
    });
}
