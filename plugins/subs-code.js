import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'

let handler = async (m, { conn }) => {
  try {
    if (!globalThis.jadi) globalThis.jadi = 'Sessions/Sockets'
    if (!global.conns) global.conns = []

    const sessionId = `${m.sender.split('@')[0]}_${Date.now()}`
    const { state, saveCreds } = await useMultiFileAuthState(`${globalThis.jadi}/${sessionId}`)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['SubBot', 'Safari', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // Pedir linking code
    const code = await sock.requestPairingCode(m.sender.split('@')[0])
    await conn.sendMessage(m.chat, { text: `✿ *Código de vinculación generado*\n\nTu código es: *${code}*\n\nEscanéalo desde WhatsApp > Vincular dispositivo.` }, { quoted: m })

    sock.ev.on('connection.update', ({ connection }) => {
      if (connection === 'open') {
        global.conns.push(sock)
        conn.sendMessage(m.chat, { text: `✿ *SubBot ${sessionId} conectado y guardado en ${globalThis.jadi}*` })
      }
    })

  } catch (err) {
    console.error('Error en .code:', err)
    await conn.sendMessage(m.chat, { text: '✿ *Error ›* No se pudo generar el código del Sub-Bot.' })
  }
}

handler.command = ['code']
handler.help = ['code']
handler.tags = ['jadibot']

export default handler