import { Server, Socket } from "net";
import fs from 'fs';
import JSON5 from 'json5';
import Net from 'net';
import { Client, GatewayIntentBits, ThreadChannel } from 'discord.js';
import { escapeMarkdown } from '@discordjs/formatters';
import Emoji from './Emoji';
const Bun = require('bun');

type PluginPayload = HandhsakePayload | ChatPayload | MessagePayload | ConnectPayload;

interface ORCT2DiscordConfig {
    port: number;
    guild: string;
    channel: string;
    connectionMessages: boolean;
    botToken: string;
}

interface DiscordChatOptions {
    guild?: string;
    channel?: string;
}

interface ConnectionsMap {
    [key: string]: ConnectionObject;
}

interface ConnectionObject {
    socket: Socket;
    channel: string;
    guild: string;
    connectionMessages: boolean
}

interface HandhsakePayload {
    type: 'handshake';
    body: HandshakeBody;
}

interface ChatPayload {
    type: 'chat';
    body: ChatBody;
}

interface MessagePayload {
    type: 'message';
    body: string;
}

interface ConnectPayload {
    type: 'connect';
    body: ConnectBody;
}

interface HandshakeBody {
    name?: string;
    channel?: string;
    guild?: string;
    connectionMessages?: boolean;
}

interface ChatBody {
    author: string;
    content: string;
}

interface ConnectBody {
    player: string;
    type: 'leave' | 'join'
}

const UNHEALTHY_THRESHOLD = 5;
const emoji = new Emoji();
const server: Server = new Net.Server();
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
});
let clients = 0;

fs.readFile('config/config.json5', (err, data) => {
    if (err) {
        console.log(err);
    }
    else {
        let config: ORCT2DiscordConfig = JSON5.parse(data.toString());
        let connections: ConnectionsMap = {};
        let healthFactor = UNHEALTHY_THRESHOLD;

        config.port = config.port || 35711;

        function healthyAction(healthy: boolean = true): void {
            healthFactor = healthy ? Math.max(0, healthFactor - 1) : Math.min(UNHEALTHY_THRESHOLD << 1, healthFactor + 2);
        }

        async function sendChatToDiscord(msg: string, options: DiscordChatOptions = {}) {
            ((await client.guilds.fetch(options.guild || config.guild)).channels.resolve(options.channel || config.channel) as ThreadChannel).send(msg);
        }

        function sendChatToOtherServers(msg: PluginPayload, originServer: ConnectionObject) {
            let message = JSON.stringify(msg);
            for (let conId in connections) {
                if (connections[conId] !== originServer && connections[conId].channel === originServer.channel) {
                    connections[conId].socket.write(message);
                }
            }
        }

        server.on('connection', (socket: Socket) => {
            clients++;
            let id = Date.now();
            let servername = 'unknown server';
            let conobj: ConnectionObject = connections[id] = {
                socket,
                channel: config.channel,
                guild: config.guild,
                connectionMessages: config.connectionMessages
            };
            socket.on('data', (data) => {
                try {
                    let msg: PluginPayload = JSON5.parse(data.toString());
                    if (msg.type === 'handshake') {
                        if (msg.body.name) {
                            servername = msg.body.name.replace('(', '').replace(')', '');
                        }
                        conobj.channel = msg.body.channel || config.channel;
                        conobj.guild = msg.body.guild || config.guild;
                        conobj.connectionMessages = msg.body.connectionMessages || config.connectionMessages;
                    }
                    else if (msg.type === 'chat') {
                        sendChatToDiscord(`**${escapeMarkdown(msg.body.author)}** *(${servername})*\n${msg.body.content}`, conobj);
                        sendChatToOtherServers(msg, conobj);
                    }
                    else if (msg.type === 'message') {
                        sendChatToDiscord(`*(${servername})*\n${msg.body}`, conobj);
                    }
                    else if (conobj.connectionMessages && msg.type === 'connect') {
                        sendChatToDiscord(`*(${servername})*\n${escapeMarkdown(msg.body.player)} has ${msg.body.type == 'leave' ? 'left' : 'joined'}.`, conobj);
                    }
                    healthyAction();
                }
                catch (ex) {
                    console.log(`Error parsing json: ${ex}\nInput json: ${data.toString()}`);
                    healthyAction(false);
                }
            });
            socket.on('close', _ => {
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

        client.on('messageCreate', async msg => {
            if (!msg.author.bot && msg.guild) {
                let message = {
                    type: 'chat',
                    body: {
                        author: msg.author.username,
                        content: (msg.stickers.size) ? `sent a sticker- "${msg.stickers.first()?.name}"` : emoji.emojiToText(msg.cleanContent)
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
            console.log(`Bot logged in as ${client.user?.username}`);
            healthFactor = 0;
        });

        client.on('error', err => {
            console.error('error', err);
            healthyAction(false);
        });

        client.login(config.botToken);

        server.listen(config.port, '0.0.0.0', () => {
            console.log(`Discord Bridge server listening on ${config.port}`);
        });

        const healthcheckServer = Bun.serve({
            fetch() {
                const healthy = healthFactor < UNHEALTHY_THRESHOLD;
                return healthy ? new Response('Healthy \u{1F642}') : new Response('Unhealthy \u{1F641}', {
                    status: 500
                });
            }
        });

        process.on('SIGTERM', () => {
            client.destroy();
            server.close();
            healthcheckServer.stop();
        });
    }
});
