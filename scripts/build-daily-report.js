const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { createRequire } = require("module");

const outputDir = process.env.OUTPUT_DIR || "C:\\Users\\admin\\Documents\\Codex\\2026-07-28\\new-chat\\outputs";
const siteDir = process.env.SITE_DIR || path.join(outputDir, "cloudflare-pages-site");
const archiveDir = path.join(siteDir, "archive");
const siteOfficialIconDir = path.join(siteDir, "assets", "icons", "official");
const localOfficialIconDir = path.join(outputDir, "assets", "icons", "official");
const metadataPath = path.join(siteOfficialIconDir, "icon-metadata.json");
const siteRequire = createRequire(path.join(siteDir, "package.json"));
let googlePlayScraperCache = null;

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function latestPreviousReport(currentDate) {
  const prefix = "game-intelligence-full-";
  const suffix = ".html";
  const dates = new Set();
  if (fs.existsSync(outputDir)) {
    for (const name of fs.readdirSync(outputDir)) {
      if (name.startsWith(prefix) && name.endsWith(suffix)) dates.add(name.slice(prefix.length, -suffix.length));
    }
  }
  if (fs.existsSync(archiveDir)) {
    for (const name of fs.readdirSync(archiveDir)) {
      if (name.endsWith(suffix)) dates.add(name.slice(0, -suffix.length));
    }
  }
  return Array.from(dates)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date < currentDate)
    .sort()
    .pop() || "";
}

const reportDate = process.env.REPORT_DATE || process.argv[2] || todayInShanghai();
const previousDate = process.env.PREVIOUS_DATE || process.argv[3] || latestPreviousReport(reportDate);

function displayMonthDay(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ""));
  if (!match) return date;
  return `${Number(match[2])} \u6708 ${Number(match[3])} \u65e5`;
}

const sources = [
  {
    key: "gpGamesFree",
    label: "Google Play 游戏免费总榜 Top 50",
    short: "GP Games 免费",
    url: "https://www.appbrain.com/stats/google-play-rankings/top_free/game/us",
    expectedTitle: "Games",
    sourceLabel: "AppBrain Google Play - Top Free Games / US",
    sourceProvider: "appbrain",
    limit: 50,
    official: {
      category: "GAME",
      collection: "TOP_FREE",
      url: "https://play.google.com/store/apps/category/GAME?hl=en_US&gl=US",
      sourceLabel: "Google Play official - Top Free Games / US",
      sourceProvider: "google-play-official",
    },
  },
  {
    key: "gpPuzzleGross",
    label: "Google Play Puzzle 收入榜 Top 30",
    short: "GP Puzzle 收入",
    url: "https://www.appbrain.com/stats/google-play-rankings/top_grossing/puzzle/us",
    expectedTitle: "Puzzle Games",
    sourceLabel: "AppBrain Google Play - Top Grossing Puzzle / US",
    sourceProvider: "appbrain",
    official: {
      category: "GAME_PUZZLE",
      collection: "GROSSING",
      url: "https://play.google.com/store/apps/category/GAME_PUZZLE?hl=en_US&gl=US",
      sourceLabel: "Google Play official - Top Grossing Puzzle / US",
      sourceProvider: "google-play-official",
    },
  },
  {
    key: "gpPuzzleFree",
    label: "Google Play Puzzle 免费榜 Top 30",
    short: "GP Puzzle 免费",
    url: "https://www.appbrain.com/stats/google-play-rankings/top_free/puzzle/us",
    expectedTitle: "Puzzle Games",
    sourceLabel: "AppBrain Google Play - Top Free Puzzle / US",
    sourceProvider: "appbrain",
    official: {
      category: "GAME_PUZZLE",
      collection: "TOP_FREE",
      url: "https://play.google.com/store/apps/category/GAME_PUZZLE?hl=en_US&gl=US",
      sourceLabel: "Google Play official - Top Free Puzzle / US",
      sourceProvider: "google-play-official",
    },
  },
  {
    key: "gpRpgGross",
    label: "Google Play RPG 收入榜 Top 30",
    short: "GP RPG 收入",
    url: "https://www.appbrain.com/stats/google-play-rankings/top_grossing/role_playing/us",
    expectedTitle: "Role Playing Games",
    sourceLabel: "AppBrain Google Play - Top Grossing Role Playing / US",
    sourceProvider: "appbrain",
    official: {
      category: "GAME_ROLE_PLAYING",
      collection: "GROSSING",
      url: "https://play.google.com/store/apps/category/GAME_ROLE_PLAYING?hl=en_US&gl=US",
      sourceLabel: "Google Play official - Top Grossing Role Playing / US",
      sourceProvider: "google-play-official",
    },
  },
  {
    key: "gpStrategyGross",
    label: "Google Play Strategy 收入榜 Top 30",
    short: "GP Strategy 收入",
    url: "https://www.appbrain.com/stats/google-play-rankings/top_grossing/strategy/us",
    expectedTitle: "Strategy Games",
    sourceLabel: "AppBrain Google Play - Top Grossing Strategy / US",
    sourceProvider: "appbrain",
    official: {
      category: "GAME_STRATEGY",
      collection: "GROSSING",
      url: "https://play.google.com/store/apps/category/GAME_STRATEGY?hl=en_US&gl=US",
      sourceLabel: "Google Play official - Top Grossing Strategy / US",
      sourceProvider: "google-play-official",
    },
  },
  {
    key: "iosStrategyGross",
    label: "iOS Strategy 收入榜 Top 80",
    short: "iOS Strategy 收入",
    url: "https://www.appbrain.com/stats/appstore-rankings/top_grossing/games_strategy/us",
    expectedTitle: "Strategy Games",
    sourceLabel: "AppBrain App Store - Top Grossing Strategy / US",
    sourceProvider: "appbrain",
    limit: 80,
  },
];

const iosSource = {
  key: "iosPuzzleGross",
  label: "iOS Puzzle 收入榜 Top 30",
  short: "iOS Puzzle 收入",
  url: "https://appcurrents.com/charts/us/puzzle-games",
  sourceLabel: "AppCurrents iOS - Top Grossing Puzzle / US",
  sourceProvider: "appcurrents",
};

const aliasMap = new Map(Object.entries({
  "Flambé®: Merge & Cook": "Flambe: Merge & Cook",
  "Flambé®: Merge and Cook": "Flambe: Merge & Cook",
  "Flambé: Merge & Cook": "Flambe: Merge & Cook",
  "Flambé: Merge and Cook": "Flambe: Merge & Cook",
  "Gossip Harbor®: Merge & Story": "Gossip Harbor: Merge & Story",
  "Seaside Escape®: Merge & Story": "Seaside Escape",
  "Seaside Escape: Merge & Story": "Seaside Escape",
  "Travel Town - Merge Adventure": "Travel Town",
  "Mystery Town: Merge Games": "Mystery Town",
  "Hole Stars: Puzzle Game": "Hole Stars",
  "Domino Dreams™": "Domino Dreams",
  "Marble Sort! - Color Puzzle": "Marble Sort!",
  "Merge Mansion: Puzzles & Story": "Merge Mansion",
  "Empires & Puzzles: Match-3 RPG": "Empires & Puzzles",
  "Disney Emoji Blitz Game": "Disney Emoji Blitz",
  "Car Sort: Color Puzzle": "Car Sort",
  "Tasty Travels: Merge Game": "Tasty Travels",
  "Homescapes: Match 3 Games": "Homescapes",
  "Merge Cooking®": "Merge Cooking",
  "NYT Games: Wordle & Crossword": "NYT Games",
  "Yarn Loop: Knit Puzzle": "Yarn Loop",
  "Block Out! - Color Sort Puzzle": "Block Out!",
  "Ball Sort Puzzle - Color Game": "Ball Sort Puzzle - Color Games",
  "Loop Master™: Color Jam Sort": "Loop Master",
  "Hidden Object Games: Seek It": "Hidden Object Games: Seek It",
  "Mahjong Master: Daily Match": "Mahjong Master",
  "Star Wars™: Galaxy of Heroes": "Star Wars: Galaxy of Heroes",
  "Zenless Zone Zero - Anniv.": "Zenless Zone Zero",
  "Fate/Grand Order (English)": "Fate/Grand Order",
  "MARVEL Strike Force: Squad RPG": "MARVEL Strike Force",
  "MapleStory : Idle RPG": "MapleStory: Idle RPG",
  "Watcher of Realms - US": "Watcher of Realms",
  "Hero Wars: Alliance RPG Legend": "Hero Wars",
  "Rogue Legend - Roguelike RPG": "Rogue Legend",
  "WWE Champions: Wrestling RPG": "WWE Champions",
  "Last War:Survival Game": "Last War: Survival Game",
  "Castle Busters": "Castle Busters: Tower Defense",
  "Castle Busters - Tower Defense": "Castle Busters: Tower Defense",
  "Mystery Dumpling: Unbox ASMR": "Mystery Dumpling Blind Box",
  "Mystery Dumpling: Unbox ASMR Games": "Mystery Dumpling Blind Box",
  "Mystery Dumpling": "Mystery Dumpling Blind Box",
  "Kingdom Guard:Tower Defense TD": "Kingdom Guard",
  "Tower War": "Tower War - Tactical Conquest",
  "Tower War: Tactical Conquest": "Tower War - Tactical Conquest",
  "Rush Royale": "Rush Royale: Tower Defense TD",
  "Total Battle: War Strategy": "Total Battle",
  "Puzzles & Chaos: Frozen Castle": "Puzzles & Chaos",
  "Rise of Kingdoms: Lost Crusade": "Rise of Kingdoms",
  "Lords Mobile x Transformers": "Lords Mobile",
  "Top Heroes: Kingdom Saga": "Top Heroes",
  "Top War: Battle Game": "Top War",
  "Warhammer 40,000: Tacticus ™": "Warhammer 40,000: Tacticus",
}));

const gameCn = {
  "Royal Match": "皇家消除",
  "Mystery Dumpling Blind Box": "神秘饺子盲盒 / 开盒 ASMR",
  "Gossip Harbor: Merge & Story": "浪漫餐厅",
  "Royal Kingdom": "皇家王国",
  "Toon Blast": "卡通爆破",
  "Fishdom": "梦幻水族箱",
  "Match Factory!": "匹配工厂",
  "Pixel Flow!": "像素流",
  "Yarn Loop": "毛线环",
  "All in Hole: Black Hole Games": "全部进洞：黑洞游戏",
  "Flambe: Merge & Cook": "合成与烹饪",
  "Mystery Town": "神秘小镇",
  "Travel Town": "旅行小镇",
  "Toy Blast": "玩具爆破",
  "Hole Stars": "黑洞明星",
  "Magic Sort!": "魔法排序",
  "Seaside Escape": "梦幻旅行",
  "Merge Dragons!": "合成龙",
  "Domino Dreams": "多米诺梦境",
  "Color Block Jam": "色块堵塞",
  "Marble Sort!": "弹珠排序",
  "Merge Mansion": "合并庄园",
  "Empires & Puzzles": "帝国与谜题",
  "Match Villains": "匹配反派",
  "Triple Match 3D": "三重匹配 3D",
  "Triple Match City": "三重匹配城市",
  "Cube Land Puzzle Game": "方块大陆",
  "Screwdom 3D": "螺丝王国 3D",
  "Disney Emoji Blitz": "迪士尼表情闪电",
  "Car Sort": "汽车排序",
  "Loop Sort": "环形排序",
  "Loop Master: Color Jam Sort": "\u73af\u5f62\u6392\u5e8f\u5927\u5e08",
  "Meowdoku: Brain Puzzle Games": "喵独：脑力谜题",
  "Arrows – Puzzle Escape": "箭头逃脱",
  "Bus Traffic Fever!": "巴士交通热",
  "Amaze GO!": "迷宫冲冲冲",
  "Arrow Puzzle: Tap Puzzle Games": "箭头点击谜题",
  "Stack Smash - Block 3D Puzzle": "堆栈粉碎",
  "Color Block: Combo Blast": "彩色方块连击",
  "Pocket Sort: Coin Merge Puzzle": "口袋排序：硬币合并",
  "Woodoku Blast": "木独爆破",
  "Loop Master": "环形排序大师",
  "Hidden Object Games: Seek It": "找找看：隐藏物品",
  "Ball Sort Puzzle - Color Games": "球排序",
  "Jigsawcard Solitaire Puzzle": "拼图纸牌",
  "Block Color Mania, Puzzle Game": "彩块狂热",
  "Jigsaw Drop: Solitaire Puzzle": "拼图掉落",
  "Romantic Nuts & Bolts Sorting": "浪漫螺母螺栓排序",
  "Tile Explorer - Triple Match": "瓷砖探索",
  "Tile Family:Match Puzzle Game": "\u74f7\u7816\u5bb6\u65cf\uff1a\u5339\u914d\u8c1c\u9898",
  "Point Out: Color Escape Puzzle": "点出：颜色逃脱",
  "Knock Out": "击倒",
  "Mahjong Master": "麻将大师",
  "Block Blast!": "方块爆破",
  "Block Out!": "方块突围",
  "Colony Flow!": "殖民流",
  "Jelly Busters: Puzzle Game": "果冻爆破",
  "Screwdom": "螺丝王国",
  "Township": "梦想小镇",
  "Gardenscapes": "梦幻花园",
  "Homescapes": "梦幻家园",
  "Candy Crush Saga": "糖果传奇",
  "Candy Crush Soda Saga": "糖果苏打传奇",
  "Tasty Travels": "美味旅行",
  "Merge Cooking": "合成烹饪",
  "NYT Games": "纽约时报游戏",
  "Sword x Staff": "剑与法杖",
  "Zenless Zone Zero": "绝区零",
  "Fate/Grand Order": "命运/冠位指定",
  "Star Wars: Galaxy of Heroes": "星球大战：银河英雄",
  "GODDESS OF VICTORY: NIKKE": "胜利女神：妮姬",
  "RAID: Shadow Legends": "突袭：暗影传说",
  "MARVEL Strike Force": "漫威突击队",
  "Summoners War X Frieren": "魔灵召唤 x 葬送的芙莉莲",
  "CookieRun: Kingdom": "姜饼人王国",
  "Isekai:Slow Life": "异世界慢生活",
  "CookieRun: Crumble - Idle RPG": "姜饼人：碎碎冒险",
  "Diablo Immortal": "暗黑破坏神：不朽",
  "MapleStory: Idle RPG": "冒险岛：放置 RPG",
  "Watcher of Realms": "诸神黄昏守望者",
  "Invincible: Guarding the Globe": "无敌少侠：守护地球",
  "Chaos Zero Nightmare": "混沌零点噩梦",
  "Hero Wars": "英雄战争",
  "DIGIMON UP": "数码宝贝 UP",
  "NTE: Neverness to Everness": "异环",
  "Rogue Legend": "肉鸽传说",
  "BrownDust2 - Full Burst RPG": "棕色尘埃 2",
  "MapleStory M - Fantasy MMORPG": "冒险岛 M",
  "The Seven Deadly Sins": "七大罪",
  "XP Hero": "经验英雄",
  "Wizardry Variants Daphne": "巫术变体：达芙妮",
  "RF ONLINE NEXT": "RF Online Next",
  "P5X | Persona5: The Phantom X": "女神异闻录：夜幕魅影",
  "Pokémon Masters EX": "宝可梦大师 EX",
  "WWE Champions": "WWE 冠军",
  "AFK Arena": "剑与远征",
  "Last War: Survival Game": "最后战争：生存游戏",
  "Castle Busters: Tower Defense": "城堡破坏者：塔防",
  "Kingdom Guard": "王国守卫",
  "Bloons TD 6": "气球塔防 6",
  "Bloons TD Battles 2": "气球塔防对战 2",
  "Tower War - Tactical Conquest": "塔楼战争",
  "Tower War: Tactical Conquest": "塔楼战争",
  "Rush Royale: Tower Defense TD": "皇家冲冲冲",
  "The Tower - Idle Tower Defense": "放置高塔防御",
  "Raid Rush: Tower Defense TD": "突袭塔防",
  "Grow Castle - Tower Defense": "成长城堡",
  "King's Choice: Rule Your Fate": "\u56fd\u738b\u7684\u9009\u62e9\uff1a\u547d\u8fd0\u6cd5\u5219",
  "Kingshot": "王国射击",
  "Whiteout Survival": "无尽冬日",
  "Last Z: Survival Shooter": "末日 Z",
  "Evony: The King's Return": "伊凡尼：王者归来",
  "Total Battle": "全面战争策略",
  "Clash of Clans": "部落冲突",
  "Last Asylum: Plague": "最后庇护所：瘟疫",
  "Dark War Survival": "黑暗战争生存",
  "Puzzles & Survival": "谜题与生存",
  "Puzzles & Chaos": "谜题与混沌",
  "Arknights": "明日方舟",
  "Star Trek Fleet Command": "星际迷航舰队指挥",
  "Palmon: Survival": "帕鲁生存",
  "Rise of Kingdoms": "万国觉醒",
  "Rise of Castles: Ice and Fire": "\u57ce\u5821\u5d1b\u8d77\uff1a\u51b0\u4e0e\u706b",
  "Clash Royale": "皇室战争",
  "Age of Origins": "起源时代",
  "Lands of Jail": "监狱之地",
  "Top Girl": "顶级女孩",
  "Game of Thrones: Dragonfire": "权力的游戏：龙焰",
  "Police Chief": "警察局长",
  "Lords Mobile": "王国纪元",
  "The Grand Mafia": "黑道风云",
  "Warhammer 40,000: Tacticus": "战锤 40K：战术",
  "Tiles Survive!": "瓷砖生存",
  "Top War": "口袋奇兵",
  "Duck Survival": "鸭子生存",
  "Foundation: Galactic Frontier": "基地：银河边境",
  "Top Heroes": "顶级英雄",
  "Guns of Glory: Lost Island": "火枪纪元：失落之岛",
};

