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
