let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) return m.reply(
`✿ *Uso correcto ›* ${usedPrefix + command} <función>

Funciones disponibles:
> antilink
> detect
> alerts
> antiarabe

Ejemplo:
> ${usedPrefix}on antilink
> ${usedPrefix}off antiarabe`)

  let chat = global.db.data.chats[m.chat]
  let option = args[0].toLowerCase()
  let valid = ['antilink', 'detect', 'alerts', 'antiarabe']

  if (!valid.includes(option)) return m.reply(
`✿ *Función no válida ›* ${option}
> Usa alguna de estas: ${valid.join(', ')}`)

  if (command === 'on') {
    chat[option] = true
    m.reply(`✿ *${option}* activado ✨`)
  } else if (command === 'off') {
    chat[option] = false
    m.reply(`✿ *${option}* desactivado ❌`)
  }
}

handler.command = ['on', 'off']
handler.help = ['on <función>', 'off <función>']
handler.tags = ['config']

export default handler