const devCnRaw = {
  "Dream Games, Ltd.": "Dream Games（梦之游戏）",
  "Microfun Limited": "Microfun（柠檬微趣）",
  "Fun Galaxy Media": "Fun Galaxy Media（成都向扬科技）",
  "Peak": "Peak / Peak Games",
  "Playrix": "Playrix（可记为梦幻系厂商）",
  "Loom Games A.Ş.": "Loom Games",
  "Combo Game": "Combo Game",
  "Homa": "Homa（霍马）",
  "Cedar Games Studio": "Cedar Games",
  "Magmatic Games LTD": "Magmatic Games（Travel Town 团队）",
  "Grand Games A.Ş.": "Grand Games",
  "Gram Games Limited": "Gram Games",
  "SuperPlay.": "SuperPlay",
  "Rollic Games": "Rollic Games",
  "VOODOO": "Voodoo",
  "Metacore Games Oy": "Metacore",
  "Small Giant Games": "Small Giant Games",
  "Good Job Games": "Good Job Games",
  "Boombox Games LTD": "Boombox Games",
  "Breeze Games": "Breeze Games",
  "Rotatelab Yazilim ve Bilisim A.S.": "Rotatelab",
  "iKame Games - Zego Studio": "iKame / Zego",
  "Jam City, Inc.": "Jam City",
  "Oakever Games": "Oakever Games",
  "Lessmore GmbH": "Lessmore",
  "GOODROID,Inc.": "GOODROID",
  "Easybrain": "Easybrain",
  "Tripledot Studios Limited": "Tripledot Studios",
  "Ivy": "Ivy",
  "SayGames Ltd": "SayGames",
  "NimbleMind Network Inc.": "NimbleMind",
  "Guru Puzzle Game": "Guru Puzzle",
  "Runyou": "Runyou",
  "Bunny Fungames": "Bunny Fungames",
  "Lion Studios Plus": "Lion Studios",
  "Mindful Daily Puzzles": "Mindful Daily Puzzles",
  "BOLTRAY GAMES": "BOLTRAY GAMES",
  "COGNOSPHERE PTE. LTD.": "COGNOSPHERE（米哈游海外）",
  "Aniplex Inc.": "Aniplex",
  "ELECTRONIC ARTS": "EA（艺电）",
  "Level Infinite": "Level Infinite（腾讯海外发行）",
  "Plarium Global Ltd": "Plarium",
  "Scopely": "Scopely",
  "Com2uS": "Com2uS",
  "Devsisters Corporation": "Devsisters",
  "Mars-Games": "Mars-Games",
  "Blizzard Entertainment, Inc.": "Blizzard（暴雪）",
  "NEXON Company": "NEXON",
  "Skystone Games Pte. Ltd.": "Skystone Games",
  "Ubisoft Entertainment": "Ubisoft（育碧）",
  "Smilegate, Inc.": "Smilegate",
  "N2E": "N2E",
  "PocketHaven": "PocketHaven",
  "NEOWIZ": "NEOWIZ",
  "株式会社ドリコム": "Drecom",
  "SEGA CORPORATION": "SEGA（世嘉）",
  "DeNA Co., Ltd.": "DeNA",
  "LilithGames": "LilithGames（莉莉丝）",
  "FUNFLY PTE. LTD.": "FirstFun / FunFly",
  "Century Games PTE. LTD.": "Century Games（世纪游戏）",
  "Omnilojo Pte Ltd": "Omnilojo",
  "TG Inc.": "TG Inc.",
  "Scorewarrior": "Scorewarrior",
  "Supercell": "Supercell",
  "37GAMES GLOBAL": "37GAMES（三七互娱海外）",
  "37GAMES": "37GAMES（三七互娱）",
  "Yostar Limited.": "Yostar（悠星）",
  "LILITH TECHNOLOGY HONG KONG LIMITED": "Lilith / LilithGames（莉莉丝）",
  "CamelStudio": "CamelStudio",
  "SINGAPORE JUST GAME TECHNOLOGY PTE. LTD.": "Just Game",
  "Happy Factory PTE LTD": "Happy Factory",
  "Warner Bros. International Enterprises": "Warner Bros.（华纳兄弟）",
  "VoyagerOne IE": "VoyagerOne",
  "IGG.COM": "IGG",
  "Phantix Games": "Phantix",
  "Snowprint Studios AB": "Snowprint Studios",
  "FunPlus International AG": "FunPlus",
  "RiverGame": "RiverGame",
  "Joy Nice Games": "Joy Nice Games",
  "Gimica GmbH": "Gimica",
  "Ninja Kiwi": "Ninja Kiwi（气球塔防团队）",
  "MY.GAMES B.V.": "MY.GAMES",
  "Gear Games": "Gear Games",
  "Gear Inc.": "Gear Inc.",
  "Gear Inc": "Gear Inc.",
  "Easybrain Ltd": "Easybrain",
  "Game Duo Co.,Ltd.": "Game Duo",
  "Game Duo Co., Ltd.": "Game Duo",
};

const typeMap = {
  "Royal Match": "Match-3",
  "Mystery Dumpling Blind Box": "Unbox / ASMR / 休闲模拟",
  "Gossip Harbor: Merge & Story": "Merge / Story",
  "Royal Kingdom": "Match-3",
  "Toon Blast": "Blast",
  "Fishdom": "Match-3 / 养成",
  "Match Factory!": "3D Match",
  "Pixel Flow!": "轻 Puzzle",
  "Yarn Loop": "Knit / Sort",
  "All in Hole: Black Hole Games": "黑洞 / 轻 Puzzle",
  "Flambe: Merge & Cook": "Merge / Cook",
  "Mystery Town": "Merge / 悬疑",
  "Travel Town": "Merge",
  "Toy Blast": "Blast",
  "Hole Stars": "黑洞 / Puzzle",
  "Magic Sort!": "Sort",
  "Seaside Escape": "Merge / Story",
  "Merge Dragons!": "Merge",
  "Domino Dreams": "Domino / Puzzle",
  "Color Block Jam": "Block / Jam",
  "Marble Sort!": "Sort",
  "Merge Mansion": "Merge / Story",
  "Empires & Puzzles": "Puzzle RPG",
  "Screwdom 3D": "Screw Puzzle",
  "Meowdoku: Brain Puzzle Games": "Sudoku / Brain Puzzle",
  "Block Blast!": "Block",
  "Sword x Staff": "Action RPG",
  "Zenless Zone Zero": "Action RPG / 二游",
  "GODDESS OF VICTORY: NIKKE": "二游 / 角色收集",
  "AFK Journey": "放置 RPG / 角色收集",
  "AFK Arena": "放置 RPG",
  "Hero Wars": "放置 RPG / 养成",
  "Isekai: Slow Life": "放置 RPG / 模拟经营",
  "CookieRun: Crumble - Idle RPG": "放置 RPG",
  "MapleStory: Idle RPG": "放置 RPG",
  "Top Heroes": "放置 RPG / Kingdom",
  "Last War: Survival Game": "轻玩法 + SLG",
  "Last Z: Survival Shooter": "轻射击 + 生存策略",
  "Kingshot": "Survival Strategy",
  "Whiteout Survival": "Survival SLG",
  "Puzzles & Survival": "Puzzle + SLG",
  "Clash Royale": "卡牌 / 轻策略",
  "Tiles Survive!": "Tile + 生存策略",
  "Duck Survival": "轻量生存策略",
  "Castle Busters: Tower Defense": "休闲塔防 / TD",
  "Arknights": "塔防 / 二游",
  "Age of Origins": "4X SLG / 塔防",
  "Kingdom Guard": "中轻度塔防 / 合成",
  "The Tower - Idle Tower Defense": "放置塔防 / 中轻度",
  "Raid Rush: Tower Defense TD": "中轻度塔防 / TD",
  "Grow Castle - Tower Defense": "中轻度塔防 / TD",
  "Rush Royale: Tower Defense TD": "中轻度塔防 / 卡牌",
  "Bloons TD 6": "经典休闲塔防",
  "Bloons TD Battles 2": "休闲塔防 / PVP",
  "Tower War - Tactical Conquest": "休闲塔防 / 轻策略",
  "Tower War: Tactical Conquest": "休闲塔防 / 轻策略",
};

const familyDefs = [
  {
    name: "Match-3 / Blast",
    desc: "传统消除、Blast 与关卡型长线产品，重点看关卡产能、活动节奏和长期目标。",
  },
  {
    name: "Merge / Story / Cook",
    desc: "合成、订单、装修、剧情和烹饪题材，重点看叙事包装、任务链和内容消耗。",
  },
  {
    name: "Sort / Jam / Line",
    desc: "排序、Jam、路线与堵塞类轻谜题，重点看首局压力、素材表达和广告变现入口。",
  },
  {
    name: "Traffic / Route / Escape",
    desc: "交通疏导、箭头路径、逃脱和车辆排序题，重点看规则一眼懂、堵点反馈和失败重试节奏。",
  },
  {
    name: "3D Match / Object",
    desc: "3D 物件匹配和找物清屏，重点看物件识别、触感反馈和关卡节奏。",
  },
  {
    name: "Hidden Object / Search",
    desc: "找物和视觉搜索，重点看场景信息量、目标提示和题材包装。",
  },
  {
    name: "Word / Sudoku / Brain",
    desc: "文字、数独、纸牌、麻将和脑力题，重点看日常留存、题库组织和轻量化包装。",
  },
  {
    name: "Card / Mahjong / Domino",
    desc: "纸牌、麻将、多米诺和拼图纸牌题，重点看日常挑战、收集目标和低压力长期留存。",
  },
  {
    name: "Arcade / Logic Puzzle",
    desc: "Block、Screw、Hole、Tile 等机制型 Puzzle，重点看单局爽感和素材可解释性。",
  },
  {
    name: "Puzzle + Meta / SLG",
    desc: "Puzzle 与 RPG、SLG、养成等外层系统混合，重点看玩法入口和商业化外层。",
  },
];

const familyOrder = new Map(familyDefs.map((family, index) => [family.name, index]));

const pointMap = {
  "Royal Match": "头部标杆，继续拆关卡产能、活动节奏、装修改造叙事和礼包节奏。",
  "Gossip Harbor: Merge & Story": "merge/story 头部样本，订单、剧情和场景修复都值得长期拆。",
  "Royal Kingdom": "Dream 第二产品，适合看同题材能力复用与差异化。",
  "Toon Blast": "老牌 Blast 长线运营样本。",
  "Fishdom": "消除 + 水族箱养成目标仍有效，适合看长期内容目标。",
  "Match Factory!": "3D Match 收入化重点样本，注意物件设计、清屏反馈和活动节奏。",
  "Pixel Flow!": "轻玩法同时在收入与免费侧可见，适合观察广告量向内购转化。",
  "Yarn Loop": "毛线/编织触感题材持续高位，适合看素材包装。",
  "Magic Sort!": "排序玩法今天在免费榜和收入榜都强，值得看首局与关卡压力曲线。",
  "Meowdoku: Brain Puzzle Games": "免费榜第一，猫咪包装 + 数独/脑力题材值得拆素材。",
  "Block Blast!": "免费榜仍在前三，作为买量素材和首局体验标杆继续观察。",
  "Zenless Zone Zero": "RPG 收入 #2，版本/角色池拉榜能力非常明显。",
  "Last War: Survival Game": "Strategy 收入 #1，轻玩法前置 + SLG 商业化仍是男向重点。",
  "Kingshot": "Century 另一头部策略产品，和 Whiteout Survival 形成双核心。",
  "Whiteout Survival": "冰雪生存 SLG 标杆，适合拆建筑、联盟和活动节奏。",
  "Puzzles & Survival": "Puzzle + SLG 核心样本，今天 Strategy 前 10。",
  "Arknights": "塔防/二游长线代表，适合看版本节点与角色内容拉动。",
};

