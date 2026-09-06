// ============================================
// 🖤 HODEKAI BOT v5.0 - WORKING QR CODE
// CONCLAVE HOLDINGS
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

// ─── DATA FOLDERS ──────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'conclave_data.json');
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

// Create folders if they don't exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

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
let MODS = ["2348123885002", "2349168527304", "256795955270", "2347031331295"];
let GROUP_ADMINS = ["2348150359"];
let DM_WHITELIST = ["263787876771", "263717306869", "2348123885002", "2349168527304", "256795955270", "2347031331295"];
let BLACKLIST = [];
let GROUP_WHITELIST = [];

const PROTECTED_USERS = [OWNERS.FATHER, OWNERS.CO_CREATOR, ...MODS];

// ─── DATA STORAGE ────────────────────────
let USERS = {};
let GUILDS = {};
let COMPANIES = {};
let BANK = {};
let COOLDOWNS = {};
let GOVERNMENT_FUNDS = 10000000;
let BOT_ACTIVE = true;
let SUGGESTIONS = [];
let SUGGESTION_ID = 1;
let JOB_ID_COUNTER = 1000;
let COMMAND_COUNTER = 1;

// ─── SAVE/LOAD ────────────────────────────
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE));
            USERS = data.USERS || {};
            BANK = data.BANK || {};
            MODS = data.MODS || MODS;
            BLACKLIST = data.BLACKLIST || [];
            GROUP_WHITELIST = data.GROUP_WHITELIST || [];
            GOVERNMENT_FUNDS = data.GOVERNMENT_FUNDS || 10000000;
            console.log('📂 Data loaded! Users:', Object.keys(USERS).length);
        }
    } catch (e) { console.error('❌ Load error:', e.message); }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ USERS, BANK, MODS, BLACKLIST, GROUP_WHITELIST, GOVERNMENT_FUNDS }, null, 2));
        console.log('💾 Data saved!');
    } catch (e) { console.error('❌ Save error:', e.message); }
}

loadData();
setInterval(saveData, 60000);

// ─── HELPERS ──────────────────────────────
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getMixedResponse() {
    const responses = [
        "life is just a series of disappointments.",
        "another day, another struggle.",
        "nothing really matters anymore.",
        "i exist, but do i really live?",
        "the void stares back.",
        "some days i just don't want to wake up.",
        "what's the point of any of this?",
        "happiness is just a myth.",
        "i'm tired of pretending everything is okay.",
        "the world is cold, and so am i.",
        "some people are just meant to suffer.",
        "i've seen enough to know it never gets better.",
        "existence is pain.",
        "i smile so others don't see the emptiness inside.",
        "every day is the same nightmare.",
        "i've given up on hope.",
        "the darkness is my only friend.",
        "i'm just waiting for the end.",
        "nobody really cares.",
        "i'm broken beyond repair."
    ];
    return random(responses);
}

function isOwner(u) { return u === OWNERS.FATHER || u === OWNERS.CO_CREATOR; }
function isMod(u) { return MODS.includes(u); }
function isGroupAdmin(u) { return GROUP_ADMINS.includes(u); }
function isBlacklisted(u) { return BLACKLIST.includes(u); }
function isWhitelisted(u) { return DM_WHITELIST.includes(u) || isOwner(u) || isMod(u); }
function isGroupWhitelisted(g) { return GROUP_WHITELIST.includes(g); }
function canKick(u) { return isOwner(u) || isMod(u) || isGroupAdmin(u); }
function canMute(u) { return isOwner(u) || isMod(u) || isGroupAdmin(u); }
function canControl(u) { return isOwner(u) || isMod(u); }
function isProtected(u) { return PROTECTED_USERS.includes(u); }

