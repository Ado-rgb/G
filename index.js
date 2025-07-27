// Ensure TLS certificate rejection is enabled for security.
Process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

import './settings.js'; // Assuming this file sets global variables like 'sessions', 'jadi', 'botNumber'
import { setupMaster, fork } from 'cluster'; // Not used in this particular script
import { watchFile, unwatchFile } from 'fs'; // 'watchFile' and 'unwatchFile' not used directly in this snippet
import cfonts from 'cfonts';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn, execSync } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import boxen from 'boxen'; // Not used in this snippet
import P from 'pino'; // Redundant with 'pino' below
import pino from 'pino';
import Pino from 'pino'; // Redundant with 'pino' below
import path, { join, dirname } from 'path';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './lib/simple.js'; // Assuming these augment Baileys objects
import { Low, JSONFile } from 'lowdb';
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js'; // Not used in this snippet
import store from './lib/store.js'; // Baileys store
const { proto } = (await import('@whiskeysockets/baileys')).default;
import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');
import readline, { createInterface } from 'readline';
import NodeCache from 'node-cache';

const { CONNECTING } = ws; // Not used
const { chain } = lodash; // Used for global.db.chain

const PORT = process.env.PORT || process.env.SERVER_PORT || 3000; // Not used in this snippet

let { say } = cfonts;

console.log(chalk.magentaBright('\nIniciando...'));

// Display ASCII art for the bot name
say('Michi', {
    font: 'simple',
    align: 'left',
    gradient: ['green', 'white']
});
say('Made With Ado', {
    font: 'console',
    align: 'center',
    colors: ['cyan', 'magenta', 'yellow']
});

// Extend Baileys prototypes and add serialization
protoType();
serialize();

// --- Global utility functions and variables ---
globalThis.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
    return path.dirname(globalThis.__filename(pathURL, true));
};
globalThis.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

globalThis.timestamp = { start: new Date() }; // Record start time

const __dirname = globalThis.__dirname(import.meta.url); // Current directory

globalThis.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse()); // Parse command-line arguments

globalThis.prefix = new RegExp('^[#.!/]'); // Default command prefix

// --- Database setup ---
// Assumes 'cloudDBAdapter' is defined elsewhere if opts['db'] is a URL
globalThis.db = new Low(/https?:\/\//.test(globalThis.opts['db'] || '') ? new cloudDBAdapter(globalThis.opts['db']) : new JSONFile('datos.json'));
globalThis.DATABASE = globalThis.db;

globalThis.loadDatabase = async function loadDatabase() {
    if (globalThis.db.READ) {
        // Wait until a previous read operation is complete
        return new Promise((resolve) => setInterval(async function() {
            if (!globalThis.db.READ) {
                clearInterval(this);
                resolve(globalThis.db.data == null ? globalThis.loadDatabase() : globalThis.db.data);
            }
        }, 1 * 1000));
    }
    if (globalThis.db.data !== null) return; // If data is already loaded, exit
    globalThis.db.READ = true; // Set flag to indicate database is being read
    await globalThis.db.read().catch(console.error);
    globalThis.db.READ = null; // Clear flag
    globalThis.db.data = {
        users: {},
        chats: {},
        settings: {},
        ...(globalThis.db.data || {}), // Merge existing data
    };
    globalThis.db.chain = chain(globalThis.db.data); // Initialize lodash chain
};
loadDatabase(); // Load the database on startup

// --- Baileys connection setup ---
// globalThis.sessions is assumed to be defined in settings.js
const { state, saveState, saveCreds } = await useMultiFileAuthState(globalThis.sessions);
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 }); // Cache for message retry counters
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 }); // Cache for user devices
const { version } = await fetchLatestBaileysVersion(); // Fetch latest Baileys version
let phoneNumber = globalThis.botNumber; // globalThis.botNumber is assumed from settings.js

