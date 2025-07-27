let handler = async (m, { conn, args }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')

  if (!args[0]) return m.reply('✿ *Uso correcto ›* .kicknum +212123456789 o .kicknum 212123456789')

  let input = args[0].replace(/\s+/g, '') // quita espacios por si acaso

  // Regex para detectar código de país al inicio (+212 o 212)
  const codeCountryRegex = /^\+?\d{1,3}/
  let codeMatch = input.match(codeCountryRegex)
  if (!codeMatch) return m.reply('❌ Debes poner un número con código de país, ejemplo +212123456789 o 212123456789')

  let codeCountry = codeMatch[0].replace('+', '')
  let number = input.replace(/^(\+?\d{1,3})/, '') // quita el código del número

  if (!number) return m.reply('❌ Número inválido después del código de país.')

  let user = codeCountry + number + '@s.whatsapp.net'

  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
    await conn.sendMessage(m.chat, { 
      text: `✿ *KickNum:* Usuario +${codeCountry}${number} expulsado sin validar admin ni bot admin.`,
      mentions: [user]
    })
  } catch {
    m.reply('❌ No pude expulsar al usuario (quizás no soy admin o pasó otro error)')
  }
}

handler.command = ['kicknum']
handler.help = ['kicknum']
handler.tags = ['grupos']
handler.admin = true

export default handler