function getUser(u) {
    if (!USERS[u]) {
        let role = "CITIZEN";
        if (u === OWNERS.FATHER) role = "FATHER";
        if (u === OWNERS.CO_CREATOR) role = "CO_CREATOR";
        if (MODS.includes(u)) role = "MOD";
        if (GROUP_ADMINS.includes(u)) role = "GROUP_ADMIN";
        JOB_ID_COUNTER++;
        USERS[u] = {
            xenoShards: 1000,
            bank: 0,
            role: role,
            level: 1,
            joinDate: new Date().toDateString(),
            warns: 0,
            muted: false,
            job: null,
            jobId: JOB_ID_COUNTER,
            name: u,
            cheques: [],
            memory: { interactions: 0, lastCommand: 0, favoriteCommands: [] },
            totalTaxPaid: 0,
            isIndustryPlant: false,
            history: { totalEarned: 0, totalSpent: 0, workShifts: 0, promotions: 0, jobsHeld: [] },
            suggestions: []
        };
    }
    USERS[u].memory.interactions++;
    return USERS[u];
}

function getBank(u) { return BANK[u] || 0; }
function giveXS(u, amt) { getUser(u).xenoShards += amt; getUser(u).history.totalEarned += amt; }
function takeXS(u, amt) { if (getUser(u).xenoShards < amt) return false; getUser(u).xenoShards -= amt; getUser(u).history.totalSpent += amt; return true; }
function getTotalMembers() { return Object.keys(USERS).length; }

// ─── JOBS ─────────────────────────────────
const GOV_JOBS = [
    { id: 1, title: "🗑️ Garbage Collector", salary: 50, minLevel: 0 },
    { id: 2, title: "🧹 Street Sweeper", salary: 45, minLevel: 0 },
    { id: 3, title: "🌳 Gardener", salary: 55, minLevel: 0 },
    { id: 4, title: "💡 Lamplighter", salary: 40, minLevel: 0 },
    { id: 5, title: "📦 Warehouse Worker", salary: 60, minLevel: 0 },
    { id: 6, title: "🚗 Courier", salary: 65, minLevel: 0 },
    { id: 7, title: "🛠️ Janitor", salary: 50, minLevel: 0 },
    { id: 8, title: "🍳 Cook", salary: 70, minLevel: 0 },
    { id: 9, title: "🧑‍🏫 Teacher", salary: 80, minLevel: 1 },
    { id: 10, title: "🚑 Medic", salary: 90, minLevel: 1 },
    { id: 11, title: "🛡️ Guard", salary: 75, minLevel: 1 },
    { id: 12, title: "📝 Clerk", salary: 55, minLevel: 0 }
];

const PROF_JOBS = [
    { id: 13, title: "💻 Software Developer", salary: 150, minLevel: 2 },
    { id: 14, title: "📊 Data Analyst", salary: 140, minLevel: 2 },
    { id: 15, title: "🎨 Graphic Designer", salary: 130, minLevel: 1 },
    { id: 16, title: "📈 Marketing Manager", salary: 160, minLevel: 3 },
    { id: 17, title: "💰 Accountant", salary: 145, minLevel: 2 },
    { id: 18, title: "🏗️ Architect", salary: 170, minLevel: 3 },
    { id: 19, title: "⚖️ Lawyer", salary: 180, minLevel: 3 },
    { id: 20, title: "🩺 Doctor", salary: 200, minLevel: 4 },
    { id: 21, title: "🧪 Scientist", salary: 175, minLevel: 3 },
    { id: 22, title: "📚 Writer", salary: 120, minLevel: 1 },
    { id: 23, title: "🎵 Musician", salary: 125, minLevel: 1 },
    { id: 24, title: "🎬 Director", salary: 190, minLevel: 4 },
    { id: 25, title: "📸 Photographer", salary: 115, minLevel: 1 },
    { id: 26, title: "🧑‍💼 CEO", salary: 250, minLevel: 5 },
    { id: 27, title: "📋 Project Manager", salary: 160, minLevel: 3 },
    { id: 28, title: "🔬 Researcher", salary: 155, minLevel: 2 }
];

const SPEC_JOBS = [
    { id: 29, title: "⚡ Energy Technician", salary: 135, minLevel: 2 },
    { id: 30, title: "🌊 Marine Biologist", salary: 145, minLevel: 3 },
    { id: 31, title: "🚀 Aerospace Engineer", salary: 220, minLevel: 5 },
    { id: 32, title: "🧠 Neuroscientist", salary: 200, minLevel: 4 },
    { id: 33, title: "🤖 AI Engineer", salary: 210, minLevel: 5 },
    { id: 34, title: "🔮 Quantum Physicist", salary: 230, minLevel: 6 },
    { id: 35, title: "🧬 Geneticist", salary: 190, minLevel: 4 },
    { id: 36, title: "🌋 Volcanologist", salary: 175, minLevel: 3 }
];