const methodCodeQR = process.argv.includes("qr"); // Check if 'qr' argument is passed
const methodCode = !!phoneNumber || process.argv.includes("code"); // Check if 'code' argument or phoneNumber is set
const MethodMobile = process.argv.includes("mobile"); // Check if 'mobile' argument is passed

const colors = chalk.bold.white;
const qrOption = chalk.blueBright;
const textOption = chalk.cyan;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Helper function to ask a question via readline
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

let opcion; // Variable to store user's connection choice

// Prompt for connection method if no method is specified via arguments and no existing creds.json
if (methodCodeQR) {
    opcion = '1'; // If 'qr' argument is present, default to QR
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${globalThis.sessions}/creds.json`)) {
    do {
        opcion = await question(colors("Seleccione una opción:\n") + qrOption("1. Con código QR\n") + textOption("2. Con código de texto de 8 dígitos\n--> "));

        if (!/^[1-2]$/.test(opcion)) {
            console.log(chalk.bold.redBright(`No se permiten números que no sean 1 o 2, tampoco letras o símbolos especiales.`));
        }
    } while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${globalThis.sessions}/creds.json`));
}

// Strings to filter from console output (decoded from Base64)
const filterStrings = [
    "Closing stable open",
    "Closing open session",
    "Failed to decrypt",
    "Session error",
    "Error: Bad MAC",
    "Decrypted message"
].map(s => Buffer.from(s).toString('base64')); // Encode to Base64 to match your original filter

// Redefine console methods to filter out specific Baileys debug messages
console.info = () => { };
console.debug = () => { };
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings));

// Baileys connection options for the main bot
const connectionOptions = {
    logger: pino({ level: 'silent' }), // Suppress Baileys logs
    printQRInTerminal: opcion === '1' || methodCodeQR, // Print QR if option 1 or 'qr' arg
    mobile: MethodMobile,
    browser: opcion === '1' || methodCodeQR ? Browsers.macOS("Desktop") : Browsers.macOS("Chrome"), // Browser type
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: false, // Don't show as online immediately
    generateHighQualityLinkPreview: true,
    syncFullHistory: false, // Don't sync full chat history
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        } catch (error) {
            return "";
        }
    },
    msgRetryCounterCache: msgRetryCounterCache,
    userDevicesCache: userDevicesCache,
    defaultQueryTimeoutMs: undefined,
    cachedGroupMetadata: (jid) => globalThis.conn.chats[jid] ?? {}, // Use main bot's chat cache
    version: version,
    keepAliveIntervalMs: 55000, // Keep alive interval
    maxIdleTimeMs: 60000, // Max idle time before disconnect
};

globalThis.conn = makeWASocket(connectionOptions); // Initialize main Baileys connection

// --- Sub-bot management ---
globalThis.conns = {}; // Object to store active sub-bot connections

/**
 * Creates and manages a sub-bot connection.
 * @param {string} sessionId - The unique identifier for the sub-bot's session.
 */
