import os from 'os'
import process from 'process'

let handler = async (m, { conn }) => {
  let start = Date.now()
  await m.reply('ꕥ Espera un toque, midiendo todo...')

  let ping = Date.now() - start

  let totalMem = os.totalmem() / 1024 / 1024
  let freeMem = os.freemem() / 1024 / 1024
  let usedMem = totalMem - freeMem
  let memPercent = (usedMem / totalMem) * 100

  let cpus = os.cpus()
  let cpuModel = cpus[0].model
  let cpuCores = cpus.length
  let loadAvg = os.loadavg()

  let uptime = process.uptime()

  function formatTime(s) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return `${h ? h + 'h ' : ''}${m ? m + ' minutos, ' : ''}${sec} segundos`
  }

  let text = `
ꕥ *Velocidad y Recursos* ꕥ ⚡️

⏳ Tiempo de respuesta: *${ping} ms*
🧠 RAM usada: *${usedMem.toFixed(2)}*MB / *${totalMem.toFixed(2)}*MB (${memPercent.toFixed(2)}%)
🖥️ CPU: *${cpuModel}* (${cpuCores} núcleos)
📈 Carga (1,5,15 min): *${loadAvg.map(l => l.toFixed(2)).join(', ')}*
⏰ Tiempo activo: *${formatTime(uptime)}*

ꕥ Actualmente estoy sobreviviendo en esta chatarra, UwU.`
  
  await m.reply(text.trim())
}

handler.command = ['speed', 'ping', 'status']
handler.help = ['speed']
handler.tags = ['info']

export default handler