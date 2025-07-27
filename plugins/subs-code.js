import {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import crypto from 'crypto'
import fs from 'fs'
import pino from 'pino'
import NodeCache from 'node-cache'
import { makeWASocket } from '../lib/simple.js'

if (!(global.conns instanceof Array)) global.conns = []

let handler = async (m, { conn: _conn, args, usedPrefix, command }) => {
  let parent = args[0] && args[0] == 'plz' ? _conn : global.conn

  async function serbot() {
    const tmpFolder = './Sessions/TEMP'
    if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true })

    const authFolderB = crypto.randomBytes(10).toString('hex').slice(0, 8)
    const authPath = `${tmpFolder}/${authFolderB}`
    fs.mkdirSync(authPath, { recursive: true })

    if (args[0]) {
      try {
        const credsData = JSON.parse(Buffer.from(args[0], 'base64').toString('utf-8'))
        fs.writeFileSync(`${authPath}/creds.json`, JSON.stringify(credsData, null, '\t'))
      } catch (e) {
        await parent.reply(m.chat, '*Error: Credenciales inválidas*', m)
        return
      }
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    const msgRetryCounterCache = new NodeCache()
    const { version } = await fetchLatestBaileysVersion()
    let isConnected = false

    const connectionOptions = {
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      msgRetryCounterCache,
      version,
    }

    const conn = makeWASocket(connectionOptions)

    async function connectionUpdate(update) {
      const { connection } = update
      if (connection === 'open') {
        isConnected = true
        const finalPath = `./Sessions/Sockets/${authFolderB}`
        try {
          fs.renameSync(authPath, finalPath)
        } catch (e) {
          // Si la carpeta ya existe o error, solo ignora y sigue
        }
        global.conns.push(conn)
        await parent.reply(
          m.chat,
          '➪ *Conectado exitosamente con WhatsApp*\n\n*Nota:* Esto es temporal\nSi el Bot principal se reinicia o se desactiva, todos los sub bots también lo harán',
          m,
        )
      }

      if (connection === 'close' && !isConnected) {
        // No conectó, limpia carpeta temporal
        try {
          fs.rmSync(authPath, { recursive: true, force: true })
        } catch {}
      }
    }

    conn.connectionUpdate = connectionUpdate
    conn.ev.on('connection.update', connectionUpdate)
  }

  serbot()
}

handler.help = ['code']
handler.tags = ['subbots']
handler.command = ['code']
export default handler