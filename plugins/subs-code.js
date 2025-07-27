import {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    MessageRetryMap,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} from '@whiskeysockets/baileys'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'
import readline from 'readline'
import qrcode from "qrcode"
import crypto from 'crypto'
import fs from "fs"
import pino from 'pino';
import * as ws from 'ws';
const { CONNECTING } = ws
import { Boom } from '@hapi/boom'
import { makeWASocket } from '../lib/simple.js';

if (!(global.conns instanceof Array)) global.conns = []

let handler = async (m, { conn: _conn, args, usedPrefix, command }) => {
    let parent = args[0] && args[0] == 'plz' ? _conn : await global.conn

    async function serbot() {
        const tmpFolder = "./Sessions/TEMP"
        if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true })

        const authFolderB = crypto.randomBytes(10).toString('hex').slice(0, 8)
        const authPath = `${tmpFolder}/${authFolderB}`

        fs.mkdirSync(authPath, { recursive: true })

        if (args[0]) {
            fs.writeFileSync(`${authPath}/creds.json`, JSON.stringify(
                JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")),
                null,
                '\t'
            ))
        }

        const { state, saveState, saveCreds } = await useMultiFileAuthState(authPath)
        const msgRetryCounterCache = new NodeCache()
        const { version } = await fetchLatestBaileysVersion();
        let phoneNumber = m.sender.split('@')[0]

        const connectionOptions = {
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            msgRetryCounterCache,
            version
        }

        let conn = makeWASocket(connectionOptions)

        conn.isInit = false
        let isConnected = false

        async function connectionUpdate(update) {
            const { connection, isNewLogin } = update

            if (connection === 'open') {
                isConnected = true
                conn.isInit = true
                global.conns.push(conn)

                // Ahora sí movemos la sesión a Sockets
                const finalPath = `./Sessions/Sockets/${authFolderB}`
                fs.renameSync(authPath, finalPath)

                await parent.reply(m.chat, 'Conectado exitosamente con WhatsApp\n\n*Nota:* Esto es temporal\nSi el Bot principal se reinicia o se desactiva, todos los sub bots también lo harán', m)
            }

            if (connection === 'close' && !isConnected) {
                // Si nunca se conetó, limpiamos la carpeta temporal
                fs.rmSync(authPath, { recursive: true, force: true })
            }
        }

        conn.connectionUpdate = connectionUpdate
        conn.ev.on('connection.update', conn.connectionUpdate)
    }

    serbot()
}

handler.help = ['code']
handler.tags = ['subbots']
handler.command = ['code']
export default handler