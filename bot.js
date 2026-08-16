const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    delay
} = require('@whiskeysockets/baileys');
const config = require('./config');
const pino = require('pino')({ level: 'silent' });
const express = require('express');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

let sock = null;
let currentQR = null;
let connectionState = 'initializing';
let statusMessage = 'Bot starting...';
let botNumber = null;
let qrDied = false;

const app = express();
const PORT = process.env.PORT || 10000;
const AUTH_PATH = './auth_info_baileys';
const BACKUP_ZIP = './auth_backup.zip';

// ===== AUTO EXTRACT AUTH BACKUP =====
function extractAuthBackup() {
    try {
        if (fs.existsSync(BACKUP_ZIP) && !fs.existsSync(AUTH_PATH)) {
            console.log('📦 Found auth_backup.zip, extracting...');
            const zip = new AdmZip(BACKUP_ZIP);
            zip.extractAllTo('./', true);
            console.log('✅ Auth backup extracted successfully!');
            return true;
        }
    } catch (err) {
        console.error('❌ Extract backup error:', err.message);
    }
    return false;
}

// ===== WEB SERVER =====
app.get('/', (req, res) => {
    if (connectionState === 'open') {
        res.send(renderPage('active'));
    } else if (currentQR && !qrDied) {
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentQR)}`;
        res.send(renderPage('qr', qrImageUrl));
    } else {
        res.send(renderPage('loading'));
    }
});

app.get('/reset', (req, res) => {
    try {
        if (fs.existsSync(AUTH_PATH)) {
            fs.rmSync(AUTH_PATH, { recursive: true, force: true });
        }
        if (fs.existsSync(BACKUP_ZIP)) {
            fs.unlinkSync(BACKUP_ZIP);
        }
        res.send(`
        <html><body style="text-align:center;padding:50px;font-family:Arial;">
        <h1>✅ Auth Files Deleted!</h1>
        <p>Bot will restart with new QR Code in 10 seconds...</p>
        <p><a href="/">Go back to main page</a></p>
        <script>setTimeout(()=>location.href='/', 10000);</script>
        </body></html>`);
        setTimeout(() => process.exit(0), 2000);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

app.get('/download-auth', (req, res) => {
    try {
        if (!fs.existsSync(AUTH_PATH)) {
            return res.status(404).send('Auth files not found.');
        }
        const zip = new AdmZip();
        zip.addLocalFolder(AUTH_PATH, 'auth_info_baileys');
        const zipBuffer = zip.toBuffer();
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=auth_backup.zip');
        res.send(zipBuffer);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

function renderPage(type, qrUrl) {
    if (type === 'active') {
        return `<!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bot Active</title><style>
        body{font-family:Arial;text-align:center;padding:40px;background:#e8f5e9;}
        .box{background:white;padding:30px;border-radius:15px;max-width:400px;margin:0 auto;box-shadow:0 4px 15px rgba(0,0,0,0.1);}
        h1{color:#2e7d32;}.status{color:green;font-size:20px;font-weight:bold;}
        .features{text-align:left;margin-top:20px;}.features li{margin:8px 0;color:#333;}
        .backup{margin-top:20px;padding:15px;background:#fff3e0;border-radius:8px;}
        .backup a{color:#e65100;font-weight:bold;}.reset{margin-top:15px;}
        .reset a{color:#d32f2f;font-size:12px;}
        </style></head><body>
        <div class="box"><h1>🤖 Pakistan Welfare Bot</h1>
        <p class="status">✅ ACTIVE & RUNNING</p>
        <p>Bot is connected and monitoring groups!</p>
        <ul class="features"><li>🗑️ Auto-delete status mentions/shares</li>
        <li>🩸 Auto-reply blood requests</li><li>👋 Welcome new members</li></ul>
        <div class="backup"><b>💾 Session Backup:</b><br>
        <a href="/download-auth">Download Auth Files</a><br>
        <small>(Upload auth_backup.zip to GitHub for auto-login)</small></div>
        <div class="reset"><a href="/reset">🔄 Reset / New QR Code</a></div>
        <p style="margin-top:20px;color:#666;font-size:12px;">Powered by Pakistan Welfare Society</p>
        </div></body></html>`;
    }

    if (type === 'qr') {
        return `<!DOCTYPE html>
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scan QR Code</title><style>
        body{font-family:Arial;text-align:center;padding:20px;background:#fff3e0;}
        .box{background:white;padding:25px;border-radius:15px;max-width:450px;margin:0 auto;box-shadow:0 4px 15px rgba(0,0,0,0.1);}
        h1{color:#e65100;font-size:22px;}.qr{margin:20px 0;border:3px dashed #ff9800;padding:10px;border-radius:10px;}
        .qr img{max-width:100%;height:auto;}.steps{text-align:left;background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0;}
        .steps li{margin:8px 0;color:#333;}.refresh{color:#666;font-size:13px;margin-top:15px;}
        .timer{color:#d32f2f;font-weight:bold;}.reset{margin-top:15px;}
        .reset a{color:#d32f2f;font-size:13px;}
        </style><script>
        let seconds=20;setInterval(()=>{seconds--;document.getElementById('timer').textContent=seconds;
        if(seconds<=0)location.reload();},1000);
        </script></head><body>
        <div class="box"><h1>🔷 Scan QR Code</h1>
        <p>Apne <b>Bot Number</b> ke WhatsApp se scan karein!</p>
        <div class="qr"><img src="${qrUrl}" alt="QR Code" width="300" height="300"></div>
        <div class="steps"><b>Steps:</b><ol>
        <li>WhatsApp kholein (Bot Number se)</li><li>3 Dots → Linked Devices</li>
        <li>Link a Device → QR Scan karein</li></ol></div>
        <p class="refresh">⏳ Auto-refresh in <span class="timer" id="timer">20</span> seconds</p>
        <div class="reset"><a href="/reset">🔄 Not working? Click here to Reset</a></div>
        <p style="color:#666;font-size:12px;margin-top:15px;">Pakistan Welfare Society</p>
        </div></body></html>`;
    }

    return `<!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bot Loading</title><style>
    body{font-family:Arial;text-align:center;padding:40px;background:#f5f5f5;}
    .box{background:white;padding:30px;border-radius:15px;max-width:400px;margin:0 auto;}
    h1{color:#666;}.loader{border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;width:40px;height:40px;
    animation:spin 1s linear infinite;margin:20px auto;}@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
    .reset{margin-top:20px;}.reset a{color:#d32f2f;font-size:14px;}
    </style><meta http-equiv="refresh" content="8"></head><body>
    <div class="box"><h1>⏳ ${statusMessage}</h1>
    <div class="loader"></div>
    <p>Please wait...</p>
    <p style="color:#666;font-size:12px;">If stuck for more than 2 minutes, click reset below</p>
    <div class="reset"><a href="/reset">🔄 Reset / New QR Code</a></div>
    </div></body></html>`;
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 Web server running on port ${PORT}`);
    console.log(`👉 Open: https://your-service-name.onrender.com`);
    console.log(`🔄 Reset URL: https://your-service-name.onrender.com/reset\n`);
});

// ===== GET MESSAGE TEXT =====
function getMessageText(msg) {
    try {
        if (!msg || !msg.message) return '';
        const m = msg.message;
        let text = '';
        if (m.conversation) text = m.conversation;
        else if (m.extendedTextMessage && m.extendedTextMessage.text) text = m.extendedTextMessage.text;
        else if (m.imageMessage && m.imageMessage.caption) text = m.imageMessage.caption;
        else if (m.videoMessage && m.videoMessage.caption) text = m.videoMessage.caption;
        else if (m.documentMessage && m.documentMessage.caption) text = m.documentMessage.caption;
        return text.toLowerCase();
    } catch (e) { return ''; }
}

// ===== CHECK IF STATUS MENTION =====
function isStatusMention(msg) {
    try {
        if (!msg || !msg.message) return false;
        if (msg.message.groupStatusMentionMessage) return true;
        const text = getMessageText(msg);
        return text.includes('status');
    } catch (e) { return false; }
}

// ===== DELETE AUTH FILES =====
function clearAuth() {
    try {
        if (fs.existsSync(AUTH_PATH)) {
            fs.rmSync(AUTH_PATH, { recursive: true, force: true });
        }
        if (fs.existsSync(BACKUP_ZIP)) {
            fs.unlinkSync(BACKUP_ZIP);
        }
        console.log('🗑️ Auth files cleared');
    } catch (e) { console.error('Clear auth error:', e.message); }
}

// ===== WHATSAPP BOT =====
async function startBot() {
    try {
        // Step 1: Try to extract backup if auth folder doesn't exist
        extractAuthBackup();

        statusMessage = 'Loading auth state...';
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

        statusMessage = 'Fetching WhatsApp version...';
        const { version } = await fetchLatestBaileysVersion();

        statusMessage = 'Connecting to WhatsApp...';

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

        // QR Timeout
        let qrTimeout = setTimeout(() => {
            if (connectionState !== 'open') {
                console.log('⏰ QR Code timeout - clearing auth');
                qrDied = true;
                clearAuth();
                statusMessage = 'QR expired, restarting...';
                setTimeout(() => process.exit(0), 3000);
            }
        }, 120000);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                clearTimeout(qrTimeout);
                currentQR = qr;
                connectionState = 'qr';
                statusMessage = 'QR Code ready - please scan';
                console.log('\n🔷 QR Code generated!');
                console.log('👉 Open your Render URL in browser to scan!\n');

                qrTimeout = setTimeout(() => {
                    if (connectionState !== 'open') {
                        console.log('⏰ QR Code expired - restarting');
                        qrDied = true;
                        clearAuth();
                        statusMessage = 'QR expired, getting new one...';
                        setTimeout(() => process.exit(0), 3000);
                    }
                }, 60000);
            }

            if (connection === 'close') {
                clearTimeout(qrTimeout);
                connectionState = 'close';
                currentQR = null;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log('⚠️ Connection closed. Code:', statusCode, 'Reconnect:', shouldReconnect);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('🗑️ Logged out - clearing auth');
                    clearAuth();
                }

                if (shouldReconnect) {
                    statusMessage = 'Reconnecting...';
                    setTimeout(startBot, 5000);
                } else {
                    statusMessage = 'Session expired - click Reset';
                    qrDied = true;
                }
            } else if (connection === 'open') {
                clearTimeout(qrTimeout);
                connectionState = 'open';
                currentQR = null;
                qrDied = false;
                botNumber = sock.user.id;
                statusMessage = 'Bot Active';
                console.log('\n🚀 =====================================');
                console.log('🤖 Pakistan Welfare Society Bot ACTIVE!');
                console.log('📱 Bot Number: ' + botNumber);
                console.log('=====================================\n');
                console.log('💾 Download auth_backup.zip from /download-auth');
                console.log('   and upload it to GitHub for auto-login on next deploy!\n');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ===== MESSAGE HANDLER =====
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const chatId = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNumber = sender.split('@')[0];

            if (!chatId.endsWith('@g.us')) return;

            const text = getMessageText(msg);

            console.log(`\n📩 From: ${senderNumber} | Text: "${text}"`);

            // ----- FEATURE 1: Auto-delete status -----
            if (isStatusMention(msg)) {
                console.log(`🚨 STATUS MENTION! Deleting...`);
                try {
                    await sock.sendMessage(chatId, { delete: msg.key });
                    console.log('   ✅ DELETED!');
                    setTimeout(async () => {
                        try { await sock.sendMessage(chatId, { text: config.statusWarningMessage }); } catch (e) {}
                    }, 1500);
                } catch (err) {
                    console.error('   ❌ Delete failed:', err.message);
                    try {
                        const warnMsg = config.statusDeleteFailMessage.replace('{{user}}', senderNumber);
                        await sock.sendMessage(chatId, { text: warnMsg });
                    } catch (e) {}
                }
                return;
            }

            // ----- FEATURE 2: Auto-reply blood -----
            const hasBlood = config.bloodKeywords.some(k => text.includes(k.toLowerCase()));
            if (hasBlood) {
                console.log(`🩸 BLOOD REQUEST! Replying...`);
                try {
                    await sock.sendMessage(chatId, { text: config.bloodReplyMessage, quoted: msg });
                    console.log('   ✅ Reply sent');
                } catch (err) { console.error('   ❌ Reply failed:', err.message); }
                return;
            }
        });

        // ===== WELCOME =====
        sock.ev.on('group-participants.update', async (update) => {
            if (update.action === 'add') {
                try {
                    const welcomeMsg = `👋 *Welcome!*\n\n*Pakistan Welfare Society* mein khush amdeed! 🎉\n\n📌 *Group Rules:*\n• Status mention/share karna *sakht mana* hai\n• Blood request ke liye form fill karein\n\n🩸 *Blood Request Form:*\nhttps://bloodrequest.netlify.app/\n\nJazakAllah! 🤲`;
                    await sock.sendMessage(update.id, { text: welcomeMsg });
                    console.log(`👋 Welcome sent`);
                } catch (err) { console.error('Welcome error:', err.message); }
            }
        });

    } catch (err) {
        console.error('❌ Bot startup error:', err.message);
        statusMessage = 'Error starting bot - click Reset';
        qrDied = true;
    }
}

startBot();

process.on('SIGINT', async () => {
    console.log('\n🛑 Bot band ho raha hai...');
    if (sock) await sock.logout();
    process.exit(0);
});