async function createSubBotConnection(sessionId) {
    const sessionPath = join(__dirname, 'Sessions', 'Sockets', sessionId);

    if (!existsSync(sessionPath)) {
        console.warn(chalk.yellow(`Sub-bot session directory not found: ${sessionPath}. Skipping.`));
        return;
    }

    const { state: subBotState, saveState: saveSubBotState, saveCreds: saveSubBotCreds } = await useMultiFileAuthState(sessionPath);

    const subBotConnectionOptions = {
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Sub-bots won't print QR in terminal
        mobile: MethodMobile,
        browser: Browsers.macOS("SubBot"), // Differentiate browser type for sub-bots
        auth: {
            creds: subBotState.creds,
            keys: makeCacheableSignalKeyStore(subBotState.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => {
            try {
                let jid = jidNormalizedUser(key.remoteJid);
                let msg = await store.loadMessage(jid, key.id);
                return msg?.message || "";
            } catch (error) {
                return "";
            }
        },
        msgRetryCounterCache: new NodeCache({ stdTTL: 0, checkperiod: 0 }),
        userDevicesCache: new NodeCache({ stdTTL: 0, checkperiod: 0 }),
        defaultQueryTimeoutMs: undefined,
        cachedGroupMetadata: (jid) => globalThis.conn.chats[jid] ?? {}, // Can share main bot's cache or have its own
        version: version,
        keepAliveIntervalMs: 55000,
        maxIdleTimeMs: 60000,
    };

    const subBotConn = makeWASocket(subBotConnectionOptions);

    // Add event listeners for the sub-bot connection
    subBotConn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, isNewLogin } = update;

        if (isNewLogin) {
            subBotConn.isInit = true;
        }

        if (connection === 'open') {
            const userJid = jidNormalizedUser(subBotConn.user.id);
            const userName = subBotConn.user.name || subBotConn.user.verifiedName || "Desconocido";
            console.log(chalk.green.bold(`\n🟢 Sub-bot [${sessionId}] conectado: +${userJid.split("@")[0]} - ${userName}`));
            // IMPORTANT: Add to global.conns ONLY when connected
            globalThis.conns[sessionId] = subBotConn;
            // Bind the handler to the sub-bot connection
            if (handler && handler.handler) { // Ensure handler is loaded
                subBotConn.handler = handler.handler.bind(subBotConn);
                subBotConn.ev.on('messages.upsert', subBotConn.handler);
            } else {
                console.warn(chalk.yellow(`Handler not yet loaded for sub-bot [${sessionId}]. Messages will not be processed.`));
            }
        } else if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(chalk.red.bold(`\n🔴 Sub-bot [${sessionId}] desconectado. Motivo: ${reason}`));

            // Remove from global.conns when disconnected
            if (globalThis.conns[sessionId]) {
                globalThis.conns[sessionId].ev.removeAllListeners(); // Clean up listeners
                delete globalThis.conns[sessionId];
            }

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bold.redBright(`\n🍀 Sub-bot [${sessionId}] desconectado permanentemente. Borrando credenciales.`));
                rmSync(sessionPath, { recursive: true, force: true }); // Delete session folder
            } else {
                console.log(chalk.bold.yellowBright(`\n🔄 Intentando reconectar Sub-bot [${sessionId}]...`));
                // Attempt to reconnect by re-creating the connection
                setTimeout(() => createSubBotConnection(sessionId), 3000); // Retry after 3 seconds
            }
        }
    });

    subBotConn.ev.on('creds.update', saveSubBotCreds); // Simplified: saveCreds takes care of state internally

    console.log(chalk.blue(`Intentando conectar sub-bot: ${sessionId}`));
}

/**
 * Starts all sub-bots by iterating through session directories.
 */
async function startSubBots() {
    const socketsDir = join(__dirname, 'Sessions', 'Sockets');
    if (!existsSync(socketsDir)) {
        mkdirSync(socketsDir, { recursive: true });
    }

    const sessionIds = readdirSync(socketsDir).filter(name => {
        const fullPath = join(socketsDir, name);
        // Only process directories with a 'creds.json' file inside and a valid ID format
        return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'creds.json')) && /^[0-9a-fA-F]{8,}$/.test(name);
    });

    for (const sessionId of sessionIds) {
        await createSubBotConnection(sessionId);
    }
}

// Call startSubBots after the main bot connection setup
startSubBots().catch(console.error);

// --- Main bot pairing code / QR logic ---
if (!fs.existsSync(`./${globalThis.sessions}/creds.json`)) {
    if (opcion === '2' || methodCode) {
        opcion = '2';
        if (!globalThis.conn.authState.creds.registered) {
            let addNumber;
            if (!!phoneNumber) {
                addNumber = phoneNumber.replace(/[^0-9]/g, '');
            } else {
                do {
                    phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`✦ Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.magentaBright('---> ')}`)));
                    phoneNumber = phoneNumber.replace(/\D/g, '');
                    if (!phoneNumber.startsWith('+')) {
                        phoneNumber = `+${phoneNumber}`;
                    }
                } while (!(await isValidPhoneNumber(phoneNumber)));
                rl.close(); // Close readline interface after getting number
                addNumber = phoneNumber.replace(/\D/g, '');
            }
            // Request pairing code after a short delay
            setTimeout(async () => {
                let codeBot = await globalThis.conn.requestPairingCode(addNumber);
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                console.log(chalk.bold.white(chalk.bgMagenta(`🎍 Código: `)), chalk.bold.white(chalk.white(codeBot)));
            }, 3000);
        }
    }
}