const studioGroups = [
  {
    name: "Dream Games",
    cn: "梦之游戏",
    mark: "Dream",
    type: "Puzzle 精品化",
    intro: "土耳其头部休闲游戏厂商，代表路径是把单一 Match-3 玩法做到极高完成度，再用第二产品承接同一套能力。",
    thesis: "学习重点：关卡产能、失败-重试节奏、王室题材包装、活动节奏与第二产品差异化。",
    products: ["Royal Match", "Royal Kingdom"],
  },
  {
    name: "Microfun Limited",
    cn: "柠檬微趣",
    mark: "Micro",
    type: "Merge / Story",
    intro: "中国出海休闲厂商，强项是 merge、剧情、订单和场景修复目标的组合。",
    thesis: "学习重点：订单系统如何驱动资源循环，剧情和装修目标如何延长留存，多产品如何复用 merge/story 框架。",
    products: ["Gossip Harbor: Merge & Story", "Flambe: Merge & Cook", "Seaside Escape"],
  },
  {
    name: "Oakever Games",
    cn: "Oakever Games",
    mark: "Oak",
    type: "免费榜 / 轻 Puzzle",
    intro: "今天 Google Play Puzzle 免费榜里最值得补充观察的厂商，多个产品进入前 30。",
    thesis: "学习重点：免费榜买量包装、脑力题材、拼图/瓷砖/迷宫轻玩法的矩阵化投放。",
    products: ["Meowdoku: Brain Puzzle Games", "Amaze GO!", "Jigsawcard Solitaire Puzzle", "Tile Explorer - Triple Match"],
  },
  {
    name: "Peak / Peak Games",
    cn: "Peak / Peak Games",
    mark: "Peak",
    type: "Blast / 3D Match",
    intro: "经典休闲厂商，从 Blast 老产品延伸到 3D Match，产品组合能看出玩法迁移能力。",
    thesis: "学习重点：老产品长线运营、关卡池维护、从 2D Blast 到 3D Match 的商业化迁移。",
    products: ["Toon Blast", "Match Factory!", "Toy Blast"],
  },
  {
    name: "Playrix",
    cn: "Playrix；可记为梦幻系厂商",
    mark: "Playrix",
    type: "消除 + Meta",
    intro: "长线休闲产品矩阵厂商，擅长把消除与家装、花园、小镇、水族箱等长期目标结合。",
    thesis: "学习重点：老产品长期内容框架、主题化装修目标、多产品矩阵的稳定经营。",
    products: ["Fishdom", "Township", "Gardenscapes", "Homescapes"],
  },
  {
    name: "King",
    cn: "King；Candy Crush 厂商",
    mark: "King",
    type: "经典 Match-3",
    intro: "全球经典 Match-3 厂商之一，强项是品牌资产、关卡池和活动运营。",
    thesis: "学习重点：老产品持续变现、品牌认知、活动节奏、关卡难度曲线。",
    products: ["Candy Crush Saga", "Candy Crush Soda Saga"],
  },
  {
    name: "Century Games",
    cn: "世纪游戏",
    mark: "Century",
    type: "SLG + 休闲横向",
    intro: "同时覆盖男向 SLG 和休闲 merge 的厂商，产品组合很适合学习跨品类能力。",
    thesis: "学习重点：生存题材包装、买量素材、联盟 SLG 商业化，以及休闲产品线的横向扩张。",
    products: ["Kingshot", "Whiteout Survival", "Tasty Travels"],
  },
  {
    name: "37GAMES",
    cn: "三七互娱海外品牌",
    mark: "37",
    type: "Puzzle + SLG",
    intro: "中国出海大厂，擅长把 puzzle 前置玩法和 SLG/RPG 数值框架结合。",
    thesis: "学习重点：轻玩法入口、末日/城堡题材、联盟系统、付费数值和买量素材的结合。",
    products: ["Puzzles & Survival", "Puzzles & Chaos", "Last Asylum: Plague"],
  },
  {
    name: "COGNOSPHERE / HoYoverse",
    cn: "米哈游海外发行主体",
    mark: "HYV",
    type: "二游 / 内容驱动",
    intro: "内容工业化和角色运营能力强，榜单波动通常与版本、角色池、活动节点高度相关。",
    thesis: "学习重点：角色资产、版本更新节奏、活动召回、社区话题和收入峰值之间的关系。",
    products: ["Zenless Zone Zero"],
  },
  {
    name: "Devsisters",
    cn: "Devsisters",
    mark: "Dev",
    type: "RPG / 可爱风 IP",
    intro: "今天 RPG 收入榜里同一账号两款 CookieRun 产品同时出现，适合观察 IP 矩阵。",
    thesis: "学习重点：可爱风 IP、角色收集、王国/放置框架和衍生产品的分层运营。",
    products: ["CookieRun: Kingdom", "CookieRun: Crumble - Idle RPG"],
  },
  {
    name: "Level Infinite",
    cn: "腾讯 Level Infinite",
    mark: "Level",
    type: "全球发行 / 二游",
    intro: "腾讯海外发行品牌，适合观察二游在欧美市场的发行、素材和商业化。",
    thesis: "学习重点：角色收集、美术资产、抽卡活动和全球发行节奏。",
    products: ["GODDESS OF VICTORY: NIKKE"],
  },
  {
    name: "Supercell",
    cn: "Supercell",
    mark: "SC",
    type: "策略长线",
    intro: "经典策略厂商，代表产品长期占据策略榜单，是成熟玩法和社区运营参照。",
    thesis: "学习重点：多人竞技、部落/社区、平衡性、活动运营和长线品牌。",
    products: ["Clash of Clans", "Clash Royale"],
  },
  {
    name: "Lilith / LilithGames",
    cn: "莉莉丝",
    mark: "Lilith",
    type: "SLG / 放置 RPG",
    intro: "中国出海代表厂商之一，既有 4X 长线，也有放置 RPG 和新生存策略线索。",
    thesis: "学习重点：4X 长线框架、题材包装、英雄收集和新产品探索。",
    products: ["Palmon: Survival", "Rise of Kingdoms", "AFK Arena"],
  },
  {
    name: "FunPlus",
    cn: "FunPlus",
    mark: "FP",
    type: "SLG / 混合题材",
    intro: "老牌 SLG 出海厂商，今天 Strategy 榜尾仍有多条产品线索。",
    thesis: "学习重点：SLG 买量题材、解谜前置、老产品回流和新品试探。",
    products: ["Tiles Survive!", "Foundation: Galactic Frontier", "Guns of Glory: Lost Island"],
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function canonicalName(name) {
  const cleaned = decodeHtml(String(name || ""))
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return aliasMap.get(cleaned) || cleaned;
}

function cnName(name) {
  return gameCn[name] || gameCn[canonicalName(name)] || "暂无公开常用译名";
}

function gameLabel(name) {
  const cn = cnName(name);
  return cn === "暂无公开常用译名" ? name : `${name}（${cn}）`;
}

function norm(value) {
  return canonicalName(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return norm(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "game";
}

function words(value) {
  return norm(value).split(" ").filter((word) => word.length > 1);
}

function initials(value) {
  const result = words(value).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return result || "GM";
}

function devCn(name) {
  return devCnRaw[name] || name || "厂商暂缺";
}

function gameType(name, fallback) {
  return typeMap[name] || fallback || "待观察";
}

function rowText(name, categoryShort = "") {
  return `${name || ""} ${typeMap[name] || ""} ${categoryShort || ""}`.toLowerCase();
}

function isMidLightTowerDefenseText(raw) {
  return /castle busters|kingdom guard|bloons td|tower war|rush royale|raid rush|grow castle|the tower|idle tower|中轻度塔防|休闲塔防|放置塔防|经典休闲塔防/.test(raw);
}

function isTowerDefenseText(raw) {
  return isMidLightTowerDefenseText(raw) || /tower|td|defen[cs]e|塔防|arknights|age of origins/.test(raw);
}

function isCasualStrategyText(raw) {
  return /last war|last z|clash royale|tiles survive|duck survival|轻玩法|轻射击|卡牌 \/ 轻策略|tile \+ 生存|轻量生存/.test(raw);
}

function gameFamily(name, categoryShort = "") {
  const raw = rowText(name, categoryShort);
  if (/mystery dumpling|blind box|unbox|asmr/.test(raw)) return "Unbox / ASMR / 休闲模拟";
  if (isMidLightTowerDefenseText(raw)) return "休闲 / 中轻度塔防";
  if (isTowerDefenseText(raw)) return "重度塔防 / 策略塔防";
  if (/idle|afk|放置|slow life|top heroes|hero wars|maplestory idle|crumble/.test(raw)) return "放置 RPG / Idle";
  if (categoryShort.includes("RPG")) return "RPG / 角色收集";
  if (categoryShort.includes("Strategy")) {
    if (isMidLightTowerDefenseText(raw)) return "休闲 / 中轻度塔防";
    if (isTowerDefenseText(raw)) return "重度塔防 / 策略塔防";
    if (isCasualStrategyText(raw)) return "休闲策略 / 轻 SLG 入口";
    if (/puzzles? & (survival|chaos)|puzzle \+ slg|puzzle/.test(raw)) return "Puzzle + Meta / SLG";
    return "SLG / 4X / 生存策略";
  }
  if (/puzzles? & (survival|chaos)|empires & puzzles|puzzle rpg|puzzle \+ slg|slg/.test(raw)) return "Puzzle + Meta / SLG";
  if (/merge|cook|mansion|harbor|travel town|seaside|dragons|flambe|mystery town|tasty travels/.test(raw)) return "Merge / Story / Cook";
  if (/match factory|3d match|triple match|object/.test(raw)) return "3D Match / Object";
  if (/bus traffic|car sort|arrow|arrows|point out|escape|route|traffic/.test(raw)) return "Traffic / Route / Escape";
  if (/domino|solitaire|jigsawcard|mahjong|jigsaw drop/.test(raw)) return "Card / Mahjong / Domino";
  if (/sort|jam|line|loop|yarn|marble/.test(raw)) return "Sort / Jam / Line";
  if (/hidden|seek|search|find/.test(raw)) return "Hidden Object / Search";
  if (/\bword\b|sudoku|brain|nyt/.test(raw)) return "Word / Sudoku / Brain";
  if (/block|screw|hole|pixel|flow|knock|tile|cube|woodoku|jigsaw|point out|color block/.test(raw)) return "Arcade / Logic Puzzle";
  if (/match-3|candy|royal match|royal kingdom|toon blast|toy blast|fishdom|gardenscapes|homescapes|township/.test(raw)) return "Match-3 / Blast";
  return "Arcade / Logic Puzzle";
}

function learningPoint(name, categoryShort) {
  if (pointMap[name]) return pointMap[name];
  const raw = rowText(name, categoryShort);
  if (/mystery dumpling|blind box|unbox|asmr/.test(raw)) return "免费总榜冲顶样本，重点看盲盒开盒反馈、ASMR 声画包装、低门槛题材和广告素材转化。";
  if (isMidLightTowerDefenseText(raw)) return "休闲/中轻度塔防线索，重点看首局可解释性、塔/单位成长、关卡压力和广告到内购转化。";
  if (isTowerDefenseText(raw)) return "重度塔防/策略塔防线索，重点看防线构筑、角色深度、版本节点和活动商业化。";
  if (isCasualStrategyText(raw)) return "休闲策略线索，重点看轻玩法前置、素材吸量、短局反馈和中长期 SLG 外层承接。";
  if (/idle|afk|放置|slow life|top heroes|hero wars|maplestory idle|crumble/.test(raw)) return "放置 RPG 线索，重点看离线收益、养成深度、角色收集和低操作长期留存。";
  if (categoryShort.includes("免费")) return "免费榜流量线索，适合看素材包装、首局体验和广告变现入口。";
  if (categoryShort.includes("RPG")) return "RPG 收入线索，适合看角色池、版本活动、IP/美术资产与付费节奏。";
  if (categoryShort.includes("Strategy")) return "策略/SLG 收入线索，适合看题材包装、联盟系统、买量素材和长线活动。";
  return "收入榜线索，适合看题材包装、关卡节奏、活动运营和商业化设计。";
}

async function fetchText(url, expectedTitle) {
  let lastError = null;
  const maxAttempts = Number(process.env.FETCH_ATTEMPTS || 6);
  const timeoutMs = Number(process.env.FETCH_TIMEOUT_MS || 45000);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CodexGameDaily/1.0",
          "Accept": "text/html,application/xhtml+xml",
          "Cache-Control": "no-cache",
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (expectedTitle) {
        const title = /<title>([^<]+)/i.exec(text)?.[1] || "";
        if (!title.includes(expectedTitle)) throw new Error(`unexpected page title: ${title}`);
      }
      return text;
    } catch (error) {
      lastError = error;
      console.warn(`fetch retry ${attempt}/${maxAttempts} failed for ${url}: ${error.message}`);
      await sleep(Math.min(60000, 5000 * attempt + Math.floor(Math.random() * 2000)));
    }
  }
  throw new Error(`failed to fetch ${url}: ${lastError ? lastError.message : "unknown error"}`);
}

function loadGooglePlayScraper() {
  if (process.env.DISABLE_GOOGLE_PLAY_OFFICIAL === "1") return null;
  if (googlePlayScraperCache) return googlePlayScraperCache;
  try {
    const loaded = siteRequire("google-play-scraper");
    googlePlayScraperCache = loaded.default || loaded;
    return googlePlayScraperCache;
  } catch (firstError) {
    if (process.env.DISABLE_AUTO_NPM_INSTALL === "1") {
      console.warn(`Google Play official scraper unavailable: ${firstError.message}`);
      return null;
    }
    try {
      const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
      console.log("install google-play-scraper@10.1.3 for official Google Play rankings");
      execFileSync(npmCommand, ["install", "google-play-scraper@10.1.3", "--no-save", "--no-audit", "--no-fund"], {
        cwd: siteDir,
        stdio: "inherit",
        timeout: 180000,
      });
      const loaded = siteRequire("google-play-scraper");
      googlePlayScraperCache = loaded.default || loaded;
      return googlePlayScraperCache;
    } catch (installError) {
      console.warn(`Google Play official scraper install failed: ${installError.message}`);
      return null;
    }
  }
}

async function fetchGooglePlayOfficial(config) {
  const official = config.official;
  if (!official) throw new Error("missing official Google Play config");
  const gplay = loadGooglePlayScraper();
  if (!gplay || !gplay.list || !gplay.category || !gplay.collection) {
    throw new Error("google-play-scraper is not available");
  }
  const apps = await gplay.list({
    category: gplay.category[official.category] || official.category,
    collection: gplay.collection[official.collection] || official.collection,
    num: config.limit || 30,
    lang: "en",
    country: "us",
    fullDetail: false,
  });
  if (!Array.isArray(apps) || apps.length === 0) {
    throw new Error(`Google Play official list returned no rows for ${config.key}`);
  }
  const rows = apps.slice(0, config.limit || 30).map((app, index) => {
    const rawName = app.title || "";
    const name = canonicalName(rawName);
    const developer = app.developer || "";
    return {
      rank: index + 1,
      rawName,
      name,
      developer,
      developerCn: devCn(developer),
      type: gameType(name, config.short),
      family: gameFamily(name, config.short),
      point: learningPoint(name, config.short),
      categoryKey: config.key,
      categoryShort: config.short,
      icon: app.icon || "",
      appId: app.appId || "",
      sourceUrl: app.url || (app.appId ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(app.appId)}&hl=en_US&gl=US` : official.url),
      sourceProvider: official.sourceProvider,
    };
  });
  return {
    updated: todayInShanghai(),
    rows,
    url: official.url,
    sourceLabel: official.sourceLabel,
    sourceProvider: official.sourceProvider,
    fallbackSourceLabel: config.sourceLabel,
    fallbackUrl: config.url,
  };
}

async function fetchRankList(config) {
  if (config.official) {
    try {
      console.log(`fetch official ${config.key}`);
      return { ...config, ...await fetchGooglePlayOfficial(config) };
    } catch (error) {
      console.warn(`official Google Play failed for ${config.key}, fallback to AppBrain: ${error.message}`);
    }
  }
  console.log(`fetch fallback ${config.key}`);
  const html = await fetchText(config.url, config.expectedTitle);
  return { ...config, ...parseAppBrain(html, config) };
}

function parseAppBrain(html, config) {
  const updated = /Last updated:\s*<time>([^<]+)/i.exec(html)?.[1] || "";
  const rows = [...html.matchAll(/<tr>[\s\S]*?<\/tr>/g)]
    .map((match) => match[0])
    .filter((row) => row.includes("ranking-rank") && row.includes("ranking-app-cell"))
    .slice(0, config.limit || 30)
    .map((row) => {
      const rank = Number(stripTags(/<td class="ranking-rank">([\s\S]*?)<\/td>/i.exec(row)?.[1] || ""));
      const appCell = /<td class="ranking-app-cell">([\s\S]*?)<\/td>/i.exec(row)?.[1] || "";
      const appLink = /<a href="([^"]+)">([\s\S]*?)<\/a>/i.exec(appCell) || [];
      const rawName = stripTags(appLink[2] || "");
      const name = canonicalName(rawName);
      const developer = stripTags(/by\s*<a[^>]*>([\s\S]*?)<\/a>/i.exec(appCell)?.[1] || "");
      const icon = decodeHtml(/ranking-icon-cell[\s\S]*?<img[^>]+src="([^"]+)"/i.exec(row)?.[1] || "");
      const appbrainUrl = appLink[1] ? new URL(appLink[1], "https://www.appbrain.com").href : config.url;
      return {
        rank,
        rawName,
        name,
        developer,
        developerCn: devCn(developer),
        type: gameType(name, config.short),
        family: gameFamily(name, config.short),
        point: learningPoint(name, config.short),
        categoryKey: config.key,
        categoryShort: config.short,
        icon,
        sourceUrl: appbrainUrl,
        sourceProvider: config.sourceProvider || "appbrain",
      };
    });
  return { updated, rows, sourceProvider: config.sourceProvider || "appbrain" };
}

function parseAppCurrents(html) {
  const dateModified = /"dateModified":"([^"]+)"/.exec(html)?.[1] || "";
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  for (const script of scripts) {
    try {
      const json = JSON.parse(script);
      const list = (json["@graph"] || []).find((item) => item["@type"] === "ItemList" && /Puzzle/.test(item.name || ""));
      if (!list) continue;
      return {
        updated: dateModified,
        rows: list.itemListElement.slice(0, 30).map((item) => {
          const name = canonicalName(item.name);
          const developer = developerByGame[name] || "";
          return {
            rank: Number(item.position),
            rawName: item.name,
            name,
            developer,
            developerCn: devCn(developer),
            type: gameType(name, iosSource.short),
            family: gameFamily(name, iosSource.short),
            point: learningPoint(name, iosSource.short),
            categoryKey: iosSource.key,
            categoryShort: iosSource.short,
            icon: "",
            sourceUrl: item.url || iosSource.url,
            sourceProvider: iosSource.sourceProvider || "appcurrents",
          };
        }),
        sourceProvider: iosSource.sourceProvider || "appcurrents",
      };
    } catch {
      // Keep looking for a parseable JSON-LD block.
    }
  }
  throw new Error("Could not parse AppCurrents iOS Puzzle list");
}

const developerByGame = {};

function buildDeveloperLookup(data) {
  for (const list of Object.values(data)) {
    for (const row of list.rows) {
      if (row.developer) developerByGame[row.name] = row.developer;
    }
  }
  Object.assign(developerByGame, {
    "Township": "Playrix",
    "Gardenscapes": "Playrix",
    "Homescapes": "Playrix",
    "Candy Crush Saga": "King",
    "Candy Crush Soda Saga": "King",
    "Tasty Travels": "Century Games PTE. LTD.",
    "Block Out!": "HypeHype",
    "NYT Games": "The New York Times",
    "Screwdom": "Zego Global",
    "Colony Flow!": "ABI Global",
    "Jelly Busters: Puzzle Game": "",
  });
}

function parsePreviousRanks() {
  const previousPaths = previousDate ? [
    path.join(outputDir, `game-intelligence-full-${previousDate}.html`),
    path.join(archiveDir, `${previousDate}.html`),
  ] : [];
  const previousPath = previousPaths.find((candidate) => fs.existsSync(candidate));
  const out = {
    __available: false,
    __date: previousDate || "",
    __path: previousPath || "",
    __providers: {},
  };
  if (!previousPath) return out;
  const html = fs.readFileSync(previousPath, "utf8");
  try {
    const sourceSnapshot = /<script id="rank-source-snapshot" type="application\/json">([\s\S]*?)<\/script>/i.exec(html)?.[1] || "";
    if (sourceSnapshot) {
      const parsed = JSON.parse(decodeHtml(sourceSnapshot));
      for (const [key, value] of Object.entries(parsed || {})) {
        out.__providers[key] = value.sourceProvider || "";
      }
    }
  } catch {
    out.__providers = {};
  }
  const ids = ["free", "puzzle", "male"];
  let parsedTables = 0;

  function section(id) {
    const start = html.indexOf(`<section id="${id}"`);
    if (start < 0) return "";
    const next = html.indexOf("<section id=", start + 20);
    return html.slice(start, next < 0 ? html.length : next);
  }

  function productName(cellHtml = "") {
    return canonicalName(stripTags(cellHtml.split('<span class="cn"')[0]));
  }

  for (const id of ids) {
    const sectionHtml = section(id);
    const bodies = [...sectionHtml.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)].map((match) => match[1]);
    const keys = id === "free" ? ["gpGamesFree"]
      : id === "puzzle" ? ["gpPuzzleGross", "iosPuzzleGross", "gpPuzzleFree"]
      : ["gpRpgGross", "gpStrategyGross", "iosStrategyGross"];
    bodies.forEach((tbody, tableIndex) => {
      const key = keys[tableIndex];
      if (!key) return;
      out[key] = new Map();
      [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].forEach((match, index) => {
        const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]);
        const name = productName(cells[1] || "");
        if (name) out[key].set(norm(name), index + 1);
      });
      if (out[key].size > 0) parsedTables += 1;
    });
  }
  out.__available = parsedTables > 0;
  return out;
}

function attachDeltas(data, previousRanks) {
  const hasComparableSnapshot = Boolean(previousRanks && previousRanks.__available);
  for (const [key, list] of Object.entries(data)) {
    const currentProvider = list.sourceProvider || "";
    const previousProvider = previousRanks?.__providers?.[key] || "";
    const sameSource = Boolean(currentProvider && previousProvider && currentProvider === previousProvider);
    const previous = hasComparableSnapshot && sameSource ? previousRanks[key] : null;
    for (const row of list.rows) {
      if (!previous || previous.size === 0) {
        row.previousRank = null;
        row.delta = "";
        row.deltaClass = "none";
        row.deltaVerified = false;
        continue;
      }
      const oldRank = previous.get(norm(row.name));
      row.previousRank = oldRank || null;
      if (!oldRank) {
        row.delta = "新进Top30";
        row.deltaClass = "new";
      } else if (oldRank === row.rank) {
        row.delta = "持平";
        row.deltaClass = "flat";
      } else if (oldRank > row.rank) {
        row.delta = `↑${oldRank - row.rank}`;
        row.deltaClass = "up";
      } else {
        row.delta = `↓${row.rank - oldRank}`;
        row.deltaClass = "down";
      }
      row.deltaVerified = true;
    }
  }
}

function readMetadata() {
  if (!fs.existsSync(metadataPath)) return { metadata: [] };
  return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
}

function scoreIconMatch(query, item) {
  const nq = norm(query);
  const nr = norm(item.trackName);
  const qWords = words(query);
  const rWords = words(item.trackName);
  let score = 0;
  if (nr === nq) score += 120;
  if (nr.includes(nq) || nq.includes(nr)) score += 60;
  const common = qWords.filter((word) => rWords.includes(word));
  score += common.length * 12;
  if (qWords.length && common.length / qWords.length >= 0.75) score += 35;
  if (String(item.primaryGenreName || "").toLowerCase().includes("game")) score += 15;
  if ((item.genres || []).some((genre) => String(genre).toLowerCase().includes("game"))) score += 8;
  if (!item.artworkUrl512 && !item.artworkUrl100) score -= 60;
  return score;
}

function iconQueries(name) {
  const out = [name];
  for (const candidate of [
    name.replace(/[!®™]/g, "").replace(/:.*/, "").trim(),
    name.replace(/\s+-\s+.*/, "").trim(),
    name.split(":")[0].trim(),
    name.replace(/\s+x\s+.*/i, "").trim(),
  ]) {
    if (candidate && !out.includes(candidate)) out.push(candidate);
  }
  return out;
}

async function findIcon(name) {
  let best = null;
  const seen = new Set();
  for (const query of iconQueries(name)) {
    const url = "https://itunes.apple.com/search?entity=software&country=us&limit=12&term=" + encodeURIComponent(query);
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 CodexGameDaily/1.0" } });
    if (!response.ok) continue;
    const json = await response.json();
    for (const item of json.results || []) {
      const id = item.trackId || `${item.trackName}-${item.artistName}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const artworkUrl = String(item.artworkUrl512 || item.artworkUrl100 || "").replace(/\/\d+x\d+bb\.(jpg|png)$/i, "/512x512bb.jpg");
      const candidate = {
        trackName: item.trackName,
        artistName: item.artistName,
        artworkUrl,
        sourceUrl: item.trackViewUrl,
        score: scoreIconMatch(name, item),
        query,
      };
      if (!best || candidate.score > best.score) best = candidate;
    }
  }
  return best;
}

async function downloadIcon(url, destination) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 CodexGameDaily/1.0" } });
  if (!response.ok) throw new Error(`download ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, buffer);
  return buffer.length;
}

async function ensureIcons(rows) {
  fs.mkdirSync(siteOfficialIconDir, { recursive: true });
  fs.mkdirSync(localOfficialIconDir, { recursive: true });
  const metadata = readMetadata();
  const byName = new Map((metadata.metadata || []).map((entry) => [entry.name, entry]));
  const byCanonical = new Map((metadata.metadata || []).map((entry) => [norm(entry.name), entry]));
  const unique = [];
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    unique.push(row);
  }

  for (const row of unique) {
    const existing = byName.get(row.name) || byCanonical.get(norm(row.name));
    if (existing && existing.found && existing.image) {
      const sitePath = path.join(siteDir, existing.image);
      const localPath = path.join(outputDir, existing.image);
      if (fs.existsSync(sitePath)) {
        if (!fs.existsSync(localPath)) fs.copyFileSync(sitePath, localPath);
        byName.set(row.name, { ...existing, name: row.name });
        continue;
      }
    }

    process.stdout.write(`icon ${row.name} ... `);
    const slug = slugify(row.name);
    const rel = `assets/icons/official/${slug}.jpg`;
    const siteDest = path.join(siteOfficialIconDir, `${slug}.jpg`);
    const localDest = path.join(localOfficialIconDir, `${slug}.jpg`);
    try {
      if (row.icon) {
        const bytes = await downloadIcon(row.icon, siteDest);
        fs.copyFileSync(siteDest, localDest);
        byName.set(row.name, {
          name: row.name,
          found: true,
          initial: initials(row.name),
          image: rel,
          matchedName: row.rawName || row.name,
          artistName: row.developer || "",
          sourceUrl: row.sourceUrl || "",
          source: "AppBrain Google Play icon",
          score: 100,
          bytes,
        });
        console.log("ok -> AppBrain");
        await sleep(120);
        continue;
      }

      const best = await findIcon(row.name);
      if (!best || best.score < 70 || !best.artworkUrl) {
        console.log(`fallback${best ? ` (${best.trackName}, score ${best.score})` : ""}`);
        byName.set(row.name, { name: row.name, found: false, initial: initials(row.name), best });
        continue;
      }
      const bytes = await downloadIcon(best.artworkUrl, siteDest);
      fs.copyFileSync(siteDest, localDest);
      byName.set(row.name, {
        name: row.name,
        found: true,
        initial: initials(row.name),
        image: rel,
        matchedName: best.trackName,
        artistName: best.artistName,
        sourceUrl: best.sourceUrl,
        source: "Apple iTunes Search API",
        score: best.score,
        query: best.query,
        bytes,
      });
      console.log(`ok -> ${best.trackName}`);
      await sleep(120);
    } catch (error) {
      console.log(`fallback (${error.message})`);
      byName.set(row.name, { name: row.name, found: false, initial: initials(row.name), error: error.message });
    }
  }

  const merged = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
  const next = {
    preparedAt: new Date().toISOString(),
    total: merged.length,
    found: merged.filter((entry) => entry.found).length,
    metadata: merged,
  };
  fs.writeFileSync(metadataPath, JSON.stringify(next, null, 2), "utf8");
  fs.copyFileSync(metadataPath, path.join(localOfficialIconDir, "icon-metadata.json"));
  return new Map(merged.map((entry) => [entry.name, entry]));
}

function allRows(data) {
  return Object.values(data).flatMap((list) => list.rows);
}

function rankLookup(data) {
  const lookup = new Map();
  for (const list of Object.values(data)) {
    for (const row of list.rows) {
      if (!lookup.has(row.name)) lookup.set(row.name, []);
      lookup.get(row.name).push(`${row.categoryShort} #${row.rank}`);
    }
  }
  return lookup;
}

function topMovers(data) {
  const rows = allRows(data).filter((row) => row.deltaVerified && (row.deltaClass === "up" || row.deltaClass === "new"));
  return rows
    .sort((a, b) => {
      const scoreA = a.deltaClass === "new" ? 99 : Number(a.delta.slice(1));
      const scoreB = b.deltaClass === "new" ? 99 : Number(b.delta.slice(1));
      return scoreB - scoreA || a.rank - b.rank;
    })
    .slice(0, 10);
}

const maleSegmentDefinitions = [
  {
    key: "casualTowerDefense",
    title: "休闲 / 中轻度塔防",
    badge: "轻TD",
    desc: "优先看规则是否一眼懂、首局压力、塔/单位成长，以及广告流量到内购的承接。",
    match: (row) => isMidLightTowerDefenseText(rowText(row.name, row.categoryShort)),
  },
  {
    key: "casualStrategy",
    title: "休闲策略 / 轻 SLG 入口",
    badge: "轻策略",
    desc: "轻操作玩法先吸量，再用城建、生存、卡牌或联盟外层承接长期留存。",
    match: (row) => isCasualStrategyText(rowText(row.name, row.categoryShort)),
  },
  {
    key: "coreRpg",
    title: "核心 RPG / 角色收集",
    badge: "RPG",
    desc: "角色池、版本节点、IP/美术资产和抽卡活动驱动收入。",
    match: (row) => row.categoryShort.includes("RPG") && !/idle|afk|放置|slow life|top heroes|hero wars|maplestory idle|crumble/i.test(`${row.name} ${row.type} ${row.family}`) && !/tower|td|defen[cs]e|塔防|arknights/i.test(`${row.name} ${row.type} ${row.family}`),
  },
  {
    key: "idleRpg",
    title: "放置 RPG / Idle",
    badge: "Idle",
    desc: "低操作、离线收益、长线养成和角色收集，适合和核心 RPG 分开看。",
    match: (row) => /idle|afk|放置|slow life|top heroes|hero wars|maplestory idle|crumble/i.test(`${row.name} ${row.type} ${row.family}`),
  },
  {
    key: "towerDefense",
    title: "重度塔防 / 策略塔防",
    badge: "重TD",
    desc: "角色、阵营、版本活动和策略外层更重，适合和休闲塔防拆开阅读。",
    match: (row) => isTowerDefenseText(rowText(row.name, row.categoryShort)) && !isMidLightTowerDefenseText(rowText(row.name, row.categoryShort)),
  },
  {
    key: "slg",
    title: "SLG / 4X / 生存策略",
    badge: "SLG",
    desc: "联盟、赛季、城建、战争和生存题材，是男向 Strategy 主干。",
    match: (row) => row.categoryShort.includes("Strategy") && !isTowerDefenseText(rowText(row.name, row.categoryShort)) && !isCasualStrategyText(rowText(row.name, row.categoryShort)) && !/puzzles? &|puzzle \+ slg/i.test(`${row.name} ${row.type} ${row.family}`),
  },
  {
    key: "puzzleSlg",
    title: "Puzzle + SLG / 混合外层",
    badge: "Hybrid",
    desc: "用轻 Puzzle 做入口，外层接 SLG/RPG 数值和联盟商业化。",
    match: (row) => /puzzles? &|puzzle \+ slg|puzzle \+ meta|empires & puzzles/i.test(`${row.name} ${row.type} ${row.family}`),
  },
];

function maleSourceRows(data) {
  return uniqueProductRows([
    ...data.gpRpgGross.rows,
    ...data.gpStrategyGross.rows,
    ...(data.iosStrategyGross?.rows || []),
  ]).sort((a, b) => {
    const weight = (row) => {
      if (row.categoryShort.includes("RPG")) return 0;
      if (row.categoryShort.includes("GP Strategy")) return 24;
      if (row.categoryShort.includes("iOS Strategy")) return 28;
      return 35;
    };
    return (a.rank + weight(a)) - (b.rank + weight(b));
  });
}

function buildMaleSegments(data) {
  const rows = maleSourceRows(data);
  return maleSegmentDefinitions.map((segment) => ({
    ...segment,
    rows: rows.filter(segment.match).slice(0, 6),
  })).filter((segment) => segment.rows.length);
}

function maleSegmentCardsHtml(data) {
  return buildMaleSegments(data).map((segment) => `
          <article class="card insight-card male-segment-card">
            <div class="insight-card-head">
              <div>
                <h3>${escapeHtml(segment.title)}</h3>
                <p>${escapeHtml(segment.desc)}</p>
              </div>
              <span>${escapeHtml(segment.badge)}</span>
            </div>
            <div class="mini-list">${segment.rows.map((row) => compactProductHtml(data, row, row.point, "male-segment-product")).join("")}
            </div>
          </article>`).join("");
}

function cleanInsightText(value, maxLength = 220) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/待核验/g, "")
    .trim()
    .slice(0, maxLength);
}

