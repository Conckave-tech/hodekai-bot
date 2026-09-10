// ============================================
// 🖤 HODEKAI BOT v5.0 - FINAL STABLE
// ============================================

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_NUMBER = process.env.BOT_NUMBER || "256775032199";

app.use(cors());
app.use(express.json());

// ─── FOLDERS ──────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'conclave_data.json');
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys_v7');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// ─── GLOBAL STATE (prevents wild reconnecting!) ──
let pairingRequested = false;
let isConnected = false;
let reconnectAttempts = 0;
let activeSocket = null;
let pairingCodeExpiry = 0;

// ─── CONFIG ──────────────────────────────
const PREFIX = ":";
const BOT_INFO = {
    NAME: "HODEKAI",
    FATHER: "HOUDEKAI",
    CO_CREATOR: "SHOUKATSU-KATSUKI",
    COMPANY: "CONCLAVE HOLDINGS",
    VERSION: "5.0.0"
};

const OWNERS = {
    FATHER: "263787876771",
    CO_CREATOR: "263717306869"
};

let MODS = ["2348123885002", "2349168527304", "256795955270", "2347031331295"];
let BLACKLIST = [];
let GROUP_WHITELIST = [];

const DM_WHITELIST = [OWNERS.FATHER, OWNERS.CO_CREATOR, ...MODS];

// ─── DATA ────────────────────────────────
let USERS = {};
let BANK = {};
let COOLDOWNS = {};
let GOVERNMENT_FUNDS = 10000000;
let BOT_ACTIVE = true;

// ─── SAVE/LOAD ────────────────────────────
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE));
            USERS = data.USERS || {};
            BANK = data.BANK || {};
            MODS = data.MODS || MODS;
            BLACKLIST = data.BLACKLIST || [];
            GOVERNMENT_FUNDS = data.GOVERNMENT_FUNDS || 10000000;
            console.log('📂 Data loaded! Users:', Object.keys(USERS).length);
        }
    } catch (e) { console.error('❌ Load error:', e.message); }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ USERS, BANK, MODS, BLACKLIST, GOVERNMENT_FUNDS }, null, 2));
        console.log('💾 Data saved!');
    } catch (e) { console.error('❌ Save error:', e.message); }
}

loadData();
setInterval(saveData, 30000);

// ─── HELPERS ──────────────────────────────
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function cleanNumber(str) { return str ? str.replace(/[^0-9]/g, "") : ""; }

function getMixedResponse() {
    return random([
        "life is just a series of disappointments.",
        "another day, another struggle.",
        "nothing really matters anymore.",
        "the void stares back.",
        "some days i just don't want to wake up.",
        "happiness is just a myth.",
        "the world is cold, and so am i.",
        "existence is pain.",
        "the darkness is my only friend.",
        "nobody really cares.",
        "i'm broken beyond repair.",
        "Power is not given, it is taken.",
        "In CONCLAVE, loyalty is the only currency that matters.",
        "The night is darkest before the dawn.",
        "In the end, only the strong survive."
    ]);
}

function isOwner(u) { return u === OWNERS.FATHER || u === OWNERS.CO_CREATOR; }
function isMod(u) { return MODS.includes(u); }
function isBlacklisted(u) { return BLACKLIST.includes(u); }
function isProtected(u) { return u === OWNERS.FATHER || u === OWNERS.CO_CREATOR || MODS.includes(u); }
function isDMAllowed(u) { return DM_WHITELIST.includes(u); }

function getUser(u) {
    if (!USERS[u]) {
        let role = "CITIZEN";
        if (u === OWNERS.FATHER) role = "FATHER";
        if (u === OWNERS.CO_CREATOR) role = "CO_CREATOR";
        if (MODS.includes(u)) role = "MOD";
        USERS[u] = {
            xenoShards: 1000, bank: 0, role,
            joinDate: new Date().toDateString(),
            warns: 0, muted: false, job: null,
            memory: { interactions: 0 },
            history: { totalEarned: 0, totalSpent: 0, workShifts: 0 }
        };
    }
    USERS[u].memory.interactions++;
    return USERS[u];
}