globalThis.conn.isInit = false;
globalThis.conn.well = false; // Unused variable, consider removing if not needed elsewhere
globalThis.conn.logger.info(`🎍  H E C H O\n`);

// --- Database writing interval ---
if (!globalThis.opts['test']) {
    if (globalThis.db) {
        setInterval(async () => {
            if (globalThis.db.data) {
                await globalThis.db.write();
            }
            // Autoclean tmp directory if enabled
            if (globalThis.opts['autocleartmp'] && (global.support || {}).find) {
                const tmp = [tmpdir(), 'tmp', `${globalThis.jadi}`]; // globalThis.jadi is assumed from settings.js
                tmp.forEach((filename) => spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete']));
            }
        }, 30 * 1000); // Every 30 seconds
    }
}

/**
 * Handles Baileys connection updates for the main bot.
 * @param {object} update - The connection update object.
 */
async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update;
    global.stopped = connection; // Set global stopped status
    if (isNewLogin) globalThis.conn.isInit = true;

    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;

    // If connection closed for a reason other than logged out, attempt reload
    if (code && code !== DisconnectReason.loggedOut && globalThis.conn?.ws.socket == null) {
        await globalThis.reloadHandler(true).catch(console.error);
        globalThis.timestamp.connect = new Date(); // Record connection timestamp
    }
    if (globalThis.db.data == null) loadDatabase(); // Ensure database is loaded

    if (update.qr !== 0 && update.qr !== undefined || methodCodeQR) {
        if (opcion === '1' || methodCodeQR) {
            console.log(chalk.green.bold(`
╭───────────────────╼
│ ${chalk.cyan("Escanea este código QR para conectarte.")}
╰───────────────────╼`));
        }
    }

    if (connection === "open") {
        const userJid = jidNormalizedUser(globalThis.conn.user.id);
        const userName = globalThis.conn.user.name || globalThis.conn.user.verifiedName || "Desconocido";
        console.log(chalk.green.bold(`
╭───────────────────╼
│ ${chalk.cyan("Conectado con éxito")}
│
│- ${chalk.cyan("Usuario :")} +${chalk.white(userJid.split("@")[0] + " - " + userName)}
│- ${chalk.cyan("Versión de WhatsApp :")} ${chalk.white(version)}
╰───────────────────╼`));
    }

    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    if (connection === 'close') {
        if (reason === DisconnectReason.badSession) {
            console.log(chalk.bold.cyanBright(`\n💦 Sin conexión, borra la sesión principal del Bot y conéctate nuevamente.`));
        } else if (reason === DisconnectReason.connectionClosed) {
            console.log(chalk.bold.magentaBright(`\n🎋 Reconectando la conexión del Bot...`));
            await globalThis.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.connectionLost) {
            console.log(chalk.bold.blueBright(`\n🍁 Conexión perdida con el servidor, reconectando el Bot...`));
            await globalThis.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.connectionReplaced) {
            console.log(chalk.bold.yellowBright(`\n🐷 La conexión del Bot ha sido reemplazada.`));
            // Optional: You might want to reload here if you want to try to regain control
            // await globalThis.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.bold.redBright(`\n🍀 Sin conexión, borra la sesión principal del Bot, y conéctate nuevamente.`));
            // No reload needed here, manual intervention (deletion of creds.json) is required.
            // Consider adding a process.exit() if you want the main bot to stop completely here.
            rmSync(`./${globalThis.sessions}/creds.json`, { recursive: true, force: true });
        } else if (reason === DisconnectReason.restartRequired) {
            console.log(chalk.bold.cyanBright(`\n🐞 Conectando el Bot con el servidor...`));
            await globalThis.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.timedOut) {
            console.log(chalk.bold.yellowBright(`\n🦋 Conexión agotada, reconectando el Bot...`));
            await globalThis.reloadHandler(true).catch(console.error);
        } else {
            console.log(chalk.bold.redBright(`\n🎍 Conexión cerrada (${reason || 'unknown'}), conéctese nuevamente.`));
            // For unhandled reasons, try to reload
            await globalThis.reloadHandler(true).catch(console.error);
        }
    }
}

