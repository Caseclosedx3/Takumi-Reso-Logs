<script lang="ts">
  import type { BuffDefinition, BuffNameInfo } from "$lib/bindings";
  import type { BuffDisplayMode, BuffGroup } from "$lib/settings-store";

  interface Props {
    buffSearch: string;
    filteredBuffs: BuffNameInfo[];
    monitoredBuffIds: number[];
    selectedBuffs: BuffDefinition[];
    availableBuffs: BuffDefinition[];
    availableBuffMap: Map<number, BuffDefinition>;
    buffNames: Map<number, BuffNameInfo>;
    isBuffSelected: (buffId: number) => boolean;
    toggleBuff: (buffId: number) => void;
    clearBuffs: () => void;
    setBuffSearch: (value: string) => void;

    buffDisplayMode: BuffDisplayMode;
    setBuffDisplayMode: (mode: BuffDisplayMode) => void;
    textBuffMaxVisible: number;
    setTextBuffMaxVisible: (value: number) => void;

    globalPrioritySearch: string;
    globalPrioritySearchResults: BuffNameInfo[];
    setGlobalPrioritySearch: (value: string) => void;
    buffPriorityIds: number[];
    toggleGlobalPriority: (buffId: number) => void;
    moveGlobalPriority: (buffId: number, direction: "up" | "down") => void;

    individualMonitorAllGroup: BuffGroup | null;
    addIndividualMonitorAll: () => void;
    removeIndividualMonitorAll: () => void;
    updateIndividualMonitorAllGroup: (updater: (group: BuffGroup) => BuffGroup) => void;

    buffGroups: BuffGroup[];
    addBuffGroup: () => void;
    removeBuffGroup: (groupId: string) => void;
    updateBuffGroup: (groupId: string, updater: (group: BuffGroup) => BuffGroup) => void;
    getGroupSearchKeyword: (groupId: string) => string;
    setGroupSearchKeyword: (groupId: string, value: string) => void;
    getGroupSearchResults: (group: BuffGroup) => BuffNameInfo[];
    getGroupPrioritySearchKeyword: (groupId: string) => string;
    setGroupPrioritySearchKeyword: (groupId: string, value: string) => void;
    getGroupPrioritySearchResults: (group: BuffGroup) => BuffNameInfo[];
    getGroupPriorityIds: (group: BuffGroup) => number[];
    toggleBuffInGroup: (groupId: string, buffId: number) => void;
    togglePriorityInGroup: (groupId: string, buffId: number) => void;
    moveGroupPriority: (groupId: string, buffId: number, direction: "up" | "down") => void;
  }

  let {
    buffSearch,
    filteredBuffs,
    monitoredBuffIds,
    selectedBuffs,
    availableBuffs,
    availableBuffMap,
    buffNames,
    isBuffSelected,
    toggleBuff,
    clearBuffs,
    setBuffSearch,
    buffDisplayMode,
    setBuffDisplayMode,
    textBuffMaxVisible,
    setTextBuffMaxVisible,
    globalPrioritySearch,
    globalPrioritySearchResults,
    setGlobalPrioritySearch,
    buffPriorityIds,
    toggleGlobalPriority,
    moveGlobalPriority,
    individualMonitorAllGroup,
    addIndividualMonitorAll,
    removeIndividualMonitorAll,
    updateIndividualMonitorAllGroup,
    buffGroups,
    addBuffGroup,
    removeBuffGroup,
    updateBuffGroup,
    getGroupSearchKeyword,
    setGroupSearchKeyword,
    getGroupSearchResults,
    getGroupPrioritySearchKeyword,
    setGroupPrioritySearchKeyword,
    getGroupPrioritySearchResults,
    getGroupPriorityIds,
    toggleBuffInGroup,
    togglePriorityInGroup,
    moveGroupPriority,
  }: Props = $props();
</script>