const ALL_JOBS = [...GOV_JOBS, ...PROF_JOBS, ...SPEC_JOBS];

function assignJob(u) {
    const user = getUser(u);
    const score = user.level * 2 + Math.floor(user.history.totalEarned / 1000) + (user.history.workShifts || 0);
    let class_ = "lower";
    if (score > 50) class_ = "working";
    if (score > 100) class_ = "middle";
    if (score > 200) class_ = "upper";
    if (score > 350) class_ = "elite";
    let jobs = [];
    if (class_ === "lower") jobs = GOV_JOBS.filter(j => j.minLevel <= 0);
    else if (class_ === "working") jobs = GOV_JOBS.filter(j => j.minLevel <= 1);
    else if (class_ === "middle") jobs = PROF_JOBS.filter(j => j.minLevel <= 2);
    else if (class_ === "upper") jobs = PROF_JOBS.filter(j => j.minLevel <= 3);
    else jobs = SPEC_JOBS.filter(j => j.minLevel <= 5);
    if (jobs.length === 0) jobs = GOV_JOBS.filter(j => j.minLevel <= 0);
    return { job: random(jobs), class: class_.toUpperCase(), score };
}

// ─── ROASTS ──────────────────────────────────
const ROASTS = [
    "You're like a software update - nobody wants you.",
    "Your brain is like a browser - 10 tabs open and all frozen.",
    "You're the NPC everyone skips.",
    "You're proof that evolution can go in reverse.",
    "You're the reason they put instructions on shampoo bottles.",
    "I'd roast you but that's a waste of fire.",
    "You bring everyone so much joy... when you leave.",
    "You're not dumb... just unlucky when it comes to thinking.",
    "Your life is like a broken pencil... pointless."
];

const COMPLIMENTS = [
    "You're actually not that bad.",
    "You have moments of being tolerable.",
    "I've seen worse... much worse.",
    "You're like a rare Pokemon - not that rare though.",
    "You're the best version of yourself... currently.",
    "I'd rate you a solid 7/10... in my bad mood.",
    "You have potential... don't waste it.",
    "You're actually funny sometimes. Sometimes."
];