// Global error handler for uncaught exceptions
process.on('uncaughtException', console.error);

let isInit = true;
// Import the handler module once at the top level
let handler = await import('./handler.js');

/**
 * Reloads the main bot's handler and re-establishes connection if needed.
 * @param {boolean} restartConn - True to restart the Baileys connection.
 */
globalThis.reloadHandler = async function(restartConn) {
    try {
        // Import handler with a cache-busting timestamp to ensure fresh load
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) {
            handler = Handler;
        }
    } catch (e) {
        console.error("Error reloading handler:", e);
    }

    if (restartConn) {
        const oldChats = globalThis.conn.chats;
        try {
            globalThis.conn.ws.close(); // Close existing websocket connection
        } catch (e) {
            console.error("Error closing old connection:", e);
        }
        globalThis.conn.ev.removeAllListeners(); // Remove all old event listeners
        globalThis.conn = makeWASocket(connectionOptions, { chats: oldChats }); // Create new connection
        isInit = true; // Set isInit to true for a new login
    }

    // If not the first initialization, remove old event listeners before re-attaching
    if (!isInit) {
        globalThis.conn.ev.off('messages.upsert', globalThis.conn.handler);
        globalThis.conn.ev.off('connection.update', globalThis.conn.connectionUpdate);
        globalThis.conn.ev.off('creds.update', globalThis.conn.credsUpdate);
    }

    // Bind handler functions to the current connection instance
    globalThis.conn.handler = handler.handler.bind(globalThis.conn);
    globalThis.conn.connectionUpdate = connectionUpdate.bind(globalThis.conn);
    globalThis.conn.credsUpdate = saveCreds.bind(globalThis.conn, true); // Bind saveCreds

    // Attach new event listeners
    globalThis.conn.ev.on('messages.upsert', globalThis.conn.handler);
    globalThis.conn.ev.on('connection.update', globalThis.conn.connectionUpdate);
    globalThis.conn.ev.on('creds.update', globalThis.conn.credsUpdate);

    isInit = false; // Mark as initialized
    return true;
};

// Auto-restart the process every 3 hours to refresh memory/state
setInterval(() => {
    console.log('[ ✿ ] Reiniciando...');
    process.exit(0);
}, 10800000); // 3 hours in milliseconds

// --- Plugin management ---
const pluginFolder = globalThis.__dirname(join(__dirname, './plugins/index')); // Path to plugin folder
const pluginFilter = (filename) => /\.js$/.test(filename); // Filter for .js files
globalThis.plugins = {}; // Object to store loaded plugins

/**
 * Initializes all plugins from the plugin folder.
 */
async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = globalThis.__filename(join(pluginFolder, filename));
            const module = await import(file);
            globalThis.plugins[filename] = module.default || module; // Support default export or named exports
        } catch (e) {
            globalThis.conn.logger.error(`Error loading plugin '${filename}':`, e);
            delete globalThis.plugins[filename]; // Remove if loading fails
        }
    }
}
filesInit().then((_) => Object.keys(globalThis.plugins)).catch(console.error);

/**
 * Reloads a single plugin file on change.
 * @param {string} _ev - Event type (e.g., 'change', 'rename').
 * @param {string} filename - The name of the changed file.
 */
