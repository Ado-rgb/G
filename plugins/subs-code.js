import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  jidNormalizedUser 
} from '@whiskeysockets/baileys'
import pino from 'pino'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

if (!global.conns) global.conns = []
if (!globalThis.jadi) globalThis.jadi = path.join('.', 'Sessions', 'Sockets')

let handler = async (m, { conn: parentConn, args, usedPrefix, command }) => {
  try {
    // Crear carpeta Sessions/Sockets si no existe
    if (!fs.existsSync(globalThis.jadi)) {
      fs.mkdirSync(globalThis.jadi, { recursive: true })
    }

    // Generar id random para la carpeta de la sesión
    let authFolder = crypto.randomBytes(5).toString('hex').slice(0, 8)
    const authPath = path.join(globalThis.jadi, authFolder)

    // Si te pasan creds base64, guardalas para login sin QR
    if (args[0]) {
      try {
        const credsData = JSON.parse(Buffer.from(args[0], 'base64').toString('utf-8'))
        if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true })
        fs.writeFileSync(path.join(authPath, 'creds.json'), JSON.stringify(credsData, null, 2))
      } catch {
        return m.reply('❌ Código de sesión inválido o corrupto.')
      }
    }

    // Cargar estado
    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    const { version } = await fetchLatestBaileysVersion()

    // Crear socket subbot
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['SubBot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // Pedir código real para vinculación WhatsApp
    const phoneNumber = m.sender.split('@')[0]
    const cleanNumber = phoneNumber.replace(/\D/g, '')
    const code = await sock.requestPairingCode(cleanNumber)

    // Enviar el código al usuario
    await parentConn.sendMessage(m.chat, {
      text: `✿ *SubBot: Vinculación*\n\nUsa este código para vincular tu Sub-Bot con WhatsApp:\n\n*${code}*\n\nPasos:\n1. En WhatsApp: Configuración > Dispositivos vinculados\n2. Selecciona "Vincular un dispositivo"\n3. Escribe el código exacto\n\nEste código es único para tu sesión.`
    }, { quoted: m })

    // Manejar eventos de conexión
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        global.conns.push(sock)
        await parentConn.sendMessage(m.chat, {
          text: `✿ *SubBot conectado*\nID sesión: ${authFolder}\nNúmero vinculado: ${sock.user.id}`
        }, { quoted: m })
      }
      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode
        if (reason !== DisconnectReason.loggedOut) {
          try { await sock.logout() } catch {}
          global.conns = global.conns.filter(c => c !== sock)
          await parentConn.sendMessage(m.chat, { text: '⚠️ SubBot desconectado inesperadamente.' }, { quoted: m })
        } else {
          global.conns = global.conns.filter(c => c !== sock)
          // opcional borrar sesión
          // fs.rmdirSync(authPath, { recursive: true, force: true })
        }
      }
    })

  } catch (e) {
    console.error('Error en handler SubBot:', e)
    await parentConn.sendMessage(m.chat, {
      text: '❌ *Error:* No se pudo crear el Sub-Bot, intenta de nuevo.'
    }, { quoted: m })
  }
}

handler.help = ['code']
handler.tags = ['jadibot']
handler.command = ['code', 'subbot']

export default handler