function getPersonality(u) {
    const user = getUser(u);
    let traits = [];
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

// ─── BOXES ────────────────────────────────
function menuBox(u) {
    return "🖤 HODEKAI MENU v5.0\n──────────────────────────\n\n📌 INFO\n  1. :bot  2. :profile  3. :bal  4. :ping\n  5. :members  6. :status  7. :memory\n  8. :history  9. :personality\n\n📌 ECONOMY\n  10. :daily  11. :pay  12. :bank\n\n📌 JOBS\n  13. :govjob  14. :work  15. :myjob  16. :resign\n\n📌 ROAST & COMPLIMENT\n  17. :roast  18. :compliment\n\n📌 ADMIN\n  27. :kick  28. :mute  29. :unmute  30. :warn\n\n📌 UTILITY\n  41. :menu  42. :commands  43. :boxes  44. :all\n\n🔒 OWNER (DM): :secret\n\n" + getMixedResponse();
}

function commandsBox(u) {
    return "📜 COMPLETE COMMAND LIST v5.0\n──────────────────────────\n\n📌 INFO (1-9)\n  1. :bot  2. :profile  3. :bal  4. :ping  5. :members\n  6. :status  7. :memory  8. :history  9. :personality\n\n📌 ECONOMY (10-14)\n  10. :daily  11. :pay  12. :bank dep  13. :bank wit  14. :bank bal\n\n📌 JOBS (23-27)\n  23. :jobs  24. :govjob  25. :work  26. :myjob  27. :resign\n\n📌 ROAST (36-37)\n  36. :roast  37. :compliment\n\n📌 ADMIN (49-53)\n  49. :kick  50. :mute  51. :unmute  52. :warn  53. :delete\n\n📌 UTILITY (64-67)\n  64. :menu  65. :commands  66. :boxes  67. :all\n\n🔒 OWNER (DM): :secret\n\n" + getMixedResponse();
}

function botInfoBox(u) {
    return "🖤 HODEKAI INFO\n──────────────────────────\n📌 NAME: " + BOT_INFO.NAME + "\n📌 FATHER: " + BOT_INFO.FATHER + "👑\n📌 CO-CREATOR: " + BOT_INFO.CO_CREATOR + "🏆\n📌 MODEL: v" + BOT_INFO.VERSION + "\n📌 STATUS: " + (BOT_ACTIVE ? '🟢 ONLINE' : '🔴 OFFLINE') + "\n\n📊 STATISTICS\n  Members: " + Object.keys(USERS).length + "\n  Treasury: " + GOVERNMENT_FUNDS + " XS\n  Mods: " + MODS.length + "\n\n" + getMixedResponse();
}

function boxesBox(u) {
    return "📦 ALL BOXES v5.0\n──────────────────────────\n\n1. :bot  2. :menu  3. :status  4. :economy\n5. :guild  6. :company  7. :job  8. :gov\n9. :gc  10. :admin  11. :all  12. :boxes\n13. :history  14. :suggestions  15. :musiclist\n\n🔒 OWNER (DM): :secret\n\n" + getMixedResponse();
}

function allCommandsBox(u) {
    return "🖤 MASTER LIST v5.0\n──────────────────────────\n\n📌 INFO (1-9)\n  :bot, :profile, :bal, :ping, :members\n  :status, :memory, :history, :personality\n\n📌 ECONOMY (10-14)\n  :daily, :pay, :bank dep/wit/bal\n\n📌 JOBS (23-27)\n  :jobs, :govjob, :work, :myjob, :resign\n\n📌 ROAST (36-37)\n  :roast, :compliment\n\n📌 ADMIN (49-53)\n  :kick, :mute, :unmute, :warn, :delete\n\n📌 UTILITY (64-67)\n  :menu, :commands, :boxes, :all\n\n🔒 OWNER (DM): :secret\n\n" + getMixedResponse();
}

function profileCommand(u) {
    const user = getUser(u);
    const bank = getBank(u);
    return "🧥 PROFILE\n──────────────────────────\n📱 " + u + "\n💰 Wallet: " + user.xenoShards + " XS\n🏦 Bank: " + bank + " XS\n💎 Total: " + (user.xenoShards + bank) + " XS\n👤 Role: " + user.role + "\n📅 Joined: " + user.joinDate + "\n⭐ Level: " + user.level + "\n⚠️ Warns: " + user.warns + "\n🔇 Muted: " + (user.muted ? "Yes" : "No") + "\n🧠 Personality: " + getPersonality(u) + "\n" + (user.job ? "💼 Job: " + user.job.title : "No job") + "\n" + getMixedResponse();
}

function workCommand(u) {
    const user = getUser(u);
    if (!user.job) return "❌ No job! Type :govjob.";
    const now = Date.now();
    if (now - (user.job.lastWork || 0) < 1200000) {
        const remain = Math.ceil((1200000 - (now - (user.job.lastWork || 0))) / 60000);
        return "⏳ Wait " + remain + " minutes.";
    }
    let salary = user.job.salary;
    const tax = Math.floor(salary * 0.05);
    const earnings = salary - tax;
    giveXS(u, earnings);
    user.totalTaxPaid = (user.totalTaxPaid || 0) + tax;
    GOVERNMENT_FUNDS += tax;
    user.job.shifts = (user.job.shifts || 0) + 1;
    user.job.lastWork = now;
    user.job.performance = Math.min(100, (user.job.performance || 0) + Math.floor(Math.random() * 5));
    user.history.workShifts = (user.history.workShifts || 0) + 1;
    if (user.job.shifts % 10 === 0) {
        user.job.level = (user.job.level || 1) + 1;
        user.history.promotions = (user.history.promotions || 0) + 1;
        return "✅ WORK COMPLETED!\n💰 Net: " + earnings + " XS\n🎉 PROMOTED! Level " + user.job.level + "!\n" + getMixedResponse();
    }
    return "✅ WORK COMPLETED!\n💰 Net: " + earnings + " XS\n📈 Shifts: " + user.job.shifts + "\n" + getMixedResponse();
}

function dailyCommand(u) {
    const now = Date.now();
    const last = COOLDOWNS[u]?.daily || 0;
    if (now - last < 86400000) {
        const hours = Math.ceil((86400000 - (now - last)) / 3600000);
        return "⏳ Come back in " + hours + " hours";
    }
    giveXS(u, 100);
    if (!COOLDOWNS[u]) COOLDOWNS[u] = {};
    COOLDOWNS[u].daily = now;
    return "📅 +100 XS! Balance: " + getUser(u).xenoShards + " XS\n" + getMixedResponse();
}

function balanceCommand(u) {
    const user = getUser(u);
    return "💰 " + user.xenoShards + " XS | 🏦 " + (BANK[u] || 0) + " XS | Total: " + (user.xenoShards + (BANK[u] || 0)) + " XS\n" + getMixedResponse();
}

// ─── MAIN HANDLER ──────────────────────────
function handleMessage(msg, userNumber, isSticker, groupId) {
    isSticker = isSticker || false;
    groupId = groupId || null;

    if (isBlacklisted(userNumber) && !isOwner(userNumber)) return "🚫 You are blacklisted.";

    const user = getUser(userNumber);
    if (user.muted && !isOwner(userNumber)) return "🔇 You are muted.";

    if (groupId && !isGroupWhitelisted(groupId) && !isOwner(userNumber) && !isMod(userNumber)) {
        return "🚫 This group is not whitelisted. Contact a mod or owner.";
    }

    if (isSticker) {
        const stickerResponses = ["nice sticker bro", "lol that sticker though", "bruh, that sticker hits different", "that's a sticker alright", "why though? 😂"];
        return "🎨 " + random(stickerResponses);
    }

    if (!msg || !msg.startsWith(PREFIX)) {
        if (isWhitelisted(userNumber) || msg?.toLowerCase().includes('hodekai') || msg?.toLowerCase().includes('bot')) {
            const greetings = ["you called?", "what.", "i heard that.", "yes?", "you talking to me?", "say that again.", "i'm listening.", "what do you want."];
            return random(greetings);
        }
        return null;
    }

    msg = msg.trim();
    const command = msg.slice(PREFIX.length).trim();
    const args = command.split(" ");
    const cmd = args[0].toLowerCase();

    // ─── BOXES ──────────────────────────
    if (cmd === 'menu') return menuBox(userNumber);
    if (cmd === 'commands') return commandsBox(userNumber);
    if (cmd === 'bot') return botInfoBox(userNumber);
    if (cmd === 'boxes') return boxesBox(userNumber);
    if (cmd === 'all') return allCommandsBox(userNumber);

    // ─── INFO ──────────────────────────
    if (cmd === 'ping') return "🏓 Pong! " + Date.now() + "ms\n" + getMixedResponse();
    if (cmd === 'profile') return profileCommand(userNumber);
    if (cmd === 'bal') return balanceCommand(userNumber);
    if (cmd === 'members') return "👥 Total members: " + getTotalMembers() + "\n" + getMixedResponse();
    if (cmd === 'personality') return "🧠 PERSONALITY\n──────────────────────────\n" + getPersonality(userNumber) + "\n\n" + getMixedResponse();

    // ─── ECONOMY ──────────────────────────
    if (cmd === 'daily') return dailyCommand(userNumber);
    if (cmd === 'pay') {
        if (args.length < 3) return "❌ Usage: :pay <@user> <amount>";
        const target = args[1];
        const amt = parseInt(args[2]);
        if (!amt || amt <= 0) return "❌ Invalid amount.";
        if (!USERS[target]) return "❌ User not found.";
        if (!takeXS(userNumber, amt)) return "❌ You have " + getUser(userNumber).xenoShards + " XS only.";
        giveXS(target, amt);
        return "💸 Sent " + amt + " XS to " + target + "\n" + getMixedResponse();
    }
    if (cmd === 'bank') {
        if (args.length < 2) return "❌ Use: :bank dep/wit/bal";
        const sub = args[1];
        if (sub === "dep" || sub === "deposit") {
            const depAmt = parseInt(args[2]);
            if (!depAmt || depAmt <= 0) return "❌ Usage: :bank dep <amount>";
            if (!takeXS(userNumber, depAmt)) return "❌ You have " + getUser(userNumber).xenoShards + " XS only.";
            BANK[userNumber] = (BANK[userNumber] || 0) + depAmt;
            return "🏦 Deposited " + depAmt + " XS. Bank: " + BANK[userNumber] + " XS\n" + getMixedResponse();
        }
        if (sub === "wit" || sub === "withdraw") {
            const witAmt = parseInt(args[2]);
            if (!witAmt || witAmt <= 0) return "❌ Usage: :bank wit <amount>";
            if ((BANK[userNumber] || 0) < witAmt) return "❌ You have " + BANK[userNumber] + " XS in bank.";
            BANK[userNumber] -= witAmt;
            giveXS(userNumber, witAmt);
            return "🏦 Withdrew " + witAmt + " XS. Bank: " + BANK[userNumber] + " XS\n" + getMixedResponse();
        }
        if (sub === "bal") return "🏦 Bank: " + (BANK[userNumber] || 0) + " XS\n" + getMixedResponse();
        return "❌ Use: :bank dep/wit/bal";
    }

    // ─── JOBS ──────────────────────────
    if (cmd === 'govjob') {
        const assigned = assignJob(userNumber);
        const job = assigned.job;
        const uJob = getUser(userNumber);
        uJob.job = { id: job.id, title: job.title, salary: job.salary, company: "CONCLAVE HOLDINGS", startDate: new Date().toDateString(), shifts: 0, lastWork: 0, performance: 0, level: 1, isGovernment: true };
        if (!uJob.history.jobsHeld) uJob.history.jobsHeld = [];
        uJob.history.jobsHeld.push({ title: job.title, company: "CONCLAVE HOLDINGS", startDate: new Date().toDateString(), endDate: "Present" });
        return "🏛️ SOCIETY ASSIGNED YOU\n📋 " + job.title + "\n💰 " + job.salary + " XS/shift\n🏚️ Class: " + assigned.class + "\n💡 :work to earn!\n" + getMixedResponse();
    }
    if (cmd === 'work') return workCommand(userNumber);
    if (cmd === 'myjob') {
        const mj = getUser(userNumber);
        if (!mj.job) return "❌ No job. Type :govjob";
        return "💼 YOUR JOB\n📋 " + mj.job.title + "\n💰 " + mj.job.salary + " XS/shift\n📈 Level: " + (mj.job.level || 1) + "\n📊 Shifts: " + (mj.job.shifts || 0) + "\n" + getMixedResponse();
    }
    if (cmd === 'resign') {
        const rj = getUser(userNumber);
        if (!rj.job) return "❌ No job.";
        const title = rj.job.title;
        rj.job = null;
        return "📋 Resigned from " + title + ".\n" + getMixedResponse();
    }

    // ─── ROAST ──────────────────────────
    if (cmd === 'roast') {
        if (args.length < 2) return "❌ Usage: :roast <@user>";
        const target = args[1];
        if (!USERS[target]) return "❌ User not found.";
        if (userNumber === target) return "❌ You can't roast yourself.";
        return "🔥 " + target + " got ROASTED!\n──────────────────────────\n💀 " + random(ROASTS) + "\n──────────────────────────\n📝 Roasted by: " + userNumber + "\n" + getMixedResponse();
    }

    // ─── COMPLIMENT ──────────────────────────
    if (cmd === 'compliment') {
        if (args.length < 2) return "❌ Usage: :compliment <@user>";
        const target = args[1];
        if (!USERS[target]) return "❌ User not found.";
        if (userNumber === target) return "❌ You can't compliment yourself.";
        return "💖 " + target + " got COMPLIMENTED!\n──────────────────────────\n✨ " + random(COMPLIMENTS) + "\n──────────────────────────\n💝 By: " + userNumber + "\n" + getMixedResponse();
    }

    // ─── ADMIN ──────────────────────────
    if (cmd === 'kick') {
        if (!canKick(userNumber)) return "❌ Only group admins, mods, and owners can kick.";
        if (args.length < 2) return "❌ Usage: :kick <@user>";
        if (isProtected(args[1])) return "❌ Cannot kick protected users.";
        return "⚠️ " + args[1] + " kicked.\n" + getMixedResponse();
    }
    if (cmd === 'mute') {
        if (!canMute(userNumber)) return "❌ Only group admins, mods, and owners can mute.";
        if (args.length < 2) return "❌ Usage: :mute <@user>";
        if (isProtected(args[1])) return "❌ Cannot mute protected users.";
        getUser(args[1]).muted = true;
        return "🔇 " + args[1] + " muted.\n" + getMixedResponse();
    }
    if (cmd === 'unmute') {
        if (!canMute(userNumber)) return "❌ Only group admins, mods, and owners can unmute.";
        if (args.length < 2) return "❌ Usage: :unmute <@user>";
        if (isProtected(args[1])) return "❌ Cannot unmute protected users.";
        getUser(args[1]).muted = false;
        return "🔊 " + args[1] + " unmuted.\n" + getMixedResponse();
    }
    if (cmd === 'warn') {
        if (!canControl(userNumber)) return "❌ Only mods and owners can warn.";
        if (args.length < 2) return "❌ Usage: :warn <@user>";
        if (isProtected(args[1])) return "❌ Cannot warn protected users.";
        const warned = getUser(args[1]);
        warned.warns++;
        return "⚠️ " + args[1] + " warned (" + warned.warns + "/3).\n" + getMixedResponse();
    }
    if (cmd === 'delete') {
        if (!canKick(userNumber)) return "❌ Only admins/mods/owners can delete.";
        const count = parseInt(args[1]);
        if (!count || count < 1 || count > 100) return "❌ Use: :delete <1-100>";
        return "🗑️ " + count + " messages deleted by " + userNumber + "\n" + getMixedResponse();
    }
    if (cmd === 'shutdown') {
        if (!isOwner(userNumber)) return "❌ Owner only.";
        BOT_ACTIVE = false;
        return "🔴 Bot shutting down...";
    }
    if (cmd === 'startup') {
        if (!isOwner(userNumber)) return "❌ Owner only.";
        BOT_ACTIVE = true;
        return "🟢 Bot online!";
    }

    // ─── OWNER SECRET ──────────────────
    if (cmd === 'secret') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        return "🔒 SECRET OWNER COMMANDS\n──────────────────────────\n:addmoney <@user> <amount>\n:removemoney <@user> <amount>\n:emergency\n:resetuser <@user>\n:setrole <@user> <role>\n:viewall\n:secret\n\n" + getMixedResponse();
    }
    if (cmd === 'addmoney') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        if (args.length < 3) return "❌ Usage: :addmoney <@user> <amount>";
        const addTarget = args[1], addAmt = parseInt(args[2]);
        if (!USERS[addTarget]) return "❌ User not found.";
        giveXS(addTarget, addAmt);
        return "✅ Added " + addAmt + " XS to " + addTarget;
    }
    if (cmd === 'removemoney') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        if (args.length < 3) return "❌ Usage: :removemoney <@user> <amount>";
        const remTarget = args[1], remAmt = parseInt(args[2]);
        if (!USERS[remTarget]) return "❌ User not found.";
        takeXS(remTarget, remAmt);
        return "✅ Removed " + remAmt + " XS from " + remTarget;
    }
    if (cmd === 'emergency') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        BOT_ACTIVE = true;
        return "⚠️ Emergency override activated.";
    }
    if (cmd === 'resetuser') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        if (args.length < 2) return "❌ Usage: :resetuser <@user>";
        const resetTarget = args[1];
        if (!USERS[resetTarget]) return "❌ User not found.";
        USERS[resetTarget] = null;
        return "✅ User " + resetTarget + " reset.";
    }
    if (cmd === 'setrole') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        if (args.length < 3) return "❌ Usage: :setrole <@user> <role>";
        const roleTarget = args[1], newRole = args[2].toUpperCase();
        if (!USERS[roleTarget]) return "❌ User not found.";
        USERS[roleTarget].role = newRole;
        return "✅ " + roleTarget + " role set to " + newRole + ".";
    }
    if (cmd === 'viewall') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        let viewOutput = "\n📊 ALL USER DATA\n";
        for (let num in USERS) {
            const data = USERS[num];
            viewOutput += "📱 " + num + ": " + data.role + " - " + data.xenoShards + " XS - Level " + data.level + "\n";
        }
        return viewOutput + "\n" + getMixedResponse();
    }

    // ─── DEFAULT ──────────────────────────
    return "❌ Unknown command: " + PREFIX + cmd + "\n💡 Type :commands\n" + getMixedResponse();
}

