import fs from 'fs'
import path from 'path'

async function handler(m, { conn: stars }) {
  const socketsDir = './Sessions/Sockets'
  let activos = []

  if (!fs.existsSync(socketsDir)) {
    return await stars.sendMessage(m.chat, { text: 'No hay subbots registrados.' }, { quoted: m })
  }

  const subbotDirs = fs.readdirSync(socketsDir).filter(d =>
    fs.statSync(path.join(socketsDir, d)).isDirectory()
  )

  for (let dir of subbotDirs) {
    let credsPath = path.join(socketsDir, dir, 'creds.json')
    if (!fs.existsSync(credsPath)) continue

    try {
      let creds = JSON.parse(fs.readFileSync(credsPath))
      if (creds?.me?.id) {
        activos.push({
          jid: creds.me.id.split(':')[0].replace(/[^0-9]/g, ''),
          name: creds.me.name || '-'
        })
      }
    } catch (e) {
      console.log('Error leyendo creds:', e.message)
    }
  }

  if (activos.length === 0) {
    return await stars.sendMessage(m.chat, { text: 'No hay subbots activos en este momento.' }, { quoted: m })
  }

  let text = activos.map((bot, i) =>
    `*${i + 1}.* @${bot.jid}\n*Link:* https://wa.me/${bot.jid}\n*Nombre:* ${bot.name}`
  ).join('\n\n')

  let msg = `*Total de SubBots activos:* ${activos.length}\n\n${text}`
  await stars.sendMessage(m.chat, { text: msg, mentions: stars.parseMention(msg) }, { quoted: m })
}

handler.command = ['listjadibot', 'bots']
handler.help = ['bots']
handler.tags = ['subbots']
export default handler