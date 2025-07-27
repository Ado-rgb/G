import {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import crypto from 'crypto'
import fs from 'fs'
import pino from 'pino'
import NodeCache from 'node-cache'
import { makeWASocket } from '../lib/simple.js'

if (!(global.conns instanceof Array)) global.conns = []

let handler = async (m, { conn: _conn }) => {
  const parent = global.conn

  async function serbot() {
    const tmpFolder = './Sessions/TEMP'
    if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true })

    const authFolderB = crypto.randomBytes(10).toString('hex').slice(0, 8)
    const authPath = `${tmpFolder}/${authFolderB}`
    fs.mkdirSync(authPath, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    const msgRetryCounterCache = new NodeCache()
    const { version } = await fetchLatestBaileysVersion()

    const conn = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      msgRetryCounterCache,
      version
    })

    let moved = false

    conn.ev.on('connection.update', async (update) => {
      const { connection } = update

      if (connection === 'open' && !moved) {
        moved = true
        try {
          const finalPath = `./Sessions/Sockets/${authFolderB}`
          fs.renameSync(authPath, finalPath)
        } catch {}
        global.conns.push(conn)
      }

      if (connection === 'close' && !moved) {
        try { fs.rmSync(authPath, { recursive: true, force: true }) } catch {}
      }
    })

    if (!state.creds.registered) {
      try {
        let number = m.sender.split('@')[0]
        if (!number.startsWith('504')) number = '504' + number
        if (!number.startsWith('+')) number = '+' + number // añade +

        const code = await conn.requestPairingCode(number)
        const formatted = code.match(/.{1,4}/g).join('-')

        let txt = `➪ *Código para convertirte en SubBot*\n\n`
        txt += `┌─── ✩ *Instrucciones* ✩ ───\n`
        txt += `│ 1. En WhatsApp toca *Menú*\n`
        txt += `│ 2. Selecciona *Dispositivos vinculados*\n`
        txt += `│ 3. Elige *Vincular un dispositivo*\n`
        txt += `│ 4. Ingresa este código:\n`
        txt += `│\n│    *${formatted}*\n`
        txt += `└───────────────────────────\n\n`
        txt += `*Nota:* Solo funciona en este número`

        await parent.sendMessage(m.sender, { text: txt }) // Solo a quien pidió .code
      } catch (e) {
        await parent.reply(m.chat, 'Error al generar código, revisa tu número', m)
      }
    }
  }

  serbot()
}

handler.help = ['code']
handler.tags = ['subbots']
handler.command = ['code']
export default handler