globalThis.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        const dir = globalThis.__filename(join(pluginFolder, filename), true);
        if (filename in globalThis.plugins) {
            if (existsSync(dir)) {
                globalThis.conn.logger.info(`Updated plugin - '${filename}'`);
            } else {
                globalThis.conn.logger.warn(`Deleted plugin - '${filename}'`);
                return delete globalThis.plugins[filename];
            }
        } else {
            globalThis.conn.logger.info(`New plugin - '${filename}'`);
        }

        // Check for syntax errors before importing
        const err = syntaxerror(readFileSync(dir, 'utf8'), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });
        if (err) {
            globalThis.conn.logger.error(`Syntax error while loading '${filename}'\n${format(err)}`);
        } else {
            try {
                // Import with cache-busting timestamp
                const module = (await import(`${globalThis.__filename(dir)}?update=${Date.now()}`));
                globalThis.plugins[filename] = module.default || module;
            } catch (e) {
                globalThis.conn.logger.error(`Error requiring plugin '${filename}'\n${format(e)}`);
            } finally {
                // Re-sort plugins after update
                globalThis.plugins = Object.fromEntries(Object.entries(globalThis.plugins).sort(([a], [b]) => a.localeCompare(b)));
            }
        }
    }
};

Object.freeze(globalThis.reload); // Prevent modification of reload function
watch(pluginFolder, globalThis.reload); // Watch plugin folder for changes

await globalThis.reloadHandler(); // Initial handler load for the main bot

// --- System Dependencies Check ---
async function _quickTest() {
    const test = await Promise.all([
        spawn('ffmpeg'),
        spawn('ffprobe'),
        spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
        spawn('convert'),
        spawn('magick'),
        spawn('gm'),
        spawn('find', ['--version']),
    ].map((p) => {
        return Promise.race([
            new Promise((resolve) => {
                p.on('close', (code) => {
                    resolve(code !== 127); // 127 usually means command not found
                });
            }),
            new Promise((resolve) => {
                p.on('error', (_) => resolve(false)); // Error implies command not available
            })
        ]);
    }));
    const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
    const s = global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find };
    Object.freeze(globalThis.support); // Freeze support object
}

// --- Cleanup functions ---

/**
 * Clears the 'tmp' directory.
 */
function clearTmp() {
    const tmpDir = join(__dirname, 'tmp');
    if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true }); // Create tmp dir if it doesn't exist
    }
    const filenames = readdirSync(tmpDir);
    filenames.forEach(file => {
        const filePath = join(tmpDir, file);
        try {
            unlinkSync(filePath); // Delete each file
        } catch (e) {
            console.error(`Error deleting temp file ${filePath}:`, e);
        }
    });
}

/**
 * Purges old 'pre-key-' files from the main session folder.
 */
function purgeSession() {
    let prekeyFiles = [];
    const sessionDir = `./${globalThis.sessions}`;
    if (!existsSync(sessionDir)) return; // Exit if session directory doesn't exist

    let directoryContents = readdirSync(sessionDir);
    let filesFolderPreKeys = directoryContents.filter(file => {
        return file.startsWith('pre-key-');
    });
    prekeyFiles = [...prekeyFiles, ...filesFolderPreKeys];
    prekeyFiles.forEach(file => {
        try {
            unlinkSync(join(sessionDir, file));
        } catch (e) {
            console.error(`Error deleting pre-key file ${file}:`, e);
        }
    });
}

/**
 * Purges old 'pre-key-' files from sub-bot session folders.
 */
