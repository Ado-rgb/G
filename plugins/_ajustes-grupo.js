let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')

  if (!args[0]) return m.reply(
`✿ *Uso correcto ›* ${usedPrefix + command} <función>

Funciones disponibles:
> antilink
> detect
> alerts
> antiarabe
> welcome

Ejemplo:
> ${usedPrefix}on welcome
> ${usedPrefix}off welcome`
  )

  let chat = global.db.data.chats[m.chat]
  let option = args[0].toLowerCase()
  let valid = ['antilink', 'detect', 'alerts', 'antiarabe', 'welcome']

  if (!valid.includes(option)) return m.reply(
`✿ *Función no válida ›* ${option}
> Usa alguna de estas: ${valid.join(', ')}`
  )

  if (command === 'on') {
    chat[option] = true
    m.reply(`✿ *${option}* activado ✨`)

    if (option === 'welcome') {
      await conn.sendMessage(m.chat, {
        text: `✿ *Welcome activado* en este grupo\n> Bienvenidos y bienvenidas siempre.`,
        contextInfo: {
          externalAdReply: {
            title: "Sistema de Bienvenida",
            body: "Conectado y listo para saludar a los nuevos",
            sourceUrl: "https://myapiadonix.vercel.app",
            thumbnailUrl: "https://telegra.ph/file/24fa902ead26340f3df2c.png",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      })
    }

  } else if (command === 'off') {
    chat[option] = false
    m.reply(`✿ *${option}* desactivado ❌`)
  }
}

handler.command = ['on', 'off']
handler.help = ['on <función>', 'off <función>']
handler.tags = ['config']

export default handler