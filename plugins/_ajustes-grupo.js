let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!m.isGroup) return m.reply('✿ Este comando solo funciona en grupos')

  let chat = global.db.data.chats[m.chat]
  if (!args[0]) {
    return m.reply(
`✿ *Uso correcto ›* ${usedPrefix + command} <función>

Funciones disponibles:
> antilink
> alerts
> antiarabe
> welcome

Ejemplo:
> ${usedPrefix}on welcome
> ${usedPrefix}off welcome`
    )
  }

  let option = args[0].toLowerCase()
  let valid = ['antilink', 'detect', 'alerts', 'antiarabe', 'welcome']

  if (!valid.includes(option)) {
    return m.reply(`✿ *Función no válida ›* ${option}
> Usa alguna de estas: ${valid.join(', ')}`)
  }

  if (command === 'on') {
    chat[option] = true
    m.reply(`✿ *${option}* activado ✨`)
  } else if (command === 'off') {
    chat[option] = false
    m.reply(`✿ *${option}* desactivado ❌`)
  }
}

handler.command = ['on', 'off']
handler.help = ['on', 'off']
handler.tags = ['grupos']
handler.admin = true 
export default handler