function getBank(u) { return BANK[u] || 0; }
function giveXS(u, amt) { getUser(u).xenoShards += amt; getUser(u).history.totalEarned += amt; }
function takeXS(u, amt) {
    if (getUser(u).xenoShards < amt) return false;
    getUser(u).xenoShards -= amt;
    getUser(u).history.totalSpent += amt;
    return true;
}

async function isWhatsAppAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const p = metadata.participants.find(x => x.id.split('@')[0].split(':')[0] === userId);
        return p && (p.admin === 'admin' || p.admin === 'superadmin');
    } catch (e) { return false; }
}

async function isBotAdmin(sock, groupId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const botId = sock.user.id.split(':')[0].split('@')[0];
        const p = metadata.participants.find(x => x.id.split('@')[0].split(':')[0] === botId);
        return p && (p.admin === 'admin' || p.admin === 'superadmin');
    } catch (e) { return false; }
}

function getHumanResponse(msg) {
    const lower = msg.toLowerCase().trim();
    if (/^(hi|hello|hey|yo|sup|hiya|heya|wassup)$/i.test(lower)) {
        return random(["tch. you're here again.", "what do you want.", "oh. it's you.", "hey. whatever.", "sup.", "yo."]);
    }
    if (lower.includes('how are you')) return random(["*sigh* tired.", "could be better.", "same as always.", "not great."]);
    if (lower.includes('hodekai') || lower.includes('bot')) return random(["you called?", "what.", "i heard that.", "yes?"]);
    if (/\b(bye|goodbye|later)\b/i.test(lower)) return random(["later.", "finally. peace.", "bye."]);
    if (lower.includes('thanks') || lower.includes('thank')) return random(["mhm.", "sure.", "whatever.", "np."]);
    return getMixedResponse();
}

