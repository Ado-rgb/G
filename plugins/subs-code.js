const { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = (await import("@whiskeysockets/baileys"))
import qrcode from "qrcode"
import fs from "fs"
import path from "path"
import pino from "pino"
import * as ws from "ws"
import chalk from "chalk"
import { makeWASocket } from "../lib/simple.js"

const { CONNECTING } = ws
const TEMP_DIR = "./temp"
const SOCKETS_DIR = "./Sockets"

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
if (!fs.existsSync(SOCKETS_DIR)) fs.mkdirSync(SOCKETS_DIR, { recursive: true })

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let id = `${m.sender.split`@`[0]}`
    let tempPath = path.join(TEMP_DIR, id)

    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(tempPath)
    let { version } = await fetchLatestBaileysVersion()

    let sock = makeWASocket({
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        browser: ["SubBot", "Chrome", "1.0.0"],
        version
    })

    sock.ev.on("connection.update", async ({ connection, qr }) => {
        if (qr && command === "qr") {
            await conn.sendMessage(m.chat, {
                image: await qrcode.toBuffer(qr, { scale: 8 }),
                caption: "Escanea este QR para vincular tu cuenta."
            }, { quoted: m })
        }

        if (qr && command === "code") {
            let code = await sock.requestPairingCode(m.sender.split`@`[0])
            code = code.match(/.{1,4}/g)?.join("-")
            await m.reply(`Código de emparejamiento:\n\n${code}`)
        }

        if (connection === "open") {
            let finalPath = path.join(SOCKETS_DIR, id)
            if (!fs.existsSync(finalPath)) fs.mkdirSync(finalPath, { recursive: true })

            // Mover credenciales a Sockets
            for (let file of fs.readdirSync(tempPath)) {
                fs.renameSync(path.join(tempPath, file), path.join(finalPath, file))
            }
            fs.rmdirSync(tempPath, { recursive: true })

            console.log(chalk.green(`Sub-Bot ${id} conectado y guardado en ${finalPath}`))
        }
    })

    sock.ev.on("creds.update", saveCreds)
}

handler.help = ["qr", "code"]
handler.tags = ["serbot"]
handler.command = ["qr", "code"]

export default handler