function purgeSessionSB() {
    try {
        const subBotSessionsDir = `./${globalThis.jadi}/`; // globalThis.jadi is assumed to be the base for sub-bot sessions
        if (!existsSync(subBotSessionsDir)) return;

        const listaDirectorios = readdirSync(subBotSessionsDir);
        let SBprekeyFiles = [];

        listaDirectorios.forEach(directorio => {
            const subBotDirPath = join(subBotSessionsDir, directorio);
            if (statSync(subBotDirPath).isDirectory()) {
                const DSBPreKeys = readdirSync(subBotDirPath).filter(fileInDir => {
                    return fileInDir.startsWith('pre-key-');
                });
                SBprekeyFiles = [...SBprekeyFiles, ...DSBPreKeys];
                DSBPreKeys.forEach(fileInDir => {
                    if (fileInDir !== 'creds.json') { // Do not delete creds.json
                        try {
                            unlinkSync(join(subBotDirPath, fileInDir));
                        } catch (e) {
                            console.error(`Error deleting sub-bot pre-key file ${join(subBotDirPath, fileInDir)}:`, e);
                        }
                    }
                });
            }
        });
        // You had console logs here, but they were empty. Removed for conciseness.
    } catch (err) {
        console.error("Error purging sub-bot sessions:", err);
    }
}

/**
 * Purges old files (excluding 'creds.json') from specified directories.
 */
function purgeOldFiles() {
    const directories = [`./${globalThis.sessions}/`, `./${globalThis.jadi}/`];
    directories.forEach(dir => {
        if (!existsSync(dir)) return; // Skip if directory doesn't exist

        readdirSync(dir).forEach(file => {
            if (file !== 'creds.json') { // Do not delete creds.json
                const filePath = path.join(dir, file);
                try {
                    unlinkSync(filePath);
                } catch (err) {
                    console.error(`Error deleting old file ${filePath}:`, err);
                }
            }
        });
    });
}

/**
 * Redefines console methods to filter out specific log messages.
 * @param {string} methodName - The console method to redefine (e.g., 'log', 'warn').
 * @param {string[]} filterStrings - An array of Base64 encoded strings to filter.
 */
function redefineConsoleMethod(methodName, filterStrings) {
    const originalConsoleMethod = console[methodName];
    console[methodName] = function() {
        const message = arguments[0];
        if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
            arguments[0] = ""; // Replace message with empty string
        }
        originalConsoleMethod.apply(console, arguments);
    };
}

// --- Scheduled Cleanup Tasks ---
setInterval(async () => {
    if (global.stopped === 'close' || !globalThis.conn || !globalThis.conn.user) return;
    await clearTmp();
}, 1000 * 60 * 4); // Every 4 minutes

setInterval(async () => {
    if (global.stopped === 'close' || !globalThis.conn || !globalThis.conn.user) return;
    await purgeSession();
}, 1000 * 60 * 10); // Every 10 minutes

setInterval(async () => {
    if (global.stopped === 'close' || !globalThis.conn || !globalThis.conn.user) return;
    await purgeSessionSB();
}, 1000 * 60 * 10); // Every 10 minutes

setInterval(async () => {
    if (global.stopped === 'close' || !globalThis.conn || !globalThis.conn.user) return;
    await purgeOldFiles();
}, 1000 * 60 * 10); // Every 10 minutes

_quickTest().catch(console.error); // Run dependency check on startup

/**
 * Validates a phone number using google-libphonenumber.
 * @param {string} number - The phone number to validate.
 * @returns {Promise<boolean>} - True if the number is valid, false otherwise.
 */
async function isValidPhoneNumber(number) {
    try {
        number = number.replace(/\s+/g, ''); // Remove all whitespace
        // Adjust common Mexican number formats if needed
        if (number.startsWith('+521')) {
            number = number.replace('+521', '+52');
        } else if (number.startsWith('+52') && number.length === 13 && number[3] === '1') { // +52 1 XXXXXXXXXX
            number = `+${number.substring(1,3)}${number.substring(4)}`; // Remove the '1' after +52
        } else if (number.startsWith('521') && number.length === 12) { // 521XXXXXXXXXX
             number = `+52${number.substring(3)}`;
        }
        const parsedNumber = phoneUtil.parseAndKeepRawInput(number);
        return phoneUtil.isValidNumber(parsedNumber);
    } catch (error) {
        console.error("Error validating phone number:", error);
        return false;
    }
}
