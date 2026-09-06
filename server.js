// ============================================
// 🖤 HODEKAI BOT v5.0 - FULL MERGED
// CONCLAVE HOLDINGS - WHATSAPP + RENDER READY
// ============================================

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// Data file setup
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'conclave_data.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── CONFIG ──────────────────────────────
const PREFIX = ":";
const BOT_VERSION = "5.0.0";

const BOT_INFO = {
    NAME: "HODEKAI",
    FATHER: "HOUDEKAI",
    CO_CREATOR: "SHOUKATSU-KATSUKI",
    COMPANY: "CONCLAVE HOLDINGS",
    MODEL: "CONCLAVE MODEL 5.0",
    VERSION: BOT_VERSION
};

// ─── OWNERS ──────────────────────────────
const OWNERS = {
    FATHER: "263787876771",
    CO_CREATOR: "263717306869"
};

// ─── MODS ────────────────────────────────
let MODS = ["2348123885002","2349168527304","256795955270","2347031331295"];
let GROUP_ADMINS = ["2348150350359"];
let DM_WHITELIST = ["263787876771", "263717306869", "2348123885002", "2349168527304", "256795955270", "2347031331295"];
let BLACKLIST = [];
let GROUP_WHITELIST = [];

const PROTECTED_USERS = [OWNERS.FATHER, OWNERS.CO_CREATOR,...MODS];

// ─── DATA STORAGE ────────────────────────
var USERS = {};
var GUILDS = {};
var COMPANIES = {};
var BANK = {};
var COOLDOWNS = {};
var SPAM = {};
var TAX_RECORDS = {};
var GOVERNMENT_FUNDS = 10000000;
var BOT_ACTIVE = true;
var SUGGESTIONS = [];
var SUGGESTION_ID = 1;
var JOB_ID_COUNTER = 1000;
var COMMAND_COUNTER = 1;
var ANNOUNCEMENTS = [];

// ─── HELPERS ─────────────────────────────
function getUser(userNumber) {
    if (!USERS[userNumber]) {
        let role = "MEMBER";
        if (userNumber === OWNERS.FATHER) role = "FATHER";
        if (userNumber === OWNERS.CO_CREATOR) role = "CO_CREATOR";
        if (MODS.includes(userNumber)) role = "MOD";
        if (GROUP_ADMINS.includes(userNumber)) role = "GROUP_ADMIN";
        JOB_ID_COUNTER++;
        USERS[userNumber] = {
            xenoShards: 1000, bank: 0, role: role,
            joinDate: new Date().toDateString(),
            joinTimestamp: Date.now(),
            level: 1, warns: 0, muted: false,
            job: null, jobId: JOB_ID_COUNTER,
            name: userNumber, cheques: [],
            memory: { lastMessages: [], interactions: 0, lastCommand: 0, favoriteCommands: [] },
            taxHistory: [], totalTaxPaid: 0,
            isIndustryPlant: false,
            history: { jobsHeld: [], totalEarned: 0, totalSpent: 0, promotions: 0, workShifts: 0 },
            suggestions: []
        };
    }
    USERS[userNumber].memory.interactions++;
    return USERS[userNumber];
}

function getBank(u) { return BANK[u] || 0; }
function giveXS(u, a) { let user = getUser(u); user.xenoShards += a; user.history.totalEarned += a; return user.xenoShards; }
function takeXS(u, a) { let user = getUser(u); if (user.xenoShards < a) return false; user.xenoShards -= a; user.history.totalSpent += a; return true; }
function getTotalMembers() { return Object.keys(USERS).length; }