function validProductNameMap(data) {
  const map = new Map();
  for (const row of allRows(data)) map.set(norm(row.name), row.name);
  for (const studio of studioGroups) {
    for (const name of studio.products) map.set(norm(name), canonicalName(name));
  }
  return map;
}

function aiRankRows(list) {
  return list.rows.map((row) => ({
    name: row.name,
    cn: cnName(row.name),
    developer: row.developerCn,
    rank: row.rank,
    category: row.categoryShort,
    family: row.family || gameFamily(row.name, row.categoryShort),
    type: row.type,
    deltaVerified: Boolean(row.deltaVerified),
    delta: row.deltaVerified ? row.delta : "",
    deltaClass: row.deltaVerified ? row.deltaClass : "",
    currentPoint: row.point,
  }));
}

function buildAiContext(data) {
  return {
    reportDate,
    previousDate: previousDate || "",
    strictRules: [
      "只能依据输入榜单和 delta 字段分析，不要编造外部事实。",
      "只有 deltaVerified=true 且 deltaClass=new 时，才可写“新进Top30”。",
      "只有 deltaVerified=true 且 deltaClass=up 时，才可写“上升”。",
      "deltaVerified=false 的产品不能写成新进或上升，只能写稳定观察或继续观察。",
      "输出必须是 JSON，不要写 Markdown。",
    ],
    sources: {
      gpGamesFree: data.gpGamesFree?.updated || "",
      gpPuzzleGross: data.gpPuzzleGross.updated,
      gpPuzzleFree: data.gpPuzzleFree.updated,
      gpRpgGross: data.gpRpgGross.updated,
      gpStrategyGross: data.gpStrategyGross.updated,
      iosStrategyGross: data.iosStrategyGross?.updated || "",
      iosPuzzleGross: data.iosPuzzleGross.updated,
    },
    rankings: {
      gpGamesFree: data.gpGamesFree ? aiRankRows(data.gpGamesFree) : [],
      gpPuzzleGross: aiRankRows(data.gpPuzzleGross),
      iosPuzzleGross: aiRankRows(data.iosPuzzleGross),
      gpPuzzleFree: aiRankRows(data.gpPuzzleFree),
      gpRpgGross: aiRankRows(data.gpRpgGross),
      gpStrategyGross: aiRankRows(data.gpStrategyGross),
      iosStrategyGross: data.iosStrategyGross ? aiRankRows(data.iosStrategyGross) : [],
    },
    verifiedMovers: topMovers(data).map((row) => ({
      name: row.name,
      cn: cnName(row.name),
      developer: row.developerCn,
      rank: row.rank,
      category: row.categoryShort,
      delta: row.delta,
      deltaClass: row.deltaClass,
    })),
    maleSegments: buildMaleSegments(data).map((segment) => ({
      title: segment.title,
      desc: segment.desc,
      products: segment.rows.map((row) => ({
        name: row.name,
        cn: cnName(row.name),
        developer: row.developerCn,
        rank: row.rank,
        category: row.categoryShort,
        type: row.type,
        delta: row.deltaVerified ? row.delta : "",
      })),
    })),
    studios: studioGroups.map((studio) => ({
      name: studio.name,
      cn: studio.cn,
      type: studio.type,
      products: studio.products,
    })),
  };
}

