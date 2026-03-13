// Maps from internal EN key → display EN label (identity, kept for tooltip use)
// CN spec names received from game packet are mapped to English here.

const CN_SPEC_TO_EN: Record<string, string> = {
  // Ice Mage specs
  "冰矛": "Icicle Spear",
  "寒冰": "Frost",
  "极寒": "Extreme Cold",
  // Blade specs
  "月刃": "Moonblade",
  "雷影": "Thunder Shadow",
  "大破灭": "Great Destruction",
  // Smite / Holy specs
  "惩击": "Smite",
  "圣光": "Holy Light",
  "先锋": "Vanguard",
  // Guard / Tank specs
  "格挡": "Parry",
  "砂岩": "Sandstone",
  "岩御": "Earth Shield",
  // Ranger specs
  "弹无虚发": "Marksman",
  "光意": "Light Intent",
  "幻影": "Phantom",
  // Bard specs
  "升格": "Ascendant",
  "烈焰": "Blazing Flame",
  "激涌": "Surge",
  // Nature / Healer specs
  "狂野": "Feral",
  "繁盛": "Flourishing",
  "再生": "Regeneration",
  // Dream / Void specs
  "虚蚀": "Void Corrosion",
  "幻梦": "Dream Phantom",
  "寂灭": "Extinction",
  // Generic fallback spec names seen in packets
  "愈合": "Healing",
  "森语": "Forest Voice",
};

// Boss / monster names from CN server packets → English display names.
// Add entries here as new bosses are encountered.
const CN_BOSS_TO_EN: Record<string, string> = {
  // ── World Bosses ──
  "巨岩魔像": "Giant Rock Golem",
  "深渊巨龙": "Abyssal Dragon",
  "虚空吞噬者": "Void Devourer",
  "混沌领主": "Chaos Lord",
  // ── Dungeon / Instance Bosses ──
  "冰霜之王": "Frost King",
  "熔岩巨人": "Lava Giant",
  "暗影使徒": "Shadow Apostle",
  "风暴之翼": "Storm Wing",
  "腐化守卫": "Corrupted Guardian",
  "古老树人": "Ancient Treant",
  "死亡骑士": "Death Knight",
  "魔法傀儡": "Magic Puppet",
  "虚空领主": "Void Lord",
  "雷霆巨兽": "Thunder Beast",
  "深渊使者": "Abyss Herald",
  // ── Elite / Field Bosses ──
  "精英哥布林": "Elite Goblin",
  "石化巨蜥": "Petrified Monitor",
  "暴风雪熊": "Blizzard Bear",
  "毒蜘蛛女王": "Venom Spider Queen",
  "骸骨领主": "Skeleton Lord",
  // ── Raid Bosses ──
  "时间之神": "God of Time",
  "末日使者": "Doomsday Messenger",
  "星界守护者": "Astral Guardian",
  "命运织者": "Fate Weaver",
  "永恒之王": "Eternal King",
};

function hasCJK(str: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(str);
}

/**
 * Translate a boss/monster name from CN to EN.
 * If the name is already English (no CJK), returns it unchanged.
 * Falls back to the original name if no mapping exists.
 */
export function toBossName(monsterName: string): string {
  if (!monsterName) return monsterName;
  if (!hasCJK(monsterName)) return monsterName;
  return CN_BOSS_TO_EN[monsterName] ?? monsterName;
}

export function toClassLabel(className: string): string {
  // Internal class names are already English — return as-is
  return className ?? "";
}

export function toSpecLabel(specName: string): string {
  if (!specName) return "";
  // If it contains CJK characters, attempt lookup
  if (/[\u4e00-\u9fff]/.test(specName)) {
    return CN_SPEC_TO_EN[specName] ?? specName;
  }
  return specName;
}

export function formatClassSpecLabel(
  className: string,
  specName?: string,
): string {
  const classLabel = toClassLabel(className);
  const specLabel = specName ? toSpecLabel(specName) : "";
  if (!classLabel && !specLabel) return "";
  if (!classLabel) return specLabel;
  if (!specLabel) return classLabel;
  return `${classLabel} - ${specLabel}`;
}
