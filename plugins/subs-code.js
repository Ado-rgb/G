import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import pino from 'pino'
import NodeCache from 'node-cache'
import readline from 'readline'
import { Boom } from '@hapi/boom'
import * as ws from 'ws'
import moment from 'moment-timezone'
import qrcode from 'qrcode'
import { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  MessageRetryMap, 
  makeCacheableSignalKeyStore, 
  jidNormalizedUser 
} from '@whiskeysockets/baileys'
import { makeWASocket } from '../lib/simple.js'

const { CONNECTING } = ws

// Definir globalThis.jadi si no existe
if (!globalThis.jadi) globalThis.jadi = path.join('.', 'Sessions', 'Sockets')
// Crear carpeta si no existe
if (!fs.existsSync(globalThis.jadi)) fs.mkdirSync(globalThis.jadi, { recursive: true })

if (!global.conns) global.conns = []

let handler = async (m, { conn: _conn, args, usedPrefix, command }) => {
  let parent = args[0] && args[0] == 'plz' ? _conn : await global.conn

  async function serbot() {
    // Generar id random para la carpeta de sesión
    let authFolderB = crypto.randomBytes(5).toString('hex').slice(0, 8)
    let authPath = path.join(globalThis.jadi, authFolderB)

    // Crear carpeta sesión si no existe
    if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true })

    // Si envían creds base64, guardarlas para login sin QR
    if (args[0]) {
      try {
        const credsData = JSON.parse(Buffer.from(args[0], 'base64').toString('utf-8'))
        fs.writeFileSync(path.join(authPath, 'creds.json'), JSON.stringify(credsData, null, 2))
      } catch {
        return m.reply('❌ Código de sesión inválido o corrupto.')
      }
    }

    // Cargar estado y versión baileys
    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    const { version } = await fetchLatestBaileysVersion()

    // Opciones conexión
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
      version,
      msgRetryCounterCache: new NodeCache(),
      msgRetryCounterMap: MessageRetryMap,
    }

    // Crear socket subbot
    let conn = makeWASocket(connectionOptions)

    // Guardar credenciales en cada update
    conn.ev.on('creds.update', saveCreds)

    // Variables control
    conn.isInit = false
    let isInit = true

    // Obtener número para pedir código si no registrado
    const phoneNumber = m.sender.split('@')[0]

    // Mostrar código (8 dígitos) si no registrado aún
    if (!conn.authState.creds.registered) {
      let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '')
      if (cleanedNumber.length < 8 || cleanedNumber.length > 15) {
        console.error('Número inválido:', cleanedNumber)
        return m.reply('Número inválido para vincular SubBot')
      }

      // Pedir código para vincular
      setTimeout(async () => {
        try {
          let codeBot = await conn.requestPairingCode(cleanedNumber)
          codeBot = codeBot?.match(/.{1,4}/g)?.join('-') || codeBot

          let txt = ` –  *S E R B O T  -  S U B B O T*\n\n`
          txt += `┌  ✩  *Usa este Código para convertirte en un Sub Bot*\n`
          txt += `│  ✩  Pasos\n`
          txt += `│  ✩  *1* : Haga click en los 3 puntos\n`
          txt += `│  ✩  *2* : Toque dispositivos vinculados\n`
          txt += `│  ✩  *3* : Selecciona *Vincular con el número de teléfono*\n`
          txt += `└  ✩  *4* : Escriba el Codigo\n\n`
          txt += `*Nota:* Este Código solo funciona en el número que lo solicitó`
          await parent.reply(m.chat, txt, m)
          await parent.reply(m.chat, codeBot, m)
        } catch {
          await parent.reply(m.chat, '❌ No se pudo generar el código del Sub-Bot.', m)
        }
      }, 3000)
    }

    // Escuchar updates de conexión
    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, isNewLogin, qr } = update

      if (isNewLogin) conn.isInit = true

      // Si se desconecta
      const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
      if (code && code !== DisconnectReason.loggedOut && conn?.ws?.socket == null) {
        let i = global.conns.indexOf(conn)
        if (i >= 0) {
          global.conns.splice(i, 1)
          delete global.conns[i]
        }
        await parent.sendMessage(m.chat, { text: "⚠️ Conexión perdida.." }, { quoted: m })
      }

      // Cuando conecta
      if (connection === 'open') {
        conn.isInit = true
        if (!global.conns.includes(conn)) global.conns.push(conn)
        await parent.reply(m.chat, args[0] ? 'Conectado con éxito' : `SubBot conectado!\nID sesión: ${authFolderB}\nNúmero: ${conn.user.id}`, m)
        await sleep(2000)

        if (args[0]) return

        await parent.reply(conn.user.jid, `Para reconectar sin QR, envía este mensaje con el código base64:`, m)
        const credsBase64 = Buffer.from(fs.readFileSync(path.join(authPath, 'creds.json'))).toString('base64')
        await parent.sendMessage(conn.user.jid, { text: `${usedPrefix}${command} ${credsBase64}` }, { quoted: m })
      }
    })

    // Limpiar conexiones muertas cada minuto
    setInterval(() => {
      for (let i = global.conns.length - 1; i >= 0; i--) {
        if (!global.conns[i].user) {
          try { global.conns[i].ws.close() } catch {}
          global.conns[i].ev.removeAllListeners()
          global.conns.splice(i, 1)
        }
      }
    }, 60000)
  }
  serbot()
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code', 'codebotraro']

export default handler

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}