<div class="space-y-6">
  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-foreground">Buff 监控</h2>
        <p class="text-xs text-muted-foreground">统一通过 Buff 名称搜索（含有图标/无图标 Buff）</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-xs text-muted-foreground">已选 {monitoredBuffIds.length}</div>
        <button
          type="button"
          class="text-xs px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          onclick={clearBuffs}
        >
          清空
        </button>
      </div>
    </div>

    <input
      class="w-full sm:w-64 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      placeholder="搜索 Buff 名称"
      value={buffSearch}
      oninput={(event) => setBuffSearch((event.currentTarget as HTMLInputElement).value)}
    />

    {#if buffSearch.trim().length > 0}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-3">
        {#each filteredBuffs as buff (buff.baseId)}
          {@const iconBuff = availableBuffMap.get(buff.baseId)}
          <button
            type="button"
            class="relative group rounded-lg border overflow-hidden transition-colors {isBuffSelected(buff.baseId)
              ? 'border-primary ring-1 ring-primary'
              : 'border-border/60 hover:border-border'}"
            title={buff.name}
            onclick={() => toggleBuff(buff.baseId)}
          >
            {#if iconBuff}
              <img
                src={`/images/buff/${iconBuff.spriteFile}`}
                alt={iconBuff.name}
                class="w-full h-full object-contain aspect-square bg-muted/20"
              />
            {:else}
              <div class="w-full h-full aspect-square flex items-center justify-center bg-muted/20 text-[11px] text-foreground p-1 text-center">
                {buff.name.slice(0, 8)}
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {:else}
      <div class="text-xs text-muted-foreground">请输入关键词搜索 Buff</div>
    {/if}

    <div class="space-y-2">
      <div class="text-xs text-muted-foreground">已选 Buff</div>
      <div class="flex flex-wrap gap-2">
        {#each monitoredBuffIds as buffId (buffId)}
          {@const iconBuff = selectedBuffs.find((buff) => buff.baseId === buffId)}
          {@const nameInfo = buffNames.get(buffId)}
          {#if iconBuff}
            <button
              type="button"
              class="relative rounded-md border border-border/60 overflow-hidden bg-muted/20 size-12 hover:border-border hover:bg-muted/30"
              title={iconBuff.name}
              onclick={() => toggleBuff(iconBuff.baseId)}
            >
              <img
                src={`/images/buff/${iconBuff.spriteFile}`}
                alt={iconBuff.name}
                class="w-full h-full object-contain"
              />
            </button>
          {:else}
            <button
              type="button"
              class="rounded-md border border-border/60 bg-muted/20 px-2 py-1 text-[11px] text-foreground hover:border-border hover:bg-muted/30"
              title={nameInfo?.name ?? `#${buffId}`}
              onclick={() => toggleBuff(buffId)}
            >
              {nameInfo?.name ?? `#${buffId}`}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div>
      <h2 class="text-base font-semibold text-foreground">Buff 显示模式</h2>
      <p class="text-xs text-muted-foreground">可在独立定位和分组布局间切换，配置会按方案保存</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {buffDisplayMode === 'individual'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => setBuffDisplayMode("individual")}
      >
        独立模式
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-medium border transition-colors {buffDisplayMode === 'grouped'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/30 text-foreground border-border/60 hover:bg-muted/50'}"
        onclick={() => setBuffDisplayMode("grouped")}
      >
        分组模式
      </button>
    </div>
    <label class="block text-xs text-muted-foreground max-w-md">
      无图标 Buff 最大显示数: {textBuffMaxVisible}
      <input
        class="w-full mt-1"
        type="range"
        min="1"
        max="20"
        step="1"
        value={textBuffMaxVisible}
        oninput={(event) => setTextBuffMaxVisible(Number((event.currentTarget as HTMLInputElement).value))}
      />
    </label>
  </div>

  <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
    <div class="space-y-2">
      <div class="text-xs font-medium text-foreground">全局 Buff 优先级</div>
      <input
        class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="搜索并添加到全局优先级"
        value={globalPrioritySearch}
        oninput={(event) => setGlobalPrioritySearch((event.currentTarget as HTMLInputElement).value)}
      />
      {#if globalPrioritySearch.trim().length > 0 && globalPrioritySearchResults.length > 0}
        <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
          {#each globalPrioritySearchResults as item (item.baseId)}
            {@const iconBuff = availableBuffMap.get(item.baseId)}
            {#if monitoredBuffIds.includes(item.baseId) && !buffPriorityIds.includes(item.baseId)}
              <button
                type="button"
                class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                title={item.name}
                onclick={() => toggleGlobalPriority(item.baseId)}
              >
                {#if iconBuff}
                  <img src={`/images/buff/${iconBuff.spriteFile}`} alt={iconBuff.name} class="w-full h-10 object-contain" />
                {/if}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
      <div class="space-y-1">
        {#each buffPriorityIds as buffId, idx (buffId)}
          {@const iconBuff = availableBuffMap.get(buffId)}
          {@const nameInfo = buffNames.get(buffId)}
          <div class="flex items-center gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1">
            <span class="w-6 text-center text-xs text-muted-foreground">{idx + 1}</span>
            <span class="flex-1 text-xs text-foreground truncate">
              {nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
            </span>
            <button type="button" class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40" onclick={() => toggleGlobalPriority(buffId)}>移除</button>
            <button type="button" class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50" onclick={() => moveGlobalPriority(buffId, "up")} disabled={idx === 0}>上移</button>
            <button type="button" class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50" onclick={() => moveGlobalPriority(buffId, "down")} disabled={idx === buffPriorityIds.length - 1}>下移</button>
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if buffDisplayMode === "individual"}
    <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-foreground">监控全部 Buff </h2>
          <p class="text-xs text-muted-foreground">
            新增一个网格区域显示全部 Buff（自动排除已在独立模式中选中的 Buff）
          </p>
        </div>
        {#if !individualMonitorAllGroup}
          <button type="button" class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors" onclick={addIndividualMonitorAll}>
            监控全部 Buff
          </button>
        {:else}
          <button type="button" class="text-xs px-3 py-2 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors" onclick={removeIndividualMonitorAll}>
            移除全部 Buff 分组
          </button>
        {/if}
      </div>
      {#if individualMonitorAllGroup}
        <div class="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <input
              class="w-52 rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-sm text-foreground"
              value={individualMonitorAllGroup.name}
              oninput={(event) =>
                updateIndividualMonitorAllGroup((curr) => ({
                  ...curr,
                  name: (event.currentTarget as HTMLInputElement).value || curr.name,
                }))}
            />
            <span class="text-xs text-muted-foreground">固定为监控全部 Buff</span>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if buffDisplayMode === "grouped"}
    <div class="rounded-lg border border-border/60 bg-card/40 p-4 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-foreground">Buff 分组管理</h2>
          <p class="text-xs text-muted-foreground">
            通过分组管理 Buff 展示，组内自动网格对齐
          </p>
        </div>
        <button
          type="button"
          class="text-xs px-3 py-2 rounded border border-border/60 text-foreground hover:bg-muted/40 transition-colors"
          onclick={addBuffGroup}
        >
          新建分组
        </button>
      </div>

      <div class="space-y-3">
        {#each buffGroups as group (group.id)}
          <div class="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <input
                class="w-52 rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-sm text-foreground"
                value={group.name}
                oninput={(event) =>
                  updateBuffGroup(group.id, (curr) => ({
                    ...curr,
                    name: (event.currentTarget as HTMLInputElement).value || curr.name,
                  }))}
              />
              <button
                type="button"
                class="text-xs px-2 py-1 rounded border border-border/60 text-destructive hover:bg-destructive/10 transition-colors"
                onclick={() => removeBuffGroup(group.id)}
              >
                删除分组
              </button>
              <label class="ml-auto flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={group.monitorAll}
                  onchange={(event) =>
                    updateBuffGroup(group.id, (curr) => ({
                      ...curr,
                      monitorAll: (event.currentTarget as HTMLInputElement).checked,
                    }))}
                />
                监控全部 Buff
              </label>
            </div>

            <div class="space-y-2">
              <input
                class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="搜索并添加到此分组"
                value={getGroupSearchKeyword(group.id)}
                oninput={(event) =>
                  setGroupSearchKeyword(group.id, (event.currentTarget as HTMLInputElement).value)}
              />
              {#if getGroupSearchResults(group).length > 0}
                <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                  {#each getGroupSearchResults(group).slice(0, 40) as item (item.baseId)}
                    {@const iconBuff = availableBuffMap.get(item.baseId)}
                    <button
                      type="button"
                      class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                      title={item.name}
                      onclick={() => toggleBuffInGroup(group.id, item.baseId)}
                    >
                      {#if iconBuff}
                        <img src={`/images/buff/${iconBuff.spriteFile}`} alt={iconBuff.name} class="w-full h-10 object-contain" />
                      {/if}
                    </button>
                  {/each}
                </div>
              {/if}

              <div class="space-y-1">
                <div class="text-xs text-muted-foreground">分组内优先级</div>
                <input
                  class="w-full sm:w-72 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="搜索并添加到优先级列表"
                  value={getGroupPrioritySearchKeyword(group.id)}
                  oninput={(event) =>
                    setGroupPrioritySearchKeyword(group.id, (event.currentTarget as HTMLInputElement).value)}
                />
                {#if getGroupPrioritySearchResults(group).length > 0}
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                    {#each getGroupPrioritySearchResults(group).slice(0, 40) as item (item.baseId)}
                      {@const iconBuff = availableBuffMap.get(item.baseId)}
                      <button
                        type="button"
                        class="rounded border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-1"
                        title={item.name}
                        onclick={() => togglePriorityInGroup(group.id, item.baseId)}
                      >
                        {#if iconBuff}
                          <img src={`/images/buff/${iconBuff.spriteFile}`} alt={iconBuff.name} class="w-full h-10 object-contain" />
                        {/if}
                      </button>
                    {/each}
                  </div>
                {/if}
                {#each getGroupPriorityIds(group) as buffId, idx (buffId)}
                  {@const iconBuff = availableBuffMap.get(buffId)}
                  {@const nameInfo = buffNames.get(buffId)}
                  <div class="flex items-center gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1">
                    <span class="w-6 text-center text-xs text-muted-foreground">{idx + 1}</span>
                    <span class="flex-1 text-xs text-foreground truncate">
                      {nameInfo?.name ?? iconBuff?.name ?? `#${buffId}`}
                    </span>
                    <button type="button" class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40" onclick={() => togglePriorityInGroup(group.id, buffId)}>移除</button>
                    <button type="button" class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50" onclick={() => moveGroupPriority(group.id, buffId, "up")} disabled={idx === 0}>上移</button>
                    <button type="button" class="text-xs px-2 py-0.5 rounded border border-border/60 hover:bg-muted/40 disabled:opacity-50" onclick={() => moveGroupPriority(group.id, buffId, "down")} disabled={idx === getGroupPriorityIds(group).length - 1}>下移</button>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
        <div class="text-xs text-muted-foreground">分组布局预览</div>
        <div class="space-y-2">
          {#each buffGroups as group (group.id)}
            <div class="rounded border border-border/50 p-2">
              <div class="text-xs mb-2 text-foreground">{group.name}{group.monitorAll ? "（全部）" : ""}</div>
              <div
                class="grid"
                style:grid-template-columns={`repeat(${Math.max(1, group.columns)}, minmax(0, ${group.iconSize / 2}px))`}
                style:gap={`${Math.max(0, group.gap / 2)}px`}
              >
                {#if group.monitorAll}
                  {#each availableBuffs.slice(0, Math.max(6, group.columns * group.rows)) as buff (buff.baseId)}
                    <img src={`/images/buff/${buff.spriteFile}`} alt={buff.name} class="w-full aspect-square object-contain rounded border border-border/30 bg-muted/20" />
                  {/each}
                {:else}
                  {#each group.buffIds.slice(0, Math.max(6, group.columns * group.rows)) as buffId (buffId)}
                    {@const buff = availableBuffMap.get(buffId)}
                    {#if buff}
                      <img src={`/images/buff/${buff.spriteFile}`} alt={buff.name} class="w-full aspect-square object-contain rounded border border-border/30 bg-muted/20" />
                    {:else}
                      <div class="w-full aspect-square rounded border border-border/30 bg-muted/20"></div>
                    {/if}
                  {/each}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