function normalizeAiInsights(raw, data) {
  if (!raw || typeof raw !== "object") return null;
  const validNames = validProductNameMap(data);
  const resolveName = (name) => validNames.get(norm(name)) || "";
  const productItem = (item) => {
    const name = resolveName(typeof item === "string" ? item : item && item.name);
    if (!name) return null;
    return {
      name,
      note: cleanInsightText(item && item.note, 180),
    };
  };
  const productMap = (obj, maxLength) => {
    const out = {};
    if (!obj || typeof obj !== "object") return out;
    for (const [key, value] of Object.entries(obj)) {
      const name = resolveName(key);
      const text = cleanInsightText(value, maxLength);
      if (name && text) out[name] = text;
    }
    return out;
  };

  const summaryCards = Array.isArray(raw.summaryCards) ? raw.summaryCards.slice(0, 5).map((card) => {
    const products = Array.isArray(card.products) ? card.products.map(productItem).filter(Boolean).slice(0, 5) : [];
    if (!products.length) return null;
    return {
      title: cleanInsightText(card.title, 28),
      badge: cleanInsightText(card.badge, 12),
      note: cleanInsightText(card.note, 130),
      products,
    };
  }).filter(Boolean) : [];

  const accountCards = Array.isArray(raw.accountCards) ? raw.accountCards.slice(0, 4).map((card) => {
    const products = Array.isArray(card.products) ? card.products.map(productItem).filter(Boolean).slice(0, 4) : [];
    if (!products.length) return null;
    return {
      title: cleanInsightText(card.title, 28),
      subtitle: cleanInsightText(card.subtitle, 60),
      products,
    };
  }).filter(Boolean) : [];

  const studioNotes = {};
  if (raw.studioNotes && typeof raw.studioNotes === "object") {
    const studioNames = new Set(studioGroups.map((studio) => studio.name));
    for (const [name, note] of Object.entries(raw.studioNotes)) {
      if (!studioNames.has(name) || !note || typeof note !== "object") continue;
      studioNotes[name] = {
        intro: cleanInsightText(note.intro, 160),
        thesis: cleanInsightText(note.thesis, 180),
      };
    }
  }

  const watch = Array.isArray(raw.watch) ? raw.watch.map(productItem).filter(Boolean).slice(0, 4) : [];

  return {
    title: cleanInsightText(raw.title, 48),
    lead: cleanInsightText(raw.lead, 180),
    summaryCards,
    moverNotes: productMap(raw.moverNotes, 160),
    watch,
    accountCards,
    productPoints: productMap(raw.productPoints, 170),
    studioNotes,
  };
}

async function requestAiInsights(data) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    console.log("AI insights skipped: OPENAI_API_KEY is not configured.");
    return null;
  }
  if (process.env.DISABLE_AI_INSIGHTS === "1") {
    console.log("AI insights skipped: DISABLE_AI_INSIGHTS=1.");
    return null;
  }

  const baseUrl = String(process.env.OPENAI_API_BASE || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = String(process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
  const context = buildAiContext(data);
  const messages = [
    {
      role: "system",
      content: [
        "你是游戏行业产品分析师，服务对象是游戏产品/发行团队。",
        "你必须基于输入 JSON 中的榜单、排名、厂商和 delta 字段输出日报分析。",
        "严禁杜撰新品、上升、下降、厂商背景或外部新闻。",
        "如果产品没有 deltaVerified=true，不要把它写成新进或上升。",
        "写法要短、具体、可学习，避免空话。",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        task: "生成日报可读性增强数据。只返回 JSON。",
        outputShape: {
          title: "页面 H1，包含日期和一个核心结论",
          lead: "一句说明今天读法，不写方法论指令",
          summaryCards: [
            { title: "短标题", badge: "短标签", note: "卡片结论", products: [{ name: "必须来自输入产品名", note: "该产品学习点" }] },
          ],
          moverNotes: { "产品名": "仅对 verifiedMovers 里的产品写动态原因" },
          watch: [{ name: "必须来自输入产品名", note: "明天继续看的原因" }],
          accountCards: [
            { title: "厂商/账号标题", subtitle: "短说明", products: [{ name: "必须来自输入产品名", note: "账号内产品观察" }] },
          ],
          productPoints: { "产品名": "完整榜单里使用的简要学习点" },
          studioNotes: { "厂商英文名": { intro: "厂商简介", thesis: "产品方法观察" } },
        },
        context,
      }),
    },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(Number(process.env.OPENAI_TIMEOUT_MS || 90000)),
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: Number(process.env.OPENAI_TEMPERATURE || 0.2),
        response_format: { type: "json_object" },
        messages,
      }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${text.slice(0, 240)}`);
    const payload = JSON.parse(text);
    const content = payload.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    const normalized = normalizeAiInsights(parsed, data);
    if (!normalized) throw new Error("OpenAI returned an empty insight object.");
    console.log(`AI insights applied with model ${model}.`);
    return normalized;
  } catch (error) {
    if (process.env.AI_INSIGHTS_REQUIRED === "1") throw error;
    console.warn(`AI insights fallback: ${error.message}`);
    return null;
  }
}

function applyAiInsights(data, insights) {
  if (!insights || !insights.productPoints) return;
  for (const row of allRows(data)) {
    const point = insights.productPoints[row.name];
    if (point) row.point = point;
  }
}

function categoryRows(rows) {
  return rows.map((row) => {
    const deltaHtml = row.deltaVerified && row.delta
      ? `<span class="delta ${row.deltaClass}">${escapeHtml(row.delta)}</span>`
      : `<span class="muted-dash">&mdash;</span>`;
    return `
              <tr>
                <td><span class="${row.rank <= 10 ? "rank" : "rank soft"}">${row.rank}</span></td>
                <td class="product">${escapeHtml(row.name)}<span class="cn">中文参考：${escapeHtml(cnName(row.name))}</span></td>
                <td>${escapeHtml(row.developerCn)}</td>
                <td><strong>${escapeHtml(row.family || gameFamily(row.name, row.categoryShort))}</strong><span class="cn">${escapeHtml(row.type)}</span></td>
                <td>${deltaHtml}</td>
                <td>${escapeHtml(row.point)}</td>
              </tr>`;
  }).join("");
}

function rankSourceSnapshot(data) {
  const snapshot = {};
  for (const [key, list] of Object.entries(data)) {
    snapshot[key] = {
      sourceProvider: list.sourceProvider || "",
      sourceLabel: list.sourceLabel || "",
      url: list.url || "",
      updated: list.updated || "",
    };
  }
  return JSON.stringify(snapshot);
}

function sourceSummary(data) {
  const providers = new Set(Object.values(data).map((list) => list.sourceProvider || "").filter(Boolean));
  const gpOfficial = providers.has("google-play-official");
  const labels = [];
  if (gpOfficial) labels.push("Google Play 官方公开榜单");
  if (providers.has("appbrain")) labels.push("AppBrain");
  if (providers.has("appcurrents")) labels.push("AppCurrents");
  return labels.join(" / ") || "公开榜单源";
}

function sourceListHtml(data) {
  return Object.values(data)
    .map((source) => {
      const fallback = source.fallbackSourceLabel ? `（兜底源：${source.fallbackSourceLabel}）` : "";
      return `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.sourceLabel || source.label)}</a>${escapeHtml(fallback)}</li>`;
    })
    .join("\n");
}

function puzzleFamilyCardsHtml(data) {
  const ranks = rankLookup(data);
  const puzzleRows = [
    ...data.gpPuzzleGross.rows,
    ...data.iosPuzzleGross.rows,
    ...data.gpPuzzleFree.rows,
    ...allRows(data).filter((row) => {
      const familyName = row.family || gameFamily(row.name, row.categoryShort);
      return familyName === "Puzzle + Meta / SLG" || /puzzle/i.test(`${row.name} ${row.type || ""}`);
    }),
  ];
  const byName = new Map();
  const sourceScore = (item) => {
    if (!item) return 9999;
    const sourceWeight = item.categoryKey === "gpPuzzleGross" ? 0
      : item.categoryKey === "iosPuzzleGross" ? 4
      : item.categoryKey === "gpPuzzleFree" ? 12
      : item.categoryKey === "gpStrategyGross" ? 18
      : item.categoryKey === "iosStrategyGross" ? 24
      : item.categoryKey === "gpRpgGross" ? 26
      : item.categoryKey === "gpGamesFree" ? 32
      : 40;
    return sourceWeight + Number(item.rank || 999);
  };
  for (const row of puzzleRows) {
    const existing = byName.get(row.name);
    if (!existing || sourceScore(row) < sourceScore(existing)) byName.set(row.name, row);
  }

  const groups = new Map(familyDefs.map((family) => [family.name, []]));
  for (const row of byName.values()) {
    const familyName = row.family || gameFamily(row.name, row.categoryShort);
    if (!groups.has(familyName)) groups.set(familyName, []);
    groups.get(familyName).push(row);
  }

  const familyCards = [...groups.entries()]
    .filter(([, rows]) => rows.length)
    .sort((a, b) => (familyOrder.get(a[0]) ?? 99) - (familyOrder.get(b[0]) ?? 99))
    .map(([familyName, rows]) => {
      const def = familyDefs.find((item) => item.name === familyName);
      const sorted = rows.sort((a, b) => {
        const scoreA = a.categoryShort.includes("收入") ? a.rank : a.rank + 35;
        const scoreB = b.categoryShort.includes("收入") ? b.rank : b.rank + 35;
        return scoreA - scoreB;
      });
      const productCard = (row) => {
        const rankHtml = (ranks.get(row.name) || [`${row.categoryShort} #${row.rank}`])
          .slice(0, 3)
          .map((label) => `<span>${escapeHtml(label)}</span>`)
          .join("");
        return `
                <article class="family-product" data-game="${escapeHtml(row.name)}">
                  <span class="family-product-icon app-icon"></span>
                  <div class="family-product-text">
                    <strong>${escapeHtml(row.name)}</strong>
                    <span>中文参考：${escapeHtml(cnName(row.name))}</span>
                    <p>${escapeHtml(row.point)}</p>
                  </div>
                  <div class="family-ranks">${rankHtml}</div>
                </article>`;
      };
      const primaryRows = sorted.slice(0, 8);
      const extraRows = sorted.slice(8, 14);
      const productHtml = primaryRows.map(productCard).join("");
      const extraHtml = extraRows.length ? `
              <details class="family-more">
                <summary>展开更多 ${extraRows.length} 款同板块产品</summary>
                <div class="family-products extra">${extraRows.map(productCard).join("")}
                </div>
              </details>` : "";
      return `
          <article class="family-card">
            <header>
              <div>
                <h3>${escapeHtml(familyName)}</h3>
                <p>${escapeHtml(def?.desc || "本期 Puzzle 榜单中的机制类产品集合。")}</p>
              </div>
              <span>${sorted.length} 款</span>
            </header>
            <div class="family-products">${productHtml}
            </div>
            ${extraHtml}
          </article>`;
    });

  return familyCards.join("\n");
}

function studioCardsHtml(data, insights = null) {
  const ranks = rankLookup(data);
  return studioGroups.map((studio, index) => {
    const studioNote = insights?.studioNotes?.[studio.name] || {};
    const productHtml = studio.products.map((name) => {
      const rankItems = ranks.get(name) || [];
      const rankHtml = rankItems.length
        ? rankItems.slice(0, 3).map((label) => `<span>${escapeHtml(label)}</span>`).join("")
        : `<span>本期未进 Top 30</span><small>代表作观察</small>`;
      const productPoint = insights?.productPoints?.[name] || pointMap[name] || learningPoint(name, "厂商作品集");
      return `
              <article class="studio-product" data-game="${escapeHtml(name)}">
                <span class="studio-product-icon app-icon"></span>
                <div class="studio-product-text">
                  <strong>${escapeHtml(name)}</strong>
                  <span>中文参考：${escapeHtml(cnName(name))}</span>
                  <p>${escapeHtml(productPoint)}</p>
                </div>
                <div class="studio-rank-list">${rankHtml}</div>
              </article>`;
    }).join("");
    const firstRank = ranks.get(studio.products[0])?.join(" / ") || studio.type;
    return `
        <details class="studio-card" ${index < 2 ? "open" : ""}>
          <summary>
            <div class="studio-summary">
              <div class="studio-mark">${escapeHtml(studio.mark)}</div>
              <div class="studio-title">
                <h3>${escapeHtml(studio.name)}</h3>
                <span>${escapeHtml(studio.cn)}</span>
              </div>
              <div class="studio-toggle">展开</div>
            </div>
            <p class="studio-intro">${escapeHtml(studioNote.intro || studio.intro)}</p>
            <div class="studio-metrics">
              <span>${studio.products.length} 款标志产品</span>
              <span>${escapeHtml(studio.type)}</span>
              <span>${escapeHtml(firstRank)}</span>
            </div>
          </summary>
          <div class="studio-body">
            <p class="studio-thesis">${escapeHtml(studioNote.thesis || studio.thesis)}</p>
            <div class="studio-products">${productHtml}
            </div>
          </div>
        </details>`;
  }).join("");
}

function iconMapScript(iconEntries, rows) {
  const palette = [
    "linear-gradient(135deg,#2566d8,#f2c94c)",
    "linear-gradient(135deg,#f6c37a,#5f9fd9)",
    "linear-gradient(135deg,#2e6bc9,#7fd0ff)",
    "linear-gradient(135deg,#e45538,#fed14a)",
    "linear-gradient(135deg,#13b4df,#f6d84d)",
    "linear-gradient(135deg,#10a8ef,#ffce55)",
    "linear-gradient(135deg,#111827,#b91c1c)",
    "linear-gradient(135deg,#70d9ee,#f4bc34)",
    "linear-gradient(135deg,#c9eef9,#3a78b7)",
    "linear-gradient(135deg,#8b5cf6,#22c55e)",
    "linear-gradient(135deg,#f59bc8,#ffd27a)",
    "linear-gradient(135deg,#334155,#84cc16)",
  ];
  const names = Array.from(new Set([
    ...rows.map((row) => row.name),
    ...studioGroups.flatMap((studio) => studio.products),
  ])).sort((a, b) => b.length - a.length);
  const lines = names.map((name, index) => {
    const entry = iconEntries.get(name);
    const parts = [
      `initial: ${JSON.stringify((entry && entry.initial) || initials(name))}`,
      `color: ${JSON.stringify(palette[index % palette.length])}`,
    ];
    if (entry && entry.found && entry.image) parts.push(`image: ${JSON.stringify(entry.image)}`);
    return `      ${JSON.stringify(name)}: { ${parts.join(", ")} }`;
  });
  return `    const iconMap = {\n${lines.join(",\n")}\n    };`;
}

