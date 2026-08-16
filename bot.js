const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const pino = require('pino')({ level: 'silent' });

let sock = null;
let qrCount = 0;

// ===== START BOT =====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino,
        printQRInTerminal: false,
        auth: state,
        browser: ['Pakistan Welfare Bot', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000
    });

    // ===== QR CODE =====
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCount++;
            console.log(`\n🔷 QR Code #${qrCount} - Scan karein apne phone se:\n`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n🚀 =====================================');
            console.log('🤖 Pakistan Welfare Society Bot ACTIVE!');
            console.log('📋 Features:');
            console.log('   • Auto-delete status mentions');
            console.log('   • Auto-reply blood requests');
            console.log('   • Multi-group support');
            console.log('=====================================\n');
        }
    });

    // ===== SAVE CREDENTIALS =====
    sock.ev.on('creds.update', saveCreds);

    // ===== MESSAGE HANDLER =====
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || '';

        // Only group messages
        if (!chatId.endsWith('@g.us')) return;

        const lowerText = text.toLowerCase();

        // ----- FEATURE 1: Auto-delete status mentions -----
        const hasStatus = config.statusKeywords.some(k => lowerText.includes(k.toLowerCase()));

        if (hasStatus) {
            console.log(`🚨 Status mention detected in ${chatId}`);
            console.log(`   From: ${sender}`);
            console.log(`   Text: ${text.substring(0, 60)}...`);

            try {
                // Delete the message
                await sock.sendMessage(chatId, { delete: msg.key });
                console.log('   ✅ Message deleted');

                // Send warning after 2 seconds
                setTimeout(async () => {
                    await sock.sendMessage(chatId, { 
                        text: config.statusWarningMessage 
                    });
                }, 2000);

            } catch (err) {
                console.error('   ❌ Delete failed:', err.message);
                // If delete fails, just send warning
                await sock.sendMessage(chatId, { 
                    text: config.statusWarningMessage 
                });
            }
            return;
        }

        // ----- FEATURE 2: Auto-reply blood requests -----
        const hasBlood = config.bloodKeywords.some(k => lowerText.includes(k.toLowerCase()));

        if (hasBlood) {
            console.log(`🩸 Blood request detected in ${chatId}`);
            console.log(`   From: ${sender}`);
            console.log(`   Text: ${text.substring(0, 60)}...`);

            try {
                // Reply to the message
                await sock.sendMessage(chatId, { 
                    text: config.bloodReplyMessage,
                    quoted: msg
                });
                console.log('   ✅ Blood reply sent');
            } catch (err) {
                console.error('   ❌ Reply failed:', err.message);
            }
            return;
        }
    });

    // ===== GROUP PARTICIPANTS UPDATE (Welcome) =====
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            const chatId = update.id;
            try {
                const welcomeMsg = `👋 *Welcome!* \n\n*Pakistan Welfare Society* mein khush amdeed! 🎉\n\n📌 *Group Rules:*\n• Status mention karna *sakht mana* hai\n• Blood request ke liye form fill karein\n• Fake news share nahi karein\n\n🩸 *Blood Request Form:*\nhttps://bloodrequest.netlify.app/\n\nJazakAllah! 🤲`;

                await sock.sendMessage(chatId, { text: welcomeMsg });
                console.log(`👋 Welcome sent in ${chatId}`);
            } catch (err) {
                console.error('Welcome error:', err.message);
            }
        }
    });
}

// ===== START =====
startBot();

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGINT', async () => {
    console.log('\n🛑 Bot band ho raha hai...');
    if (sock) {
        await sock.logout();
    }
    process.exit(0);
});