if (typeof (registerPlugin) === "undefined") {
    const fs = require('fs');
    const JSON5 = require('json5');
    const Server = require('net').Server;
    const Discord = require('discord.js');
    const server = new Server();
    const client = new Discord.Client();

    fs.readFile('config/config.json5', (err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            let config = JSON5.parse(data);
            let connections = {};

            async function sendChatToDiscord(msg) {
                (await client.guilds.fetch(config.guild)).channels.resolve(config.channel).send(msg, {
                    disableMentions: 'all'
                });
            }

            server.on('connection', (socket) => {
                let id = Date.now();
                connections[id] = socket;
                let servername = 'unknown server';
                socket.on('data', (data) => {
                    let msg = JSON5.parse(data);
                    if (msg.type === 'id') {
                        servername = msg.body.replace('(','').replace(')', '');
                        connections[servername] = socket;
                    }
                    else if (msg.type === 'chat') {
                        sendChatToDiscord(`**${msg.body.author}** *(${servername})*\n${msg.body.content}`);
                    }
                    else if (msg.type === 'message') {
                        sendChatToDiscord(`*(${servername})*\n${msg.body}`);
                    }
                });
                socket.on('close', had_error => {
                    delete connections[id];
                    delete connections[server];
                })
            });
            server.on('error', (err) => {
                console.log(err);
            });

            client.on('message', async msg => {
                if (!msg.author.bot && msg.guild && msg.channel.id === config.channel) {
                    let message = JSON.stringify({
                        type: 'chat',
                        body: {
                            author: msg.author.username,
                            content: msg.content
                        }
                    });
                    if (msg.reference || msg.content.startsWith('(')) {
                        let server = null;
                        if(msg.reference){
                            let repliedTo = await msg.channel.messages.fetch(msg.reference.messageID);
                            repliedTo = /\*\(([^()]+)\)\*\n/g.exec(repliedTo.content);
                            if(repliedTo && repliedTo.length > 1){
                                server = repliedTo[1];
                            }
                        }
                        else{
                            let repliedTo = /\(([^()]+)\)/g.exec(msg.content);
                            if(repliedTo && repliedTo.length > 1){
                                server = repliedTo[1];
                            }
                        }
                        if(server && server in connections){
                            connections[server].write(message);
                        }
                    }
                    else {
                        for (conid in connections) {
                            connections[conid].write(message);
                        }
                    }
                }
            });

            client.login(config.botToken);

            server.listen(config.port, () => {
                console.log(`Discord Bridge server listening on ${config.port}`);
            });
        }
    });
}