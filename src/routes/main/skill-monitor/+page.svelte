<script lang="ts">
  import { onMount } from "svelte";
  import { commands, type BuffDefinition, type BuffNameInfo } from "$lib/bindings";
  import SettingsSwitch from "../dps/settings/settings-switch.svelte";
  import TabSkillCd from "./tab-skill-cd.svelte";
  import TabBuffMonitor from "./tab-buff-monitor.svelte";
  import TabPanelAttr from "./tab-panel-attr.svelte";
  import TabCustomPanel from "./tab-custom-panel.svelte";
  import TabOverlay from "./tab-overlay.svelte";
  import {
    AVAILABLE_PANEL_ATTRS,
    createDefaultBuffGroup,
    createDefaultSkillMonitorProfile,
    SETTINGS,
    type BuffDisplayMode,
    type BuffGroup,
    type CustomPanelStyle,
    type InlineBuffEntry,
    type PanelAttrConfig,
    type PanelAreaRowRef,
    type SkillMonitorProfile,
  } from "$lib/settings-store";
  import {
    findResonanceSkill,
    getCounterRules,
    getClassConfigs,
    getSkillsByClass,
    searchResonanceSkills,
  } from "$lib/skill-mappings";

  let availableBuffs = $state<BuffDefinition[]>([]);
  let buffNames = $state(new Map<number, BuffNameInfo>());
  let buffSearch = $state("");
  let buffSearchResults = $state<BuffNameInfo[]>([]);
  let globalPrioritySearch = $state("");
  let globalPrioritySearchResults = $state<BuffNameInfo[]>([]);
  let groupSearchKeyword = $state<Record<string, string>>({});
  let groupSearchResults = $state<Record<string, BuffNameInfo[]>>({});
  let groupPrioritySearchKeyword = $state<Record<string, string>>({});
  let groupPrioritySearchResults = $state<Record<string, BuffNameInfo[]>>({});
  let resonanceSearch = $state("");
  let inlineBuffSearch = $state("");
  let inlineBuffSearchResults = $state<BuffNameInfo[]>([]);
  let activeTab = $state<"skill-cd" | "buff" | "panel-attr" | "custom-panel" | "overlay">("skill-cd");
  let attrSectionExpanded = $state(false);
  onMount(() => {
    void (async () => {
      const res = await commands.getAvailableBuffs();
      if (res.status === "ok") {
        availableBuffs = res.data;
      }
    })();
  });

  const classConfigs = $derived(getClassConfigs());
  const counterRules = $derived(getCounterRules());
  const profiles = $derived(SETTINGS.skillMonitor.state.profiles);
  const activeProfileIndex = $derived(
    Math.min(
      Math.max(SETTINGS.skillMonitor.state.activeProfileIndex, 0),
      Math.max(0, profiles.length - 1),
    ),
  );
  const activeProfile = $derived(
    profiles[activeProfileIndex] ?? createDefaultSkillMonitorProfile(),
  );
  const selectedClassKey = $derived(activeProfile.selectedClass);
  const classSkills = $derived(getSkillsByClass(selectedClassKey));
  const monitoredSkillIds = $derived(activeProfile.monitoredSkillIds);
  const monitoredBuffIds = $derived(activeProfile.monitoredBuffIds);
  const monitoredPanelAttrs = $derived.by(() => ensurePanelAttrs(activeProfile));
  const panelAttrGap = $derived(
    Math.max(0, Math.min(24, Math.round(activeProfile.overlaySizes?.panelAttrGap ?? 4))),
  );
  const panelAttrFontSize = $derived(
    Math.max(
      10,
      Math.min(28, Math.round(activeProfile.overlaySizes?.panelAttrFontSize ?? 14)),
    ),
  );
  const panelAttrColumnGap = $derived(
    Math.max(
      0,
      Math.min(240, Math.round(activeProfile.overlaySizes?.panelAttrColumnGap ?? 12)),
    ),
  );
  const showSkillCdGroup = $derived(
    activeProfile.overlayVisibility?.showSkillCdGroup ?? true,
  );
  const showResourceGroup = $derived(
    activeProfile.overlayVisibility?.showResourceGroup ?? true,
  );
  const showPanelAttrGroup = $derived(
    activeProfile.overlayVisibility?.showPanelAttrGroup ?? true,
  );
  const showCustomPanelGroup = $derived(
    activeProfile.overlayVisibility?.showCustomPanelGroup ?? true,
  );
  const customPanelStyle = $derived.by(() => ensureCustomPanelStyle(activeProfile));
  const buffDisplayMode = $derived(
    activeProfile.buffDisplayMode ?? "individual",
  );
  const buffGroups = $derived.by(() => ensureBuffGroups(activeProfile));
  const individualMonitorAllGroup = $derived.by(() => ensureIndividualMonitorAllGroup(activeProfile));
  const buffPriorityIds = $derived.by(() => {
    const selected = new Set(monitoredBuffIds);
    return uniqueIds((activeProfile.buffPriorityIds ?? []).filter((id) => selected.has(id)));
  });
  const textBuffMaxVisible = $derived(
    Math.max(1, Math.min(20, activeProfile.textBuffMaxVisible ?? 10)),
  );
  const inlineBuffEntries = $derived.by(() => ensureInlineBuffEntries(activeProfile));
  const panelAreaRowOrder = $derived.by(() => ensurePanelAreaRowOrder(activeProfile));
  const filteredInlineBuffSearchResults = $derived.by(() => {
    const ids = new Set<number>();
    return inlineBuffSearchResults.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (inlineBuffEntries.some((entry) => entry.sourceType === "buff" && entry.sourceId === item.baseId)) {
        return false;
      }
      ids.add(item.baseId);
      return true;
    });
  });

  function uniqueIds(ids: number[]): number[] {
    return Array.from(new Set(ids));
  }

  function moveItem(ids: number[], item: number, direction: "up" | "down"): number[] {
    const idx = ids.indexOf(item);
    if (idx === -1) return ids;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return ids;
    const next = [...ids];
    const temp = next[idx];
    const targetValue = next[target];
    if (temp === undefined || targetValue === undefined) return ids;
    next[idx] = targetValue;
    next[target] = temp;
    return next;
  }

  function normalizeGroupPriorityIds(group: BuffGroup): number[] {
    if (group.monitorAll) {
      return uniqueIds(group.priorityBuffIds ?? []);
    }
    const inGroup = new Set(group.buffIds);
    return uniqueIds((group.priorityBuffIds ?? []).filter((id) => inGroup.has(id)));
  }

  function ensureBuffGroup(group: BuffGroup, index: number): BuffGroup {
    return {
      id: group.id ?? `group_${index + 1}`,
      name: group.name ?? `分组 ${index + 1}`,
      buffIds: group.buffIds ?? [],
      priorityBuffIds: group.priorityBuffIds ?? [],
      monitorAll: group.monitorAll ?? false,
      position: group.position ?? { x: 40 + index * 40, y: 310 + index * 40 },
      iconSize: Math.max(24, Math.min(120, group.iconSize ?? 44)),
      columns: Math.max(1, Math.min(12, group.columns ?? 6)),
      rows: Math.max(1, Math.min(12, group.rows ?? 3)),
      gap: Math.max(0, Math.min(16, group.gap ?? 6)),
      showName: group.showName ?? true,
      showTime: group.showTime ?? true,
      showLayer: group.showLayer ?? true,
    };
  }

  function ensureBuffGroups(profile: SkillMonitorProfile): BuffGroup[] {
    return (profile.buffGroups ?? []).map((group, idx) => ensureBuffGroup(group, idx));
  }

  function ensureIndividualMonitorAllGroup(profile: SkillMonitorProfile): BuffGroup | null {
    const group = profile.individualMonitorAllGroup;
    if (!group) return null;
    const normalized = ensureBuffGroup(group, 0);
    return {
      ...normalized,
      monitorAll: true,
      name: normalized.name || "全部 Buff",
    };
  }

  function ensurePanelAttrs(profile: SkillMonitorProfile): PanelAttrConfig[] {
    const current = profile.monitoredPanelAttrs ?? [];
    const currentMap = new Map(current.map((item) => [item.attrId, item]));
    return AVAILABLE_PANEL_ATTRS.map((item) => {
      const existing = currentMap.get(item.attrId);
      return {
        attrId: item.attrId,
        label: existing?.label ?? item.label,
        color: existing?.color ?? item.color,
        enabled: existing?.enabled ?? item.enabled,
        format: existing?.format ?? item.format,
      };
    });
  }

  function ensureInlineBuffEntries(profile: SkillMonitorProfile): InlineBuffEntry[] {
    return (profile.inlineBuffEntries ?? []).map((entry, idx) => ({
      id: entry.id ?? `inline_${idx + 1}`,
      sourceType: entry.sourceType ?? "buff",
      sourceId: entry.sourceId,
      label: entry.label ?? (entry.sourceType === "counter" ? `计数器 ${entry.sourceId}` : `Buff ${entry.sourceId}`),
      format: entry.format ?? "timer",
      color: entry.color ?? "#ffffff",
    }));
  }

  function isSameRowRef(a: PanelAreaRowRef, b: PanelAreaRowRef): boolean {
    return a.attrId === b.attrId;
  }

  function ensurePanelAreaRowOrder(profile: SkillMonitorProfile): PanelAreaRowRef[] {
    const enabledAttrIds = ensurePanelAttrs(profile)
      .filter((item) => item.enabled)
      .map((item) => item.attrId);
    const attrIdSet = new Set(enabledAttrIds);
    const normalized: PanelAreaRowRef[] = [];
    for (const row of profile.panelAreaRowOrder ?? []) {
      if (!attrIdSet.has(row.attrId)) continue;
      if (!normalized.some((item) => isSameRowRef(item, row))) {
        normalized.push({ type: "attr", attrId: row.attrId });
      }
    }
    for (const attrId of enabledAttrIds) {
      const row: PanelAreaRowRef = { type: "attr", attrId };
      if (!normalized.some((item) => isSameRowRef(item, row))) {
        normalized.push(row);
      }
    }
    return normalized;
  }

  function ensureOverlaySizes(profile: SkillMonitorProfile) {
    const current = profile.overlaySizes;
    return {
      skillCdGroupScale: current?.skillCdGroupScale ?? 1,
      resourceGroupScale: current?.resourceGroupScale ?? 1,
      textBuffPanelScale: current?.textBuffPanelScale ?? 1,
      panelAttrGroupScale: current?.panelAttrGroupScale ?? 1,
      customPanelGroupScale: current?.customPanelGroupScale ?? 1,
      panelAttrGap: Math.max(0, Math.min(24, Math.round(current?.panelAttrGap ?? 4))),
      panelAttrFontSize: Math.max(
        10,
        Math.min(28, Math.round(current?.panelAttrFontSize ?? 14)),
      ),
      panelAttrColumnGap: Math.max(
        0,
        Math.min(240, Math.round(current?.panelAttrColumnGap ?? 12)),
      ),
      iconBuffSizes: current?.iconBuffSizes ?? {},
    };
  }

  function ensureCustomPanelStyle(profile: SkillMonitorProfile): CustomPanelStyle {
    const current = profile.customPanelStyle;
    return {
      gap: Math.max(0, Math.min(24, Math.round(current?.gap ?? 6))),
      columnGap: Math.max(0, Math.min(240, Math.round(current?.columnGap ?? 12))),
      fontSize: Math.max(10, Math.min(28, Math.round(current?.fontSize ?? 14))),
      nameColor: current?.nameColor ?? "#ffffff",
      valueColor: current?.valueColor ?? "#ffffff",
      progressColor: current?.progressColor ?? "#ffffff",
    };
  }

  function updateActiveProfile(
    updater: (profile: SkillMonitorProfile) => SkillMonitorProfile,
  ) {
    const state = SETTINGS.skillMonitor.state;
    const currentProfiles = state.profiles;
    if (currentProfiles.length === 0) {
      state.profiles = [createDefaultSkillMonitorProfile()];
      state.activeProfileIndex = 0;
      return;
    }

    const index = Math.min(
      Math.max(state.activeProfileIndex, 0),
      currentProfiles.length - 1,
    );
    state.profiles = currentProfiles.map((profile, i) =>
      i === index ? updater(profile) : profile,
    );
  }

  function setSelectedClass(classKey: string) {
    updateActiveProfile((profile) => ({
      ...profile,
      selectedClass: classKey,
      monitoredSkillIds: [],
    }));
  }

  function toggleSkill(skillId: number) {
    const current = monitoredSkillIds;
    const exists = current.includes(skillId);
    if (exists) {
      updateActiveProfile((profile) => ({
        ...profile,
        monitoredSkillIds: current.filter((id) => id !== skillId),
      }));
      return;
    }
    if (current.length >= 10) return;
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredSkillIds: [...current, skillId],
    }));
  }

  function isSelected(skillId: number): boolean {
    return monitoredSkillIds.includes(skillId);
  }

  const filteredResonanceSkills = $derived.by(() =>
    searchResonanceSkills(resonanceSearch),
  );
  const selectedResonanceSkills = $derived.by(
    () =>
      monitoredSkillIds
        .map((id) => findResonanceSkill(id))
        .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))
        .slice(0, 10),
  );

  function clearSkills() {
    updateActiveProfile((profile) => ({ ...profile, monitoredSkillIds: [] }));
  }

  function clearBuffs() {
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredBuffIds: [],
      buffPriorityIds: [],
    }));
  }

  function setResonanceSearch(value: string) {
    resonanceSearch = value;
  }

  function setBuffSearch(value: string) {
    buffSearch = value;
  }

  function setGlobalPrioritySearch(value: string) {
    globalPrioritySearch = value;
  }

  function setAttrSectionExpanded(expanded: boolean) {
    attrSectionExpanded = expanded;
  }

  function toggleBuff(buffId: number) {
    const current = monitoredBuffIds;
    const exists = current.includes(buffId);
    if (exists) {
      updateActiveProfile((profile) => ({
        ...profile,
        monitoredBuffIds: current.filter((id) => id !== buffId),
        buffPriorityIds: (profile.buffPriorityIds ?? []).filter((id) => id !== buffId),
      }));
      return;
    }
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredBuffIds: [...current, buffId],
    }));
  }

  function toggleGlobalPriority(buffId: number) {
    updateActiveProfile((profile) => {
      const current = uniqueIds(profile.buffPriorityIds ?? []);
      const exists = current.includes(buffId);
      return {
        ...profile,
        buffPriorityIds: exists ? current.filter((id) => id !== buffId) : [...current, buffId],
      };
    });
  }

  function isBuffSelected(buffId: number): boolean {
    return monitoredBuffIds.includes(buffId);
  }

  const filteredBuffs = $derived.by(() => {
    const ids = new Set<number>();
    const merged: BuffNameInfo[] = [];
    for (const item of buffSearchResults) {
      if (ids.has(item.baseId)) continue;
      ids.add(item.baseId);
      merged.push(item);
    }
    return merged;
  });
  const availableBuffMap = $derived.by(() => {
    const map = new Map<number, BuffDefinition>();
    for (const buff of availableBuffs) {
      map.set(buff.baseId, buff);
    }
    return map;
  });
  const selectedBuffs = $derived.by(
    () =>
      monitoredBuffIds
        .map((id) => availableBuffs.find((buff) => buff.baseId === id))
        .filter(Boolean) as BuffDefinition[],
  );

  $effect(() => {
    const ids = monitoredBuffIds;
    if (ids.length === 0) return;
    void (async () => {
      const missing = ids.filter((id) => !buffNames.has(id));
      if (missing.length === 0) return;
      const res = await commands.getBuffNames(missing);
      if (res.status !== "ok") return;
      const next = new Map(buffNames);
      for (const item of res.data) {
        next.set(item.baseId, item);
      }
      buffNames = next;
    })();
  });

  $effect(() => {
    const keyword = buffSearch.trim();
    if (!keyword) {
      buffSearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      buffSearchResults = res.data;
    })();
  });

  $effect(() => {
    const keyword = globalPrioritySearch.trim();
    if (!keyword) {
      globalPrioritySearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      globalPrioritySearchResults = res.data;
    })();
  });

  $effect(() => {
    const keyword = inlineBuffSearch.trim();
    if (!keyword) {
      inlineBuffSearchResults = [];
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      inlineBuffSearchResults = res.data;
    })();
  });

  function setOverlaySectionVisibility(
    key: "showSkillCdGroup" | "showResourceGroup" | "showPanelAttrGroup" | "showCustomPanelGroup",
    checked: boolean,
  ) {
    updateActiveProfile((profile) => ({
      ...profile,
      overlayVisibility: {
        showSkillCdGroup: profile.overlayVisibility?.showSkillCdGroup ?? true,
        showResourceGroup: profile.overlayVisibility?.showResourceGroup ?? true,
        showPanelAttrGroup: profile.overlayVisibility?.showPanelAttrGroup ?? true,
        showCustomPanelGroup: profile.overlayVisibility?.showCustomPanelGroup ?? true,
        [key]: checked,
      },
    }));
  }

  function toggleOverlaySectionVisibility(
    key: "showSkillCdGroup" | "showResourceGroup" | "showPanelAttrGroup" | "showCustomPanelGroup",
  ) {
    const current = key === "showSkillCdGroup"
      ? showSkillCdGroup
      : key === "showResourceGroup"
      ? showResourceGroup
      : key === "showPanelAttrGroup"
      ? showPanelAttrGroup
      : showCustomPanelGroup;
    setOverlaySectionVisibility(key, !current);
  }

  function setPanelAttrEnabled(attrId: number, enabled: boolean) {
    updateActiveProfile((profile) => {
      const nextAttrs = ensurePanelAttrs(profile).map((item) =>
        item.attrId === attrId ? { ...item, enabled } : item
      );
      let nextOrder = ensurePanelAreaRowOrder(profile).filter((row) =>
        nextAttrs.some((item) => item.enabled && item.attrId === row.attrId)
      );
      if (enabled && !nextOrder.some((row) => row.type === "attr" && row.attrId === attrId)) {
        nextOrder = [...nextOrder, { type: "attr", attrId }];
      }
      return {
        ...profile,
        monitoredPanelAttrs: nextAttrs,
        panelAreaRowOrder: nextOrder,
      };
    });
  }

  function setPanelAttrColor(attrId: number, color: string) {
    updateActiveProfile((profile) => ({
      ...profile,
      monitoredPanelAttrs: ensurePanelAttrs(profile).map((item) =>
        item.attrId === attrId ? { ...item, color } : item
      ),
    }));
  }

  function setPanelAttrGap(value: number) {
    const nextValue = Math.max(0, Math.min(24, Math.round(value)));
    updateActiveProfile((profile) => ({
      ...profile,
      overlaySizes: {
        ...ensureOverlaySizes(profile),
        panelAttrGap: nextValue,
      },
    }));
  }

  function setPanelAttrFontSize(value: number) {
    const nextValue = Math.max(10, Math.min(28, Math.round(value)));
    updateActiveProfile((profile) => ({
      ...profile,
      overlaySizes: {
        ...ensureOverlaySizes(profile),
        panelAttrFontSize: nextValue,
      },
    }));
  }

  function setPanelAttrColumnGap(value: number) {
    const nextValue = Math.max(0, Math.min(240, Math.round(value)));
    updateActiveProfile((profile) => ({
      ...profile,
      overlaySizes: {
        ...ensureOverlaySizes(profile),
        panelAttrColumnGap: nextValue,
      },
    }));
  }

  function setInlineBuffSearch(value: string) {
    inlineBuffSearch = value;
  }

  function updateCustomPanelStyle(
    updater: (style: CustomPanelStyle) => CustomPanelStyle,
  ) {
    updateActiveProfile((profile) => ({
      ...profile,
      customPanelStyle: updater(ensureCustomPanelStyle(profile)),
    }));
  }

  function setCustomPanelGap(value: number) {
    const nextValue = Math.max(0, Math.min(24, Math.round(value)));
    updateCustomPanelStyle((style) => ({ ...style, gap: nextValue }));
  }

  function setCustomPanelFontSize(value: number) {
    const nextValue = Math.max(10, Math.min(28, Math.round(value)));
    updateCustomPanelStyle((style) => ({ ...style, fontSize: nextValue }));
  }

  function setCustomPanelColumnGap(value: number) {
    const nextValue = Math.max(0, Math.min(240, Math.round(value)));
    updateCustomPanelStyle((style) => ({ ...style, columnGap: nextValue }));
  }

  function setCustomPanelNameColor(value: string) {
    updateCustomPanelStyle((style) => ({ ...style, nameColor: value }));
  }

  function setCustomPanelValueColor(value: string) {
    updateCustomPanelStyle((style) => ({ ...style, valueColor: value }));
  }

  function setCustomPanelProgressColor(value: string) {
    updateCustomPanelStyle((style) => ({ ...style, progressColor: value }));
  }

  function addInlineBuffEntry(sourceType: "buff" | "counter", sourceId: number) {
    updateActiveProfile((profile) => {
      const entries = ensureInlineBuffEntries(profile);
      if (entries.some((entry) => entry.sourceType === sourceType && entry.sourceId === sourceId)) {
        return profile;
      }
      const label = sourceType === "counter"
        ? (counterRules.find((rule) => rule.ruleId === sourceId)?.name ?? `计数器 ${sourceId}`)
        : (buffNames.get(sourceId)?.name ?? availableBuffMap.get(sourceId)?.name ?? `Buff ${sourceId}`);
      const nextEntry: InlineBuffEntry = {
        id: `inline_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        sourceType,
        sourceId,
        label,
        format: "timer",
        color: "#ffffff",
      };
      return {
        ...profile,
        inlineBuffEntries: [...entries, nextEntry],
      };
    });
  }

  function removeInlineBuffEntry(entryId: string) {
    updateActiveProfile((profile) => ({
      ...profile,
      inlineBuffEntries: ensureInlineBuffEntries(profile).filter((entry) => entry.id !== entryId),
    }));
  }

  function updateInlineBuffEntry(
    entryId: string,
    updater: (entry: InlineBuffEntry) => InlineBuffEntry,
  ) {
    updateActiveProfile((profile) => ({
      ...profile,
      inlineBuffEntries: ensureInlineBuffEntries(profile).map((entry) =>
        entry.id === entryId ? updater(entry) : entry
      ),
    }));
  }

  function setInlineBuffLabel(entryId: string, label: string) {
    updateInlineBuffEntry(entryId, (entry) => ({ ...entry, label }));
  }

  function movePanelAreaRow(row: PanelAreaRowRef, direction: "up" | "down") {
    updateActiveProfile((profile) => {
      const current = ensurePanelAreaRowOrder(profile);
      const idx = current.findIndex((item) => isSameRowRef(item, row));
      if (idx === -1) return profile;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= current.length) return profile;
      const next = [...current];
      const temp = next[idx];
      const targetValue = next[target];
      if (!temp || !targetValue) return profile;
      next[idx] = targetValue;
      next[target] = temp;
      return {
        ...profile,
        panelAreaRowOrder: next,
      };
    });
  }

  function moveCustomPanelEntry(entryId: string, direction: "up" | "down") {
    updateActiveProfile((profile) => {
      const entries = ensureInlineBuffEntries(profile);
      const idx = entries.findIndex((entry) => entry.id === entryId);
      if (idx < 0) return profile;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= entries.length) return profile;
      const next = [...entries];
      const temp = next[idx];
      const targetValue = next[target];
      if (!temp || !targetValue) return profile;
      next[idx] = targetValue;
      next[target] = temp;
      return {
        ...profile,
        inlineBuffEntries: next,
      };
    });
  }

  function setBuffDisplayMode(mode: BuffDisplayMode) {
    updateActiveProfile((profile) => ({
      ...profile,
      buffDisplayMode: mode,
      buffPriorityIds: uniqueIds(profile.buffPriorityIds ?? []),
      textBuffMaxVisible: Math.max(1, Math.min(20, profile.textBuffMaxVisible ?? 10)),
      buffGroups: ensureBuffGroups(profile),
    }));
  }

  function setTextBuffMaxVisible(value: number) {
    const nextValue = Math.max(1, Math.min(20, Math.round(value)));
    updateActiveProfile((profile) => ({
      ...profile,
      textBuffMaxVisible: nextValue,
    }));
  }

  function updateBuffGroup(groupId: string, updater: (group: BuffGroup) => BuffGroup) {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: ensureBuffGroups(profile).map((group) =>
        group.id === groupId
          ? (() => {
              const updated = updater(group);
              return {
                ...updated,
                priorityBuffIds: normalizeGroupPriorityIds(updated),
              };
            })()
          : group,
      ),
    }));
  }

  function addBuffGroup() {
    updateActiveProfile((profile) => {
      const groups = ensureBuffGroups(profile);
      return {
        ...profile,
        buffGroups: [...groups, createDefaultBuffGroup(`分组 ${groups.length + 1}`, groups.length + 1)],
      };
    });
  }

  function removeBuffGroup(groupId: string) {
    updateActiveProfile((profile) => ({
      ...profile,
      buffGroups: ensureBuffGroups(profile).filter((group) => group.id !== groupId),
    }));
    const nextKeyword = { ...groupSearchKeyword };
    delete nextKeyword[groupId];
    groupSearchKeyword = nextKeyword;
    const nextResults = { ...groupSearchResults };
    delete nextResults[groupId];
    groupSearchResults = nextResults;
    const nextPriorityKeyword = { ...groupPrioritySearchKeyword };
    delete nextPriorityKeyword[groupId];
    groupPrioritySearchKeyword = nextPriorityKeyword;
    const nextPriorityResults = { ...groupPrioritySearchResults };
    delete nextPriorityResults[groupId];
    groupPrioritySearchResults = nextPriorityResults;
  }

  function addIndividualMonitorAll() {
    updateActiveProfile((profile) => {
      const existing = ensureIndividualMonitorAllGroup(profile);
      if (existing) return profile;
      return {
        ...profile,
        individualMonitorAllGroup: {
          ...createDefaultBuffGroup("全部 Buff", 1),
          monitorAll: true,
        },
      };
    });
  }

  function removeIndividualMonitorAll() {
    updateActiveProfile((profile) => ({
      ...profile,
      individualMonitorAllGroup: null,
    }));
  }

  function updateIndividualMonitorAllGroup(updater: (group: BuffGroup) => BuffGroup) {
    updateActiveProfile((profile) => {
      const current = ensureIndividualMonitorAllGroup(profile);
      if (!current) return profile;
      const updated = ensureBuffGroup(updater(current), 0);
      return {
        ...profile,
        individualMonitorAllGroup: {
          ...updated,
          monitorAll: true,
        },
      };
    });
  }

  function setGroupSearchKeyword(groupId: string, value: string) {
    groupSearchKeyword = { ...groupSearchKeyword, [groupId]: value };
    const keyword = value.trim();
    if (!keyword) {
      groupSearchResults = { ...groupSearchResults, [groupId]: [] };
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      groupSearchResults = { ...groupSearchResults, [groupId]: res.data };
    })();
  }

  function getGroupSearchKeyword(groupId: string) {
    return groupSearchKeyword[groupId] ?? "";
  }

  function setGroupPrioritySearchKeyword(groupId: string, value: string) {
    groupPrioritySearchKeyword = { ...groupPrioritySearchKeyword, [groupId]: value };
    const keyword = value.trim();
    if (!keyword) {
      groupPrioritySearchResults = { ...groupPrioritySearchResults, [groupId]: [] };
      return;
    }
    void (async () => {
      const res = await commands.searchBuffsByName(keyword, 120);
      if (res.status !== "ok") return;
      groupPrioritySearchResults = { ...groupPrioritySearchResults, [groupId]: res.data };
    })();
  }

  function getGroupPrioritySearchKeyword(groupId: string) {
    return groupPrioritySearchKeyword[groupId] ?? "";
  }

  function getGroupSearchResults(group: BuffGroup): BuffNameInfo[] {
    const results = groupSearchResults[group.id] ?? [];
    const ids = new Set<number>();
    return results.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (group.buffIds.includes(item.baseId)) return false;
      if (group.priorityBuffIds.includes(item.baseId)) return false;
      ids.add(item.baseId);
      return true;
    });
  }

  function getGroupPrioritySearchResults(group: BuffGroup): BuffNameInfo[] {
    const results = groupPrioritySearchResults[group.id] ?? [];
    const ids = new Set<number>();
    return results.filter((item) => {
      if (ids.has(item.baseId)) return false;
      if (!group.monitorAll && !group.buffIds.includes(item.baseId)) return false;
      if (group.priorityBuffIds.includes(item.baseId)) return false;
      ids.add(item.baseId);
      return true;
    });
  }

  function getGroupPriorityIds(group: BuffGroup): number[] {
    return normalizeGroupPriorityIds(group);
  }

  function toggleBuffInGroup(groupId: string, buffId: number) {
    updateBuffGroup(groupId, (group) => {
      const exists = group.buffIds.includes(buffId);
      return {
        ...group,
        buffIds: exists
          ? group.buffIds.filter((id) => id !== buffId)
          : [...group.buffIds, buffId],
        priorityBuffIds: exists
          ? group.priorityBuffIds.filter((id) => id !== buffId)
          : group.priorityBuffIds,
      };
    });
  }

  function togglePriorityInGroup(groupId: string, buffId: number) {
    updateBuffGroup(groupId, (group) => {
      const exists = group.priorityBuffIds.includes(buffId);
      return {
        ...group,
        priorityBuffIds: exists
          ? group.priorityBuffIds.filter((id) => id !== buffId)
          : uniqueIds([...group.priorityBuffIds, buffId]),
      };
    });
  }

  function moveGlobalPriority(buffId: number, direction: "up" | "down") {
    updateActiveProfile((profile) => ({
      ...profile,
      buffPriorityIds: moveItem(buffPriorityIds, buffId, direction),
    }));
  }

  function moveGroupPriority(groupId: string, buffId: number, direction: "up" | "down") {
    updateBuffGroup(groupId, (group) => ({
      ...group,
      priorityBuffIds: moveItem(normalizeGroupPriorityIds(group), buffId, direction),
    }));
  }

</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] space-y-2">
    <SettingsSwitch
      bind:checked={SETTINGS.skillMonitor.state.enabled}
      label="启用技能监控"
      description="开启后将实时推送技能CD数据到悬浮窗口"
    />
  </div>

  <div class="rounded-lg border border-border/60 bg-card/40 p-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {activeTab === 'skill-cd'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => (activeTab = "skill-cd")}
      >
        技能CD
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {activeTab === 'buff'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => (activeTab = "buff")}
      >
        Buff监控
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {activeTab === 'panel-attr'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => (activeTab = "panel-attr")}
      >
        角色面板
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {activeTab === 'custom-panel'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => (activeTab = "custom-panel")}
      >
        自定义面板
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {activeTab === 'overlay'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => (activeTab = "overlay")}
      >
        Overlay
      </button>
    </div>
  </div>

  {#if activeTab === "skill-cd"}
    <TabSkillCd
      {classConfigs}
      {selectedClassKey}
      {classSkills}
      {monitoredSkillIds}
      {resonanceSearch}
      {filteredResonanceSkills}
      {selectedResonanceSkills}
      {setSelectedClass}
      {toggleSkill}
      {isSelected}
      {clearSkills}
      {setResonanceSearch}
    />
  {:else if activeTab === "buff"}
    <TabBuffMonitor
      {buffSearch}
      {filteredBuffs}
      {monitoredBuffIds}
      {selectedBuffs}
      {availableBuffs}
      {availableBuffMap}
      {buffNames}
      {isBuffSelected}
      {toggleBuff}
      {clearBuffs}
      {setBuffSearch}
      {buffDisplayMode}
      {setBuffDisplayMode}
      {textBuffMaxVisible}
      {setTextBuffMaxVisible}
      {globalPrioritySearch}
      {globalPrioritySearchResults}
      {setGlobalPrioritySearch}
      {buffPriorityIds}
      {toggleGlobalPriority}
      {moveGlobalPriority}
      {individualMonitorAllGroup}
      {addIndividualMonitorAll}
      {removeIndividualMonitorAll}
      {updateIndividualMonitorAllGroup}
      {buffGroups}
      {addBuffGroup}
      {removeBuffGroup}
      {updateBuffGroup}
      {getGroupSearchKeyword}
      {setGroupSearchKeyword}
      {getGroupSearchResults}
      {getGroupPrioritySearchKeyword}
      {setGroupPrioritySearchKeyword}
      {getGroupPrioritySearchResults}
      {getGroupPriorityIds}
      {toggleBuffInGroup}
      {togglePriorityInGroup}
      {moveGroupPriority}
    />
  {:else if activeTab === "panel-attr"}
    <TabPanelAttr
      {attrSectionExpanded}
      {monitoredPanelAttrs}
      {panelAttrGap}
      {panelAttrFontSize}
      {panelAttrColumnGap}
      {panelAreaRowOrder}
      {setAttrSectionExpanded}
      {setPanelAttrEnabled}
      {setPanelAttrColor}
      {setPanelAttrGap}
      {setPanelAttrFontSize}
      {setPanelAttrColumnGap}
      {movePanelAreaRow}
    />
  {:else if activeTab === "custom-panel"}
    <TabCustomPanel
      {counterRules}
      {availableBuffMap}
      {buffNames}
      {inlineBuffSearch}
      {filteredInlineBuffSearchResults}
      {inlineBuffEntries}
      {customPanelStyle}
      {setInlineBuffSearch}
      {addInlineBuffEntry}
      {removeInlineBuffEntry}
      {setInlineBuffLabel}
      {moveCustomPanelEntry}
      {setCustomPanelGap}
      {setCustomPanelFontSize}
      {setCustomPanelColumnGap}
      {setCustomPanelNameColor}
      {setCustomPanelValueColor}
      {setCustomPanelProgressColor}
    />
  {:else}
    <TabOverlay
      {showSkillCdGroup}
      {showResourceGroup}
      {showPanelAttrGroup}
      {showCustomPanelGroup}
      {toggleOverlaySectionVisibility}
    />
  {/if}

</div>
