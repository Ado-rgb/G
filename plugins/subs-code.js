import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore, 
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

    // Generar id random de 8 caracteres para sesión
    let authFolder = crypto.randomBytes(5).toString('hex').slice(0, 8)

    // Si el usuario manda un código base64, guardamos creds.json para login sin QR
    if (args[0]) {
      try {
        const credsData = JSON.parse(Buffer.from(args[0], 'base64').toString('utf-8'))
        const pathCreds = path.join(globalThis.jadi, authFolder, 'creds.json')
        if (!fs.existsSync(path.join(globalThis.jadi, authFolder))) {
          fs.mkdirSync(path.join(globalThis.jadi, authFolder), { recursive: true })
        }
        fs.writeFileSync(pathCreds, JSON.stringify(credsData, null, 2))
      } catch (e) {
        return m.reply('❌ Código de sesión inválido o corrupto.')
      }
    }

    // Cargar estado de la sesión
    const { state, saveCreds } = await useMultiFileAuthState(path.join(globalThis.jadi, authFolder))
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

    // Generar linking code (8 dígitos en formato XXXX-XXXX)
    const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const code = rawCode.match(/.{1,4}/g).join('-')

    // Enviar instrucciones y código de vinculación al chat
    await parentConn.sendMessage(m.chat, {
      text: `✿ *SubBot: Vinculación*\n\nUsa este código para vincular tu Sub-Bot con WhatsApp:\n\n*${code}*\n\nPasos:\n1. En WhatsApp: Configuración > Dispositivos vinculados\n2. Selecciona "Vincular un dispositivo"\n3. Escribe el código exacto\n\nEste código es único para tu sesión.`
    }, { quoted: m })

    // Manejar eventos de conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode
        if (reason !== DisconnectReason.loggedOut) {
          // Intentar reconectar o limpiar
          try {
            await sock.logout()
          } catch {}
          global.conns = global.conns.filter(c => c !== sock)
        } else {
          // Sesión cerrada, eliminar subbot
          global.conns = global.conns.filter(c => c !== sock)
          // Opcional: borrar sesión de disco
          // fs.rmdirSync(path.join(globalThis.jadi, authFolder), { recursive: true, force: true })
        }
      }

      if (connection === 'open') {
        global.conns.push(sock)
        await parentConn.sendMessage(m.chat, {
          text: `✿ *SubBot conectado*\nID sesión: ${authFolder}\nNúmero vinculado: ${sock.user.id}`
        }, { quoted: m })
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