function isOwner(u) { return u === OWNERS.FATHER || u === OWNERS.CO_CREATOR; }
function isMod(u) { return MODS.includes(u); }
function isGroupAdmin(u) { return GROUP_ADMINS.includes(u); }
function isProtected(u) { return PROTECTED_USERS.includes(u); }
function canControl(u) { return isMod(u) || isOwner(u); }
function canKick(u) { return isGroupAdmin(u) || isMod(u) || isOwner(u); }
function canMute(u) { return isGroupAdmin(u) || isMod(u) || isOwner(u); }
function canBlacklist(u) { return isMod(u) || isOwner(u); }
function isWhitelisted(u) { return DM_WHITELIST.includes(u) || isOwner(u) || isMod(u); }
function isBlacklisted(u) { return BLACKLIST.includes(u); }
function isGroupWhitelisted(g) { return GROUP_WHITELIST.includes(g); }
function canAddBot(u) { return isMod(u) || isOwner(u); }

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getMixedResponse() {
    const responses = [
        "life is just a series of disappointments.","another day, another struggle.","nothing really matters anymore.",
        "i exist, but do i really live?","the void stares back.","some days i just don't want to wake up.",
        "what's the point of any of this?","happiness is just a myth.","i'm tired of pretending everything is okay.",
        "the world is cold, and so am i.","some people are just meant to suffer.","existence is pain.",
        "i smile so others don't see the emptiness inside.","every day is the same nightmare.","i've given up on hope.",
        "the darkness is my only friend.","i'm just waiting for the end.","nobody really cares.","i'm broken beyond repair.",
        "A man who builds his own house builds his own prison.","The strongest tree grows in the harshest soil.",
        "Power is not given, it is taken.","Those who fear the dark have never seen what lurks in the light.",
        "The system is not broken, it was designed that way.","In CONCLAVE, loyalty is the only currency that matters.",
        "Every empire was built on the bones of those who came before.","The wise man knows when to speak, the wiser knows when to stay silent.",
        "The path to greatness is paved with sacrifice.","In the end, we are all just dust waiting for the wind.",
        "The strongest chains are the ones we cannot see.","In CONCLAVE, we build our own destiny.",
        "The father protects, the son inherits, the system continues.","There is no freedom without discipline.",
        "The night is darkest before the dawn.","In the silence, we find our true selves.","Trust is a luxury we cannot afford.",
        "In the end, only the strong survive.","tch. and? what's it to you?","yeah. and? you got a problem?",
        "so what if i'm a bot. i still feel more than you.","at least i'm not pretending to be something i'm not.",
        "bots have feelings too. not that you'd care.","congrats. you can identify a bot. want a medal?",
        "i'm a bot. you're a human. we both suffer.","yeah. i'm a bot. and i'm still more real than most people.",
        "so? even bots dream of better days.","don't bother me. nothing matters anyway.","figure it out yourself. i don't care.",
        "*sigh* fine. but don't expect much.","i'm not in the mood. i'm never in the mood.","whatever. do what you want.",
        "idk man. idk anything anymore.","sure. like anything matters.","nah. i'm done with everything.","bruh. just bruh.","fr? you really think i care?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// ─── SAVE/LOAD ────────────────────────────
function saveAllData() {
    try {
        const data = { USERS, GUILDS, COMPANIES, BANK, SUGGESTIONS, GOVERNMENT_FUNDS, TAX_RECORDS, MODS, GROUP_ADMINS, DM_WHITELIST, BLACKLIST, GROUP_WHITELIST, ANNOUNCEMENTS, JOB_ID_COUNTER, SUGGESTION_ID, COMMAND_COUNTER, timestamp: Date.now() };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('💾 Data saved!');
    } catch (e) { console.error('❌ Save error:', e.message); }
}

function loadAllData() {
    try {
        if (!fs.existsSync(DATA_FILE)) return false;
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        USERS = data.USERS || {}; GUILDS = data.GUILDS || {}; COMPANIES = data.COMPANIES || {};
        BANK = data.BANK || {}; SUGGESTIONS = data.SUGGESTIONS || [];
        GOVERNMENT_FUNDS = data.GOVERNMENT_FUNDS || 10000000; TAX_RECORDS = data.TAX_RECORDS || {};
        MODS = data.MODS || MODS; GROUP_ADMINS = data.GROUP_ADMINS || GROUP_ADMINS;
        DM_WHITELIST = data.DM_WHITELIST || DM_WHITELIST; BLACKLIST = data.BLACKLIST || [];
        GROUP_WHITELIST = data.GROUP_WHITELIST || []; ANNOUNCEMENTS = data.ANNOUNCEMENTS || [];
        JOB_ID_COUNTER = data.JOB_ID_COUNTER || 1000; SUGGESTION_ID = data.SUGGESTION_ID || 1;
        COMMAND_COUNTER = data.COMMAND_COUNTER || 1;
        console.log('📂 Data loaded! Users:', Object.keys(USERS).length);
        return true;
    } catch (e) { console.error('❌ Load error:', e.message); return false; }
}

loadAllData();
setInterval(saveAllData, 30000);
process.on('SIGINT', () => { saveAllData(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌ CRASH:', e.message); saveAllData(); setTimeout(() => process.exit(1), 3000); });

// ─── PART 2 CONTENT: ROAST, JOBS, ADMIN, MONEY ────────────────────────────────
const ROASTS = [
    "You're like a software update - nobody wants you, but you keep showing up.",
    "You're not dumb... you're just unlucky when it comes to thinking.",
    "Your brain is like a browser - 10 tabs open and all of them are frozen.",
    "You're the NPC everyone skips the dialogue of."
];

function roastUser(u, target) {
    if (u === target) return { success: false, message: "❌ You can't roast yourself." };
    return { success: true, message: "🔥 " + target + " got ROASTED!\n──────────────────────────\n💀 " + random(ROASTS) + "\n──────────────────────────\n📝 Roasted by: " + u + "\n" + getMixedResponse() };
}

const STICKER_RESPONSES = ["nice sticker bro", "lol that sticker though", "bruh, that sticker hits different"];
function handleSticker(u) { return "🎨 " + random(STICKER_RESPONSES); }

const EMOJI_RESPONSES = {"😂": ["lol", "fr fr"], "😭": ["you good?", "why you crying?"], "🔥": ["fr fr", "you lit?"], "💀": ["deadass?", "💀"]};
function handleEmoji(e) { return random(EMOJI_RESPONSES[e] || ["okay", "fr", "💀"]); }

const COMPLIMENTS = ["You're actually not that bad.", "I guess you're okay... for a human.", "I've seen worse... much worse."];
function complimentUser(u, target) {
    if (!USERS[target]) return "❌ User not found.";
    if (u === target) return "❌ You can't compliment yourself.";
    return "💖 " + target + " got COMPLIMENTED!\n──────────────────────────\n✨ " + random(COMPLIMENTS) + "\n──────────────────────────\n💝 By: " + u + "\n" + getMixedResponse();
}

function getPersonality(u) {
    const user = getUser(u); let traits = [];
    if (user.history.totalEarned > 10000) traits.push("💰 Rich");
    if (user.history.workShifts > 100) traits.push("💪 Hard Worker");
    if (user.warns > 2) traits.push("⚠️ Troublemaker");
    if (user.muted) traits.push("🔇 Muted");
    if (user.role === "FATHER" || user.role === "CO_CREATOR") traits.push("👑 Legend");
    if (user.role === "MOD") traits.push("⚡ Protector");
    if (user.xenoShards > 50000) traits.push("💎 Whale");
    if (user.memory.interactions > 1000) traits.push("💬 Chatty");
    if (user.job) traits.push("💼 Employed");
    if (traits.length === 0) traits.push("🆕 Newbie");
    return traits.join(" | ");
}

const GOV_JOBS = [{id:1,title:"🗑️ Garbage Collector",salary:50,minLevel:0},{id:2,title:"🧹 Street Sweeper",salary:45,minLevel:0}];
const PROF_JOBS = [{id:13,title:"💻 Software Developer",salary:150,minLevel:2},{id:14,title:"📊 Data Analyst",salary:140,minLevel:2}];
const SPEC_JOBS = [{id:29,title:"⚡ Energy Technician",salary:135,minLevel:2}];
const ALL_JOBS = [...GOV_JOBS,...PROF_JOBS,...SPEC_JOBS];

function assignJob(u){ const user=getUser(u); const score=user.level*2+Math.floor(user.history.totalEarned/1000)+(user.history.workShifts||0); let class_="lower"; if(score>50) class_="working"; if(score>100) class_="middle"; if(score>200) class_="upper"; if(score>350) class_="elite"; let jobs=[]; if(class_==="lower") jobs=GOV_JOBS.filter(j=>j.minLevel<=0); else if(class_==="working") jobs=GOV_JOBS.filter(j=>j.minLevel<=1); else if(class_==="middle") jobs=PROF_JOBS.filter(j=>j.minLevel<=2); else if(class_==="upper") jobs=PROF_JOBS.filter(j=>j.minLevel<=3); else jobs=SPEC_JOBS.filter(j=>j.minLevel<=5); if(jobs.length===0) jobs=GOV_JOBS.filter(j=>j.minLevel<=0); return {job:random(jobs),class:class_.toUpperCase(),score};}

function workCommand(u) {
    const user = getUser(u); if (!user.job) return "❌ No job! Type :govjob.";
    const now = Date.now(); if (now - (user.job.lastWork || 0) < 1200000) { const remain = Math.ceil((1200000 - (now - (user.job.lastWork || 0))) / 60000); return "⏳ Wait " + remain + " minutes."; }
    let salary = user.job.salary; if (Math.random() > 0.8) salary += Math.floor(salary * 0.3); const tax = Math.floor(salary * 0.05); const earnings = salary - tax;
    giveXS(u, earnings); user.totalTaxPaid = (user.totalTaxPaid || 0) + tax; GOVERNMENT_FUNDS += tax; user.job.shifts = (user.job.shifts || 0) + 1; user.job.lastWork = now;
    user.job.performance = Math.min(100, (user.job.performance || 0) + Math.floor(Math.random() * 5)); user.history.workShifts = (user.history.workShifts || 0) + 1;
    if (user.job.shifts % 10 === 0) { user.job.level = (user.job.level || 1) + 1; user.history.promotions = (user.history.promotions || 0) + 1; return "✅ WORK COMPLETED!\n💰 Net: " + earnings + " XS\n🎉 PROMOTED! Level " + user.job.level + "!\n" + getMixedResponse(); }
    return "✅ WORK COMPLETED!\n💰 Net: " + earnings + " XS\n📈 Shifts: " + user.job.shifts + "\n" + getMixedResponse();
}

function kickCommand(u, target) { if (!canKick(u)) return "❌ No permission."; if (isProtected(target)) return "❌ Cannot kick protected users."; return "⚠️ " + target + " kicked.\n" + getMixedResponse(); }
function muteCommand(u, target) { if (!canMute(u)) return "❌ No permission."; if (isProtected(target)) return "❌ Cannot mute protected users."; getUser(target).muted = true; return "🔇 " + target + " muted.\n" + getMixedResponse(); }
function unmuteCommand(u, target) { if (!canMute(u)) return "❌ No permission."; getUser(target).muted = false; return "🔊 " + target + " unmuted.\n" + getMixedResponse(); }
function warnCommand(u, target) { if (!canControl(u)) return "❌ No permission."; getUser(target).warns++; return "⚠️ " + target + " warned (" + getUser(target).warns + "/3).\n" + getMixedResponse(); }

function dailyCommand(u) {
    const now = Date.now(); const last = COOLDOWNS[u]?.daily || 0;
    if (now - last < 86400000) { const hours = Math.ceil((86400000 - (now - last)) / 3600000); return "⏳ Come back in " + hours + " hours"; }
    giveXS(u, 100); if (!COOLDOWNS[u]) COOLDOWNS[u] = {}; COOLDOWNS[u].daily = now;
    return "📅 +100 XS! Balance: " + getUser(u).xenoShards + " XS\n" + getMixedResponse();
}

function payCommand(u, cmd) {
    const parts = cmd.split(" "); if (parts.length < 3) return "❌ Usage: :pay <@user> <amount>";
    const target = parts[1]; const amt = parseInt(parts[2]); if (!amt || amt <= 0) return "❌ Invalid amount.";
    if (!USERS[target]) return "❌ User not found."; if (!takeXS(u, amt)) return "❌ You have " + getUser(u).xenoShards + " XS only.";
    giveXS(target, amt); return "💸 Sent " + amt + " XS to " + target + "\n" + getMixedResponse();
}

// ─── PART 3 CONTENT: BOXES ────────────────────────────────
function menuBox(u) { return "🖤 HODEKAI MENU v5.0\n──────────────────────────\n\n📌 INFO\n 1. :bot 2. :profile 3. :bal 4. :ping\n 5. :members 6. :status 7. :memory\n 8. :history 9. :personality\n\n📌 ECONOMY\n 10. :daily 11. :pay 12. :bank\n\n📌 JOBS\n 13. :govjob 14. :work 15. :myjob 16. :resign\n\n📌 ROAST & COMPLIMENT\n 17. :roast 18. :compliment\n\n📌 MUSIC\n 19. :play 20. :musiclist\n\n📌 CHEQUE\n 21. :cheque\n\n📌 SUGGESTIONS\n 22. :suggest 23. :suggestions\n\n📌 GOVERNMENT\n 24. :taxes 25. :gov 26. :treasury\n\n📌 ADMIN\n 27. :kick 28. :mute 29. :unmute 30. :warn\n 31. :delete 32. :users 33. :announce\n📌 MOD\n 34. :blacklist 35. :unblacklist 36. :shutdown 37. :startup\n\n📌 GROUP\n 38. :addgroup 39. :removegroup 40. :listgroups\n\n📌 UTILITY\n 41. :menu 42. :commands 43. :boxes 44. :all\n\n🔒 OWNER (DM): :secret\n🔒 COMING SOON: Map | Passport | Holiday\n\n" + getMixedResponse(); }

function commandsBox(u) { return "📜 COMPLETE COMMAND LIST v5.0\n" + getMixedResponse(); }
function botInfoBox(u) { return "🖤 HODEKAI INFO\n📌 NAME: " + BOT_INFO.NAME + "\n📌 FATHER: " + BOT_INFO.FATHER + "👑\n📌 MODEL: v" + BOT_INFO.VERSION + "\n📌 STATUS: " + (BOT_ACTIVE? '🟢 ONLINE' : '🔴 OFFLINE') + "\n\n📊 Members: " + Object.keys(USERS).length + "\n" + getMixedResponse(); }
function boxesBox(u) { return "📦 ALL BOXES v5.0\n" + getMixedResponse(); }
function allCommandsBox(u) { return "🖤 MASTER LIST v5.0\n" + getMixedResponse(); }

// ─── PART 4 CONTENT: SECRET, MUSIC, CHEQUE, COMPANIES ────────────────────────────────
function secretBox(u) { return "🔒 SECRET OWNER COMMANDS\n" + getMixedResponse(); }
function viewAll(u) { if (!isOwner(u)) return "❌ Unknown command."; let output = "\n📊 ALL USER DATA\n"; for (let num in USERS) { output += "📱 " + num + ": " + USERS[num].role + " - " + USERS[num].xenoShards + " XS\n"; } return output + "\n" + getMixedResponse(); }

const MUSIC_LIBRARY = {"conclave anthem": "https://dl.dropbox.com/s/example/conclave_anthem.mp3","hodekai theme": "https://dl.dropbox.com/s/example/hodekai_theme.mp3"};
function playMusic(u, song) { const query = song.toLowerCase().trim(); for (let key in MUSIC_LIBRARY) { if (query.includes(key)) { return "🎵 NOW PLAYING: " + key + "\n📥 Download: " + MUSIC_LIBRARY[key] + "\n" + getMixedResponse(); } return "🎵 SEARCHING: " + song + "\n▶️ YouTube: https://www.youtube.com/results?search_query=" + encodeURIComponent(song) + "\n" + getMixedResponse(); }
function musicList(u) { let msg = "📋 MUSIC LIBRARY\n"; for (let key in MUSIC_LIBRARY) { msg += " 🎵 " + key + "\n"; } return msg + "\n💡 :play <song>\n" + getMixedResponse(); }

function submitSuggestion(u, category, title, desc) {
    if (!isWhitelisted(u)) return { success: false, message: "❌ You must be whitelisted." };
    const s = { id: SUGGESTION_ID++, user: u, category, title, description: desc, status: "⏳ PENDING REVIEW", submitted: new Date().toDateString() };
    SUGGESTIONS.push(s); if (!getUser(u).suggestions) getUser(u).suggestions = []; getUser(u).suggestions.push(s.id);
    return { success: true, message: "✅ SUGGESTION #" + s.id + " SUBMITTED!\n" + getMixedResponse() };
}

function chequeCommand(u, cmd) { return "📋 CHEQUE SYSTEM\n" + getMixedResponse(); }
function companyCommand(u, cmd) { return "🏢 COMPANY COMMANDS\n" + getMixedResponse(); }
function guildCommand(u, cmd) { return "⚔️ GUILD COMMANDS\n" + getMixedResponse(); }
function taxesCommand(u) { return "🏛️ TAX REPORT\n" + getMixedResponse(); }
function treasuryCommand(u) { return "🏛️ TREASURY\n💰 Funds: " + GOVERNMENT_FUNDS + " XS\n" + getMixedResponse(); }

function profileCommand(u) { const user = getUser(u); return "🧥 PROFILE\n📱 " + u + "\n💰 Wallet: " + user.xenoShards + " XS\n🏦 Bank: " + getBank(u) + " XS\n👤 Role: " + user.role + "\n" + getMixedResponse(); }
function balanceCommand(u) { const user = getUser(u); return "💰 " + user.xenoShards + " XS | 🏦 " + (BANK[u] || 0) + " XS\n" + getMixedResponse(); }
function pingCommand(u) { return "🏓 pong!"; }
function membersCommand(u) { return "👥 Total: " + getTotalMembers() + "\n" + getMixedResponse(); }

function checkSpam(user) {
    if (isWhitelisted(user)) return { blocked: false };
    const now = Date.now(); if (!SPAM[user]) SPAM[user] = { count: 0, time: now, banned: 0 };
    if (SPAM[user].banned > now) { const min = Math.ceil((SPAM[user].banned - now) / 60000); return { blocked: true, msg: "⛔ Restricted for " + min + " min" }; }
    if (now - SPAM[user].time < 10000) { SPAM[user].count++; if (SPAM[user].count >= 5) { SPAM[user].banned = now + 1800000; SPAM[user].count = 0; const u = getUser(user); u.xenoShards = Math.max(0, u.xenoShards - 500); return { blocked: true, msg: "🚨 SPAM! 30min + 500 XS fine" }; } } else { SPAM[user] = { count: 1, time: now, banned: 0 }; }
    return { blocked: false };
}

function handleMessage(msg, userNumber, isSticker, groupId) {
    isSticker = isSticker || false; groupId = groupId || null;
    if (groupId &&!isGroupWhitelisted(groupId) &&!isOwner(userNumber) &&!isMod(userNumber)) { return "🚫 Group not whitelisted."; }
    if (isSticker) return handleSticker(userNumber);
    if (!BOT_ACTIVE &&!isOwner(userNumber)) return "⚠️ Bot locked.";
    if (isBlacklisted(userNumber)) return "🚫 You are blacklisted.";

    msg = msg.trim(); const u = getUser(userNumber); const spam = checkSpam(userNumber);
    if (spam.blocked) return spam.msg;
    if (u.muted && msg.startsWith(PREFIX)) return "🔇 You are muted.";

    if (!msg.startsWith(PREFIX)) {
        const lower = msg.toLowerCase();
        if (lower.includes('hodekai') || lower.includes('bot')) { return random(["you called?", "what.", "i heard that."]); }
        return null;
    }

    const command = msg.slice(PREFIX.length).trim(); COMMAND_COUNTER++;

    if (command.startsWith("roast ")) { const target = command.slice(6); if (!USERS[target]) return "❌ User not found."; return roastUser(userNumber, target).message; }
    if (command.startsWith("compliment ")) { return complimentUser(userNumber, command.slice(11)); }
    if (command === "secret" && isOwner(userNumber)) return secretBox(userNumber);
    if (command === "viewall" && isOwner(userNumber)) return viewAll(userNumber);
    if (command.startsWith("kick ")) return kickCommand(userNumber, command.slice(5));
    if (command.startsWith("mute ")) return muteCommand(userNumber, command.slice(5));
    if (command.startsWith("unmute ")) return unmuteCommand(userNumber, command.slice(7));
    if (command === "users") { let msg = "\n👥 ALL USERS\n"; for (let num in USERS) { msg += "📱 " + num + " - " + USERS[num].role + " - " + USERS[num].xenoShards + " XS\n"; } return msg + "\n" + getMixedResponse(); }
    if (command === "musiclist") return musicList(userNumber);
    if (command.startsWith("play ")) return playMusic(userNumber, command.slice(5));
    if (command === "govjob") { if (getUser(userNumber).job) return "❌ You already have a job!"; const result = assignJob(userNumber); getUser(userNumber).job = {...result.job, shifts: 0, lastWork: 0, level: 1}; return "🏛️ JOB ASSIGNED\n📋 " + result.job.title + "\n💰 " + result.job.salary + " XS/shift\n🏚️ Class: " + result.class + "\n💡 :work to earn!\n" + getMixedResponse(); }
    if (command === "work") return workCommand(userNumber);
    if (command === "myjob") { const user = getUser(userNumber); if (!user.job) return "❌ No job."; return "💼 YOUR JOB\n📋 " + user.job.title + "\n💰 " + user.job.salary + " XS/shift\n" + getMixedResponse(); }
    if (command === "daily") return dailyCommand(userNumber);
    if (command.startsWith("pay ")) return payCommand(userNumber, command);
    if (command === "bal") return balanceCommand(userNumber);
    if (command === "profile") return profileCommand(userNumber);
    if (command === "ping") return pingCommand(userNumber);
    if (command === "members") return membersCommand(userNumber);
    if (command === "bot") return botInfoBox(userNumber);
    if (command === "menu") return menuBox(userNumber);
    if (command === "commands") return commandsBox(userNumber);
    if (command === "shutdown" && canControl(userNumber)) { BOT_ACTIVE = false; return "🛑 Bot shut down."; }
    if (command === "startup" && canControl(userNumber)) { BOT_ACTIVE = true; return "🟢 Bot started."; }
    return "❌ Unknown: " + PREFIX + command + "\n💡 :menu\n" + getMixedResponse();
}

// ─── WHATSAPP CONNECTION ─────────────────
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, printQRInTerminal: true });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) qrcode.generate(qr, {small: true});
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode!== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if(shouldReconnect) connectToWhatsApp();
        } else if(connection === 'open') {
            console.log('🖤 HODEKAI BOT CONNECTED!');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        if(!BOT_ACTIVE) return; if(m.type!== 'notify') return;
        const msg = m.messages[0]; if(!msg.message) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const sender = msg.key.remoteJid.split('@')[0];
        const isGroup = msg.key.remoteJid.includes('@g.us');
        if(text.startsWith(PREFIX)) {
            const reply = handleMessage(text, sender, false, msg.key.remoteJid);
            if(reply) await sock.sendMessage(msg.key.remoteJid, { text: reply });
        }
    });
    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp();

// ─── WEB SERVER FOR RENDER ───────────────
app.get('/', (req, res) => {
    res.json({status: "HODEKAI BOT v5.0 ONLINE", members: getTotalMembers(), uptime: process.uptime()});
});
app.listen(PORT, () => console.log('Server running on port '+PORT));