// ─── MAIN HANDLER ──────────────────────────
async function handleMessage(msg, sender, isSticker, groupId, sock, contextInfo, isDM) {
    if (isBlacklisted(sender) && !isOwner(sender)) return null;
    const user = getUser(sender);
    if (user.muted && !isOwner(sender)) return null;

    // DM restriction
    if (isDM && !isDMAllowed(sender)) {
        console.log('🚫 Blocked DM from:', sender);
        return "🚫 Only MODS and OWNERS can DM the bot.";
    }

    if (isSticker) {
        return "🎨 " + random(["nice sticker", "lol", "bruh", "cool sticker", "W sticker"]);
    }

    let isWaAdmin = false;
    if (groupId) isWaAdmin = await isWhatsAppAdmin(sock, groupId, sender);

    // Non-command responses
    if (!msg || !msg.startsWith(PREFIX)) {
        if (isDM && isDMAllowed(sender)) return getHumanResponse(msg);
        if (groupId) {
            const lower = (msg || '').toLowerCase();
            if (lower.includes('hodekai') || isOwner(sender) || isMod(sender)) {
                return getHumanResponse(msg);
            }
        }
        return null;
    }

    const command = msg.slice(PREFIX.length).trim();
    const args = command.split(/\s+/);
    const cmd = args[0].toLowerCase();

    // ─── BASIC COMMANDS ──────────────────
    if (cmd === 'menu') {
        return `🖤 HODEKAI MENU v5.0
──────────────────────────
📌 INFO: :bot :profile :bal :ping :members :status :modlist
💰 ECONOMY: :daily :pay :bank
💼 JOBS: :jobs :govjob <id> :work :myjob :resign
😈 FUN: :roast :compliment
🎵 MUSIC: :play :musiclist
📦 BOXES: :boxes :all :gs
🛡️ ADMIN: :kick :mute :unmute :warn :close :open :delete
👑 OWNER: :secret :mod add/remove/list

${getMixedResponse()}`;
    }

    if (cmd === 'bot') {
        return `🖤 HODEKAI
👑 FATHER: ${OWNERS.FATHER}
🏆 CO-CREATOR: ${OWNERS.CO_CREATOR}
📊 Members: ${Object.keys(USERS).length}
⚡ Mods: ${MODS.length}
🏛️ Treasury: ${GOVERNMENT_FUNDS} XS
🟢 Status: ONLINE

${getMixedResponse()}`;
    }

    if (cmd === 'profile') {
        const bank = getBank(sender);
        return `🧥 PROFILE
📱 ${sender}
👤 Role: ${user.role}
💰 Wallet: ${user.xenoShards} XS
🏦 Bank: ${bank} XS
💎 Total: ${user.xenoShards + bank} XS
⚠️ Warns: ${user.warns}
💼 Job: ${user.job ? user.job.title : 'None'}

${getMixedResponse()}`;
    }

    if (cmd === 'bal') {
        const bank = getBank(sender);
        return `💰 Wallet: ${user.xenoShards} XS
🏦 Bank: ${bank} XS
💎 Total: ${user.xenoShards + bank} XS`;
    }

    if (cmd === 'ping') {
        try { await sock.sendMessage(groupId || sender, { react: { text: '🖤', key: msg.key } }); } catch (e) {}
        return `🖤 HODEKAI IS ALIVE!
⚡ Uptime: ${Math.floor(process.uptime())}s
📱 Status: ONLINE

tch. you called?`;
    }

    if (cmd === 'members') return `👥 Members: ${Object.keys(USERS).length}\n⚡ Mods: ${MODS.length}`;
    if (cmd === 'status') return `📊 STATUS\n🟢 ONLINE\n👥 ${Object.keys(USERS).length} members\n⚡ ${MODS.length} mods\n⏱️ Uptime: ${Math.floor(process.uptime())}s`;

    if (cmd === 'modlist') {
        let out = `⚡ POWER HIERARCHY\n──────────────────────────\n👑 OWNERS\n1. ${OWNERS.FATHER}\n2. ${OWNERS.CO_CREATOR}\n\n⚡ MODS (${MODS.length})\n`;
        MODS.forEach((m, i) => out += `${i + 1}. ${m}\n`);
        return out;
    }

    if (cmd === 'gs') {
        if (!groupId) return "❌ Groups only.";
        try {
            const meta = await sock.groupMetadata(groupId);
            const members = meta.participants.map(p => p.id.split('@')[0].split(':')[0]);
            const ownersHere = members.filter(isOwner);
            const modsHere = members.filter(isMod);
            const adminsHere = meta.participants.filter(p => p.admin).map(p => p.id.split('@')[0].split(':')[0]);

            return `📊 GROUP STATS
📋 ${meta.subject}
👥 Members: ${members.length}
🛡️ Admins: ${adminsHere.length}

👑 Owners present: ${ownersHere.length ? ownersHere.join(', ') : 'None'}
⚡ Mods present: ${modsHere.length ? modsHere.join(', ') : 'None'}
🛡️ Admins: ${adminsHere.length ? adminsHere.join(', ') : 'None'}`;
        } catch (e) { return "❌ Couldn't fetch group info."; }
    }

    if (cmd === 'boxes' || cmd === 'all') {
        return `📦 BOXES
1. :menu 2. :bot 3. :commands 4. :all 5. :boxes
6. :economy 7. :job 8. :status 9. :modlist 10. :gs`;
    }

    // ─── ECONOMY ──────────────────────
    if (cmd === 'daily') {
        const now = Date.now();
        const last = COOLDOWNS[sender]?.daily || 0;
        if (now - last < 86400000) {
            const h = Math.ceil((86400000 - (now - last)) / 3600000);
            return `⏳ Come back in ${h}h`;
        }
        giveXS(sender, 100);
        if (!COOLDOWNS[sender]) COOLDOWNS[sender] = {};
        COOLDOWNS[sender].daily = now;
        return `📅 +100 XS! Balance: ${user.xenoShards}`;
    }

    if (cmd === 'pay') {
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        const amt = parseInt(args[2]);
        if (!target || !amt) return "❌ Usage: :pay <number> <amount>";
        if (!USERS[target]) getUser(target);
        if (!takeXS(sender, amt)) return `❌ You have ${user.xenoShards} XS only.`;
        giveXS(target, amt);
        return `💸 Sent ${amt} XS to ${target}`;
    }

    if (cmd === 'bank') {
        const sub = args[1];
        if (sub === 'dep') {
            const amt = parseInt(args[2]);
            if (!amt || !takeXS(sender, amt)) return "❌ Invalid or insufficient.";
            BANK[sender] = (BANK[sender] || 0) + amt;
            return `🏦 Deposited ${amt}. Bank: ${BANK[sender]}`;
        }
        if (sub === 'wit') {
            const amt = parseInt(args[2]);
            if (!amt || (BANK[sender] || 0) < amt) return "❌ Insufficient.";
            BANK[sender] -= amt;
            giveXS(sender, amt);
            return `🏦 Withdrew ${amt}. Wallet: ${user.xenoShards}`;
        }
        if (sub === 'bal') return `🏦 Bank: ${getBank(sender)} XS`;
        return "❌ :bank dep/wit/bal";
    }

    // ─── JOBS ──────────────────────────
    if (cmd === 'jobs' || cmd === 'govjob') {
        const jobList = [
            { id: 1, title: "🗑️ Garbage Collector", salary: 50 },
            { id: 2, title: "🧹 Street Sweeper", salary: 45 },
            { id: 3, title: "🌳 Gardener", salary: 55 },
            { id: 4, title: "📦 Warehouse Worker", salary: 60 },
            { id: 5, title: "🍳 Cook", salary: 70 },
            { id: 6, title: "🧑‍🏫 Teacher", salary: 80 },
            { id: 7, title: "💻 Developer", salary: 150 },
            { id: 8, title: "🩺 Doctor", salary: 200 },
            { id: 9, title: "🚀 Engineer", salary: 220 },
            { id: 10, title: "🧑‍💼 CEO", salary: 250 }
        ];

        if (cmd === 'jobs') {
            let out = "💼 AVAILABLE JOBS\n──────────────────────────\n";
            jobList.forEach(j => out += `${j.id}. ${j.title} - ${j.salary} XS\n`);
            return out + `\n💡 :govjob <id> to take one`;
        }

        if (user.job) return "❌ You already have a job!";
        const id = parseInt(args[1]);
        if (!id) {
            let out = "💼 Choose a job:\n";
            jobList.forEach(j => out += `${j.id}. ${j.title} - ${j.salary} XS\n`);
            return out;
        }
        const job = jobList.find(j => j.id === id);
        if (!job) return "❌ Invalid job ID.";
        user.job = { id: job.id, title: job.title, salary: job.salary, shifts: 0, lastWork: 0 };
        return `🏛️ JOB TAKEN: ${job.title}\n💰 ${job.salary} XS/shift\n💡 :work to earn!`;
    }

    if (cmd === 'work') {
        if (!user.job) return "❌ No job. :govjob";
        const now = Date.now();
        if (now - (user.job.lastWork || 0) < 1200000) {
            const r = Math.ceil((1200000 - (now - (user.job.lastWork || 0))) / 60000);
            return `⏳ Wait ${r} min.`;
        }
        const earnings = user.job.salary;
        giveXS(sender, earnings);
        user.job.shifts = (user.job.shifts || 0) + 1;
        user.job.lastWork = now;
        return `✅ WORK DONE! +${earnings} XS\n📈 Shifts: ${user.job.shifts}`;
    }

    if (cmd === 'myjob') {
        if (!user.job) return "❌ No job.";
        return `💼 ${user.job.title}\n💰 ${user.job.salary} XS/shift\n📊 Shifts: ${user.job.shifts || 0}`;
    }

    if (cmd === 'resign') {
        if (!user.job) return "❌ No job.";
        const t = user.job.title;
        user.job = null;
        return `📋 Resigned from ${t}.`;
    }

    // ─── ROAST / COMPLIMENT ──────────────
    if (cmd === 'roast') {
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ :roast @user OR reply with :roast";
        if (sender === target) return "❌ Can't roast yourself.";
        if (!USERS[target]) getUser(target);
        const roasts = [
            "You're like a software update - nobody wants you.",
            "Your brain is like a browser - 10 tabs open and frozen.",
            "You're the NPC everyone skips.",
            "You're proof evolution can go in reverse.",
            "You're the reason they put instructions on shampoo bottles.",
            "I'd roast you but that's a waste of fire."
        ];
        return `🔥 ${target} ROASTED!\n💀 ${random(roasts)}\n📝 By: ${sender}`;
    }

    if (cmd === 'compliment') {
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ :compliment @user";
        if (sender === target) return "❌ Can't compliment yourself.";
        if (!USERS[target]) getUser(target);
        const comps = [
            "You're actually not that bad.",
            "You have potential... don't waste it.",
            "You're doing better than most.",
            "You have moments of being tolerable."
        ];
        return `💖 ${target} COMPLIMENTED!\n✨ ${random(comps)}\n💝 By: ${sender}`;
    }

    // ─── MUSIC ──────────────────────────
    if (cmd === 'play') {
        const song = command.slice(5).trim();
        if (!song) return "❌ :play <song>";
        try { await sock.sendMessage(groupId || sender, { react: { text: '🎵', key: msg.key } }); } catch (e) {}
        return `🎵 NOW PLAYING: ${song}
──────────────────────────
▶️ YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(song)}
🎧 Spotify: https://open.spotify.com/search/${encodeURIComponent(song)}

${getMixedResponse()}`;
    }

    if (cmd === 'musiclist') {
        return `🎵 MUSIC\n:play <song> to search\n\nPopular:\n• despacito\n• shape of you\n• blinding lights\n• dance monkey`;
    }

    // ─── ADMIN (require WhatsApp admin/mods/owners + bot admin) ──
    if (['kick', 'mute', 'unmute', 'warn', 'close', 'open', 'delete'].includes(cmd)) {
        if (!(isOwner(sender) || isMod(sender) || isWaAdmin)) {
            return "❌ Only ADMINS, MODS, and OWNERS can use this.";
        }
        if (!groupId) return "❌ Groups only.";

        const botAdmin = await isBotAdmin(sock, groupId);
        if (!botAdmin) return "❌ BOT NEEDS TO BE ADMIN for this command.";

        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);

        if (cmd === 'kick') {
            if (!target) return "❌ :kick @user";
            if (isProtected(target)) return "❌ Protected user.";
            try {
                await sock.groupParticipantsUpdate(groupId, [target + "@s.whatsapp.net"], "remove");
                return `⚠️ ${target} kicked.`;
            } catch (e) { return "❌ " + e.message; }
        }
        if (cmd === 'mute') {
            if (!target) return "❌ :mute @user";
            getUser(target).muted = true;
            return `🔇 ${target} muted.`;
        }
        if (cmd === 'unmute') {
            if (!target) return "❌ :unmute @user";
            getUser(target).muted = false;
            return `🔊 ${target} unmuted.`;
        }
        if (cmd === 'warn') {
            if (!target) return "❌ :warn @user";
            getUser(target).warns++;
            return `⚠️ ${target} warned (${getUser(target).warns}/3).`;
        }
        if (cmd === 'close') {
            try { await sock.groupSettingUpdate(groupId, "announcement"); return "🔒 GROUP CLOSED"; }
            catch (e) { return "❌ " + e.message; }
        }
        if (cmd === 'open') {
            try { await sock.groupSettingUpdate(groupId, "not_announcement"); return "🔓 GROUP OPENED"; }
            catch (e) { return "❌ " + e.message; }
        }
        if (cmd === 'delete') {
            const n = parseInt(args[1]);
            if (!n || n < 1 || n > 50) return "❌ :delete <1-50>";
            return `🗑️ ${n} messages marked.`;
        }
    }

    // ─── MOD MANAGEMENT ──────────────────
    if (cmd === 'mod') {
        if (!isOwner(sender)) return "❌ Owners only.";
        const sub = args[1];
        const target = cleanNumber(args[2]);
        if (sub === 'add' && target) {
            if (!MODS.includes(target)) {
                MODS.push(target);
                DM_WHITELIST.push(target);
                saveData();
                return `✅ Added ${target} as MOD.`;
            }
            return "ℹ️ Already mod.";
        }
        if (sub === 'remove' && target) {
            MODS = MODS.filter(m => m !== target);
            saveData();
            return `✅ Removed ${target}.`;
        }
        if (sub === 'list' || !sub) {
            return `⚡ MODS (${MODS.length})\n` + MODS.map((m, i) => `${i + 1}. ${m}`).join('\n');
        }
        return "❌ :mod add/remove/list";
    }

    // ─── SECRET OWNER ──────────────────
    if (cmd === 'secret') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        return `🔒 SECRET OWNER
:addmoney <num> <amt>
:removemoney <num> <amt>
:viewall
:resetuser <num>
:emergency`;
    }

    if (cmd === 'addmoney' && isOwner(sender)) {
        const t = cleanNumber(args[1]);
        const a = parseInt(args[2]);
        if (!t || !a) return "❌ :addmoney <num> <amt>";
        if (!USERS[t]) getUser(t);
        giveXS(t, a);
        return `✅ +${a} XS to ${t}`;
    }

    if (cmd === 'removemoney' && isOwner(sender)) {
        const t = cleanNumber(args[1]);
        const a = parseInt(args[2]);
        if (!t || !a) return "❌ :removemoney <num> <amt>";
        takeXS(t, a);
        return `✅ -${a} XS from ${t}`;
    }

    if (cmd === 'viewall' && isOwner(sender)) {
        let out = `📊 USERS (${Object.keys(USERS).length})\n`;
        Object.entries(USERS).slice(0, 20).forEach(([n, u]) => out += `${n}: ${u.xenoShards} XS\n`);
        return out;
    }

    if (cmd === 'emergency' && isOwner(sender)) {
        BOT_ACTIVE = true;
        return "⚠️ Emergency override.";
    }

    if (cmd === 'resetuser' && isOwner(sender)) {
        const t = cleanNumber(args[1]);
        if (!t || !USERS[t]) return "❌ User not found.";
        USERS[t] = null;
        return `✅ ${t} reset.`;
    }

    return `❌ Unknown: ${PREFIX}${cmd}\n💡 :menu\n\n${getMixedResponse()}`;
}

