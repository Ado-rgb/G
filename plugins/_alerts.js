let WAMessageStubType = (await import('@whiskeysockets/baileys')).default
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

let handler = m => m

handler.before = async function (m, { conn, participants, groupMetadata }) {
  if (!m.messageStubType || !m.isGroup) return
  let chat = globalThis.db.data.chats[m.chat]
  let userss = m.messageStubParameters[0]

  let msgs = {
    29: `*✩ Cambio de Rango (✿❛◡❛)*\n❑ *Usuario ›* @${userss.split('@')[0]}\n✿ *Acción ›* Promovido a *Administrador*\n♡ *Por ›* @${m.sender.split('@')[0]}`,
    30: `*✩ Cambio de Rango (✿❛◡❛)*\n❑ *Usuario ›* @${userss.split('@')[0]}\n✿ *Acción ›* Degradado de *Administrador*\n♡ *Por ›* @${m.sender.split('@')[0]}`,
    21: `*✩ Grupo Actualizado (✿❛◡❛)*\n❑ *Acción ›* Foto del grupo cambiada\n♡ *Por ›* @${m.sender.split('@')[0]}`,
    22: `*✩ Grupo Actualizado (✿❛◡❛)*\n❑ *Acción ›* Nombre del grupo cambiado\n♡ *Por ›* @${m.sender.split('@')[0]}`,
    27: `*✩ Cambio en Miembros (✿❛◡❛)*\n❑ *Usuario añadido ›* @${userss.split('@')[0]}\n♡ *Por ›* @${m.sender.split('@')[0]}`,
    28: `*✩ Cambio en Miembros (✿❛◡❛)*\n❑ *Usuario eliminado ›* @${userss.split('@')[0]}\n♡ *Por ›* @${m.sender.split('@')[0]}`
  }

  if (chat.detect && m.messageStubType == 2) {
    const uniqid = (m.isGroup ? m.chat : m.sender).split('@')[0]
    const sessionPath = './Sessions/BotOfc'
    for (const file of await fs.readdir(sessionPath)) {
      if (file.includes(uniqid)) {
        await fs.unlink(path.join(sessionPath, file))
        console.log(`${chalk.yellow.bold('✎ Delete!')} ${chalk.greenBright(`'${file}'`)}\n${chalk.redBright('Provoca "undefined" en el chat.')}`)
      }
    }
  }

  if (chat.alerts && msgs[m.messageStubType]) {
    await conn.sendMessage(m.chat, {
      text: msgs[m.messageStubType],
      mentions: [userss, m.sender]
    }, { quoted: null })
  }
}

export default handler