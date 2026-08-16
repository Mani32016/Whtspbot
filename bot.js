const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    delay,
    getContentType
} = require('@whiskeysockets/baileys');
const config = require('./config');
const pino = require('pino')({ level: 'silent' });
const express = require('express');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

let sock = null;
let currentQR = null;
let connectionState = 'connecting';

const app = express();
const PORT = process.env.PORT || 10000;

// ===== WEB SERVER =====
app.get('/', (req, res) => {
    if (connectionState === 'open') {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pakistan Welfare Bot - Active</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 40px; background: #e8f5e9; }
                .box { background: white; padding: 30px; border-radius: 15px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                h1 { color: #2e7d32; }
                .status { color: green; font-size: 20px; font-weight: bold; }
                .features { text-align: left; margin-top: 20px; }
                .features li { margin: 8px 0; color: #333; }
                .backup { margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 8px; }
                .backup a { color: #e65100; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>🤖 Pakistan Welfare Bot</h1>
                <p class="status">✅ ACTIVE & RUNNING</p>
                <p>Bot is connected and monitoring groups!</p>
                <ul class="features">
                    <li>🗑️ Auto-delete status mentions/shares</li>
                    <li>🩸 Auto-reply blood requests</li>
                    <li>👋 Welcome new members</li>
                </ul>
                <div class="backup">
                    <b>💾 Session Backup:</b><br>
                    <a href="/download-auth">Download Auth Files</a><br>
                    <small>(Save these to avoid QR scan on next deploy)</small>
                </div>
                <p style="margin-top:20px;color:#666;font-size:12px;">Powered by Pakistan Welfare Society</p>
            </div>
        </body>
        </html>`);
    } else if (currentQR) {
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(currentQR)}`;
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pakistan Welfare Bot - Scan QR</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 20px; background: #fff3e0; }
                .box { background: white; padding: 25px; border-radius: 15px; max-width: 450px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                h1 { color: #e65100; font-size: 22px; }
                .qr { margin: 20px 0; border: 3px dashed #ff9800; padding: 10px; border-radius: 10px; }
                .qr img { max-width: 100%; height: auto; }
                .steps { text-align: left; background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .steps li { margin: 8px 0; color: #333; }
                .refresh { color: #666; font-size: 13px; margin-top: 15px; }
                .timer { color: #d32f2f; font-weight: bold; }
            </style>
            <script>
                let seconds = 20;
                setInterval(() => {
                    seconds--;
                    document.getElementById('timer').textContent = seconds;
                    if (seconds <= 0) location.reload();
                }, 1000);
            </script>
        </head>
        <body>
            <div class="box">
                <h1>🔷 Scan QR Code</h1>
                <p>Apne <b>Bot Number</b> ke WhatsApp se scan karein!</p>
                <div class="qr">
                    <img src="${qrImageUrl}" alt="QR Code" width="300" height="300">
                </div>
                <div class="steps">
                    <b>Steps:</b>
                    <ol>
                        <li>WhatsApp kholein (Bot Number se)</li>
                        <li>3 Dots → Linked Devices</li>
                        <li>Link a Device → QR Scan karein</li>
                    </ol>
                </div>
                <p class="refresh">⏳ Auto-refresh in <span class="timer" id="timer">20</span> seconds</p>
                <p style="color:#666;font-size:12px;margin-top:15px;">Pakistan Welfare Society</p>
            </div>
        </body>
        </html>`);
    } else {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pakistan Welfare Bot - Loading</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 40px; background: #f5f5f5; }
                .box { background: white; padding: 30px; border-radius: 15px; max-width: 400px; margin: 0 auto; }
                h1 { color: #666; }
                .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
            <meta http-equiv="refresh" content="5">
        </head>
        <body>
            <div class="box">
                <h1>⏳ Bot Initializing...</h1>
                <div class="loader"></div>
                <p>Please wait, QR Code will appear shortly...</p>
                <p style="color:#666;font-size:12px;">Refresh this page in a few seconds</p>
            </div>
        </body>
        </html>`);
    }
});

app.get('/download-auth', (req, res) => {
    try {
        const authPath = path.join(__dirname, 'auth_info_baileys');
        if (!fs.existsSync(authPath)) {
            return res.status(404).send('Auth files not found. Connect bot first.');
        }
        const zip = new AdmZip();
        zip.addLocalFolder(authPath, 'auth_info_baileys');
        const zipBuffer = zip.toBuffer();
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=auth_backup.zip');
        res.send(zipBuffer);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 Web server running on port ${PORT}`);
    console.log(`👉 Open: https://your-service-name.onrender.com\n`);
});

// ===== ULTIMATE TEXT EXTRACTION =====
// This function searches EVERYWHERE for text in the message
function extractAllText(msg) {
    try {
        if (!msg || !msg.message) return '';

        const message = msg.message;
        let allText = '';

        // Method 1: Direct text fields
        if (message.conversation) allText += ' ' + message.conversation;
        if (message.extendedTextMessage?.text) allText += ' ' + message.extendedTextMessage.text;
        if (message.imageMessage?.caption) allText += ' ' + message.imageMessage.caption;
        if (message.videoMessage?.caption) allText += ' ' + message.videoMessage.caption;
        if (message.documentMessage?.caption) allText += ' ' + message.documentMessage.caption;

        // Method 2: Check quoted message
        if (message.extendedTextMessage?.contextInfo?.quotedMessage) {
            const qm = message.extendedTextMessage.contextInfo.quotedMessage;
            if (qm.conversation) allText += ' ' + qm.conversation;
            if (qm.extendedTextMessage?.text) allText += ' ' + qm.extendedTextMessage.text;
            if (qm.imageMessage?.caption) allText += ' ' + qm.imageMessage.caption;
        }

        // Method 3: DEEP SEARCH - Convert entire message to string and extract text
        // This catches ANY text anywhere in the message object
        const msgString = JSON.stringify(message);

        // Look for text patterns in the JSON
        const textMatches = msgString.match(/"text":"([^"]+)"/g);
        if (textMatches) {
            textMatches.forEach(match => {
                const text = match.replace('"text":"', '').replace('"', '');
                if (text && text.length > 1) allText += ' ' + text;
            });
        }

        // Look for caption patterns
        const captionMatches = msgString.match(/"caption":"([^"]+)"/g);
        if (captionMatches) {
            captionMatches.forEach(match => {
                const text = match.replace('"caption":"', '').replace('"', '');
                if (text && text.length > 1) allText += ' ' + text;
            });
        }

        // Method 4: Check for special message types
        // Group status mention, etc.
        const msgKeys = Object.keys(message);
        console.log(`   Message types: ${msgKeys.join(', ')}`);

        return allText.toLowerCase().trim();
    } catch (err) {
        console.error('Extract error:', err.message);
        return '';
    }
}

// ===== WHATSAPP BOT =====
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

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = qr;
            connectionState = 'qr';
            console.log('\n🔷 QR Code generated!');
            console.log('👉 Open your Render URL in browser to scan!\n');
        }

        if (connection === 'close') {
            connectionState = 'close';
            currentQR = null;
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(startBot, 5000);
            }
        } else if (connection === 'open') {
            connectionState = 'open';
            currentQR = null;
            console.log('\n🚀 =====================================');
            console.log('🤖 Pakistan Welfare Society Bot ACTIVE!');
            console.log('📱 Bot Number: ' + sock.user.id);
            console.log('=====================================\n');
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

        // Only group messages
        if (!chatId.endsWith('@g.us')) return;

        // Extract ALL text using ultimate method
        const allText = extractAllText(msg);

        console.log(`\n📩 From: ${senderNumber}`);
        console.log(`   Full Text: "${allText.substring(0, 100)}"`);

        // ----- FEATURE 1: Auto-delete status -----
        const hasStatus = config.statusKeywords.some(k => allText.includes(k.toLowerCase()));

        if (hasStatus) {
            console.log(`🚨 STATUS FOUND! Deleting...`);

            try {
                await sock.sendMessage(chatId, { delete: msg.key });
                console.log('   ✅ DELETED!');

                setTimeout(async () => {
                    try {
                        await sock.sendMessage(chatId, { text: config.statusWarningMessage });
                    } catch (e) {}
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
        const hasBlood = config.bloodKeywords.some(k => allText.includes(k.toLowerCase()));

        if (hasBlood) {
            console.log(`🩸 BLOOD REQUEST! Replying...`);

            try {
                await sock.sendMessage(chatId, { 
                    text: config.bloodReplyMessage,
                    quoted: msg
                });
                console.log('   ✅ Reply sent');
            } catch (err) {
                console.error('   ❌ Reply failed:', err.message);
            }
            return;
        }
    });

    // ===== WELCOME =====
    sock.ev.on('group-participants.update', async (update) => {
        if (update.action === 'add') {
            const chatId = update.id;
            try {
                const welcomeMsg = `👋 *Welcome!*\n\n*Pakistan Welfare Society* mein khush amdeed! 🎉\n\n📌 *Group Rules:*\n• Status mention/share karna *sakht mana* hai\n• Blood request ke liye form fill karein\n\n🩸 *Blood Request Form:*\nhttps://bloodrequest.netlify.app/\n\nJazakAllah! 🤲`;
                await sock.sendMessage(chatId, { text: welcomeMsg });
                console.log(`👋 Welcome sent`);
            } catch (err) {
                console.error('Welcome error:', err.message);
            }
        }
    });
}

startBot();

process.on('SIGINT', async () => {
    console.log('\n🛑 Bot band ho raha hai...');
    if (sock) await sock.logout();
    process.exit(0);
});