function hardenedWorkflowYaml() {
  return `name: Daily Game Intelligence Report

on:
  schedule:
    - cron: "8 2 * * *"
    - cron: "27 2 * * *"
    - cron: "47 2 * * *"
    - cron: "17 3 * * *"
    - cron: "17 5 * * *"
  workflow_dispatch:
    inputs:
      force:
        description: "Force rebuild even if today's report already exists"
        required: false
        type: boolean
        default: false

permissions:
  contents: write

concurrency:
  group: daily-game-intelligence-report
  cancel-in-progress: false

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "24"
          package-manager-cache: false

      - name: Decide whether to build
        shell: bash
        run: |
          REPORT_DATE="$(TZ=Asia/Shanghai date +'%Y-%m-%d')"
          FORCE="\${{ github.event.inputs.force || 'false' }}"
          echo "REPORT_DATE=$REPORT_DATE" >> "$GITHUB_ENV"
          if [ "$FORCE" != "true" ] && [ -f index.html ] && grep -q "<div class=\"date\">$REPORT_DATE</div>" index.html; then
            echo "Today's report already exists. Skip this safety run."
            echo "SKIP_BUILD=1" >> "$GITHUB_ENV"
          else
            echo "SKIP_BUILD=0" >> "$GITHUB_ENV"
          fi

      - name: Build daily report
        if: env.SKIP_BUILD != '1'
        shell: bash
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
          OPENAI_MODEL: \${{ vars.OPENAI_MODEL || 'gpt-4.1-mini' }}
          FETCH_ATTEMPTS: "8"
          FETCH_TIMEOUT_MS: "60000"
        run: |
          mkdir -p .generated
          for attempt in 1 2 3; do
            echo "Build attempt $attempt for $REPORT_DATE"
            if OUTPUT_DIR="$GITHUB_WORKSPACE/.generated" SITE_DIR="$GITHUB_WORKSPACE" node scripts/build-daily-report.js "$REPORT_DATE"; then
              break
            fi
            if [ "$attempt" = "3" ]; then
              echo "Daily report build failed after $attempt attempts."
              exit 1
            fi
            sleep $((attempt * 180))
          done

      - name: Commit and push report
        if: env.SKIP_BUILD != '1'
        shell: bash
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add index.html README.md archive assets/icons/official scripts/build-daily-report.js
          if git diff --cached --quiet; then
            echo "No report changes to commit."
          else
            git commit -m "daily report: $REPORT_DATE"
            git push
          fi
`;
}

function writeHardenedWorkflow() {
  const workflowDir = path.join(siteDir, ".github", "workflows");
  fs.mkdirSync(workflowDir, { recursive: true });
  fs.writeFileSync(path.join(workflowDir, "daily-report.yml"), hardenedWorkflowYaml(), "utf8");
}

function changeSummary(data) {
  const gamesFree = data.gpGamesFree?.rows || [];
  const gpPuzzle = data.gpPuzzleGross.rows;
  const free = data.gpPuzzleFree.rows;
  const rpg = data.gpRpgGross.rows;
  const strategy = data.gpStrategyGross.rows;
  const ios = data.iosPuzzleGross.rows;
  const rankLine = (rows) => rows.map((row) => `${gameLabel(row.name)} #${row.rank}`).join("、");
  return [
    ...(gamesFree.length ? [["游戏免费总榜雷达", `Google Play 游戏免费总榜前五为 ${rankLine(gamesFree.slice(0, 5))}。这条榜单用于捕捉不属于 Puzzle 分类、但正在快速起量的新游。`]] : []),
    ["Puzzle 收入头部", `Google Play Puzzle 收入前三为 ${rankLine(gpPuzzle.slice(0, 3))}；iOS Puzzle 收入前三为 ${rankLine(ios.slice(0, 3))}。头部格局仍由 Dream、Microfun、King 主导。`],
    ["Puzzle 免费变化", `Google Play Puzzle 免费榜今天是 ${rankLine(free.slice(0, 5))}；${gameLabel("Meowdoku: Brain Puzzle Games")}、${gameLabel("Magic Sort!")}、${gameLabel("Block Blast!")} 都值得看素材与首局。`],
    ["RPG 主线", `RPG 收入前五为 ${rankLine(rpg.slice(0, 5))}；${gameLabel("Zenless Zone Zero")} 留在头部，说明版本和角色池仍有拉动。`],
    ["Strategy 主线", `Strategy 收入榜头部变为 ${rankLine(strategy.slice(0, 5))}；${gameLabel("Last War: Survival Game")} 与 Century 的 ${gameLabel("Kingshot")} / ${gameLabel("Whiteout Survival")} 继续构成男向 Strategy 主线。`],
    ["厂商主线", "今天学习主线建议按三组看：休闲看 Dream / Microfun / Oakever / Peak；长线矩阵看 Playrix / King；男向看 FirstFun、Century、37GAMES、HoYoverse、FunPlus。"],
    ["明天继续看", `重点跟踪 ${gameLabel("Meowdoku: Brain Puzzle Games")} 是否守住免费榜第一、${gameLabel("Last War: Survival Game")} 是否继续压住 Century 双产品、${gameLabel("Zenless Zone Zero")} 是否保持 RPG 头部。`],
  ];
}

function productRef(data, name, preferredKey = "") {
  const target = norm(name);
  const matches = allRows(data).filter((row) => norm(row.name) === target);
  const preferred = preferredKey ? matches.find((row) => row.categoryKey === preferredKey || row.categoryShort.includes(preferredKey)) : null;
  return preferred || matches[0] || {
    name: canonicalName(name),
    rank: "-",
    delta: "",
    deltaClass: "flat",
    deltaVerified: false,
    categoryShort: "观察",
    developerCn: devCn(developerByGame[canonicalName(name)] || ""),
    point: learningPoint(canonicalName(name), "观察"),
  };
}

function uniqueProductRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = norm(row.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function rankBadges(data, row) {
  const ranks = rankLookup(data).get(row.name) || [];
  const labels = ranks.length ? ranks : (row.rank === "-" ? ["观察"] : [`${row.categoryShort} #${row.rank}`]);
  return Array.from(new Set(labels)).slice(0, 3).map((label) => `<span>${escapeHtml(label)}</span>`).join("");
}

function compactProductHtml(data, row, note = "", extraClass = "") {
  const noteText = note || row.point || learningPoint(row.name, row.categoryShort || "");
  const delta = row.deltaVerified && row.delta && row.delta !== "持平" ? `<span class="delta ${row.deltaClass}">${escapeHtml(row.delta)}</span>` : "";
  const developer = row.developerCn ? ` · ${row.developerCn}` : "";
  return `
              <article class="mini-product ${extraClass}" data-game="${escapeHtml(row.name)}">
                <span class="mini-product-icon app-icon"></span>
                <div class="mini-product-text">
                  <strong>${escapeHtml(row.name)}</strong>
                  <span>中文参考：${escapeHtml(cnName(row.name))}${escapeHtml(developer)}</span>
                  <p>${escapeHtml(noteText)}</p>
                </div>
                <div class="mini-ranks">${rankBadges(data, row)}${delta}</div>
              </article>`;
}

function insightCardHtml(data, title, badge, note, items) {
  return `
          <article class="card insight-card">
            <div class="insight-card-head">
              <div>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(note)}</p>
              </div>
              <span>${escapeHtml(badge)}</span>
            </div>
            <div class="mini-list">${items.map((item) => compactProductHtml(data, item.row, item.note, "insight-product")).join("")}
            </div>
          </article>`;
}

function summaryCardsHtml(data, insights = null) {
  if (insights?.summaryCards?.length) {
    return insights.summaryCards.map((card) => insightCardHtml(
      data,
      card.title || "今日观察",
      card.badge || "观察",
      card.note || "结合当天榜单和前日对比阅读。",
      card.products.map((item) => ({
        row: productRef(data, item.name),
        note: item.note,
      }))
    )).join("");
  }

  const revenueRows = uniqueProductRows([
    ...data.gpPuzzleGross.rows.slice(0, 3),
    ...data.iosPuzzleGross.rows.slice(0, 3),
  ]).slice(0, 5);
  const gamesFreeRows = (data.gpGamesFree?.rows || []).slice(0, 5);
  const freeRows = data.gpPuzzleFree.rows.slice(0, 5);
  const maleSegments = buildMaleSegments(data);
  const casualTowerRows = maleSegments.find((segment) => segment.key === "casualTowerDefense")?.rows || [];
  const casualStrategyRows = maleSegments.find((segment) => segment.key === "casualStrategy")?.rows || [];
  const rpgRows = maleSegments.find((segment) => segment.key === "coreRpg")?.rows || data.gpRpgGross.rows.slice(0, 4);
  const idleRows = maleSegments.find((segment) => segment.key === "idleRpg")?.rows || [];
  const towerRows = maleSegments.find((segment) => segment.key === "towerDefense")?.rows || [];
  const strategyRows = [
    ...(maleSegments.find((segment) => segment.key === "slg")?.rows || []),
    ...(maleSegments.find((segment) => segment.key === "puzzleSlg")?.rows || []),
  ].slice(0, 4);
  const watchRows = uniqueProductRows([
    gamesFreeRows[0],
    casualTowerRows[0],
    casualTowerRows[1],
    productRef(data, "Meowdoku: Brain Puzzle Games"),
    casualStrategyRows[0],
  ].filter(Boolean)).slice(0, 3);

  return [
    ...(gamesFreeRows.length ? [insightCardHtml(data, "游戏免费总榜雷达", "全游戏免费榜", "先看所有游戏免费榜，捕捉不在 Puzzle 分类里的突发冲榜产品。", gamesFreeRows.map((row) => ({
      row,
      note: row.point,
    })))] : []),
    insightCardHtml(data, "Puzzle 收入头部", "收入榜", "头部仍看关卡产能、长期活动和装修/剧情目标。", revenueRows.map((row) => ({
      row,
      note: row.point,
    }))),
    insightCardHtml(data, "Puzzle 免费头部", "免费榜", "免费榜更适合看题材包装、首局节奏和素材方向；是否变化只看已核验的动态区。", freeRows.map((row) => ({
      row,
      note: row.point,
    }))),
    ...(casualTowerRows.length ? [insightCardHtml(data, "休闲 / 中轻度塔防", "轻TD", "优先看规则一眼懂、首局压力、塔/单位成长和广告流量承接。", casualTowerRows.slice(0, 4).map((row) => ({
      row,
      note: row.point,
    })))] : []),
    ...(casualStrategyRows.length ? [insightCardHtml(data, "休闲策略 / 轻 SLG 入口", "轻策略", "看轻玩法前置是否降低买量理解门槛，再看 SLG/卡牌/生存外层承接。", casualStrategyRows.slice(0, 4).map((row) => ({
      row,
      note: row.point,
    })))] : []),
    insightCardHtml(data, "核心 RPG 主线", "男向", "看版本节点、角色池、美术资产和 IP 拉动。", rpgRows.slice(0, 4).map((row) => ({
      row,
      note: row.point,
    }))),
    ...(idleRows.length ? [insightCardHtml(data, "放置 RPG 补充", "Idle", "放置 RPG 单独看离线收益、养成深度和长线留存。", idleRows.slice(0, 4).map((row) => ({
      row,
      note: row.point,
    })))] : []),
    ...(towerRows.length ? [insightCardHtml(data, "重度塔防 / 策略塔防", "重TD", "和中轻度塔防分开看，重点看角色深度、版本内容和策略外层。", towerRows.slice(0, 4).map((row) => ({
      row,
      note: row.point,
    })))] : []),
    insightCardHtml(data, "SLG / Strategy 主线", "男向", "看轻玩法前置、SLG 商业化、联盟和赛季活动。", strategyRows.map((row) => ({
      row,
      note: row.point,
    }))),
    insightCardHtml(data, "明天继续跟踪", "观察", "只保留最需要复看的三个信号。", watchRows.map((row) => ({
      row,
      note: isMidLightTowerDefenseText(rowText(row.name, row.categoryShort)) ? "复看该产品在塔防/策略榜的位置是否稳定，并拆首局和成长线。"
        : row.name.includes("Meowdoku") ? "看免费榜第一能否守住，以及猫咪包装是否继续吸量。"
        : isCasualStrategyText(rowText(row.name, row.categoryShort)) ? "复看轻玩法前置是否继续带动策略榜位置。"
        : "复看榜内位置是否稳定，避免把未核验变化写成新进或上升。",
    }))),
  ].join("");
}

function accountCardHtml(data, title, subtitle, names) {
  const items = names.map((item) => typeof item === "string" ? { name: item, note: "" } : item);
  return `
              <section class="account-card">
                <header>
                  <strong>${escapeHtml(title)}</strong>
                  <span>${escapeHtml(subtitle)}</span>
                </header>
                <div class="mini-list compact">${items.map((item) => compactProductHtml(data, productRef(data, item.name), item.note || "", "account-product")).join("")}
                </div>
              </section>`;
}

function changesPanelHtml(data, movers, insights = null) {
  const moverItems = movers.slice(0, 8).map((row) => ({
    row,
    note: insights?.moverNotes?.[row.name]
      || (row.deltaClass === "new" ? "经前日同榜单对比，确认新进可见 Top30；优先看题材包装、首局和素材入口。" : `较前日同榜单${row.delta}，优先看最近版本、活动或买量素材变化。`),
  }));
  const moverListHtml = moverItems.length
    ? moverItems.map((item) => compactProductHtml(data, item.row, item.note, "mover-item")).join("")
    : `<div class="empty-state">暂无可核验的新进 / 上升产品；今日动态不强行生成。</div>`;
  const segments = buildMaleSegments(data);
  const casualTowerRows = segments.find((segment) => segment.key === "casualTowerDefense")?.rows || [];
  const casualStrategyRows = segments.find((segment) => segment.key === "casualStrategy")?.rows || [];
  const gamesFreeRows = data.gpGamesFree?.rows || [];
  const watchRows = insights?.watch?.length ? insights.watch.map((item) => ({
    row: productRef(data, item.name),
    note: item.note,
  })) : [
    ...(gamesFreeRows[0] ? [{ row: gamesFreeRows[0], note: "全游戏免费榜头部样本，先确认是否继续守住位置，再看题材包装和素材入口。" }] : []),
    { row: productRef(data, "Meowdoku: Brain Puzzle Games"), note: "免费榜头部是否稳定，是休闲新品观察重点。" },
    ...(casualTowerRows[0] ? [{ row: casualTowerRows[0], note: "中轻度塔防样本优先看榜内位置、首局压力和成长线是否稳定。" }] : []),
    ...(casualStrategyRows[0] ? [{ row: casualStrategyRows[0], note: "休闲策略样本优先看轻玩法入口与 SLG 外层承接。" }] : []),
  ];
  const accountHtml = insights?.accountCards?.length
    ? insights.accountCards.map((card) => accountCardHtml(data, card.title || "账号观察", card.subtitle || "按产品集观察", card.products)).join("")
    : [
      accountCardHtml(data, "Oakever 免费矩阵", "猫咪 / 迷宫 / 纸牌 / Tile 多题材并行", ["Meowdoku: Brain Puzzle Games", "Amaze GO!", "Jigsawcard Solitaire Puzzle", "Tile Explorer - Triple Match"]),
      accountCardHtml(data, "中轻度塔防观察池", "休闲 TD / 放置 TD / 卡牌 TD 分开看", ["Castle Busters: Tower Defense", "Kingdom Guard", "The Tower - Idle Tower Defense", "Bloons TD 6"]),
      accountCardHtml(data, "Century 男向双线", "4X / 生存 SLG 两个核心收入样本", ["Kingshot", "Whiteout Survival"]),
      accountCardHtml(data, "Devsisters RPG 账号", "CookieRun IP 的 RPG 与 Idle 延展", ["CookieRun: Kingdom", "CookieRun: Crumble - Idle RPG"]),
    ].join("");

  return `
      <div class="motion-grid">
        <div class="motion-main">
          <article class="card motion-card">
            <div class="motion-head">
              <h3>核验后的上升 / 新进Top30</h3>
              <span>${moverItems.length} 个确认信号</span>
            </div>
            <div class="mini-list mover-list">${moverListHtml}
            </div>
          </article>
          <article class="card motion-card">
            <div class="motion-head">
              <h3>账号与厂商观察</h3>
              <span>按厂商看产品集</span>
            </div>
            <div class="account-grid">
              ${accountHtml}
            </div>
          </article>
        </div>
        <aside class="motion-side">
          <article class="card motion-card">
            <div class="motion-head">
              <h3>明天继续看</h3>
              <span>${watchRows.length} 条</span>
            </div>
            <div class="mini-list watch-list">${watchRows.map((item) => compactProductHtml(data, item.row, item.note, "watch-item")).join("")}
            </div>
          </article>
          <article class="card motion-card">
            <div class="motion-head">
              <h3>阅读顺序</h3>
              <span>更省力</span>
            </div>
            <div class="read-path">
              <span>先看新进/上升</span>
              <span>再看账号产品集</span>
              <span>最后进完整榜单核对</span>
            </div>
          </article>
        </aside>
      </div>`;
}

function visualHighlightItems(data) {
  const ranks = rankLookup(data);
  const preferred = [
    ...(data.gpGamesFree?.rows || []).slice(0, 4),
    productRef(data, "Royal Match"),
    productRef(data, "Last War: Survival Game"),
    productRef(data, "Kingshot"),
    productRef(data, "Whiteout Survival"),
    productRef(data, "Castle Busters: Tower Defense"),
    productRef(data, "Kingdom Guard"),
  ];
  const seen = new Set();
  const out = [];
  for (const row of preferred) {
    if (!row || !row.name) continue;
    const key = norm(row.name);
    if (seen.has(key)) continue;
    seen.add(key);
    const label = (ranks.get(row.name) || [`${row.categoryShort} #${row.rank}`]).slice(0, 2).join(" / ");
    out.push({ row, note: label });
    if (out.length >= 8) break;
  }
  return out;
}

function html(data, iconEntries, insights = null) {
  const rows = allRows(data);
  const generatedAt = `${reportDate} ${new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())}`;
  const snapshotBits = [
    `${data.gpGamesFree?.sourceLabel || "Google Play 游戏免费总榜"}: ${data.gpGamesFree?.updated || "暂无快照时间"}`,
    `${data.gpPuzzleGross.sourceLabel || "Google Play Puzzle 收入榜"}: ${data.gpPuzzleGross.updated || "暂无快照时间"}`,
    `iOS Strategy：${data.iosStrategyGross?.updated || "暂无快照时间"}`,
    `AppCurrents：${data.iosPuzzleGross.updated || "暂无快照时间"}`,
  ];
  const fallbackTitle = `${displayMonthDay(reportDate)}更新：休闲、Puzzle 与中轻度塔防观察`;
  const fallbackLead = `公开榜单源当前可见最新快照为 ${snapshotBits.join("；")}；日报日期为 ${reportDate}。排名只展示来源抓到的原始名次，动态只在同榜单有昨日快照可比时标注。`;
  const titleText = insights?.title || fallbackTitle;
  const leadText = insights?.lead || fallbackLead;
  const unmatched = Array.from(new Set(rows.map((row) => row.name))).filter((name) => {
    const entry = iconEntries.get(name);
    return !entry || !entry.found;
  });
  const movers = topMovers(data);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>游戏产品动态与厂商学习日报 ${reportDate}</title>
  <style>
    :root { --bg:#f4f6f8; --paper:#fff; --ink:#20242a; --muted:#5f6975; --line:#d8dee7; --soft:#eef2f6; --blue:#176b87; --green:#507a44; --red:#9a4054; --gold:#9b6a22; --purple:#6356a8; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif; line-height:1.58; }
    a { color:var(--blue); text-decoration:none; } a:hover { text-decoration:underline; }
    .page { width:min(1400px,calc(100% - 32px)); margin:0 auto; padding:24px 0 56px; }
    .hero,.section,.card,.notice { background:var(--paper); border:1px solid var(--line); border-radius:8px; }
    .hero { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:24px; padding:28px; margin-bottom:14px; }
    .eyebrow { color:var(--blue); font-weight:800; margin-bottom:8px; }
    h1,h2,h3 { margin:0; letter-spacing:0; line-height:1.2; } h1 { font-size:clamp(34px,5vw,58px); max-width:920px; } h2 { font-size:28px; } h3 { font-size:18px; }
    p { margin:0; } .lead { margin-top:14px; color:#485566; font-size:17px; max-width:960px; }
    .meta { display:grid; gap:12px; color:#485566; } .meta .date { font-size:34px; font-weight:900; color:var(--ink); line-height:1.05; } .meta b { color:#344052; }
    .chips { display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; } .chip { border:1px solid var(--line); border-radius:999px; padding:7px 12px; background:#fff; color:#344052; font-size:14px; }
    .chip.blue { color:var(--blue); background:#eef8fb; border-color:#bfdae2; } .chip.green { color:var(--green); background:#f1f8ee; border-color:#cbddc4; } .chip.red { color:var(--red); background:#fbf0f3; border-color:#e5c6ce; } .chip.gold { color:var(--gold); background:#fff8ec; border-color:#e7d2aa; }
    .dashboard { display:grid; grid-template-columns:220px minmax(0,1fr); gap:16px; align-items:start; }
    .side-nav { position:sticky; top:16px; display:grid; gap:8px; padding:10px; background:#fff; border:1px solid var(--line); border-radius:8px; }
    .side-nav button { appearance:none; border:1px solid transparent; border-radius:7px; background:transparent; color:#344052; min-height:40px; padding:9px 10px; text-align:left; font:inherit; font-weight:700; cursor:pointer; }
    .side-nav button:hover { background:#f3f6f8; } .side-nav button.active { background:#eaf6f9; border-color:#bdd8e0; color:var(--blue); }
    .content-panels { min-width:0; }
    .section { padding:24px 28px; margin-top:16px; } .content-panels .section { margin-top:0; } .panel { display:none; } .panel.active { display:block; }
    .section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:16px; } .sub { color:var(--muted); margin-top:6px; }
    .grid-2 { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; } .grid-3 { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
    .change-grid { display:grid; grid-template-columns:1.1fr 1fr 1fr; gap:14px; margin-top:16px; }
    .card { padding:18px; min-width:0; } .card h3 { color:var(--blue); margin-bottom:10px; } .card p,.card li { color:#4e5b6b; }
    .card ul { margin-left:0; list-style:none; } .card li { padding:7px 0 7px 14px; border-top:1px solid #edf1f4; position:relative; } .card li:first-child { border-top:0; } .card li::before { content:""; position:absolute; left:0; top:17px; width:5px; height:5px; border-radius:50%; background:var(--blue); }
    .insight-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:16px; }
    .insight-card { padding:0; overflow:hidden; }
    .insight-card-head { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:start; padding:16px; background:#fbfcfd; border-bottom:1px solid var(--line); }
    .insight-card-head h3,.motion-head h3 { margin:0; color:var(--blue); }
    .insight-card-head p { color:#526071; font-size:14px; margin-top:6px; line-height:1.45; }
    .insight-card-head > span,.motion-head > span { display:inline-flex; align-items:center; justify-content:center; border-radius:999px; border:1px solid #bfdae2; background:#eef8fb; color:var(--blue); font-size:12px; font-weight:900; padding:5px 9px; white-space:nowrap; }
    .mini-list { display:grid; gap:0; }
    .mini-list.compact { border-top:1px solid var(--line); }
    .mini-product { display:grid; grid-template-columns:46px minmax(0,1fr) minmax(92px,auto); gap:10px; align-items:center; padding:11px 14px; border-top:1px solid var(--line); background:#fff; min-width:0; }
    .mini-product:first-child { border-top:0; }
    .mini-product-text { min-width:0; }
    .mini-product-text strong { display:block; color:#20242a; overflow-wrap:anywhere; line-height:1.25; }
    .mini-product-text span { display:block; color:#526071; font-size:12px; margin-top:2px; overflow-wrap:anywhere; line-height:1.35; }
    .mini-product-text p { color:#4e5b6b; font-size:13px; margin-top:5px; line-height:1.42; }
    .mini-ranks { justify-self:stretch; display:grid; gap:4px; align-content:center; min-width:92px; }
    .mini-ranks span,.mini-ranks .delta { display:block; width:100%; border-radius:6px; background:#eef8fb; border:1px solid #bfdae2; color:var(--blue); font-size:12px; font-weight:800; line-height:1.25; padding:5px 7px; text-align:center; }
    .mini-ranks .delta.new { background:#fff8ec; border-color:#e7d2aa; color:var(--gold); }
    .mini-ranks .delta.up { background:#eef8ee; border-color:#c8dfc0; color:var(--green); }
    .mini-ranks .delta.down { background:#fbf0f3; border-color:#e5c6ce; color:var(--red); }
    .mini-ranks .delta.unknown { background:#f6f8fa; border-color:#d8dee7; color:#657180; }
    .motion-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr); gap:14px; margin-top:16px; }
    .motion-main,.motion-side { display:grid; gap:14px; align-content:start; }
    .motion-card { padding:0; overflow:hidden; }
    .motion-head { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:16px; background:#fbfcfd; border-bottom:1px solid var(--line); }
    .account-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:14px; }
    .account-card { border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#fff; }
    .account-card header { display:grid; gap:4px; padding:12px; background:#f8fafb; border-bottom:1px solid var(--line); }
    .account-card header strong { color:#20242a; line-height:1.25; }
    .account-card header span { color:#526071; font-size:12px; line-height:1.35; }
    .account-card .mini-product { grid-template-columns:38px minmax(0,1fr); padding:9px 10px; }
    .account-card .mini-product .app-icon { width:38px; height:38px; flex-basis:38px; border-radius:8px; font-size:12px; }
    .account-card .mini-product-text p { display:none; }
    .account-card .mini-ranks { grid-column:2; display:flex; flex-wrap:wrap; gap:4px; justify-content:flex-start; min-width:0; }
    .account-card .mini-ranks span,.account-card .mini-ranks .delta { width:auto; padding:4px 6px; }
    .read-path { display:grid; gap:8px; padding:14px; }
    .read-path span { display:flex; align-items:center; min-height:36px; border:1px solid var(--line); border-radius:7px; padding:8px 10px; color:#42505f; background:#fff; font-weight:700; }
    .empty-state { padding:18px; color:#657180; background:#f8fafb; border-top:1px solid var(--line); line-height:1.5; }
    .notice { padding:14px 16px; color:#485566; background:#fbfcfd; margin:14px 0; }
    .table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:8px; background:#fff; } table { width:100%; border-collapse:collapse; min-width:1080px; }
    th,td { padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; text-align:left; } th { background:#f0f4f7; color:#354252; font-size:13px; white-space:nowrap; } tr:last-child td { border-bottom:none; }
    .rank { display:inline-flex; width:30px; height:30px; align-items:center; justify-content:center; border-radius:8px; background:var(--blue); color:#fff; font-weight:800; } .rank.soft { background:#e6edf3; color:#3d4b58; }
    .product { font-weight:800; color:#222832; } .cn { display:block; color:#526071; font-weight:500; margin-top:2px; font-size:13px; }
    .delta { display:inline-flex; align-items:center; justify-content:center; min-width:42px; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; border:1px solid var(--line); background:#f6f8fa; color:#526071; }
    .delta.up { background:#eef8ee; border-color:#c8dfc0; color:#507a44; } .delta.down { background:#fbf0f3; border-color:#e5c6ce; color:#9a4054; } .delta.new { background:#fff8ec; border-color:#e7d2aa; color:#9b6a22; } .delta.unknown { background:#f6f8fa; border-color:#d8dee7; color:#657180; }
    .muted-dash { color:#9aa4af; font-weight:800; }
    .visual-strip { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:14px; }
    .visual-card { display:grid; grid-template-columns:58px minmax(0,1fr); gap:12px; align-items:center; padding:14px; border:1px solid var(--line); border-radius:8px; background:#fff; min-width:0; }
    .visual-card strong { display:block; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .visual-card em { display:block; color:#526071; font-style:normal; font-size:12px; margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .visual-card span { display:block; color:var(--muted); font-size:13px; margin-top:2px; }
    .app-icon { width:46px; height:46px; flex:0 0 46px; display:inline-flex; align-items:center; justify-content:center; overflow:hidden; border-radius:10px; border:1px solid rgba(36,45,55,.16); background:linear-gradient(135deg,#e9f4f8,#f8f1df); color:#26313d; font-size:15px; font-weight:900; box-shadow:inset 0 0 0 1px rgba(255,255,255,.25); }
    .app-icon.large { width:58px; height:58px; flex-basis:58px; border-radius:12px; font-size:18px; } .app-icon img { width:100%; height:100%; object-fit:cover; display:block; } .app-icon.fallback { letter-spacing:0; }
    td.product-with-icon { min-width:240px; } .product-cell { display:grid; grid-template-columns:46px minmax(0,1fr); gap:10px; align-items:center; } .product-text { min-width:0; }
    .family-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .family-card { border:1px solid var(--line); border-radius:8px; background:#fff; overflow:hidden; }
    .family-card header { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:start; padding:16px; background:#fbfcfd; border-bottom:1px solid var(--line); }
    .family-card header h3 { color:var(--ink); } .family-card header p { color:#526071; margin-top:5px; font-size:13px; }
    .family-card header > span { display:inline-flex; align-items:center; justify-content:center; min-width:48px; border-radius:999px; background:#eef8fb; color:var(--blue); border:1px solid #bfdae2; font-size:12px; font-weight:900; padding:5px 8px; }
    .family-products { display:grid; gap:0; }
    .family-more { border-top:1px solid var(--line); background:#fbfcfd; }
    .family-more summary { cursor:pointer; list-style:none; min-height:40px; display:flex; align-items:center; justify-content:center; padding:8px 12px; color:var(--blue); font-weight:800; font-size:13px; }
    .family-more summary::-webkit-details-marker { display:none; }
    .family-more summary::after { content:"+"; margin-left:8px; width:20px; height:20px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; border:1px solid #bfdae2; background:#eef8fb; }
    .family-more[open] summary::after { content:"-"; }
    .family-products.extra { border-top:1px solid var(--line); }
    .family-product { display:grid; grid-template-columns:46px minmax(0,1fr) 136px; gap:10px; align-items:center; padding:10px 12px; border-top:1px solid var(--line); }
    .family-product:first-child { border-top:0; } .family-product-text { min-width:0; } .family-product-text strong { display:block; color:#20242a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .family-product-text span { color:#526071; display:block; font-size:13px; margin-top:1px; } .family-product-text p { color:#4e5b6b; margin-top:4px; font-size:13px; }
    .family-ranks { display:grid; gap:4px; } .family-ranks span { display:block; border-radius:6px; background:#fff8ec; border:1px solid #e7d2aa; color:var(--gold); font-size:12px; font-weight:800; line-height:1.25; padding:5px 7px; text-align:center; }
    .studio-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; align-items:start; }
    .studio-card { border:1px solid var(--line); border-radius:8px; background:#fff; overflow:hidden; min-width:0; transition:box-shadow .18s ease; }
    .studio-card[open] { box-shadow:0 10px 24px rgba(28,58,75,.08); } .studio-card summary { list-style:none; cursor:pointer; padding:16px; display:grid; gap:10px; }
    .studio-card summary::-webkit-details-marker { display:none; } .studio-card[open] summary { border-bottom:1px solid var(--line); background:#fbfcfd; } .studio-card:not([open]) summary:hover { background:#fbfcfd; }
    .studio-summary { display:grid; grid-template-columns:54px minmax(0,1fr) auto; gap:12px; align-items:center; }
    .studio-mark { width:54px; height:54px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:13px; background:linear-gradient(135deg,var(--blue),#2f9a91); box-shadow:inset 0 0 0 1px rgba(255,255,255,.22); }
    .studio-title { min-width:0; } .studio-title h3 { color:var(--ink); margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .studio-title span { color:var(--muted); display:block; margin-top:3px; font-size:13px; }
    .studio-toggle { color:var(--blue); font-size:0; font-weight:800; white-space:nowrap; } .studio-toggle::after { font-size:13px; } .studio-card[open] .studio-toggle::after { content:"收起"; } .studio-card:not([open]) .studio-toggle::after { content:"展开"; }
    .studio-intro { color:#4e5b6b; margin:0; } .studio-metrics { display:flex; flex-wrap:wrap; gap:8px; } .studio-metrics span { border:1px solid var(--line); background:#f6f8fa; color:#495664; border-radius:999px; padding:4px 8px; font-size:12px; }
    .studio-body { padding:14px 16px 16px; } .studio-thesis { color:#3f4d5c; margin-bottom:12px; }
    .studio-products { display:grid; gap:0; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#fff; }
    .studio-product { display:grid; grid-template-columns:46px minmax(0,1fr) 136px; gap:10px; align-items:center; padding:10px; border-top:1px solid var(--line); background:#fff; }
    .studio-product:first-child { border-top:0; } .studio-product-text { min-width:0; } .studio-product-text strong { display:block; color:#20242a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .studio-product-text span { color:#526071; display:block; font-size:13px; margin-top:1px; } .studio-product-text p { color:#4e5b6b; margin-top:5px; font-size:13px; }
    .studio-rank-list { justify-self:stretch; display:grid; gap:4px; align-content:center; }
    .studio-rank-list span,.studio-rank-list small { display:block; border-radius:6px; background:#eef8fb; border:1px solid #bfdae2; color:var(--blue); font-size:12px; font-weight:800; line-height:1.25; padding:5px 7px; text-align:center; }
    .studio-rank-list small { background:#f7f9fb; border-color:#dce3ea; color:#657180; font-weight:700; }
    ul,ol { margin:8px 0 0 20px; padding:0; } li { margin:5px 0; } footer { color:var(--muted); margin-top:20px; font-size:13px; }
    @media (max-width:1100px) { .dashboard { grid-template-columns:1fr; } .side-nav { position:static; grid-template-columns:repeat(4,minmax(0,1fr)); } .side-nav button { text-align:center; } }
    @media (max-width:980px) { .change-grid,.motion-grid,.insight-grid,.account-grid { grid-template-columns:1fr; } }
    @media (max-width:860px) { .hero,.grid-2,.grid-3,.visual-strip,.studio-grid,.family-grid { grid-template-columns:1fr; } .side-nav { display:flex; overflow-x:auto; } .side-nav button { flex:0 0 auto; white-space:nowrap; } .studio-product,.family-product,.mini-product { grid-template-columns:42px minmax(0,1fr); } .studio-rank-list,.family-ranks,.mini-ranks { grid-column:1 / -1; grid-template-columns:repeat(3,minmax(0,1fr)); } .hero { padding:22px; } .section { padding:20px; } table { min-width:940px; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <div class="eyebrow">游戏产品动态与厂商学习日报</div>
        <h1>${escapeHtml(titleText)}</h1>
        <p class="lead">${escapeHtml(leadText)}</p>
        <div class="chips">
          <span class="chip blue">游戏免费总榜</span>
          <span class="chip blue">Puzzle 完整榜单</span>
          <span class="chip green">图像速览</span>
          <span class="chip red">休闲塔防 / 放置 / RPG / Strategy</span>
          <span class="chip gold">厂商作品集</span>
          <span class="chip">对比 ${previousDate}</span>
        </div>
      </div>
      <div class="meta">
        <div><b>日报日期</b><div class="date">${reportDate}</div></div>
        <p><b>地区：</b>美国区</p>
        <p><b>平台：</b>Google Play / iOS</p>
        <p><b>榜单源：</b>${escapeHtml(sourceSummary(data))}</p>
      </div>
    </section>

    <div class="dashboard">
      <aside class="side-nav" aria-label="日报分区">
        <button type="button" class="active" data-panel="summary">今日结论</button>
        <button type="button" data-panel="visual">图像速览</button>
        <button type="button" data-panel="free">免费总榜</button>
        <button type="button" data-panel="changes">榜单动态</button>
        <button type="button" data-panel="families">玩法拆分</button>
        <button type="button" data-panel="studios">厂商学习</button>
        <button type="button" data-panel="puzzle">Puzzle 榜单</button>
        <button type="button" data-panel="male">男向榜单</button>
        <button type="button" data-panel="sources">来源口径</button>
      </aside>

      <div class="content-panels">
    <section id="summary" class="section panel active">
      <h2>今日结论</h2>
      <p class="sub">每条结论都对应具体产品，先扫图标、中文名和排名，再进入完整榜单。</p>
      <div class="insight-grid">${summaryCardsHtml(data, insights)}
      </div>
    </section>

    <section id="visual" class="section panel">
      <div class="section-head">
        <div>
          <h2>图像速览</h2>
          <p class="sub">今天最值得先看的产品和位置。</p>
        </div>
      </div>
      <div class="visual-strip">
        ${visualHighlightItems(data).map((item) => `<div class="visual-card" data-game="${escapeHtml(item.row.name)}"><span class="app-icon large"></span><div><strong>${escapeHtml(item.row.name)}</strong><em>中文参考：${escapeHtml(cnName(item.row.name))}</em><span>${escapeHtml(item.note)}</span></div></div>`).join("\n")}
      </div>
    </section>

    <section id="free" class="section panel">
      <h2>Google Play 游戏免费总榜雷达</h2>
      <p class="sub">不按 Puzzle / RPG / Strategy 过滤，专门捕捉免费榜突然冲顶的新游。</p>
      <div class="notice"><strong>用途：</strong>如果点点免费榜看到某个游戏冲到前排，先在这里核对；它可能因为商店分类不是 Puzzle，而不会出现在 Puzzle 免费榜。</div>
      <h3>${escapeHtml(data.gpGamesFree?.label || "Google Play 游戏免费总榜")}</h3>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.gpGamesFree?.rows || [])}</tbody></table></div>
    </section>

    <section id="changes" class="section panel">
      <h2>榜单动态与账号观察</h2>
      <p class="sub">动态不再堆成长句，按产品和账号拆成可扫描的小行。</p>
      ${changesPanelHtml(data, movers, insights)}
    </section>

    <section id="families" class="section panel">
      <div class="section-head">
        <div>
          <h2>Puzzle 玩法拆分</h2>
          <p class="sub">按产品学习分类重新整理 Puzzle 榜单，不再只按商店大类混放。</p>
        </div>
      </div>
      <div class="family-grid">${puzzleFamilyCardsHtml(data)}
      </div>
    </section>

    <section id="studios" class="section panel">
      <div class="section-head">
        <div>
          <h2>厂商学习卡</h2>
          <p class="sub">按厂商聚合产品矩阵。点开每张卡，可以看到代表产品、当前排名和可学习点。</p>
        </div>
      </div>
      <div class="studio-grid">${studioCardsHtml(data, insights)}
      </div>
    </section>

    <section id="puzzle" class="section panel">
      <h2>Puzzle 完整榜单与简要</h2>
      <div class="notice"><strong>中文名说明：</strong>“中文参考”用于辅助学习与记忆，不等同官方译名；厂商中文称呼优先使用常见叫法，无法确认时保留英文。</div>
      <h3>${escapeHtml(data.gpPuzzleGross.label)}</h3>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.gpPuzzleGross.rows)}</tbody></table></div>
      <h3 style="margin-top:22px">${escapeHtml(data.iosPuzzleGross.label)}</h3>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.iosPuzzleGross.rows)}</tbody></table></div>
      <h3 style="margin-top:22px">${escapeHtml(data.gpPuzzleFree.label)}</h3>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.gpPuzzleFree.rows)}</tbody></table></div>
    </section>

    <section id="male" class="section panel">
      <h2>男性向 / 休闲策略 / 中轻度塔防 / RPG / Strategy</h2>
      <p class="sub">先按休闲策略、中轻度塔防、放置 RPG、核心 RPG、SLG 拆开看，再回到原始完整榜单核对来源名次。</p>
      <div class="notice"><strong>细分口径：</strong>中轻度塔防优先看 iOS Strategy 深榜和 Google Play Strategy 榜内样本；RPG 榜单独拎出放置 RPG / Idle；Strategy 榜继续拆出休闲策略入口、重度塔防、SLG / 4X、生存策略和 Puzzle + SLG 混合外层。</div>
      <div class="insight-grid">${maleSegmentCardsHtml(data)}
      </div>
      <h3>${escapeHtml(data.gpRpgGross.label)}</h3>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.gpRpgGross.rows)}</tbody></table></div>
      <h3 style="margin-top:22px">${escapeHtml(data.gpStrategyGross.label)}</h3>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.gpStrategyGross.rows)}</tbody></table></div>
      <h3 style="margin-top:22px">${escapeHtml(data.iosStrategyGross.label)}</h3>
      <div class="notice"><strong>用途：</strong>这个深榜主要用于补充中轻度塔防和休闲策略样本；页面会保留原始来源排名，不把深榜名次改写成 Top30。</div>
      <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>排名</th><th>游戏</th><th>厂商</th><th>玩法族群</th><th>变化</th><th>简要学习点</th></tr></thead><tbody>${categoryRows(data.iosStrategyGross.rows)}</tbody></table></div>
    </section>

    <section id="sources" class="section panel">
      <h2>来源与口径</h2>
      <ul>
        ${sourceListHtml(data)}
        <li><a href="https://itunes.apple.com/search">Apple iTunes Search API - 游戏图标参考</a></li>
      </ul>
      <div class="notice"><strong>口径：</strong>Google Play 榜单优先使用官方公开榜单；如官方抓取失败，会回退到 AppBrain 对应公开榜单。iOS Puzzle 使用 AppCurrents 美国区当前页，iOS Strategy 深榜使用 AppBrain。第三方榜单可能存在估算、延迟和分类差异，本日报用于产品学习与趋势观察；所有排名徽标均保留来源榜单名和原始名次。</div>
      <div class="notice"><strong>图标匹配：</strong>本日报共纳入 ${new Set(rows.map((row) => row.name)).size} 个去重游戏名；未匹配到高可信图标的游戏：${unmatched.length ? unmatched.map(escapeHtml).join("、") : "无"}。</div>
    </section>

      </div>
    </div>

    <footer>生成日期：${escapeHtml(generatedAt)}（Asia/Shanghai）</footer>
  </main>

  <script id="rank-source-snapshot" type="application/json">${escapeHtml(rankSourceSnapshot(data))}</script>
  <script>
${iconMapScript(iconEntries, rows)}

    function activatePanel(panelId, shouldUpdateHash = true) {
      const targetId = panelId && document.getElementById(panelId) ? panelId : "summary";
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === targetId);
      });
      document.querySelectorAll(".side-nav button").forEach((button) => {
        button.classList.toggle("active", button.dataset.panel === targetId);
      });
      if (shouldUpdateHash) history.replaceState(null, "", \`#\${targetId}\`);
    }

    document.querySelectorAll(".side-nav button[data-panel]").forEach((button) => {
      button.addEventListener("click", () => activatePanel(button.dataset.panel));
    });
    activatePanel(location.hash ? location.hash.slice(1) : "summary", false);

    function matchIconEntry(text) {
      const normalized = text.replace(/\\s+/g, " ").trim();
      const keys = Object.keys(iconMap).sort((a, b) => b.length - a.length);
      return keys.find((key) => normalized.includes(key));
    }

    function makeIcon(gameKey, sizeClass = "") {
      const entry = iconMap[gameKey] || { initial: (gameKey || "?").slice(0, 2).toUpperCase(), color: "linear-gradient(135deg,#e9f4f8,#f8f1df)" };
      const icon = document.createElement("span");
      icon.className = \`app-icon \${sizeClass}\`.trim();
      icon.style.background = entry.color;
      icon.dataset.initial = entry.initial;
      icon.classList.add("fallback");
      icon.textContent = entry.initial;
      if (entry.image) {
        const img = document.createElement("img");
        const assetPrefix = location.pathname.includes("/archive/") ? "../" : "";
        img.alt = \`\${gameKey} icon\`;
        img.loading = sizeClass.includes("large") ? "eager" : "lazy";
        img.decoding = "async";
        if (sizeClass.includes("large")) img.fetchPriority = "high";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
          img.remove();
          icon.classList.add("fallback");
          icon.textContent = icon.dataset.initial;
        };
        icon.textContent = "";
        icon.classList.remove("fallback");
        icon.appendChild(img);
        img.src = entry.image.startsWith("assets/") ? \`\${assetPrefix}\${entry.image}\` : entry.image;
      }
      return icon;
    }

    document.querySelectorAll(".visual-card").forEach((card) => {
      const gameKey = card.dataset.game;
      const holder = card.querySelector(".app-icon");
      if (holder && gameKey) holder.replaceWith(makeIcon(gameKey, "large"));
    });

    document.querySelectorAll(".studio-product[data-game], .family-product[data-game], .mini-product[data-game]").forEach((item) => {
      const gameKey = item.dataset.game;
      const holder = item.querySelector(".studio-product-icon, .family-product-icon, .mini-product-icon");
      const iconKey = matchIconEntry(gameKey) || gameKey;
      if (holder && gameKey) {
        const icon = makeIcon(iconKey);
        const img = icon.querySelector("img");
        if (img) img.loading = "eager";
        holder.replaceWith(icon);
      }
    });

    document.querySelectorAll("#free tbody tr, #puzzle tbody tr, #male tbody tr").forEach((row) => {
      const cell = row.children[1];
      if (!cell || cell.querySelector(".product-cell")) return;
      const key = matchIconEntry(cell.textContent);
      const iconKey = key || cell.textContent.trim().slice(0, 18);
      const wrap = document.createElement("div");
      wrap.className = "product-cell";
      const textWrap = document.createElement("div");
      textWrap.className = "product-text";
      while (cell.firstChild) textWrap.appendChild(cell.firstChild);
      wrap.appendChild(makeIcon(iconKey));
      wrap.appendChild(textWrap);
      cell.classList.add("product-with-icon");
      cell.appendChild(wrap);
    });
  </script>
</body>
</html>`;
}

async function main() {
  const data = {};
  for (const config of sources) {
    data[config.key] = await fetchRankList(config);
    await sleep(1600);
  }

  buildDeveloperLookup(data);
  console.log("fetch iosPuzzleGross");
  const iosHtml = await fetchText(iosSource.url);
  data.iosPuzzleGross = { ...iosSource, ...parseAppCurrents(iosHtml) };
  buildDeveloperLookup(data);

  const previousRanks = parsePreviousRanks();
  attachDeltas(data, previousRanks);
  const aiInsights = await requestAiInsights(data);
  applyAiInsights(data, aiInsights);

  const rows = allRows(data);
  const iconEntries = await ensureIcons(rows);
  const reportPath = path.join(outputDir, `game-intelligence-full-${reportDate}.html`);
  const document = html(data, iconEntries, aiInsights);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, document, "utf8");

  fs.mkdirSync(archiveDir, { recursive: true });
  if (process.env.ENABLE_WORKFLOW_SELF_HEAL === "1") writeHardenedWorkflow();
  fs.writeFileSync(path.join(siteDir, "index.html"), document, "utf8");
  fs.writeFileSync(path.join(archiveDir, `${reportDate}.html`), document, "utf8");
  fs.writeFileSync(path.join(siteDir, "README.md"), [
    "# Game Intelligence Report",
    "",
    "GitHub Pages static site.",
    "",
    "- index.html: latest report",
    "- archive/YYYY-MM-DD.html: daily archive",
    "",
    `Last prepared: ${reportDate}`,
    `Source: game-intelligence-full-${reportDate}.html`,
  ].join("\n"), "utf8");

  console.log(`wrote ${reportPath}`);
  console.log(`prepared ${path.join(siteDir, "index.html")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
