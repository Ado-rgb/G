import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode'
import crypto from 'crypto'
import fs from 'fs'
import NodeCache from 'node-cache'
import readline from 'readline'
import moment from 'moment-timezone'
import { Boom } from '@hapi/boom'

if (!global.conns) global.conns = []
if (!globalThis.jadi) globalThis.jadi = 'Sessions/Sockets'

let handler = async (m, { conn: parentConn, args, usedPrefix, command }) => {
  try {
    // Crear carpeta globalThis.jadi si no existe
    if (!fs.existsSync(globalThis.jadi)) fs.mkdirSync(globalThis.jadi, { recursive: true })

    // Generar id random de 8 caracteres para sesión
    let authFolder = crypto.randomBytes(5).toString('hex').slice(0, 8)

    // Si el usuario manda un código base64, lo guardamos como creds.json para login sin QR
    if (args[0]) {
      try {
        const credsData = JSON.parse(Buffer.from(args[0], 'base64').toString('utf-8'))
        const pathCreds = `${globalThis.jadi}/${authFolder}/creds.json`
        if (!fs.existsSync(`${globalThis.jadi}/${authFolder}`)) fs.mkdirSync(`${globalThis.jadi}/${authFolder}`, { recursive: true })
        fs.writeFileSync(pathCreds, JSON.stringify(credsData, null, 2))
      } catch (e) {
        return m.reply('❌ Código de sesión inválido o corrupto.')
      }
    }

    // Cargar estado
    const { state, saveCreds } = await useMultiFileAuthState(`${globalThis.jadi}/${authFolder}`)
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

    // Generar linking code (8 dígitos, formato XXXX-XXXX)
    let phoneNumber = m.sender.split('@')[0]
    let cleanNumber = phoneNumber.replace(/\D/g, '')
    if (cleanNumber.length < 8) cleanNumber = cleanNumber.padStart(8, '0')
    const rawCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    const code = rawCode.match(/.{1,4}/g).join('-')

    // Mandar instrucciones y código de vinculación
    await parentConn.sendMessage(m.chat, {
      text: `✿ *SubBot: Vinculación*\n\nUsa este código para vincular tu Sub-Bot con WhatsApp:\n\n*${code}*\n\nPasos:\n1. En WhatsApp: Configuración > Dispositivos vinculados\n2. Selecciona "Vincular un dispositivo"\n3. Escribe el código exacto\n\nEste código es único para tu sesión.`
    }, { quoted: m })

    // Manejar eventos de conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode
        if (reason !== DisconnectReason.loggedOut) {
          // Reintentar conexión
          try {
            await sock.logout()
          } catch {}
          global.conns = global.conns.filter(c => c !== sock)
          // opcional: reconectar (podés llamar al handler otra vez)
        } else {
          // Sesión cerrada por logout
          global.conns = global.conns.filter(c => c !== sock)
          // Borrar sesión si querés
          // fs.rmdirSync(`${globalThis.jadi}/${authFolder}`, { recursive: true, force: true })
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