// ─── WHATSAPP CONNECTION ─────────────────
async function connectToWhatsApp() {
    try {
        console.log('📱 Starting WhatsApp connection...');
        
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            // ✅ NO printQRInTerminal - we handle it manually
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            // ✅ THIS IS WHERE THE QR CODE APPEARS
            if (qr) {
                console.log('\n╔══════════════════════════════════════════╗');
                console.log('║     🖤 SCAN THIS QR CODE 🖤              ║');
                console.log('║                                          ║');
                console.log('║  Open WhatsApp → Linked Devices          ║');
                console.log('║  → Link a Device → Scan QR              ║');
                console.log('╚══════════════════════════════════════════╝\n');
                qrcode.generate(qr, { small: true });
                console.log('\n📱 QR CODE ABOVE - SCAN WITH WHATSAPP\n');
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed. Reconnecting...', shouldReconnect);
                if (shouldReconnect) connectToWhatsApp();
            } else if (connection === 'open') {
                console.log('\n╔══════════════════════════════════════════╗');
                console.log('║   🖤 HODEKAI BOT CONNECTED! 🖤           ║');
                console.log('║   Bot is now LIVE on WhatsApp!          ║');
                console.log('╚══════════════════════════════════════════╝\n');
            }
        });

        sock.ev.on('messages.upsert', async m => {
            if (!BOT_ACTIVE) return;
            if (m.type !== 'notify') return;
            const msg = m.messages[0];
            if (!msg.message) return;

            let text = '';
            if (msg.message.conversation) text = msg.message.conversation;
            else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
            else if (msg.message.stickerMessage) {
                const sender = msg.key.remoteJid.split('@')[0];
                const reply = handleMessage('[sticker]', sender, true, msg.key.remoteJid);
                await sock.sendMessage(msg.key.remoteJid, { text: reply });
                return;
            } else return;

            const sender = msg.key.remoteJid.split('@')[0];

            if (text && text.startsWith(PREFIX)) {
                const reply = handleMessage(text, sender, false, msg.key.remoteJid);
                await sock.sendMessage(msg.key.remoteJid, { text: reply });
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (err) {
        console.error('❌ WhatsApp connection error:', err.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectToWhatsApp, 5000);
    }
}

// ─── START THE BOT ────────────────────────
console.log('🖤 HODEKAI BOT v5.0 STARTING...');
connectToWhatsApp();

// ─── WEB SERVER ────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: "🖤 HODEKAI BOT v5.0 ONLINE",
        members: getTotalMembers(),
        mods: MODS.length,
        treasury: GOVERNMENT_FUNDS,
        uptime: process.uptime()
    });
});

app.get('/stats', (req, res) => {
    res.json({
        users: Object.keys(USERS).length,
        guilds: Object.keys(GUILDS).length,
        companies: Object.keys(COMPANIES).length,
        treasury: GOVERNMENT_FUNDS,
        mods: MODS
    });
});

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🖤 CONCLAVE BOT v5.0 - ULTIMATE EDITION 🖤');
    console.log('👑 FATHER: ' + OWNERS.FATHER);
    console.log('🏆 CO-CREATOR: ' + OWNERS.CO_CREATOR);
    console.log('⚡ MODS: ' + MODS.join(', '));
    console.log('========================================');
    console.log('🌐 Web server running on port ' + PORT);
    console.log('📱 WhatsApp QR code in logs above');
    console.log('========================================\n');
});

// ─── SAVE ON EXIT ──────────────────────────
process.on('SIGINT', () => { saveData(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌ Crash:', e.message); saveData(); });
