const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  makeInMemoryStore
} = await import('@whiskeysockets/baileys')
import moment from 'moment-timezone'
import NodeCache from 'node-cache'
import readline from 'readline'
import qrcode from "qrcode"
import crypto from 'crypto'
import fs from "fs"
import pino from 'pino'
import * as ws from 'ws'
const { CONNECTING } = ws
import { Boom } from '@hapi/boom'
import { makeWASocket } from '../lib/simple.js'

if (!(global.conns instanceof Array)) global.conns = []

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

let handler = async (m, { conn: _conn, args, usedPrefix, command, isOwner }) => {

  async function serbot() {
    let authFolderB = m.sender.split('@')[0]
    const userFolderPath = `./Sessions/Sockets/${authFolderB}`

    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true })
    }

    if (args[0]) {
      fs.writeFileSync(`${userFolderPath}/creds.json`,
        JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'))
    }

    const { state, saveCreds } = await useMultiFileAuthState(userFolderPath)
    const msgRetryCounterCache = new NodeCache()
    const { version } = await fetchLatestBaileysVersion()
    let phoneNumber = m.sender.split('@')[0]

    const methodCode = !!phoneNumber || process.argv.includes("code")
    const MethodMobile = process.argv.includes("mobile")

    const connectionOptions = {
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      mobile: MethodMobile,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async (clave) => {
        let jid = jidNormalizedUser(clave.remoteJid)
        let msg = await store.loadMessage(jid, clave.id)
        return msg?.message || ""
      },
      msgRetryCounterCache,
      msgRetryCounterMap: {},
      version
    }

    let conn = makeWASocket(connectionOptions)

    if (methodCode && !conn.authState.creds.registered) {
      let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '')
      setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(cleanedNumber)
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
        let txt = `┌  🜲  *Usa este Código para convertirte en un Sub Bot*\n`
        txt += `│  ❀  Pasos\n`
        txt += `│  ❀  *1* : Haga click en los 3 puntos\n`
        txt += `│  ❀  *2* : Toque dispositivos vinculados\n`
        txt += `│  ❀  *3* : Selecciona *Vincular con el número de teléfono*\n`
        txt += `└  ❀  *4* : Escriba el Codigo\n\n`
        txt += `*❖ Nota:* Este Código solo funciona en el número en el que se solicitó.`
        await _conn.reply(m.chat, txt, m)
        await _conn.reply(m.chat, codeBot, m)
      }, 3000)
    }

    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update
      const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

      if (connection === 'open') {
        global.conns.push(conn)
        await _conn.reply(m.chat, 'Conectado con éxito', m)
      }

      if (code && code !== DisconnectReason.loggedOut) {
        fs.rmSync(userFolderPath, { recursive: true, force: true })
        _conn.sendMessage(m.chat, { text: "Conexión perdida.." }, { quoted: m })
      }
    })

    conn.ev.on('creds.update', saveCreds)
  }

  serbot()
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code', 'Code']
handler.rowner = false

export default handler