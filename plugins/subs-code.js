import {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import crypto from 'crypto'
import fs from 'fs'
import pino from 'pino'
import { makeWASocket } from '../lib/simple.js'

if (!(global.conns instanceof Array)) global.conns = []

let handler = async (m, { conn: _conn, args, usedPrefix }) => {
  let parent = args[0] && args[0] === 'plz' ? _conn : await global.conn

  async function serbot() {
    const tmpFolder = './Sessions/TEMP'
    if (!fs.existsSync(tmpFolder)) fs.mkdirSync(tmpFolder, { recursive: true })

    const authFolderB = crypto.randomBytes(10).toString('hex').slice(0, 8)
    const authPath = `${tmpFolder}/${authFolderB}`
    fs.mkdirSync(authPath, { recursive: true })

    if (args[0]) {
      const credsJson = Buffer.from(args[0], 'base64').toString('utf-8')
      fs.writeFileSync(`${authPath}/creds.json`, JSON.stringify(JSON.parse(credsJson), null, '\t'))
    }

    const { state, saveState, saveCreds } = await useMultiFileAuthState(authPath)
    const { version } = await fetchLatestBaileysVersion()

    const connectionOptions = {
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      version
    }

    let conn = makeWASocket(connectionOptions)
    conn.isInit = false
    let isConnected = false

    conn.ev.on('connection.update', async (update) => {
      console.log('connection.update event:', update)

      // A veces update es un array o un objeto
      let connection = update.connection || (Array.isArray(update) ? update[0]?.connection : undefined)
      let qr = update.qr || (Array.isArray(update) ? update[0]?.qr : undefined)
      let isNewLogin = update.isNewLogin || (Array.isArray(update) ? update[0]?.isNewLogin : false)

      if (qr) {
        // Aquí tienes que mandar el QR como texto o imagen o código de 8 dígitos
        // Pero la forma oficial ahora es que pide que uses requestPairingCode para el código de 8 dígitos
        // Entonces aquí solo logueamos el QR
        console.log('QR generado (escanea con WhatsApp):', qr)
        await parent.reply(m.chat, '*Escanea este código QR para conectar el sub-bot*', m)
        // Opcional: generar QR en texto:
        // import qrcode from 'qrcode'
        // const qrTxt = await qrcode.toString(qr, { type: 'terminal' })
        // console.log(qrTxt)
      }

      if (connection === 'open') {
        isConnected = true
        conn.isInit = true
        global.conns.push(conn)

        // Mueve la carpeta TEMP a Sockets solo si conecta bien
        const finalPath = `./Sessions/Sockets/${authFolderB}`
        if (!fs.existsSync('./Sessions/Sockets')) fs.mkdirSync('./Sessions/Sockets', { recursive: true })

        fs.renameSync(authPath, finalPath)

        await parent.reply(
          m.chat,
          'Conectado exitosamente con WhatsApp\n\n*Nota:* Esto es temporal\nSi el Bot principal se reinicia o se desactiva, todos los sub bots también lo harán',
          m
        )
      }

      if (connection === 'close' && !isConnected) {
        // No conectó bien, borra temp
        try {
          fs.rmSync(authPath, { recursive: true, force: true })
        } catch (e) {
          console.error('Error borrando carpeta temp:', e)
        }
        await parent.reply(m.chat, 'Error al conectar sub-bot o se canceló la conexión', m)
      }
    })
  }

  serbot()
}

handler.help = ['code']
handler.tags = ['subbots']
handler.command = ['code']
export default handler