// ─── WHATSAPP CONNECTION (FIXED!) ─────────
async function connectToWhatsApp() {
    if (isConnected && activeSocket) {
        console.log('✅ Already connected. Skipping.');
        return;
    }
    if (reconnectAttempts >= 3) {
        console.log('❌ Max reconnects. Redeploy to restart.');
        return;
    }

    try {
        console.log('📱 Starting WhatsApp connection...');
        console.log(`📱 Bot number: ${BOT_NUMBER}`);
        console.log(`🔄 Reconnect attempts: ${reconnectAttempts}/3`);

        // Close old socket
        if (activeSocket) {
            try { activeSocket.end(undefined); } catch (e) {}
            activeSocket = null;
        }

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            keepAliveIntervalMs: 30000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        });

        activeSocket = sock;

        // Request pairing code ONLY once (global flag)
        if (!state.creds.registered && !pairingRequested) {
            pairingRequested = true;
            setTimeout(async () => {
                try {
                    if (state.creds.registered) return;
                    console.log('🔑 REQUESTING PAIRING CODE...');
                    const code = await sock.requestPairingCode(BOT_NUMBER);
                    pairingCodeExpiry = Date.now() + (5 * 60 * 1000); // 5 min expiry

                    console.log('\n╔══════════════════════════════════════════╗');
                    console.log('║     🔑 YOUR PAIRING CODE                 ║');
                    console.log('║                                          ║');
                    console.log(`║     📱 CODE: ${code}                 ║`);
                    console.log('║                                          ║');
                    console.log('║  ⏰ Expires in 5 minutes                ║');
                    console.log('║  → WhatsApp → Linked Devices             ║');
                    console.log('║  → Link with Phone Number                ║');
                    console.log('╚══════════════════════════════════════════╝\n');
                } catch (err) {
                    console.error('❌ Pairing error:', err.message);
                }
            }, 3000);
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                isConnected = true;
                reconnectAttempts = 0;
                console.log('\n╔══════════════════════════════════════════╗');
                console.log('║   🖤 HODEKAI BOT CONNECTED! 🖤           ║');
                console.log('║   CONCLAVE AWAITS!!!                    ║');
                console.log('╚══════════════════════════════════════════╝\n');
            }

            if (connection === 'close') {
                isConnected = false;
                const code = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = code === DisconnectReason.loggedOut;

                console.log(`⚠️ Closed. Code: ${code || 'unknown'}`);

                if (loggedOut) {
                    console.log('🚪 Logged out. Delete auth folder to re-pair.');
                    return;
                }

                if (reconnectAttempts < 3) {
                    reconnectAttempts++;
                    console.log(`🔄 Reconnect ${reconnectAttempts}/3 in 5s...`);
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    console.log('❌ Max reconnects. Redeploy on Render.');
                }
            }
        });

        sock.ev.on('messages.upsert', async m => {
            if (!BOT_ACTIVE) return;
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                try {
                    if (!msg.message || msg.key.fromMe) continue;

                    const isGroup = msg.key.remoteJid.endsWith('@g.us');
                    const rawSender = isGroup ? msg.key.participant : msg.key.remoteJid;
                    if (!rawSender) continue;

                    const sender = rawSender.split('@')[0].split(':')[0];

                    let text = '';
                    let isSticker = false;

                    if (msg.message.conversation) text = msg.message.conversation;
                    else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
                    else if (msg.message.stickerMessage) isSticker = true;
                    else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption;

                    const contextInfo = msg.message.extendedTextMessage?.contextInfo;

                    console.log(`📩 ${sender} | Group: ${isGroup} | ${text || '[sticker]'}`);

                    const reply = await handleMessage(text, sender, isSticker, msg.key.remoteJid, sock, contextInfo, !isGroup);

                    if (reply && typeof reply === 'string' && reply.trim()) {
                        await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
                    }
                } catch (e) { console.error('❌ Error:', e.message); }
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        if (reconnectAttempts < 3) {
            reconnectAttempts++;
            setTimeout(connectToWhatsApp, 5000);
        }
    }
}

// ─── START ─────────────────────────────────
console.log('🖤 HODEKAI BOT v5.0');
console.log('🏛️ CONCLAVE AWAITS!!!');
connectToWhatsApp();

// ─── EXPRESS SERVER (keeps Render awake) ───
app.get('/', (req, res) => {
    res.json({
        status: "🖤 ONLINE",
        message: "CONCLAVE AWAITS!!!",
        members: Object.keys(USERS).length,
        uptime: process.uptime(),
        whatsapp: isConnected ? "CONNECTED" : "DISCONNECTED"
    });
});

app.get('/ping', (req, res) => res.send('pong'));

app.listen(PORT, () => {
    console.log(`🌐 Web server on port ${PORT}`);
    console.log(`📱 ${isConnected ? 'CONNECTED' : 'CONNECTING...'}`);
});

// ─── PROCESS HANDLERS ──────────────────────
process.on('SIGINT', () => { saveData(); process.exit(0); });
process.on('SIGTERM', () => { saveData(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌', e.message); saveData(); });
process.on('unhandledRejection', (e) => { console.error('❌', e); }); 
