import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"

globalThis.botNumber = ""

globalThis.owner = [
  ["50493732693", "Dev 🌟", true]
]

globalThis.botname = '𝖬𝗂𝖼𝗁𝗂 - 𝖨𝖠'
globalThis.dev = 'ꕤ 𝖬𝖺𝖽𝖾 𝗐𝗂𝗍𝗁 𝖻𝗒 🫟 𝖠𝖽𝗈'
globalThis.jadi = 'Sessions/Sockets'
globalThis.sessions = 'Sessions/BotOfc'

globalThis.api = { 
url: 'https://myapiadonix.vercel.app'
}

const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright(`Update "${file}"`))
  import(`${file}?update=${Date.now()}`)
})