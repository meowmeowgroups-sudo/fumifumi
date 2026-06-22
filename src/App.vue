<template>
  <div v-if="!authReady" class="fixed inset-0 z-[1000] bg-[#f5f5f3] flex items-center justify-center">
    <p class="text-sm font-bold text-slate-500">載入中…</p>
  </div>
  <AuthScreen v-else-if="!authUser" />
  <template v-else>
  <Transition name="fade-splash">
    <div v-if="showSplash"
         class="fixed inset-0 z-[999] bg-[#f5f5f3] flex flex-col items-center justify-center select-none px-6"
         @click="onSplashTap">
      <div class="w-full max-w-md aspect-square flex items-center justify-center relative rounded-3xl overflow-hidden bg-white/60 shadow-inner border border-white/80">
        <video v-show="!splashVideoFailed"
               ref="splashVideo"
               :src="splashVideoSrc"
               autoplay
               playsinline
               muted
               loop
               webkit-playsinline
               preload="auto"
               @error="onSplashVideoError"
               @timeupdate="onSplashTimeUpdate"
               class="w-full h-full object-contain pointer-events-none">
        </video>
        <div v-if="splashVideoFailed" class="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span class="text-6xl leading-none">🐱</span>
          <p class="text-[10px] font-bold text-slate-400">貓貓照護紀錄</p>
        </div>
      </div>
      <button type="button"
              @click.stop="enterApp"
              class="mt-8 px-8 py-3 rounded-full bg-slate-900 text-white text-xs font-black shadow-lg active:scale-95 transition-transform">
        進入主頁
      </button>
      <p class="mt-3 text-[10px] font-bold text-slate-400/80 tracking-wide text-center">
        點擊畫面或動畫播放完畢後自動進入
      </p>
    </div>
  </Transition>

  <div class="min-h-screen font-sans antialiased p-4 pb-4 md:pb-8 md:px-6 lg:px-8 transition-colors duration-500"
       :style="themePageStyle">

    <div v-if="!showSplash && (ptrPull > 0 || ptrRefreshing || ptrShowSuccess)"
         class="ptr-indicator md:hidden"
         :class="{ 'ptr-indicator--busy': ptrRefreshing || ptrShowSuccess }"
         :style="{ opacity: ptrIndicatorOpacity }">
      <div class="ptr-indicator__pill"
           :class="{
             'ptr-indicator__pill--ready': ptrReady && !ptrShowSuccess,
             'ptr-indicator__pill--loading': ptrRefreshing,
             'ptr-indicator__pill--success': ptrShowSuccess,
           }">
        <span v-if="!ptrShowSuccess" class="ptr-indicator__spinner" :class="{ 'ptr-indicator__spinner--spin': ptrRefreshing || ptrReady }"></span>
        <span v-else class="ptr-indicator__check">✓</span>
        <span class="ptr-indicator__text">{{ ptrHintText }}</span>
      </div>
    </div>

    <div v-if="!showSplash"
         class="ptr-scroll md:contents min-w-0 max-w-full overflow-x-clip"
         :class="{ 'ptr-scroll--refreshing': ptrRefreshing }"
         :style="ptrContentStyle"
         @touchstart.passive="onPullRefreshStart"
         @touchmove="onPullRefreshMove"
         @touchend="onPullRefreshEnd"
         @touchcancel="onPullRefreshEnd">
    
    <header class="max-w-md md:max-w-6xl mx-auto mb-4 rounded-2xl shadow-md overflow-hidden ring-1 ring-white/20 transition-[box-shadow] duration-500">
      <div class="px-3 pt-3 pb-2.5 transition-[background] duration-500 relative overflow-hidden space-y-2.5"
           :style="{ background: currentTheme.gradient }">
        <div class="absolute -right-10 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute -right-8 -bottom-10 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="relative z-10 w-full min-w-0 px-0.5 py-0.5">
          <p class="app-header-brand">{{ APP_BRAND_NAME }}</p>
          <p class="app-header-tagline">{{ APP_BRAND_TAGLINE }}</p>
        </div>

        <div class="relative z-10 flex items-center gap-2 border-t border-white/20 pt-2.5">
          <div class="flex-1 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none min-w-0">
            <button v-for="(cat, index) in cats" :key="cat.id || ('cat-' + index)"
                    type="button"
                    @click="switchCat(index)"
                    :class="['px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all duration-300 whitespace-nowrap shrink-0 max-w-[6rem] truncate',
                             currentCatIndex === index
                               ? 'bg-white text-slate-900 shadow-md'
                               : 'bg-white/20 text-white hover:bg-white/30 border border-white/25']">
              {{ cat.name }}
            </button>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button type="button" @click="openAddCatModal"
                    class="text-[10px] font-black px-2.5 py-2 rounded-xl whitespace-nowrap transition-colors bg-white text-slate-800 shadow-sm hover:bg-white/95">
              ＋新增貓貓
            </button>
          </div>
        </div>
      </div>
    </header>

    <nav v-if="currentCat"
         class="hidden md:flex max-w-6xl mx-auto mb-5 rounded-2xl bg-slate-900/90 backdrop-blur-lg px-1.5 py-2 shadow-lg gap-0.5">
      <button v-for="tab in APP_NAV_TABS" :key="tab.id"
              type="button"
              @click="currentTab = tab.id"
              :title="tab.title"
              :class="[
                'flex-1 flex items-center justify-center gap-1.5 p-2 min-w-0',
                navTabActiveShellClass(tab)
              ]">
        <span class="leading-none shrink-0" :class="tab.isCenter ? 'text-xl' : 'text-lg'">
          <svg v-if="tab.iconType === 'clipboard'" :class="tab.isCenter ? 'w-5 h-5' : 'w-[18px] h-[18px]'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
          </svg>
          <span v-else>{{ tab.icon }}</span>
        </span>
        <span class="text-[10px] font-bold whitespace-nowrap truncate">{{ tab.label }}</span>
      </button>
    </nav>

    <main v-if="!currentCat" class="max-w-md md:max-w-6xl mx-auto text-center py-16 px-4 max-md:pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <p class="text-sm font-bold text-slate-500">尚未有貓貓紀錄</p>
      <p class="text-[11px] text-slate-400 mt-1">請先新增一隻貓貓開始記錄</p>
      <button type="button" @click="openAddCatModal"
              class="mt-5 px-6 py-3 rounded-xl text-sm font-black text-white theme-btn-primary shadow-md">
        ＋ 新增貓貓
      </button>
    </main>

    <main v-else class="max-w-md md:max-w-6xl mx-auto space-y-6 max-md:pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-0 min-w-0 overflow-x-clip">

      <div v-if="currentTab === 'home'" :key="homeContentKey" class="space-y-4 home-cat-panel">

        <section class="theme-section home-hero rounded-[28px] p-5 shadow-lg shadow-slate-200/40 text-left ring-1 ring-slate-100/80">
          <div class="flex flex-col gap-5">
            <button type="button" @click="openEditProfile"
                    class="text-[10px] font-bold theme-chip-btn px-2.5 py-1 rounded-full self-start inline-block transition-colors">
              ✏️ 更改設定與貓貓檔案
            </button>
            <div class="flex items-center gap-4">
              <div v-if="currentCat.photo" class="shrink-0 w-[4.5rem] h-[4.5rem] rounded-2xl overflow-hidden border-2 theme-accent-border shadow-md ring-2 ring-white">
                <img :src="currentCat.photo" :alt="currentCat.name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="shrink-0 w-[4.5rem] h-[4.5rem] rounded-2xl theme-accent-bg border theme-accent-border flex items-center justify-center text-3xl shadow-inner">🐈</div>
              <div class="min-w-0 flex-1">
                <h2 class="text-2xl font-black text-slate-900 tracking-tight truncate leading-tight">{{ currentCat.name }}</h2>
                <p class="text-[11px] font-bold text-slate-500 mt-2 flex flex-wrap items-center gap-1.5">
                  <span>{{ getAgeString(currentCat.birthday) }}</span>
                  <span class="text-slate-300">·</span>
                  <span class="theme-accent-bg theme-accent-text px-2 py-0.5 rounded-lg text-[10px]">{{ currentCat.neutered ? '已絕育' : '未絕育' }}</span>
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-4xl font-black text-slate-900 leading-none tabular-nums tracking-tight">{{ currentCat.weight }}</p>
                <p class="text-[11px] font-bold text-slate-500 mt-0.5">kg</p>
              </div>
            </div>
            <p v-if="getCatDisplayNote(currentCat)"
               class="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
              <span class="font-bold text-slate-500">備註：</span>{{ getCatDisplayNote(currentCat) }}
            </p>
          </div>
        </section>

        <section class="theme-section rounded-[28px] shadow-md shadow-slate-200/45 ring-1 ring-slate-100/80 text-left px-4 py-3 bg-gradient-to-br from-slate-50/95 via-white to-[color:var(--theme-accent-bg)]/25">
          <p class="text-[10px] font-black leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
            <span class="text-slate-500 shrink-0">今日記錄</span>
            <span class="text-slate-300 shrink-0" aria-hidden="true">·</span>
            <span class="text-slate-800 tabular-nums">{{ homeTodayDateLine.main }}</span>
            <span class="text-slate-300 shrink-0" aria-hidden="true">·</span>
            <span class="text-slate-500 shrink-0">{{ homeTodayDateLine.weekday }}</span>
          </p>
          <div class="home-today-date-underline my-2" aria-hidden="true"></div>
          <p class="text-[10px] font-black text-slate-500 mb-1.5">狀態</p>
          <div v-if="homeStatusBadges.length" class="flex flex-wrap gap-1.5">
            <button v-for="badge in homeStatusBadges" :key="badge.id"
                    type="button"
                    @click="onHomeStatusBadgeClick(badge)"
                    :class="['home-status-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black transition-all active:scale-[0.97]', homeStatusBadgeClass(badge.tone)]">
              <span class="text-sm leading-none">{{ badge.icon }}</span>
              <span class="truncate max-w-[9rem] text-left">{{ badge.label }}</span>
            </button>
          </div>
          <p v-else class="text-[10px] font-bold text-slate-400 py-1">暫無狀態資料</p>
        </section>

        <div class="grid grid-cols-2 gap-2.5">
          <button type="button" @click="goToDietTab"
                  class="theme-section rounded-2xl p-3.5 shadow-sm text-left min-w-0 active:scale-[0.98] transition-transform">
            <div class="flex justify-between items-baseline gap-1 mb-2">
              <span class="text-[10px] font-black text-amber-800">🍽️ 食量</span>
              <span class="text-sm font-black text-amber-950 tabular-nums">{{ todayFeedingStats.grams }}<span class="text-[10px] font-bold opacity-70">g</span></span>
            </div>
            <div class="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ease-out"
                   :class="homeProgressBarClass('feeding')"
                   :style="{ width: (todayFeedingProgress.hasTarget ? Math.max(todayFeedingProgress.percent > 0 ? 4 : 0, todayFeedingProgress.percent) : (todayFeedingStats.count > 0 ? 100 : 0)) + '%' }"></div>
            </div>
          </button>

          <button type="button" @click="addWater()"
                  class="theme-section rounded-2xl p-3.5 shadow-sm text-left min-w-0 active:scale-[0.98] transition-transform"
                  :class="todayHydrationReport.status === 'low' ? 'ring-1 ring-rose-200' : ''">
            <div class="flex justify-between items-baseline gap-1 mb-2">
              <span class="text-[10px] font-black"
                    :class="todayHydrationReport.status === 'low' ? 'text-rose-600' : 'text-sky-700'">💧 水分</span>
              <span class="text-sm font-black tabular-nums"
                    :class="todayHydrationReport.status === 'low' ? 'text-rose-900' : 'text-sky-900'">{{ todayHydrationReport.totalHydration }}<span class="text-[10px] font-bold opacity-70">ml</span></span>
            </div>
            <div class="h-2 rounded-full overflow-hidden"
                 :class="todayHydrationReport.status === 'low' ? 'bg-rose-100' : 'bg-sky-100'">
              <div v-if="currentCat.weight > 0"
                   class="h-full rounded-full transition-all duration-500 ease-out"
                   :class="homeProgressBarClass('hydration', todayHydrationReport.status)"
                   :style="{ width: Math.max(todayHydrationReport.progressPercent > 0 ? 4 : 0, Math.min(100, todayHydrationReport.progressPercent)) + '%' }"></div>
            </div>
          </button>
        </div>

        <button type="button" @click="goToCareChecklist"
                class="theme-section rounded-2xl p-3.5 shadow-sm text-left w-full active:scale-[0.98] transition-transform ring-1 ring-slate-100/80">
          <span class="text-[10px] font-black theme-accent-text">📋 照護清單</span>
        </button>

        <div v-if="currentCat.weight > 0 && todayHydrationReport.status === 'low'"
             class="theme-section rounded-2xl p-3 border-2 border-rose-300 bg-rose-50 text-left attention-pulse">
          <p class="text-[10px] font-black text-rose-800 flex items-center gap-1">
            <span>⚠️</span> 水分不足 · 尚差 {{ todayHydrationReport.deficit }} ml
          </p>
        </div>

        <section class="theme-section rounded-[28px] p-4 shadow-md shadow-slate-200/40 space-y-3 text-left ring-1 ring-slate-100/80">
          <div class="flex justify-between items-center border-b theme-divider pb-2.5 gap-2">
            <h3 class="font-black text-slate-900 text-sm">🔔 {{ healthMemoTitle }}</h3>
            <button type="button" @click="openEditRemindersModal"
                    class="text-[10px] font-bold theme-chip-btn px-2.5 py-1.5 rounded-xl transition-colors shrink-0">
              ✏️ 新增項目及設定日期
            </button>
          </div>

          <div v-if="!homeMilestoneItems.length"
               class="text-center py-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80">
            <p class="text-xs text-slate-500 font-bold">尚未新增行程</p>
            <p class="text-[10px] text-slate-400 mt-1 font-bold">可還原預設備忘錄或自行新增項目</p>
            <button type="button" @click="restoreDefaultReminders"
                    class="mt-3 text-[10px] font-black theme-chip-btn px-4 py-2 rounded-xl shadow-sm">
              還原預設備忘錄
            </button>
          </div>

          <div v-else class="space-y-2">
            <article v-for="item in homeMilestoneItems" :key="item.rowKey"
                     class="home-milestone-row flex items-stretch gap-2 p-3 rounded-2xl bg-white border theme-accent-border shadow-sm hover:shadow-md transition-all duration-200"
                     :class="[
                       item.event.isBath ? 'ring-1 ring-rose-100/90' : '',
                       isReminderPlaceholder(item.event) ? 'border-dashed bg-slate-50/60' : ''
                     ]">
              <div class="w-1 rounded-full shrink-0 self-stretch"
                   :class="item.event.isBath ? 'bg-rose-400' : item.urgency === 'overdue' ? 'bg-rose-400' : item.urgency === 'soon' ? 'bg-amber-400' : item.urgency === 'unset' ? 'bg-slate-300' : 'bg-[color:var(--theme-primary)]'"></div>
              <div class="flex items-center gap-2.5 min-w-0 flex-1 py-0.5">
                <span class="w-10 h-10 rounded-xl theme-accent-bg flex items-center justify-center text-lg shrink-0 shadow-inner">{{ item.meta.icon || item.event.icon }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span class="text-[8px] font-black uppercase tracking-wide theme-accent-text theme-accent-bg px-1.5 py-0.5 rounded-md">
                      {{ item.event.category || item.meta.category }}
                    </span>
                    <button v-if="item.event.isBath" type="button" @click.stop="showBookingModal = true"
                            class="text-[9px] font-black bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 px-2 py-0.5 rounded-md shadow-sm active:scale-95 transition-colors">
                      💬 立即預約
                    </button>
                  </div>
                  <p class="text-xs font-black truncate"
                     :class="isReminderPlaceholder(item.event) ? 'text-slate-400' : 'text-slate-800'">
                    {{ getMilestoneDisplayTitle(item.event, item.meta) }}
                  </p>
                  <p class="text-[10px] text-slate-400 mt-0.5 font-bold">下次 · {{ formatMilestoneNextDate(item.event.nextDate) }}</p>
                </div>
              </div>
              <div class="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-1">
                <span :class="['text-[10px] font-extrabold px-2 py-1 rounded-xl whitespace-nowrap', homeMilestoneUrgencyClass(item.urgency)]">
                  {{ getCountdownText(item.event.nextDate) }}
                </span>
                <button type="button" @click="renewEvent(item.event)"
                        class="w-8 h-8 bg-white border theme-accent-border rounded-xl flex items-center justify-center text-xs font-black theme-accent-text hover:theme-accent-bg shadow-sm active:scale-95"
                        title="完成並排程下次">
                  ✓
                </button>
              </div>
            </article>
          </div>

        </section>
      </div>

      <div v-else-if="currentTab === 'care'" class="animate-fade-in space-y-4">
        <section class="rounded-3xl p-4 md:p-5 text-white shadow-lg text-left ring-1 ring-white/20"
                 :style="{ background: currentTheme.gradient }">
          <h2 class="text-lg md:text-xl font-black">📋 {{ currentCat.name }} · 照護清單</h2>
          <p class="text-[10px] md:text-[11px] opacity-90 mt-1 leading-relaxed">依照週期整理清潔與照顧項目，完成後打勾記錄日期</p>
          <p class="text-[8px] font-bold mt-1.5 opacity-80 leading-relaxed">
            ☁️ 雲端打勾 {{ careSyncStatus.localCompletions }} 項
            <span v-if="careSyncStatus.lastError" class="text-rose-200"> · 同步錯誤</span>
            <button type="button" @click="pullCareFromCloud" class="underline ml-1 opacity-90">拉取最新</button>
          </p>
        </section>

        <section class="theme-section rounded-[28px] p-4 shadow-md shadow-slate-200/40 space-y-3 text-left ring-1 ring-slate-100/80">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-[9px] font-bold text-slate-500 leading-relaxed">📋 依照清單檢視表整理，完成後點擊打勾並記錄日期。系統會根據週期自動提醒。不同家庭請依貓咪狀況彈性調整。</p>
            </div>
            <div class="flex flex-wrap gap-1 shrink-0">
              <button type="button" @click="exportCareChecklistPdf" :disabled="carePdfExporting"
                      class="text-[9px] font-black theme-btn-outline px-2 py-1 rounded-lg">
                {{ carePdfExporting ? '…' : '📄 PDF' }}
              </button>
              <button type="button" @click="openCareMaintenanceCustomModal"
                      class="text-[9px] font-black theme-btn-outline px-2 py-1 rounded-lg">＋ 自訂項目</button>
              <button type="button" @click="resetCareMaintenanceChecks"
                      class="text-[9px] font-black theme-btn-outline px-2 py-1 rounded-lg">重置打勾</button>
              <button v-if="careMaintenanceRecoverableCount > 0"
                      type="button" @click="restoreCareMaintenanceDeletedItems"
                      class="text-[9px] font-black px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                ↩ 復原已刪除 ({{ careMaintenanceRecoverableCount }})
              </button>
              <button type="button" @click="toggleCareMaintenanceEditMode"
                      :class="[
                        'text-[9px] font-black px-2 py-1 rounded-lg border transition-all',
                        careMaintenanceEditMode
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'theme-btn-outline'
                      ]">
                {{ careMaintenanceEditMode ? '完成編輯' : '編輯項目' }}
              </button>
            </div>
          </div>

          <div class="flex gap-1 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
            <button v-for="tab in CARE_MAINTENANCE_FREQ_TABS" :key="tab.id" type="button"
                    @click="setCareMaintenanceActiveFrequency(tab.id)"
                    :class="[
                      'inline-flex items-center shrink-0 px-2.5 py-1.5 rounded-full text-[9px] transition-all whitespace-nowrap',
                      careMaintenanceOverdueFreqSet.has(tab.id)
                        ? getCareMaintenanceActiveFrequency() === tab.id
                          ? 'bg-rose-400 text-white font-bold'
                          : 'border-2 border-rose-300 text-slate-700 bg-white font-bold attention-pulse'
                        : [
                            'font-black',
                            getCareMaintenanceActiveFrequency() === tab.id
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          ]
                    ]">
              {{ tab.label }}
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold text-slate-500">
            <span>{{ activeCareMaintenanceFreqLabel }}需處理項目 · 共 {{ activeCareMaintenanceItems.length }} 項</span>
            <span class="flex items-center gap-2">
              <span class="text-emerald-600">✓ 已完成 {{ activeCareMaintenanceDoneCount }}</span>
              <span class="text-amber-600">○ 待完成 {{ activeCareMaintenancePendingCount }}</span>
            </span>
          </div>

          <p v-if="activeCareMaintenanceFreqHint"
             class="text-[9px] font-bold text-slate-500 leading-relaxed bg-slate-50/90 border border-slate-100 rounded-xl px-3 py-2.5">
            {{ activeCareMaintenanceFreqHint }}
          </p>

          <div v-if="!activeCareMaintenanceItems.length"
               class="text-[10px] font-bold text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
            此週期暫無項目
          </div>

          <template v-else>
            <div v-if="activeCareMaintenanceCareItems.length" class="space-y-2">
              <div v-for="item in activeCareMaintenanceCareItems" :key="item.id"
                   class="care-maintenance-card rounded-xl border p-4 shadow-sm transition-all"
                   :class="careMaintenanceCardClass(item)"
                   @click="onCareMaintenanceCardClick(item)">
                <div class="flex items-start gap-3 w-full">
                  <div class="shrink-0 pt-0.5">
                    <input type="checkbox"
                           :checked="isCareMaintenanceItemDone(item)"
                           :disabled="careMaintenanceEditMode"
                           @click.stop="onCareMaintenanceCardClick(item)"
                           class="rounded theme-accent-border theme-accent-text w-4 h-4"
                           :class="careMaintenanceEditMode ? 'opacity-40 cursor-not-allowed' : ''" />
                  </div>
                  <div class="flex-1 flex flex-col gap-1 min-w-0">
                    <div class="flex items-center justify-between w-full gap-2">
                      <div class="min-w-0 flex items-center gap-1.5 flex-wrap flex-1">
                        <span class="text-[11px] font-black text-slate-800 leading-tight">{{ item.title }}</span>
                        <span class="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0"
                              :class="careMaintenanceEditMode ? 'cursor-pointer hover:bg-amber-50 hover:text-amber-700 border border-transparent hover:border-amber-200 transition-colors' : ''"
                              @click.stop="careMaintenanceEditMode ? openCareMaintenanceDateModal(item) : undefined">
                          {{ formatCareMaintenanceStatus(item) }}
                        </span>
                      </div>
                      <button v-if="item.isBath && !careMaintenanceEditMode"
                              type="button"
                              @click.stop="showBookingModal = true"
                              class="shrink-0 text-[9px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-sm active:scale-95 transition-colors">
                        💬 立即預約
                      </button>
                      <div v-else-if="careMaintenanceEditMode"
                           class="flex items-center space-x-3 shrink-0 pl-4">
                        <button type="button"
                                @click.stop="openCareMaintenanceEditModal(item)"
                                class="p-0.5 text-slate-400 hover:text-slate-600 text-sm leading-none bg-transparent border-0 shadow-none transition-colors active:opacity-70"
                                title="修改項目">✏️</button>
                        <button type="button"
                                @click.stop.prevent="openCareMaintenanceDeleteConfirm(item)"
                                class="p-0.5 text-red-400 hover:text-red-600 text-base font-black leading-none bg-transparent border-0 shadow-none transition-colors active:opacity-70"
                                title="刪除項目">×</button>
                      </div>
                    </div>
                    <p class="text-[9px] font-bold text-slate-500 leading-relaxed">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="activeCareMaintenanceReviewItems.length" class="space-y-2">
              <p class="text-[9px] font-black text-slate-500">🔍 {{ activeCareMaintenanceFreqLabel }}需檢查項目</p>
              <div v-for="item in activeCareMaintenanceReviewItems" :key="item.id"
                   class="care-maintenance-card rounded-xl border p-4 shadow-sm transition-all"
                   :class="careMaintenanceCardClass(item)"
                   @click="onCareMaintenanceCardClick(item)">
                <div class="flex items-start gap-3 w-full">
                  <div class="shrink-0 pt-0.5">
                    <input type="checkbox"
                           :checked="isCareMaintenanceItemDone(item)"
                           :disabled="careMaintenanceEditMode"
                           @click.stop="onCareMaintenanceCardClick(item)"
                           class="rounded theme-accent-border theme-accent-text w-4 h-4"
                           :class="careMaintenanceEditMode ? 'opacity-40 cursor-not-allowed' : ''" />
                  </div>
                  <div class="flex-1 flex flex-col gap-1 min-w-0">
                    <div class="flex items-center justify-between w-full gap-2">
                      <div class="min-w-0 flex items-center gap-1.5 flex-wrap flex-1">
                        <span class="text-[11px] font-black text-slate-800 leading-tight">{{ item.title }}</span>
                        <span class="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0"
                              :class="careMaintenanceEditMode ? 'cursor-pointer hover:bg-amber-50 hover:text-amber-700 border border-transparent hover:border-amber-200 transition-colors' : ''"
                              @click.stop="careMaintenanceEditMode ? openCareMaintenanceDateModal(item) : undefined">
                          {{ formatCareMaintenanceStatus(item) }}
                        </span>
                      </div>
                      <div v-if="careMaintenanceEditMode"
                           class="flex items-center space-x-3 shrink-0 pl-4">
                        <button type="button"
                                @click.stop="openCareMaintenanceEditModal(item)"
                                class="p-0.5 text-slate-400 hover:text-slate-600 text-sm leading-none bg-transparent border-0 shadow-none transition-colors active:opacity-70"
                                title="修改項目">✏️</button>
                        <button type="button"
                                @click.stop.prevent="openCareMaintenanceDeleteConfirm(item)"
                                class="p-0.5 text-red-400 hover:text-red-600 text-base font-black leading-none bg-transparent border-0 shadow-none transition-colors active:opacity-70"
                                title="刪除項目">×</button>
                      </div>
                    </div>
                    <p class="text-[9px] font-bold text-slate-500 leading-relaxed">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-if="careMaintenanceCustomModalOpen"
               class="rounded-xl border theme-accent-border bg-slate-50 p-3 space-y-2">
            <p class="text-[10px] font-black theme-accent-text">新增自訂項目（{{ activeCareMaintenanceFreqLabel }}）</p>
            <input v-model="careMaintenanceCustomDraft.title" type="text" placeholder="項目名稱"
                   class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold" />
            <textarea v-model="careMaintenanceCustomDraft.description" rows="2" placeholder="描述（選填）"
                      class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold resize-none" />
            <div class="flex gap-2">
              <button type="button" @click="careMaintenanceCustomModalOpen = false"
                      class="flex-1 py-2 rounded-xl text-[10px] font-black theme-btn-outline">取消</button>
              <button type="button" @click="addCareMaintenanceCustomItem"
                      class="flex-1 py-2 rounded-xl text-[10px] font-black text-white theme-btn-primary">新增</button>
            </div>
          </div>
        </section>
      </div>

      <div v-else-if="currentTab === 'diet'" class="space-y-6 animate-fade-in min-w-0 overflow-hidden">

        <section class="theme-section rounded-3xl p-5 shadow-sm space-y-5 text-left min-w-0 overflow-hidden">
          <div class="border-b theme-divider pb-3 flex justify-between items-center gap-2">
            <h3 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm whitespace-nowrap">
              🍽️ 主食與飲水登記
            </h3>
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-xl shadow-inner">
              <span class="text-[10px]">📅</span>
              <input v-model="selectedDate" 
                     type="date" 
                     class="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0 cursor-pointer w-[102px]" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" @click="addMealEntry"
                    class="flex-1 min-w-[8rem] py-2.5 rounded-xl text-xs font-black text-white theme-btn-primary transition-colors shadow-sm">
              ＋ 新增餵食紀錄
            </button>
            <button v-if="activeMealId" type="button" @click="deleteActiveMealEntry"
                    class="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border theme-accent-border transition-colors shrink-0">
              刪除此筆
            </button>
          </div>

          <template v-if="activeMealSlot">
          <div class="rounded-2xl theme-panel p-4 space-y-4 shadow-sm min-w-0 overflow-hidden">
          <div class="space-y-2 pb-1 border-b theme-divider min-w-0">
            <div class="datetime-input-group">
              <div class="datetime-input-group__cell">
                <label class="datetime-input-group__label font-black theme-accent-text">記錄日期</label>
                <input v-model="activeMealDatePart"
                       type="date"
                       :min="selectedDate"
                       :max="selectedDate"
                       class="datetime-field bg-white border theme-accent-border font-bold text-slate-800" />
              </div>
              <div class="datetime-input-group__cell">
                <label class="datetime-input-group__label font-black theme-accent-text">記錄時間</label>
                <input v-model="activeMealTimePart"
                       type="time"
                       class="datetime-field bg-white border theme-accent-border font-bold text-slate-800" />
              </div>
            </div>
            <button type="button" @click="activeMealSlot.at = getDatetimeForSelectedDate()"
                    class="text-[10px] font-bold theme-chip-btn px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0">
              設為現在
            </button>
          </div>
          <p class="text-[9px] font-bold theme-accent-text/80 -mt-2">
            預設為裝置目前時間，可手動修改（僅限所選日期當日）
          </p>

          <div class="space-y-1">
              <label class="text-xs font-black theme-accent-text block">食物/項目（選填）</label>
              <div class="flex flex-nowrap items-center justify-between gap-0.5 pb-0.5 min-w-0">
              <button v-for="opt in FOOD_TYPE_OPTIONS"
                      :key="opt.value"
                      type="button"
                      @click="activeFoodType = opt.value"
                      :class="[
                        'flex-1 min-w-0 px-0.5 py-0.5 rounded-full border text-[9px] font-black transition-all whitespace-nowrap leading-none text-center',
                        activeFoodType === opt.value
                          ? 'theme-btn-primary border-transparent shadow-sm'
                          : 'bg-white text-slate-600 theme-accent-border hover:theme-accent-border hover:theme-accent-bg'
                      ]">
                <span v-if="opt.chipLabel">{{ opt.chipLabel }}</span>
                <span v-else>{{ opt.label }}</span>
              </button>
              </div>
          </div>

          <div v-if="isDryFoodType(activeFoodType)" class="space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-black theme-accent-text">{{ activeFoodType }}紀錄</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <span v-if="mealSaveMessage" class="text-[9px] font-bold text-emerald-600">{{ mealSaveMessage }}</span>
                <button type="button" @click="saveActiveMealEntry" :class="mealFoodSaveBtnClass">
                  儲存
                </button>
              </div>
            </div>
            <div class="grid grid-cols-[30fr_30fr_25fr_15fr_25fr] gap-0.5 items-start pb-2 min-w-0">
              <div class="min-w-0 flex flex-col gap-0.5">
                <select v-if="!manualField.dryBrand" :value="activeMealSlot.dryBrand"
                        @change="activeMealSlot.dryBrand = $event.target.value"
                        :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold h-[32px] truncate', mealFieldTextClass(activeMealSlot.dryBrand)]">
                  <option value="">牌子</option>
                  <option v-for="b in historicalDryBrands" :key="b" :value="b">{{ b }}</option>
                </select>
                <input v-else v-model="activeMealSlot.dryBrand" type="text" placeholder="牌子"
                       :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold text-center h-[32px]', mealFieldTextClass(activeMealSlot.dryBrand)]" />
                <button type="button" @click="toggleManualField('dryBrand')"
                        class="w-full text-[8px] font-bold theme-accent-text theme-accent-bg px-1 py-0.5 rounded-md whitespace-nowrap">
                  {{ manualField.dryBrand ? '▼ 牌子清單' : '＋新牌子' }}
                </button>
              </div>
              <div class="min-w-0 flex flex-col gap-0.5">
                <select v-if="!manualField.dryFlavor" :value="activeMealSlot.dryFlavor"
                        @change="activeMealSlot.dryFlavor = $event.target.value"
                        :disabled="!activeMealSlot.dryBrand?.trim()"
                        :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold h-[32px] truncate disabled:opacity-50', mealFieldTextClass(activeMealSlot.dryFlavor)]">
                  <option value="">口味</option>
                  <option v-for="f in dryFlavorsForActiveBrand" :key="f" :value="f">{{ f }}</option>
                </select>
                <input v-else v-model="activeMealSlot.dryFlavor" type="text" placeholder="口味"
                       :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold h-[32px]', mealFieldTextClass(activeMealSlot.dryFlavor)]" />
                <button type="button" @click="toggleManualField('dryFlavor')"
                        class="w-full text-[8px] font-bold theme-accent-text theme-accent-bg px-1 py-0.5 rounded-md whitespace-nowrap">
                  {{ manualField.dryFlavor ? '▼ 口味清單' : '＋新口味' }}
                </button>
              </div>
              <div class="min-w-0 relative">
                <input :value="dryAmountValue"
                       @input="dryAmountValue = $event.target.value"
                       type="number"
                       min="0"
                       step="0.1"
                       placeholder="份量"
                       :class="['w-full bg-slate-50 border-none rounded-lg px-0.5 py-1.5 text-[10px] font-bold text-center h-[32px]', mealFieldTextClass(dryAmountValue)]" />
                <span v-if="dryAmountUnit === 'oz' && dryAmountValue"
                      class="absolute -bottom-2 left-0 right-0 text-center text-[7px] font-black text-amber-600 leading-none pointer-events-none">
                  {{ parseToGrams(activeMealSlot.dryAmount) }}g
                </span>
              </div>

              <div class="min-w-0">
                <select :value="dryAmountUnit"
                        @change="dryAmountUnit = $event.target.value"
                        class="w-full bg-slate-50 border-none rounded-lg px-1 py-0.5 text-[10px] font-bold text-slate-800 h-[32px] truncate">
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </div>

              <button @click="openPreferencePicker('dry')" type="button"
                      :class="['min-w-0 w-full rounded-lg border font-bold transition-all flex flex-col items-center justify-center shadow-sm min-h-[32px] px-0.5 py-0.5',
                               activeMealSlot.dryLove ? 'theme-accent-bg theme-accent-border theme-accent-text' : 'bg-slate-50 border-slate-200 text-slate-400']">
                <span class="text-pref-display leading-none">{{ getPrefBtnInfo(activeMealSlot.dryLove).icon }}</span>
                <span class="text-pref-display leading-tight truncate w-full text-center mt-0.5">{{ getPrefBtnInfo(activeMealSlot.dryLove).text }}</span>
              </button>
            </div>
            <p class="text-[8px] font-medium text-slate-400 leading-relaxed">
              為咗更精準觀察貓貓嘅飲食健康，建議登記餵食時填齊「牌子、口味、份量」。<br />
              方便隨時掌握貓貓嘅飲食喜好🩷 守護貓貓健康，由記錄開始。感謝各位家長配合😀
            </p>
          </div>

          <div class="space-y-1 pt-1" v-if="isWetFoodType(activeFoodType)">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-black theme-accent-text">{{ activeFoodType }}紀錄</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <span v-if="mealSaveMessage" class="text-[9px] font-bold text-emerald-600">{{ mealSaveMessage }}</span>
                <button type="button" @click="saveActiveMealEntry" :class="mealFoodSaveBtnClass">
                  儲存
                </button>
              </div>
            </div>
            <div class="grid grid-cols-[30fr_30fr_25fr_15fr_25fr] gap-0.5 items-start pb-2 min-w-0">
              <div class="min-w-0 flex flex-col gap-0.5">
                <select v-if="!manualField.wetBrand" :value="activeMealSlot.wetBrand"
                        @change="activeMealSlot.wetBrand = $event.target.value"
                        :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold h-[32px] truncate', mealFieldTextClass(activeMealSlot.wetBrand)]">
                  <option value="">牌子</option>
                  <option v-for="b in historicalWetBrands" :key="b" :value="b">{{ b }}</option>
                </select>
                <input v-else v-model="activeMealSlot.wetBrand" type="text" placeholder="牌子"
                       :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold text-center h-[32px]', mealFieldTextClass(activeMealSlot.wetBrand)]" />
                <button type="button" @click="toggleManualField('wetBrand')"
                        class="w-full text-[8px] font-bold theme-accent-text theme-accent-bg px-1 py-0.5 rounded-md whitespace-nowrap">
                  {{ manualField.wetBrand ? '▼ 牌子清單' : '＋新牌子' }}
                </button>
              </div>
              <div class="min-w-0 flex flex-col gap-0.5">
                <select v-if="!manualField.wetFlavor" :value="activeMealSlot.wetFlavor"
                        @change="activeMealSlot.wetFlavor = $event.target.value"
                        :disabled="!activeMealSlot.wetBrand?.trim()"
                        :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold h-[32px] truncate disabled:opacity-50', mealFieldTextClass(activeMealSlot.wetFlavor)]">
                  <option value="">口味</option>
                  <option v-for="f in wetFlavorsForActiveBrand" :key="f" :value="f">{{ f }}</option>
                </select>
                <input v-else v-model="activeMealSlot.wetFlavor" type="text" placeholder="口味"
                       :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[10px] font-bold h-[32px]', mealFieldTextClass(activeMealSlot.wetFlavor)]" />
                <button type="button" @click="toggleManualField('wetFlavor')"
                        class="w-full text-[8px] font-bold theme-accent-text theme-accent-bg px-1 py-0.5 rounded-md whitespace-nowrap">
                  {{ manualField.wetFlavor ? '▼ 口味清單' : '＋新口味' }}
                </button>
              </div>
              <div class="min-w-0 relative">
                <input :value="wetAmountValue"
                       @input="wetAmountValue = $event.target.value"
                       type="number"
                       min="0"
                       step="0.1"
                       placeholder="份量"
                       :class="['w-full bg-slate-50 border-none rounded-lg px-0.5 py-1.5 text-[10px] font-bold text-center h-[32px]', mealFieldTextClass(wetAmountValue)]" />
                <span v-if="wetAmountUnit === 'oz' && wetAmountValue"
                      class="absolute -bottom-2 left-0 right-0 text-center text-[7px] font-black text-amber-600 leading-none pointer-events-none">
                  {{ parseToGrams(activeMealSlot.wetAmount) }}g
                </span>
              </div>

              <div class="min-w-0">
                <select :value="wetAmountUnit"
                        @change="wetAmountUnit = $event.target.value"
                        class="w-full bg-slate-50 border-none rounded-lg px-1 py-0.5 text-[10px] font-bold text-slate-800 h-[32px] truncate">
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </div>

              <button @click="openPreferencePicker('wet')" type="button"
                      :class="['min-w-0 w-full rounded-lg border font-bold transition-all flex flex-col items-center justify-center shadow-sm min-h-[32px] px-0.5 py-0.5',
                               activeMealSlot.wetLove ? 'theme-accent-bg theme-accent-border theme-accent-text' : 'bg-slate-50 border-slate-200 text-slate-400']">
                <span class="text-pref-display leading-none">{{ getPrefBtnInfo(activeMealSlot.wetLove).icon }}</span>
                <span class="text-pref-display leading-tight truncate w-full text-center mt-0.5">{{ getPrefBtnInfo(activeMealSlot.wetLove).text }}</span>
              </button>
            </div>
            <p class="text-[8px] font-medium text-slate-400 leading-relaxed">
              為咗更精準觀察貓貓嘅飲食健康，建議登記餵食時填齊「牌子、口味、份量」。<br />
              方便隨時掌握貓貓嘅飲食喜好🩷 守護貓貓健康，由記錄開始。感謝各位家長配合😀
            </p>
          </div>

          <div class="space-y-2 pt-1" v-if="activeFoodType === '保健品'">
            <div class="flex items-center justify-between gap-2">
              <div class="text-xs font-black theme-accent-text flex items-center gap-1">
                保健品
                <span class="text-[9px] font-bold theme-accent-text/70">（選填）</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <span v-if="mealSaveMessage" class="text-[9px] font-bold text-emerald-600">{{ mealSaveMessage }}</span>
                <button type="button" @click="saveActiveMealEntry" :class="mealFoodSaveBtnClass">
                  儲存
                </button>
              </div>
            </div>
            <div class="flex flex-nowrap items-center gap-1 min-w-0 overflow-x-auto scrollbar-none pb-0.5">
              <button v-for="opt in SUPPLEMENT_PRESETS" :key="opt" type="button"
                      @click="toggleSupplement(opt)"
                      :class="['shrink-0 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap',
                               isSupplementSelected(opt)
                                 ? 'theme-selected-chip-muted'
                                 : 'bg-white/80 theme-accent-border text-slate-600 hover:bg-white']">
                <span v-if="isSupplementSelected(opt)" class="theme-accent-text mr-0.5">✓</span>{{ opt }}
              </button>
              <button type="button" @click="toggleSupplement('其他')"
                      :class="['shrink-0 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap',
                               isSupplementSelected('其他')
                                 ? 'theme-selected-chip-muted'
                                 : 'bg-white/80 theme-accent-border text-slate-600 hover:bg-white']">
                <span v-if="isSupplementSelected('其他')" class="theme-accent-text mr-0.5">✓</span>其他:
              </button>
              <input v-model="activeMealSlot.supplementOther"
                     type="text"
                     placeholder="名稱"
                     @focus="ensureSupplementOtherSelected"
                     :class="['shrink-0 w-[5.5rem] min-w-[4.5rem] bg-white/90 border theme-accent-border rounded-lg px-2 py-1.5 text-[10px] font-bold h-[32px]', mealFieldTextClass(activeMealSlot.supplementOther)]" />
            </div>
          </div>

          <div class="space-y-2 pt-1" v-if="activeFoodType === '零食'">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="text-xs font-black theme-accent-text">零食紀錄</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <span v-if="mealSaveMessage" class="text-[9px] font-bold text-emerald-600">{{ mealSaveMessage }}</span>
                <button type="button" @click="saveActiveMealEntry" :class="mealFoodSaveBtnClass">
                  儲存
                </button>
              </div>
            </div>
            <div class="flex justify-end">
              <button type="button" @click="toggleManualField('treats')"
                      class="text-[10px] font-bold theme-accent-text theme-accent-bg px-2 py-0.5 rounded-lg hover:theme-accent-bg-strong">
                {{ manualField.treats ? '▼ 清單選擇' : '➕ 新種類' }}
              </button>
            </div>
            <div class="flex gap-1.5 items-center">
              <select v-if="!manualField.treats" :value="activeMealSlot.treatsType"
                      @change="onTreatsTypeChange($event.target.value)"
                      :class="['flex-1 bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold h-[37px]', mealFieldTextClass(activeMealSlot.treatsType)]">
                <option value="">零食種類</option>
                <option value="沒有">沒有</option>
                <option v-for="t in historicalTreatsOptions" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-else v-model="activeMealSlot.treatsType" type="text" placeholder="零食種類"
                     :class="['flex-1 bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold', mealFieldTextClass(activeMealSlot.treatsType)]" />
              <button type="button" @click="openPreferencePicker('treats')"
                      :disabled="activeMealSlot.treatsType === '沒有'"
                      :class="['w-[4.5rem] rounded-xl border font-bold transition-all flex flex-col items-center justify-center shadow-sm h-[37px] shrink-0 px-0.5 py-1',
                               activeMealSlot.treatsType === '沒有' ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' :
                               activeMealSlot.treatsLove ? 'theme-accent-bg theme-accent-border theme-accent-text' : 'bg-slate-50 border-slate-200 text-slate-400']">
                <span class="text-pref-display leading-none">{{ getPrefBtnInfo(activeMealSlot.treatsLove).icon }}</span>
                <span class="text-pref-display leading-tight truncate w-full text-center mt-0.5">{{ getPrefBtnInfo(activeMealSlot.treatsLove).text }}</span>
              </button>
            </div>
          </div>
          </div>

          <div class="mt-3 rounded-2xl theme-panel p-4 space-y-2 shadow-sm ">
            <div class="flex justify-between items-center">
              <div class="text-xs font-black theme-accent-text">今日飲水量</div>
              <p class="text-xs font-black text-sky-600">
                {{ dayWaterDraftSourceLabel || '飲水量' }} {{ dayWaterStats.total }} ml · 總水分 {{ dayHydrationReport.totalHydration }} / {{ formatWaterRange(currentCat.weight) }} ml
              </p>
            </div>
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                  <input v-model="dayWaterDraftSources.fountain" type="checkbox" class="rounded border-slate-300 text-sky-600 w-3.5 h-3.5" />
                  飲水機
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                  <input v-model="dayWaterDraftSources.bowl" type="checkbox" class="rounded border-slate-300 text-sky-600 w-3.5 h-3.5" />
                  貓碗
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 shrink-0">
                  <input v-model="dayWaterDraftSources.other" type="checkbox" class="rounded border-slate-300 text-sky-600 w-3.5 h-3.5" />
                  其他
                </label>
                <input v-if="dayWaterDraftSources.other"
                       v-model="dayWaterDraftOther"
                       type="text"
                       placeholder="請填寫"
                       class="flex-1 min-w-[6rem] bg-slate-50 border-none rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800" />
              </div>

              <div class="flex gap-2 items-center min-w-0">
                <span class="shrink-0 text-[11px] font-black text-sky-700 min-w-[4.6rem] max-w-[7.2rem] truncate"
                      :title="dayWaterDraftSourceLabel">
                  {{ dayWaterDraftSourceLabel || '來源' }}
                </span>
                <input v-model.number="dayWaterDraftMl" type="number" min="0" step="1"
                       placeholder="ml"
                       @keyup.enter="saveDayWaterTotal"
                       class="flex-1 min-w-0 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-800" />
                <button type="button" @click="saveDayWaterTotal"
                        class="bg-sky-600 hover:bg-sky-700 text-white px-4 rounded-xl text-xs font-bold transition-colors shrink-0">
                  儲存
                </button>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 font-bold leading-relaxed">
              先選飲水來源，再填寫 ml，按「儲存」更新該日飲水量
            </p>

            <div v-if="currentCat.weight > 0 && dayHydrationReport.status === 'low'"
                 class="rounded-xl p-3 border-2 theme-accent-border bg-rose-50 text-[10px] text-rose-800 font-bold leading-relaxed">
              注意：該日水分不足，總計 {{ dayHydrationReport.totalHydration }} ml，建議至少 {{ dayHydrationReport.range.min }} ml（尚差 {{ dayHydrationReport.deficit }} ml）
            </div>
            <div v-else-if="currentCat.weight > 0 && dayHydrationReport.status === 'ok'"
                 class="rounded-xl p-3 border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800 font-bold">
              達標：該日水分達標（{{ dayHydrationReport.totalHydration }} / {{ dayHydrationReport.range.min }}–{{ dayHydrationReport.range.max }} ml）
            </div>
          </div>
          </template>

          <div v-else class="py-6 text-center rounded-2xl theme-panel-dashed">
            <p class="text-xs font-bold text-slate-500">尚未新增餵食紀錄</p>
            <p class="text-[10px] text-slate-400 mt-1">按「＋ 新增餵食紀錄」，時間會自動填入現在，亦可自行修改</p>
          </div>

          <div class="mt-3 rounded-2xl theme-panel p-4 space-y-3 shadow-sm ">
            <div class="border-b theme-divider pb-2">
              <h4 class="text-xs font-black theme-accent-text">該日餵食時間一覽</h4>
              <p class="text-[9px] font-bold theme-accent-text/80 mt-0.5">按時間排序；只顯示已按「儲存」的食物/項目及份量</p>
            </div>
            <p v-if="mealOverviewList.length === 0"
               class="text-center text-[10px] font-bold text-slate-400 py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              該日尚未有已儲存的餵食紀錄
            </p>
            <div v-else class="space-y-2.5">
              <div v-for="m in mealOverviewList" :key="'sum-' + m.id"
                   @click="selectMealEntry(m.id)"
                   :class="['rounded-xl px-3 py-2.5 cursor-pointer border transition-all bg-white/80',
                            activeMealId === m.id ? 'theme-accent-border shadow-sm' : 'theme-accent-border/80 hover:theme-accent-border']">
                <p class="text-[10px] font-black theme-accent-text mb-1.5">🕐 {{ m.timeLabel }}</p>
                <div class="space-y-1 text-[10px] font-bold leading-relaxed">
                  <p v-for="(item, idx) in m.items" :key="idx" class="text-slate-800">
                    {{ item }}
                  </p>
                </div>
              </div>
            </div>
            <div class="rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2.5">
              <p class="text-[10px] font-bold leading-relaxed">
                <span class="text-slate-600 font-black">飲水量：</span>
                <span class="text-sky-800">{{ dayWaterStats.total > 0 ? dayWaterStats.total + ' ml' : '—' }}</span>
                <span v-if="dayWaterSourceLabel" class="text-slate-500 font-bold text-[9px] ml-1">（{{ dayWaterSourceLabel }}）</span>
                <span v-if="dayHydrationReport.totalHydration > 0" class="block text-[9px] text-sky-700/90 mt-1 font-bold">
                  連同糧食水分，該日總水分約 {{ dayHydrationReport.totalHydration }} ml
                </span>
              </p>
            </div>
          </div>
        </section>

        <section class="theme-section rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div class="border-b theme-divider pb-3">
            <h3 class="font-black text-slate-900 text-sm flex items-center gap-1.5">
              👑 {{ currentCat.name }} 專屬口味累積排行榜
            </h3>
            <p class="text-[9px] font-bold text-slate-400 mt-0.5">
              已自動將海量數據整理為三大模組，點擊手風琴即可展開/收起
            </p>
          </div>

          <div class="space-y-2.5">
            
            <div class="border theme-accent-border rounded-2xl overflow-hidden shadow-sm">
              <button @click="toggleAccordion('wet')" class="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex justify-between items-center transition-colors">
                <span class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  🥫 罐罐 / 濕糧愛好榜
                  <span class="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-md">{{ groupedLeaderboard.wet.length }} 項</span>
                </span>
                <span class="text-xs text-slate-400 font-bold">{{ accordionOpen.wet ? '🔼 收起' : '🔽 展開查看' }}</span>
              </button>
              
              <div v-if="accordionOpen.wet" class="p-3 bg-white border-t border-slate-50 space-y-2 animate-fade-in">
                <p v-if="groupedLeaderboard.wet.length === 0" class="text-center py-4 text-slate-400 text-[11px]">暫時未有濕糧評分數據</p>
                <div v-for="(item, index) in groupedLeaderboard.wet" :key="index" class="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border theme-accent-border/60 text-xs">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="w-4 h-4 text-[10px] font-black flex items-center justify-center bg-blue-100 text-blue-800 rounded-full">{{ index + 1 }}</span>
                    <span class="font-black text-slate-800 truncate">{{ item.brand }} <span class="text-slate-500 font-bold">{{ item.flavor }}</span></span>
                  </div>
                  <div class="text-right font-black theme-accent-text pl-2 whitespace-nowrap">{{ item.totalPoints }} 🌟 <span class="text-[9px] font-normal text-slate-400">({{ item.count }}次)</span></div>
                </div>
              </div>
            </div>

            <div class="border theme-accent-border rounded-2xl overflow-hidden shadow-sm">
              <button @click="toggleAccordion('dry')" class="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex justify-between items-center transition-colors">
                <span class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  🟤 乾乾 / 主糧愛好榜
                  <span class="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">{{ groupedLeaderboard.dry.length }} 項</span>
                </span>
                <span class="text-xs text-slate-400 font-bold">{{ accordionOpen.dry ? '🔼 收起' : '🔽 展開查看' }}</span>
              </button>
              
              <div v-if="accordionOpen.dry" class="p-3 bg-white border-t border-slate-50 space-y-2 animate-fade-in">
                <p v-if="groupedLeaderboard.dry.length === 0" class="text-center py-4 text-slate-400 text-[11px]">暫時未有乾糧評分數據</p>
                <div v-for="(item, index) in groupedLeaderboard.dry" :key="index" class="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border theme-accent-border/60 text-xs">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="w-4 h-4 text-[10px] font-black flex items-center justify-center bg-amber-200 text-amber-900 rounded-full">{{ index + 1 }}</span>
                    <span class="font-black text-slate-800 truncate">{{ item.brand }} <span class="text-slate-500 font-bold">{{ item.flavor }}</span></span>
                  </div>
                  <div class="text-right font-black theme-accent-text pl-2 whitespace-nowrap">{{ item.totalPoints }} 🌟 <span class="text-[9px] font-normal text-slate-400">({{ item.count }}次)</span></div>
                </div>
              </div>
            </div>

            <div class="border theme-accent-border rounded-2xl overflow-hidden shadow-sm">
              <button @click="toggleAccordion('treats')" class="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex justify-between items-center transition-colors">
                <span class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  🍗 零食 / 凍乾愛好榜
                  <span class="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-md">{{ groupedLeaderboard.treats.length }} 項</span>
                </span>
                <span class="text-xs text-slate-400 font-bold">{{ accordionOpen.treats ? '🔼 收起' : '🔽 展開查看' }}</span>
              </button>
              
              <div v-if="accordionOpen.treats" class="p-3 bg-white border-t border-slate-50 space-y-2 animate-fade-in">
                <p v-if="groupedLeaderboard.treats.length === 0" class="text-center py-4 text-slate-400 text-[11px]">暫時未有零食評分數據</p>
                <div v-for="(item, index) in groupedLeaderboard.treats" :key="index" class="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border theme-accent-border/60 text-xs">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="w-4 h-4 text-[10px] font-black flex items-center justify-center bg-rose-100 text-rose-800 rounded-full">{{ index + 1 }}</span>
                    <span class="font-black text-slate-800 truncate">{{ item.brand }}</span>
                  </div>
                  <div class="text-right font-black theme-accent-text pl-2 whitespace-nowrap">{{ item.totalPoints }} 🌟 <span class="text-[9px] font-normal text-slate-400">({{ item.count }}次)</span></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section class="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-md text-left relative overflow-hidden">
          <div class="relative z-10 space-y-3">
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 class="font-black text-sm tracking-wide text-amber-400 flex items-center gap-1">
                🧮 每日所需熱量計算機
              </h3>
              <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-slate-300">{{ currentCat.weight }}kg</span>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-1">
              <div class="bg-white/5 rounded-2xl p-3 border border-white/5">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">基礎代謝率 (RER)</p>
                <p class="text-xl font-black text-white mt-1">{{ calculateRER(currentCat.weight) }} <span class="text-xs font-normal opacity-60">kcal</span></p>
              </div>
              <div class="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
                <p class="text-[9px] text-amber-400 font-bold uppercase tracking-wider">每日建議總熱量 (DER)</p>
                <p class="text-xl font-black text-amber-300 mt-1">{{ calculateDER(currentCat.weight, currentCat.neutered) }} <span class="text-xs font-normal opacity-60">kcal</span></p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-else-if="currentTab === 'medical'" class="space-y-6 animate-fade-in min-w-0 overflow-hidden">

        <section class="theme-section rounded-3xl p-5 shadow-sm space-y-5 text-left min-w-0 overflow-hidden">
          <div class="border-b theme-divider pb-3 flex justify-between items-center gap-2">
            <h3 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm whitespace-nowrap">
              💉 醫療紀錄
            </h3>
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-xl shadow-inner">
              <span class="text-[10px]">📅</span>
              <input v-model="selectedDate"
                     type="date"
                     class="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0 cursor-pointer w-[102px]" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" @click="addMedicalEntry"
                    class="flex-1 min-w-[8rem] py-2.5 rounded-xl text-xs font-black text-white theme-btn-primary transition-colors shadow-sm">
              ＋ 新增醫療紀錄
            </button>
            <button v-if="activeMedicalId" type="button" @click="deleteActiveMedicalEntry"
                    class="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border theme-accent-border transition-colors shrink-0">
              刪除此筆
            </button>
          </div>

          <template v-if="activeMedicalRecord">
            <div class="rounded-2xl theme-panel p-4 space-y-4 shadow-sm min-w-0 overflow-hidden">
              <div class="space-y-2 pb-1 border-b theme-divider min-w-0">
                <div class="datetime-input-group">
                  <div class="datetime-input-group__cell">
                    <label class="datetime-input-group__label font-black text-rose-900">記錄日期</label>
                    <input v-model="activeMedicalDatePart"
                           type="date"
                           lang="zh-HK"
                           class="datetime-field bg-white border theme-accent-border font-bold text-slate-800" />
                  </div>
                  <div class="datetime-input-group__cell">
                    <label class="datetime-input-group__label font-black text-rose-900">記錄時間</label>
                    <input v-model="activeMedicalTimePart"
                           type="time"
                           class="datetime-field bg-white border theme-accent-border font-bold text-slate-800" />
                  </div>
                </div>
                <button type="button" @click="activeMedicalRecord.at = getNowDatetimeLocal()"
                        class="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0">
                  設為現在
                </button>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-black text-rose-900 block">類型</label>
                <div class="flex flex-wrap items-center gap-1 pb-0.5">
                  <button v-for="opt in MEDICAL_TYPE_PRESETS"
                          :key="opt"
                          type="button"
                          @click="selectMedicalType(opt)"
                          :class="[
                            'px-2 py-1 rounded-full border text-[10px] font-black transition-all whitespace-nowrap',
                            activeMedicalRecord.type === opt
                              ? 'theme-selected-chip shadow-sm'
                              : 'bg-white text-slate-600 theme-accent-border hover:theme-accent-border hover:theme-accent-bg'
                          ]">
                    {{ opt }}
                  </button>
                  <button type="button" @click="selectMedicalType(MEDICAL_TYPE_OTHER)"
                          :class="[
                            'shrink-0 px-2 py-1 rounded-full border text-[10px] font-black transition-all whitespace-nowrap',
                            activeMedicalRecord.type === MEDICAL_TYPE_OTHER
                              ? 'theme-selected-chip shadow-sm'
                              : 'bg-white text-slate-600 theme-accent-border hover:theme-accent-border hover:theme-accent-bg'
                          ]">
                    其他
                  </button>
                  <input v-model="activeMedicalRecord.typeOther"
                         type="text"
                         placeholder="請填寫"
                         @focus="selectMedicalType(MEDICAL_TYPE_OTHER)"
                         :class="['flex-1 min-w-[5rem] bg-white/90 border theme-accent-border rounded-lg px-2 py-1 text-[10px] font-bold h-[28px]', mealFieldTextClass(activeMedicalRecord.typeOther)]" />
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-black text-rose-900">紀錄內容</span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span v-if="medicalSaveMessage" class="text-[9px] font-bold text-emerald-600">{{ medicalSaveMessage }}</span>
                    <button v-if="activeMedicalRecord.saved"
                            type="button"
                            @click="toggleMedicalRecordCollapse(activeMedicalRecord)"
                            class="shrink-0 px-2 py-1 rounded-full border text-[9px] font-black transition-all whitespace-nowrap leading-none text-center bg-white text-rose-700 theme-accent-border hover:theme-accent-bg">
                      {{ activeMedicalRecord.isCollapsed ? '展開內容' : '收起內容' }}
                    </button>
                    <button type="button" @click="saveActiveMedicalEntry"
                            class="shrink-0 px-2 py-1 rounded-full border text-[9px] font-black transition-all whitespace-nowrap leading-none text-center theme-btn-primary shadow-sm">
                      儲存
                    </button>
                  </div>
                </div>

                <div v-if="activeMedicalRecord.isCollapsed"
                     class="text-[10px] font-bold text-slate-500 bg-white/80 border theme-accent-border rounded-xl px-3 py-2">
                  已收起，現時只顯示記錄日期及時間。
                </div>

                <div v-if="!activeMedicalRecord.isCollapsed" class="space-y-2">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-[10px] font-black text-rose-900 shrink-0 whitespace-nowrap">登記號碼：</span>
                    <input v-model="activeMedicalRecord.registrationNo"
                           type="text"
                           :class="['flex-1 min-w-0 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold', mealFieldTextClass(activeMedicalRecord.registrationNo)]" />
                  </div>
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-[10px] font-black text-rose-900 shrink-0 whitespace-nowrap">項目：</span>
                    <input v-model="activeMedicalRecord.title"
                           type="text"
                           placeholder="例如：三合一疫苗、絕育、年度檢查…"
                           :class="['flex-1 min-w-0 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold', mealFieldTextClass(activeMedicalRecord.title)]" />
                  </div>
                </div>

                <div v-if="!activeMedicalRecord.isCollapsed" class="space-y-2">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <div class="flex items-center gap-1.5 flex-1 min-w-0 basis-[calc(50%-0.25rem)]">
                      <span class="text-[10px] font-black text-rose-900 shrink-0 whitespace-nowrap">診所／醫院：</span>
                      <input v-model="activeMedicalRecord.clinic"
                             type="text"
                             placeholder="例如：J-Vet"
                             :class="['flex-1 min-w-0 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold', mealFieldTextClass(activeMedicalRecord.clinic)]" />
                    </div>
                    <div class="flex items-center gap-1.5 flex-1 min-w-0 basis-[calc(50%-0.25rem)]">
                      <span class="text-[10px] font-black text-rose-900 shrink-0 whitespace-nowrap">醫生名稱：</span>
                      <input v-model="activeMedicalRecord.doctorName"
                             type="text"
                             placeholder="例如：Dr. Jack"
                             :class="['flex-1 min-w-0 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold', mealFieldTextClass(activeMedicalRecord.doctorName)]" />
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-[10px] font-black text-rose-900 shrink-0 whitespace-nowrap">診斷結果：</span>
                    <input v-model="activeMedicalRecord.diagnosis"
                           type="text"
                           placeholder="例如：上呼吸道感染、腸道疾病..."
                           :class="['flex-1 min-w-0 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-xs font-bold', mealFieldTextClass(activeMedicalRecord.diagnosis)]" />
                  </div>
                </div>

                <div v-if="!activeMedicalRecord.isCollapsed" class="space-y-1.5 rounded-xl border theme-accent-border theme-accent-bg p-2.5 min-w-0 w-full overflow-hidden box-border">
                  <label class="text-[10px] font-black text-rose-900 block">下次覆診日期及時間（選填）</label>
                  <div class="datetime-input-group">
                    <div class="datetime-input-group__cell">
                      <input v-model="activeMedicalRecord.nextVisitDate"
                             type="date"
                             aria-label="下次覆診日期"
                             class="datetime-field bg-white border theme-accent-border font-bold text-slate-800" />
                    </div>
                    <div class="datetime-input-group__cell">
                      <input v-model="activeMedicalRecord.nextVisitTime"
                             type="time"
                             aria-label="下次覆診時間"
                             class="datetime-field bg-white border theme-accent-border font-bold text-slate-800" />
                    </div>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input v-model="activeMedicalRecord.addReminderToHome"
                           type="checkbox"
                           :disabled="!activeMedicalRecord.nextVisitDate"
                           class="rounded theme-accent-border text-rose-600 w-3.5 h-3.5 disabled:opacity-40" />
                    <span class="text-[10px] font-bold text-slate-600 leading-relaxed">
                      加入提醒到首頁「{{ healthMemoTitle }}」
                    </span>
                  </label>
                </div>

                <div v-if="!activeMedicalRecord.isCollapsed" class="space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-black text-rose-900">用藥劑量</span>
                    <button type="button" @click="addMedicalMedicationRow(activeMedicalRecord)"
                            class="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg">
                      ＋ 新增藥物
                    </button>
                  </div>
                  <div class="grid grid-cols-[1fr_0.45fr_0.5fr_0.5fr_0.65fr_1fr] gap-1 px-0.5 items-end">
                    <span class="text-[9px] font-black text-slate-500">藥物名稱</span>
                    <span class="text-[9px] font-black text-slate-500">總日數</span>
                    <span class="text-[9px] font-black text-slate-500">每日次數</span>
                    <span class="text-[9px] font-black text-slate-500">每次份量</span>
                    <span class="text-[9px] font-black text-slate-500">質地</span>
                    <span class="text-[9px] font-black text-slate-500">服藥時間</span>
                  </div>
                  <div v-for="(med, medIdx) in activeMedicalRecord.medications" :key="'med-drug-' + medIdx"
                       class="space-y-1 pb-1 border-b theme-divider last:border-0 last:pb-0">
                    <div class="grid grid-cols-[1fr_0.45fr_0.5fr_0.5fr_0.65fr_1fr] gap-1 items-center">
                      <input v-model="med.drugName"
                             type="text"
                             placeholder="藥物名稱"
                             :class="['w-full bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold min-w-0', mealFieldTextClass(med.drugName)]" />
                      <input v-model="med.totalDays"
                             type="text"
                             placeholder="日"
                             :class="['w-full bg-slate-50 border-none rounded-lg px-1.5 py-1.5 text-[10px] font-bold min-w-0 text-center', mealFieldTextClass(med.totalDays)]" />
                      <input v-model="med.timesPerDay"
                             type="text"
                             placeholder="次"
                             :class="['w-full bg-slate-50 border-none rounded-lg px-1.5 py-1.5 text-[10px] font-bold min-w-0 text-center', mealFieldTextClass(med.timesPerDay)]" />
                      <input v-model="med.dosePerTime"
                             type="text"
                             placeholder="量"
                             :class="['w-full bg-slate-50 border-none rounded-lg px-1.5 py-1.5 text-[10px] font-bold min-w-0 text-center', mealFieldTextClass(med.dosePerTime)]" />
                      <select v-model="med.form"
                              :class="['w-full bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[9px] font-bold min-w-0 truncate h-[28px]', mealFieldTextClass(med.form)]">
                        <option value="">質地</option>
                        <option v-for="f in MEDICATION_FORM_OPTIONS" :key="f" :value="f">{{ f }}</option>
                      </select>
                      <div class="flex gap-0.5 items-center min-w-0">
                        <select v-model="med.mealTiming"
                                :class="['flex-1 min-w-0 bg-slate-50 border-none rounded-lg px-1 py-1.5 text-[9px] font-bold truncate h-[28px]', mealFieldTextClass(med.mealTiming)]">
                          <option value="">服藥時間</option>
                          <option v-for="t in MEDICATION_MEAL_TIMING_OPTIONS" :key="t" :value="t">{{ t }}</option>
                        </select>
                        <button v-if="activeMedicalRecord.medications.length > 1"
                                type="button"
                                @click="removeMedicalMedicationRow(activeMedicalRecord, medIdx)"
                                class="shrink-0 w-5 text-[10px] font-bold text-rose-400 hover:text-rose-600"
                                title="刪除此行">×</button>
                      </div>
                    </div>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input v-model="activeMedicalRecord.completeFullCourse"
                           type="checkbox"
                           class="rounded theme-accent-border text-rose-600 w-3.5 h-3.5" />
                    <span class="text-[10px] font-bold text-slate-600 leading-relaxed">需服完整個療程</span>
                  </label>
                </div>

                <div v-if="!activeMedicalRecord.isCollapsed" class="space-y-1">
                  <label class="text-[10px] font-black text-rose-900">備註</label>
                  <textarea v-model="activeMedicalRecord.detail"
                            rows="2"
                            placeholder="其他提醒事項"
                            :class="['w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold resize-none', mealFieldTextClass(activeMedicalRecord.detail)]" />
                </div>
              </div>
            </div>
          </template>

          <div v-else class="py-6 text-center rounded-2xl theme-panel-dashed">
            <p class="text-xs font-bold text-slate-500">尚未新增醫療紀錄</p>
            <p class="text-[10px] text-slate-400 mt-1">按「＋ 新增醫療紀錄」開始登記</p>
          </div>

          <div class="rounded-2xl theme-panel p-4 space-y-3 shadow-sm ">
            <div class="flex items-start justify-between gap-2 border-b theme-divider pb-2">
              <div class="min-w-0">
                <h4 class="text-xs font-black text-rose-900">該日醫療紀錄一覽</h4>
                <p class="text-[9px] font-bold text-rose-600/80 mt-0.5">只顯示已按「儲存」的紀錄；點擊可編輯</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button v-if="medicalOverviewList.length > 0"
                        type="button"
                        @click.stop="exportMedicalOverviewPdf"
                        :disabled="medicalPdfExporting"
                        class="text-[9px] font-black text-rose-700 bg-white border theme-accent-border hover:theme-accent-bg disabled:opacity-50 px-2.5 py-1.5 rounded-xl shadow-sm">
                  {{ medicalPdfExporting ? '生成中…' : '📄 匯出 PDF' }}
                </button>
              </div>
            </div>
            <p v-if="medicalOverviewList.length === 0"
               class="text-center text-[10px] font-bold text-slate-400 py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              該日尚未有已儲存的醫療紀錄
            </p>
            <div v-else class="space-y-2.5">
              <p v-if="medicalOverviewList.length > medicalOverviewListDisplay.length"
                 class="text-[9px] font-bold text-slate-400 text-right">
                只顯示最新 {{ medicalOverviewListDisplay.length }} 筆紀錄
              </p>
              <div v-for="m in medicalOverviewListDisplay" :key="'med-' + m.id"
                   @click="selectMedicalEntry(m.id)"
                   :class="['rounded-xl px-3 py-2.5 cursor-pointer border transition-all bg-white/80',
                            activeMedicalId === m.id ? 'border-rose-300 shadow-sm' : 'theme-accent-border/80 hover:theme-accent-border']">
                <div class="flex items-center justify-between gap-2 text-[10px] font-black text-rose-700 mb-1.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="shrink-0">📅 {{ m.dateLabel }}</span>
                    <span class="shrink-0">🕐 {{ m.timeLabel }}</span>
                  </div>
                  <button type="button"
                          @click.stop="toggleMedicalOverviewCollapsed(m.id)"
                          class="shrink-0 text-[9px] font-black text-rose-700 bg-white border theme-accent-border hover:theme-accent-bg px-2 py-1 rounded-lg">
                    {{ isMedicalOverviewCollapsed(m.id) ? '展開' : '收起' }}
                  </button>
                </div>
                <ul v-if="!isMedicalOverviewCollapsed(m.id)"
                    class="space-y-0.5 text-[10px] font-bold text-slate-700 leading-relaxed">
                  <li class="flex gap-1 min-w-0">
                    <span class="shrink-0 text-rose-500">•</span>
                    <span class="min-w-0"><span class="text-slate-500">項目：</span>{{ m.item || '—' }}</span>
                  </li>
                  <li class="flex gap-1 min-w-0">
                    <span class="shrink-0 text-rose-500">•</span>
                    <span class="min-w-0"><span class="text-slate-500">登記號碼：</span>{{ m.registrationNo || '—' }}</span>
                  </li>
                  <li class="flex gap-1 min-w-0">
                    <span class="shrink-0 text-rose-500">•</span>
                    <span class="min-w-0"><span class="text-slate-500">診斷：</span>{{ m.diagnosis || '—' }}</span>
                  </li>
                  <li class="flex gap-1 min-w-0">
                    <span class="shrink-0 text-rose-500">•</span>
                    <span class="min-w-0"><span class="text-slate-500">用藥劑量：</span>{{ m.medications || '—' }}</span>
                  </li>
                  <li v-if="m.completeFullCourse" class="flex gap-1 min-w-0">
                    <span class="shrink-0 text-amber-500">*</span>
                    <span class="min-w-0 text-rose-700">需服完整個療程</span>
                  </li>
                  <li class="flex gap-1 min-w-0">
                    <span class="shrink-0 text-rose-500">•</span>
                    <span class="min-w-0"><span class="text-slate-500">覆診日期：</span>{{ m.nextVisitDate || '—' }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="activeMedicalRecord"
               class="rounded-2xl border-2 border-rose-300 bg-gradient-to-b from-rose-50/90 to-white p-4 space-y-3 shadow-sm ring-1 ring-rose-200">
            <div class="flex items-center justify-between gap-2">
              <label class="flex items-center gap-2 cursor-pointer min-w-0">
                <input v-model="activeMedicalRecord.needMedicationChart"
                       type="checkbox"
                       @change="onMedicationChartToggle"
                       class="rounded border-rose-300 text-rose-600 w-3.5 h-3.5" />
                <span class="text-[10px] font-black text-rose-900">是否需要餵藥表？</span>
              </label>
              <button v-if="activeMedicalRecord.needMedicationChart"
                      type="button"
                      @click="toggleMedicationChartExpanded(activeMedicalRecord)"
                      class="shrink-0 px-2 py-1 rounded-full border text-[9px] font-black transition-all whitespace-nowrap leading-none text-center bg-white text-rose-700 theme-accent-border hover:theme-accent-bg">
                {{ activeMedicalRecord.medicationChartExpanded ? '收起餵藥表' : '展開餵藥表' }}
              </button>
            </div>

            <div v-if="activeMedicalRecord.needMedicationChart && activeMedicalRecord.medicationChartExpanded"
                 class="space-y-3 pt-1 border-t theme-accent-border">
              <p v-if="activeMedicationChartPlans.length === 0"
                 class="text-[10px] font-bold text-slate-500 bg-white/80 rounded-xl border border-dashed theme-accent-border px-3 py-3 text-center">
                請先在上方用藥劑量填寫「總日數」及「每日次數」
              </p>

              <div v-for="plan in activeMedicationChartPlans"
                   :key="'med-chart-' + activeMedicalRecord.id + '-' + plan.medIdx"
                   class="rounded-xl border theme-accent-border bg-white/90 p-2.5 space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[10px] font-black text-rose-800 truncate min-w-0">{{ plan.name }}</p>
                  <span class="text-[9px] font-bold text-rose-600 shrink-0">共 {{ plan.days }} 日 · 每日 {{ plan.times }} 次</span>
                </div>
                <div class="overflow-x-auto -mx-0.5">
                  <table class="w-full min-w-[12rem] border-collapse text-[9px]">
                    <thead>
                      <tr>
                        <th class="text-left font-black text-slate-500 py-1 pr-2 whitespace-nowrap">日數</th>
                        <th v-for="doseIdx in plan.times"
                            :key="'dose-h-' + plan.medIdx + '-' + doseIdx"
                            class="text-center font-black text-slate-500 py-1 px-1 whitespace-nowrap">
                          第{{ doseIdx }}次
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, dayIdx) in plan.checks"
                          :key="'day-row-' + plan.medIdx + '-' + dayIdx"
                          class="border-t border-rose-50">
                        <td class="font-bold text-slate-600 py-1.5 pr-2 whitespace-nowrap">第{{ dayIdx + 1 }}日</td>
                        <td v-for="(checked, doseIdx) in row"
                            :key="'dose-cell-' + plan.medIdx + '-' + dayIdx + '-' + doseIdx"
                            class="text-center py-1.5 px-1">
                          <label class="inline-flex items-center justify-center cursor-pointer">
                            <input type="checkbox"
                                   :checked="checked"
                                   @change="toggleMedicationCheck(activeMedicalRecord, plan.medIdx, dayIdx, doseIdx)"
                                   class="rounded border-rose-300 text-emerald-600 w-3.5 h-3.5" />
                          </label>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="text-[9px] font-bold text-slate-400 text-right">
                  已完成 {{ countMedicationChartDone(plan) }} / {{ plan.days * plan.times }} 次
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      <div v-else-if="currentTab === 'excretion'" class="space-y-4 animate-fade-in">
        <section class="theme-section rounded-3xl p-5 shadow-sm space-y-4 text-left">
          <div class="border-b theme-divider pb-3 flex justify-between items-center gap-2">
            <h3 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm">🚽 排泄紀錄</h3>
            <div class="flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-xl shadow-inner">
              <span class="text-[10px]">📅</span>
              <input v-model="selectedDate" type="date"
                     class="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0 cursor-pointer w-[102px]" />
            </div>
          </div>

          <p class="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 leading-relaxed">
            每次清理砂盆時順手觀察並記錄。任何紅色警示項目建議盡早諮詢獸醫。
          </p>

          <div v-if="excretionDaySummary" class="flex flex-wrap gap-1.5">
            <span v-if="excretionDaySummary.pee > 0"
                  class="text-[9px] font-black text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">💧 排尿 {{ excretionDaySummary.pee }}</span>
            <span v-if="excretionDaySummary.poop > 0"
                  class="text-[9px] font-black text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">💩 排便 {{ excretionDaySummary.poop }}</span>
            <span v-if="excretionDaySummary.vomit > 0"
                  class="text-[9px] font-black text-rose-800 bg-rose-50 border theme-accent-border px-2 py-0.5 rounded-full">🤢 嘔吐 {{ excretionDaySummary.vomit }}</span>
          </div>

          <button type="button" @click="openExcretionModal"
                  class="w-full py-3 rounded-xl text-xs font-black text-white theme-btn-primary shadow-sm">
            ＋ 新增排泄紀錄
          </button>

          <div v-if="!excretionLogsForSelectedDate.length"
               class="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
            <p class="text-xs font-bold text-slate-400">此日尚無排泄紀錄</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="log in excretionLogsForSelectedDate" :key="log.id"
                 class="rounded-xl border theme-accent-border bg-slate-50/80 p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-black text-slate-800">{{ formatExcretionLogTime(log) }}</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span v-if="log.events?.pee" class="text-[9px] font-black text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">💧 排尿</span>
                    <span v-if="log.events?.poop" class="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">💩 排便</span>
                    <span v-if="log.events?.vomit" class="text-[9px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">🤢 嘔吐</span>
                  </div>
                  <p class="text-[10px] font-bold text-slate-600 mt-1.5 leading-relaxed">{{ formatExcretionLogDetail(log) }}</p>
                  <p v-if="logHasExcretionAlert(log)" class="text-[9px] font-black text-rose-600 mt-1">⚠️ 含紅色警示項目</p>
                </div>
                <button type="button" @click="removeExcretionLog(log.id)" class="text-rose-400 text-lg leading-none shrink-0">×</button>
              </div>
              <div v-if="log.photos?.length" class="flex gap-1.5 overflow-x-auto">
                <img v-for="(ph, idx) in log.photos" :key="log.id + '-ph-' + idx" :src="ph"
                     alt="" class="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-else-if="currentTab === 'stats'" class="space-y-4 animate-fade-in min-w-0 overflow-hidden">

        <section class="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden transition-all duration-500 text-left"
                 :style="{ background: currentTheme.gradient }">
          <div class="relative z-10">
            <p class="text-[10px] opacity-80 uppercase tracking-widest font-bold">行為與社交</p>
            <h2 class="text-xl font-black mt-1 leading-snug">
              {{ isMultiCatHousehold ? '🐱 多貓互動紀錄' : '🐱 主子迷惑行為圖鑑' }}
            </h2>
            <p class="text-[10px] opacity-90 mt-2 leading-relaxed">
              {{ isMultiCatHousehold ? '記錄主角貓與其他貓貓嘅互動狀態' : `記錄 ${currentCat.name} 嘅古怪行為同壓力警號` }}
            </p>
          </div>
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </section>

        <section class="theme-section rounded-[28px] p-4 shadow-md shadow-slate-200/40 space-y-4 text-left ring-1 ring-slate-100/80 min-w-0 overflow-hidden">
          <div class="date-field-shell">
            <input v-model="behaviorSocialDraft.date" type="date"
                   class="datetime-field datetime-field--block w-full bg-slate-50 border theme-accent-border font-bold text-slate-800" />
          </div>

          <div class="grid grid-cols-2 gap-1 p-1 bg-pink-50/70 rounded-2xl border border-pink-100">
            <button type="button"
                    @click="behaviorSocialSubTab = 'status'"
                    :class="['py-2.5 px-2 rounded-xl text-[10px] font-black transition-all text-center',
                             behaviorSocialSubTab === 'status'
                               ? 'bg-white text-pink-700 shadow-sm ring-1 ring-pink-200'
                               : 'text-pink-500/80 hover:text-pink-700']">
              🐱 {{ isMultiCatHousehold ? '貓間關係' : '主子狀態' }}
            </button>
            <button type="button"
                    @click="behaviorSocialSubTab = 'social'"
                    :class="['py-2.5 px-2 rounded-xl text-[10px] font-black transition-all text-center',
                             behaviorSocialSubTab === 'social'
                               ? 'bg-white text-pink-700 shadow-sm ring-1 ring-pink-200'
                               : 'text-pink-500/80 hover:text-pink-700']">
              ❤️ 人貓互動
            </button>
          </div>

          <template v-if="behaviorSocialSubTab === 'status'">
            <template v-if="!isMultiCatHousehold">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[12px] font-black text-violet-700">🌀 日常怪癖</p>
                  <button type="button" @click="toggleBehaviorSocialSectionEdit('quirk')"
                          :class="['shrink-0 px-2 py-1 text-[9px] font-black transition-colors text-green-600 hover:text-green-700']">
                    {{ isBehaviorSocialSectionEditing('quirk') ? '✅ 完成' : '✏️ 編輯' }}
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="tag in behaviorSocialQuirkTagOptions" :key="'q-' + tag"
                       :class="['inline-flex items-stretch rounded-full border overflow-hidden text-[10px] font-black transition-all',
                                isBehaviorSocialSectionEditing('quirk') ? 'behavior-tag-chip--editing' : '',
                                behaviorSocialDraft.quirkTags.includes(tag)
                                  ? 'bg-violet-50 text-violet-800 border-violet-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-200']">
                    <button type="button" @click="onBehaviorSocialTagChipClick('quirk', tag)"
                            :class="['px-2.5 py-1.5 leading-none', isBehaviorSocialSectionEditing('quirk') ? 'cursor-default' : '']">
                      {{ tag }}
                    </button>
                    <button v-if="isBehaviorSocialSectionEditing('quirk')" type="button"
                            @click="removeBehaviorSocialTagOption('quirk', tag)"
                            class="px-2 py-1.5 border-l border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-black leading-none min-w-[1.75rem]"
                            aria-label="刪除標籤">
                      ✕
                    </button>
                  </div>
                  <button type="button" @click="showBehaviorSocialCustomQuirk = !showBehaviorSocialCustomQuirk"
                          class="px-2.5 py-1.5 rounded-full border border-dashed border-violet-200 text-[10px] font-black text-violet-600 bg-violet-50/40 hover:bg-violet-50">
                    ＋其他
                  </button>
                </div>
                <div v-if="showBehaviorSocialCustomQuirk" class="flex gap-1.5">
                  <input v-model="behaviorSocialCustomQuirkDraft" type="text" maxlength="20"
                         placeholder="其他"
                         @keyup.enter="addBehaviorSocialCustomTag('quirk')"
                         class="flex-1 min-w-0 bg-white border border-violet-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800" />
                  <button type="button" @click="addBehaviorSocialCustomTag('quirk')"
                          class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-violet-500 hover:bg-violet-600">
                    加入
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[12px] font-black text-rose-700">⚠️ 壓力／行為警告</p>
                  <button type="button" @click="toggleBehaviorSocialSectionEdit('warning')"
                          :class="['shrink-0 px-2 py-1 text-[9px] font-black transition-colors text-green-600 hover:text-green-700']">
                    {{ isBehaviorSocialSectionEditing('warning') ? '✅ 完成' : '✏️ 編輯' }}
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="tag in behaviorSocialWarningTagOptions" :key="'w-' + tag"
                       :class="['inline-flex items-stretch rounded-full border overflow-hidden text-[10px] font-black transition-all',
                                isBehaviorSocialSectionEditing('warning') ? 'behavior-tag-chip--editing' : '',
                                behaviorSocialDraft.warningTags.includes(tag)
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200']">
                    <button type="button" @click="onBehaviorSocialTagChipClick('warning', tag)"
                            :class="['px-2.5 py-1.5 leading-none', isBehaviorSocialSectionEditing('warning') ? 'cursor-default' : '']">
                      {{ tag }}
                    </button>
                    <button v-if="isBehaviorSocialSectionEditing('warning')" type="button"
                            @click="removeBehaviorSocialTagOption('warning', tag)"
                            class="px-2 py-1.5 border-l border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-black leading-none min-w-[1.75rem]"
                            aria-label="刪除標籤">
                      ✕
                    </button>
                  </div>
                  <button type="button" @click="showBehaviorSocialCustomWarning = !showBehaviorSocialCustomWarning"
                          class="px-2.5 py-1.5 rounded-full border border-dashed border-rose-200 text-[10px] font-black text-rose-600 bg-rose-50/40 hover:bg-rose-50">
                    ＋其他
                  </button>
                </div>
                <div v-if="showBehaviorSocialCustomWarning" class="flex gap-1.5">
                  <input v-model="behaviorSocialCustomWarningDraft" type="text" maxlength="20"
                         placeholder="其他"
                         @keyup.enter="addBehaviorSocialCustomTag('warning')"
                         class="flex-1 min-w-0 bg-white border border-rose-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800" />
                  <button type="button" @click="addBehaviorSocialCustomTag('warning')"
                          class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600">
                    加入
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="space-y-2">
                <p class="text-[12px] font-black text-slate-700">🐱 貓間關係</p>
                <div class="flex items-start gap-2">
                  <div class="shrink-0 space-y-1">
                    <p class="text-[9px] font-bold text-slate-400">主角貓</p>
                    <div class="inline-flex items-center justify-center min-h-[2rem] px-2.5 py-1.5 rounded-xl border theme-accent-bg theme-accent-border shadow-sm transition-colors duration-500">
                      <span class="text-[10px] font-black theme-accent-text leading-none">{{ currentCat.name }}</span>
                    </div>
                  </div>
                  <span class="text-sm font-black text-slate-400 shrink-0 mt-5">➔</span>
                  <div class="flex-1 min-w-0 space-y-1">
                    <p class="text-[9px] font-bold text-slate-400">對象貓（可多選）</p>
                    <div class="flex flex-wrap gap-1.5 min-h-[2.5rem] content-start">
                      <label v-for="cat in behaviorSocialTargetCatOptions" :key="'target-' + (cat.id || cat.name)"
                             :class="['inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl border cursor-pointer transition-colors',
                                      behaviorSocialDraft.targetCatIds.includes(cat.id)
                                        ? 'theme-accent-bg border theme-accent-border shadow-sm'
                                        : 'bg-white border-slate-200 hover:border-slate-300']">
                        <input type="checkbox"
                               :checked="behaviorSocialDraft.targetCatIds.includes(cat.id)"
                               @change="toggleBehaviorSocialTargetCat(cat.id)"
                               class="rounded theme-accent-border theme-accent-text w-3 h-3" />
                        <span class="text-[10px] font-black text-slate-700">{{ cat.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-[10px] font-black text-rose-700">💕 放閃恩愛</p>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="tag in behaviorSocialAffectionTagOptions" :key="'aff-' + tag"
                          type="button"
                          @click="toggleBehaviorSocialTag('affection', tag)"
                          :class="['px-2.5 py-1.5 rounded-full border text-[10px] font-black transition-all',
                                   behaviorSocialDraft.affectionTags.includes(tag)
                                     ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm'
                                     : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200']">
                    {{ tag }}
                  </button>
                  <button type="button" @click="showBehaviorSocialCustomAffection = !showBehaviorSocialCustomAffection"
                          class="px-2.5 py-1.5 rounded-full border border-dashed border-rose-200 text-[10px] font-black text-rose-600 bg-rose-50/40 hover:bg-rose-50">
                    ＋其他
                  </button>
                </div>
                <div v-if="showBehaviorSocialCustomAffection" class="flex gap-1.5">
                  <input v-model="behaviorSocialCustomAffectionDraft" type="text" maxlength="20"
                         placeholder="其他"
                         @keyup.enter="addBehaviorSocialCustomTag('affection')"
                         class="flex-1 min-w-0 bg-white border border-rose-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800" />
                  <button type="button" @click="addBehaviorSocialCustomTag('affection')"
                          class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600">
                    加入
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-[10px] font-black text-amber-800">⚔️ 地盤開戰</p>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="tag in behaviorSocialConflictTagOptions" :key="'conf-' + tag"
                          type="button"
                          @click="toggleBehaviorSocialTag('conflict', tag)"
                          :class="['px-2.5 py-1.5 rounded-full border text-[10px] font-black transition-all',
                                   behaviorSocialDraft.conflictTags.includes(tag)
                                     ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm'
                                     : 'bg-white text-slate-600 border-slate-200 hover:border-amber-200']">
                    {{ tag }}
                  </button>
                  <button type="button" @click="showBehaviorSocialCustomConflict = !showBehaviorSocialCustomConflict"
                          class="px-2.5 py-1.5 rounded-full border border-dashed border-amber-200 text-[10px] font-black text-amber-700 bg-amber-50/40 hover:bg-amber-50">
                    ＋其他
                  </button>
                </div>
                <div v-if="showBehaviorSocialCustomConflict" class="flex gap-1.5">
                  <input v-model="behaviorSocialCustomConflictDraft" type="text" maxlength="20"
                         placeholder="其他"
                         @keyup.enter="addBehaviorSocialCustomTag('conflict')"
                         class="flex-1 min-w-0 bg-white border border-amber-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800" />
                  <button type="button" @click="addBehaviorSocialCustomTag('conflict')"
                          class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700">
                    加入
                  </button>
                </div>
              </div>

              <div class="space-y-2.5 theme-section-soft rounded-2xl p-3.5">
                <div class="flex justify-between items-center gap-2">
                  <div>
                    <p class="text-[10px] font-black text-slate-700">{{ currentCat.name }} 今日社交評分</p>
                    <p class="text-[8px] font-bold text-slate-400 mt-0.5">根據已選標籤自動計算</p>
                  </div>
                  <span class="text-[10px] font-black theme-accent-text tabular-nums">{{ behaviorSocialDraft.intimacy }}</span>
                </div>
                <input :value="behaviorSocialDraft.intimacy" type="range" min="0" max="100" step="1"
                       disabled
                       class="behavior-intimacy-slider behavior-intimacy-slider--readonly w-full" />
                <div class="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>獨處/火爆</span>
                  <span>一般</span>
                  <span>融洽</span>
                </div>
              </div>
            </template>
          </template>

          <template v-else>
            <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[12px] font-bold text-pink-600/80">💞【黐人放閃】</p>
                  <button type="button" @click="toggleBehaviorSocialSectionEdit('humanAffection')"
                          :class="['shrink-0 px-2 py-1 text-[9px] font-black transition-colors text-green-600 hover:text-green-700']">
                    {{ isBehaviorSocialSectionEditing('humanAffection') ? '✅ 完成' : '✏️ 編輯' }}
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="tag in behaviorSocialHumanAffectionTagOptions" :key="'ha-' + tag"
                       :class="['inline-flex items-stretch rounded-full border overflow-hidden text-[10px] font-black transition-all',
                                isBehaviorSocialSectionEditing('humanAffection') ? 'behavior-tag-chip--editing' : '',
                                behaviorSocialDraft.humanInteractionTags.includes(tag)
                                  ? 'bg-pink-50 text-pink-800 border-pink-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-pink-200']">
                    <button type="button" @click="onBehaviorSocialTagChipClick('humanAffection', tag)"
                            :class="['px-2.5 py-1.5 leading-none', isBehaviorSocialSectionEditing('humanAffection') ? 'cursor-default' : '']">
                      {{ tag }}
                    </button>
                    <button v-if="isBehaviorSocialSectionEditing('humanAffection')" type="button"
                            @click="removeBehaviorSocialTagOption('humanAffection', tag)"
                            class="px-2 py-1.5 border-l border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-black leading-none min-w-[1.75rem]"
                            aria-label="刪除標籤">
                      ✕
                    </button>
                  </div>
                  <button type="button" @click="showBehaviorSocialCustomHumanAffection = !showBehaviorSocialCustomHumanAffection"
                          class="px-2.5 py-1.5 rounded-full border border-dashed border-pink-200 text-[10px] font-black text-pink-600 bg-pink-50/40 hover:bg-pink-50">
                    ＋其他
                  </button>
                </div>
                <div v-if="showBehaviorSocialCustomHumanAffection" class="flex gap-1.5">
                  <input v-model="behaviorSocialCustomHumanAffectionDraft" type="text" maxlength="20"
                         placeholder="其他"
                         @keyup.enter="addBehaviorSocialCustomTag('humanAffection')"
                         class="flex-1 min-w-0 bg-white border border-pink-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800" />
                  <button type="button" @click="addBehaviorSocialCustomTag('humanAffection')"
                          class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-pink-500 hover:bg-pink-600">
                    加入
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2 pt-0.5">
                  <p class="text-[12px] font-bold text-blue-600">💔【主子嫌棄】</p>
                  <button type="button" @click="toggleBehaviorSocialSectionEdit('humanRejection')"
                          :class="['shrink-0 px-2 py-1 text-[9px] font-black transition-colors text-green-600 hover:text-green-700']">
                    {{ isBehaviorSocialSectionEditing('humanRejection') ? '✅ 完成' : '✏️ 編輯' }}
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="tag in behaviorSocialHumanRejectionTagOptions" :key="'hr-' + tag"
                       :class="['inline-flex items-stretch rounded-full border overflow-hidden text-[10px] font-black transition-all',
                                isBehaviorSocialSectionEditing('humanRejection') ? 'behavior-tag-chip--editing' : '',
                                behaviorSocialDraft.humanInteractionTags.includes(tag)
                                  ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200']">
                    <button type="button" @click="onBehaviorSocialTagChipClick('humanRejection', tag)"
                            :class="['px-2.5 py-1.5 leading-none', isBehaviorSocialSectionEditing('humanRejection') ? 'cursor-default' : '']">
                      {{ tag }}
                    </button>
                    <button v-if="isBehaviorSocialSectionEditing('humanRejection')" type="button"
                            @click="removeBehaviorSocialTagOption('humanRejection', tag)"
                            class="px-2 py-1.5 border-l border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-black leading-none min-w-[1.75rem]"
                            aria-label="刪除標籤">
                      ✕
                    </button>
                  </div>
                  <button type="button" @click="showBehaviorSocialCustomHumanRejection = !showBehaviorSocialCustomHumanRejection"
                          class="px-2.5 py-1.5 rounded-full border border-dashed border-blue-200 text-[10px] font-black text-blue-600 bg-blue-50/40 hover:bg-blue-50">
                    ＋其他
                  </button>
                </div>
                <div v-if="showBehaviorSocialCustomHumanRejection" class="flex gap-1.5">
                  <input v-model="behaviorSocialCustomHumanRejectionDraft" type="text" maxlength="20"
                         placeholder="其他"
                         @keyup.enter="addBehaviorSocialCustomTag('humanRejection')"
                         class="flex-1 min-w-0 bg-white border border-blue-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800" />
                  <button type="button" @click="addBehaviorSocialCustomTag('humanRejection')"
                          class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-blue-500 hover:bg-blue-600">
                    加入
                  </button>
                </div>
              </div>
          </template>

          <div v-if="!isMultiCatHousehold || behaviorSocialSubTab === 'social'" class="space-y-2.5 theme-section-soft rounded-2xl p-3.5">
            <div class="flex justify-between items-center gap-2">
              <div>
                <p class="text-[10px] font-black text-slate-700">{{ currentCat.name }} 今日心情評分</p>
                <p class="text-[8px] font-bold text-slate-400 mt-0.5">根據已選標籤自動計算</p>
              </div>
              <span class="text-[10px] font-black theme-accent-text tabular-nums">{{ behaviorSocialDraft.moodScore }}</span>
            </div>
            <input :value="behaviorSocialDraft.moodScore" type="range" min="0" max="100" step="1"
                   disabled
                   class="behavior-intimacy-slider behavior-intimacy-slider--readonly w-full" />
            <div class="flex justify-between gap-1 text-[8px] font-bold text-slate-400 leading-tight">
              <span class="text-left max-w-[4.5rem]">非常低落 / 摺埋</span>
              <span class="text-center shrink-0">普通 / 正常</span>
              <span class="text-right max-w-[4.5rem]">非常活躍 / 興奮</span>
            </div>
          </div>

          <div class="space-y-1.5 pt-1 border-t theme-divider">
            <label class="text-[10px] font-black text-slate-700">詳細行為觀察備忘</label>
            <textarea v-model="behaviorSocialDraft.note" rows="3"
                      placeholder="補充今日觀察，例如觸發原因、持續時間、環境變化…"
                      class="w-full bg-slate-50 border theme-accent-border rounded-xl px-3 py-2.5 text-xs font-bold resize-none leading-relaxed" />
          </div>

          <button type="button" @click="saveBehaviorSocialRecord"
                  class="w-full py-3 rounded-xl text-white font-black text-xs theme-btn-primary shadow-md active:scale-[0.98] transition-transform">
            儲存紀錄
          </button>
          <p v-if="behaviorSocialSaveMessage" class="text-center text-[10px] font-bold text-emerald-600">{{ behaviorSocialSaveMessage }}</p>
        </section>

        <section class="theme-section rounded-[28px] p-4 shadow-sm space-y-3 text-left ring-1 ring-slate-100/80">
          <h3 class="font-black text-slate-900 text-sm border-b theme-divider pb-2.5">📋 近期紀錄</h3>
          <div v-if="!behaviorSocialLogsForView.length"
               class="text-center py-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80">
            <p class="text-xs text-slate-400 font-bold">尚未有行為紀錄</p>
          </div>
          <div v-else class="space-y-2">
            <article v-for="log in behaviorSocialLogsForView" :key="log.id"
                     class="rounded-2xl border theme-accent-border bg-white p-3 shadow-sm">
              <div class="flex justify-between items-start gap-2 mb-1">
                <p class="text-[10px] font-black theme-accent-text">{{ formatBehaviorSocialLogHeadline(log) }}</p>
                <button type="button" @click="removeBehaviorSocialLog(log.id)"
                        class="text-rose-400 text-sm leading-none shrink-0">×</button>
              </div>
              <p v-if="formatBehaviorSocialLogTargets(log)" class="text-[9px] font-bold text-slate-500 mb-1">
                對象：{{ formatBehaviorSocialLogTargets(log) }}
              </p>
              <p v-if="log.mode === 'interaction' || log.mode === 'multi'" class="text-[9px] font-bold text-slate-500 mb-1">
                社交評分 {{ log.intimacy ?? 50 }}
              </p>
              <p v-if="log.mode === 'single' || log.mode === 'interaction' || log.mode === 'multi'" class="text-[9px] font-bold text-slate-500 mb-1">
                心情評分 {{ log.moodScore ?? 50 }}
              </p>
              <p v-if="formatBehaviorSocialLogTags(log)" class="text-[10px] font-bold text-slate-600 leading-relaxed">
                {{ formatBehaviorSocialLogTags(log) }}
              </p>
              <p v-if="log.note" class="text-[10px] text-slate-500 mt-1 leading-relaxed">{{ log.note }}</p>
            </article>
          </div>
        </section>

      </div>

      <div v-else-if="currentTab === 'docs'" class="animate-fade-in flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        <section class="rounded-3xl p-4 md:p-5 text-white shadow-lg text-left w-full md:w-1/4 md:max-w-xs md:shrink-0 md:sticky md:top-4"
                 :style="{ background: currentTheme.gradient }">
          <h2 class="text-lg md:text-xl font-black">📁 {{ currentCat.name }} · 照顧資料</h2>
          <p class="text-[10px] md:text-[11px] opacity-90 mt-1 leading-relaxed">點選方格開啟表單，特定資料可匯出 PDF</p>
        </section>

        <div class="w-full md:flex-1 min-w-0">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button v-for="mod in CARE_MODULE_TILES"
                    :key="mod.id"
                    type="button"
                    @click="openCareModule(mod.id)"
                    class="care-module-tile min-h-[6.75rem] rounded-2xl shadow-sm flex items-center justify-center p-3 transition-all active:scale-[0.98]">
              <div class="flex flex-col items-center justify-center gap-1 text-center w-full">
                <span class="text-xs font-black leading-snug whitespace-pre-line theme-accent-text">{{ mod.title }}</span>
                <span class="text-[10px] font-medium text-slate-400 leading-snug px-0.5">{{ mod.desc }}</span>
              </div>
            </button>
          </div>
          <div class="text-gray-400 text-xs tracking-wide leading-relaxed text-center mt-4 px-2">
            <div class="font-medium text-gray-500 mb-2">意見與反饋：</div>
            <div>我們非常珍視每位家長的體驗。不論是遇到使用疑問，</div>
            <div>或是任何功能上的建議，都歡迎隨時電郵與我們交流：</div>
            <div class="mt-1">
              <a href="mailto:meowmeowgroups@gmail.com"
                 class="underline hover:text-gray-600 transition-colors">meowmeowgroups@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="activeCareModule"
         class="app-modal-overlay"
         @click.self="closeCareModule">
      <div :class="[
             'app-modal-panel care-module-shell',
             activeCareModule === 'manual' || activeCareModule === 'weight'
               ? 'app-modal-panel--md' : 'app-modal-panel--sm'
           ]"
           @click.stop>
        <div v-if="activeCareModule !== 'manual'" class="app-modal-header">
          <div class="modal-header">
            <div class="min-w-0">
              <h3 class="text-sm font-black theme-accent-text">{{ getCareModuleLabel(activeCareModule) }}</h3>
              <p class="text-[9px] font-bold text-slate-500 mt-0.5">{{ getCareModuleDesc(activeCareModule) }}</p>
            </div>
            <button type="button" @click="closeCareModule" class="text-slate-400 text-xl leading-none shrink-0 px-1">×</button>
          </div>
        </div>

        <div class="app-modal-body care-module-content">
        <section v-if="activeCareModule === 'manual'" class="space-y-3 pb-1">
          <div class="app-modal-header !px-0 !pt-0 !pb-2">
            <div class="modal-header">
              <h3 class="text-sm font-black theme-accent-text">{{ handoverModalTitle }}</h3>
              <button type="button" @click="closeCareModule" class="text-slate-400 text-xl leading-none shrink-0 px-1">×</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button type="button" @click="setHandoverMode('visit')"
                    :class="handoverModeBtnClass('visit')">🐾 上門照顧</button>
            <button type="button" @click="setHandoverMode('boarding')"
                    :class="handoverModeBtnClass('boarding')">🏨 貓酒店</button>
          </div>

          <div class="flex gap-1.5 flex-wrap">
            <button v-for="tab in HANDOVER_TABS" :key="tab.id" type="button"
                    @click="handoverSheet.activeTab = tab.id; persistHandover()"
                    :class="handoverTabBtnClass(tab.id)">{{ tab.label }}</button>
          </div>

          <p class="text-[9px] font-bold text-rose-500 leading-relaxed">💗 設定會自動儲存，下次開啟好多資料都唔洗打多次</p>

          <div v-if="handoverSheet.activeTab === 'basic'" class="space-y-3 min-w-0 overflow-hidden w-full">
            <div class="datetime-input-group">
              <div class="datetime-input-group__cell">
                <label class="datetime-input-group__label font-black text-slate-600">開始日期 *</label>
                <input v-model="handoverSheet.startDate" type="date" @change="onHandoverDateRangeChange"
                       class="datetime-field datetime-field--muted bg-slate-50 border border-slate-200 font-bold" />
              </div>
              <div class="datetime-input-group__cell">
                <label class="datetime-input-group__label font-black text-slate-600">結束日期 *</label>
                <input v-model="handoverSheet.endDate" type="date" @change="onHandoverDateRangeChange"
                       class="datetime-field datetime-field--muted bg-slate-50 border border-slate-200 font-bold" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div v-if="handoverSheet.mode === 'visit'">
                <label class="text-[9px] font-black text-slate-600">Pet Sitter 姓名</label>
                <input v-model="handoverSheet.sitterName" @input="persistHandover" placeholder="例：小美"
                       class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
              </div>
              <div v-else>
                <label class="text-[9px] font-black text-slate-600">貓酒店名稱</label>
                <input v-model="handoverSheet.boardingShopName" @input="persistHandover" placeholder="喵喵喵酒店"
                       class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
              </div>
              <div>
                <label class="text-[9px] font-black text-slate-600">主人聯絡資料</label>
                <input v-model="handoverSheet.ownerContact" @input="persistHandover"
                       placeholder="e.g. whatsapp 9846 2988"
                       class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
              </div>
            </div>

            <div v-if="handoverSheet.mode === 'visit'" class="space-y-2">
              <div>
                <label class="text-[9px] font-black text-slate-600">主人地址</label>
                <input v-model="handoverSheet.ownerAddress" @input="persistHandover" placeholder="例：香港九龍…"
                       class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
              </div>
              <div>
                <p class="text-[9px] font-black text-slate-600 mb-1.5">開門方式</p>
                <div class="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
                  <template v-for="opt in HANDOVER_ENTRY_OPTIONS" :key="opt.key">
                    <button type="button"
                            @click="toggleHandoverEntryMethod(opt.key)"
                            :class="[
                              'shrink-0 px-3 py-1.5 rounded-full border text-[9px] font-black transition-all whitespace-nowrap',
                              handoverSheet.entryMethods[opt.key]
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            ]">
                      {{ opt.label }}
                    </button>
                    <input v-if="opt.key === 'other' && handoverSheet.entryMethods.other"
                           v-model="handoverSheet.entryOtherNote" @input="persistHandover"
                           placeholder="請填寫"
                           class="shrink-0 w-[5.5rem] min-w-[4.5rem] bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1.5 text-[9px] font-bold" />
                  </template>
                </div>
                <p class="text-[8px] font-bold text-slate-400 mt-1.5 leading-relaxed">
                  保安關係，密碼等等請私下提供***
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-[10px] font-black text-slate-800">🏥 獸醫聯絡資料</p>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[9px] font-black text-slate-500">醫院名稱</label>
                  <input v-model="handoverSheet.vetHospital" @input="persistHandover" placeholder="喵喵獸醫診所 / 動物醫院"
                         class="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
                </div>
                <div>
                  <label class="text-[9px] font-black text-slate-500">醫生名稱</label>
                  <input v-model="handoverSheet.vetDoctor" @input="persistHandover" placeholder="例：喵醫生"
                         class="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
                </div>
                <div>
                  <label class="text-[9px] font-black text-slate-500">電話</label>
                  <input v-model="handoverSheet.vetPhone" @input="persistHandover"
                         class="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
                </div>
                <div>
                  <label class="text-[9px] font-black text-slate-500">地址</label>
                  <input v-model="handoverSheet.vetAddress" @input="persistHandover"
                         class="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
                </div>
              </div>
            </div>

            <div v-if="handoverSheet.mode === 'visit'" class="space-y-2">
              <div class="grid grid-cols-2 gap-3 items-start">
                <div>
                  <p class="text-[10px] font-black text-slate-800 mb-1.5">到訪時間</p>
                  <div class="flex flex-wrap gap-1.5">
                    <button v-for="opt in HANDOVER_VISIT_TIME_OPTIONS" :key="opt.key"
                            type="button"
                            @click="toggleHandoverVisitTime(opt.key)"
                            :class="[
                              'px-3 py-1.5 rounded-full border text-[10px] font-black transition-all',
                              handoverSheet.visitTimes[opt.key]
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            ]">
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="text-[9px] font-black text-slate-600">每日到訪次數</label>
                  <input v-model.number="handoverSheet.visitsPerDayDefault" type="number" min="1" max="10"
                         @change="onHandoverDefaultVisitsChange"
                         class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold text-center" />
                </div>
              </div>
              <div class="rounded-xl bg-sky-50/80 border border-sky-100 overflow-hidden">
                <button type="button"
                        @click="handoverSheet.dailyVisitsExpanded = !handoverSheet.dailyVisitsExpanded; persistHandover()"
                        class="w-full flex items-center justify-between gap-2 px-2.5 py-2.5 text-left">
                  <span class="text-[9px] font-black text-sky-900">每天來訪次數（可個別調整）</span>
                  <span class="text-[9px] font-bold text-sky-700 shrink-0">
                    {{ handoverSheet.dailyVisitsExpanded ? '收起 ▲' : '展開 ▼' }}
                  </span>
                </button>
                <div v-show="handoverSheet.dailyVisitsExpanded" class="px-2.5 pb-2.5 space-y-2 border-t border-sky-100">
                  <div v-for="(row, idx) in handoverSheet.dailyVisits" :key="row.date"
                       class="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-700">
                    <span class="shrink-0">{{ formatHandoverVisitDayLabel(row.date, idx) }}</span>
                    <div class="flex items-center gap-1.5">
                      <button type="button" @click="adjustHandoverDailyVisit(row.date, -1)"
                              class="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600">−</button>
                      <span class="w-6 text-center">{{ row.count }}</span>
                      <button type="button" @click="adjustHandoverDailyVisit(row.date, 1)"
                              class="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600">+</button>
                      <span class="text-[9px] text-slate-500">次</span>
                    </div>
                  </div>
                  <p class="text-[9px] font-black text-sky-800 text-right">總計：{{ handoverTotalVisits }} 次</p>
                </div>
              </div>
            </div>
            <div v-else class="space-y-2">
              <p class="text-[10px] font-black text-slate-800">💰 住宿費用</p>
              <input v-model="handoverSheet.dailyBoardingFee" @input="persistHandover" placeholder="每日費用"
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[10px] font-bold" />
            </div>

            <div class="space-y-2">
              <p class="text-[10px] font-black text-slate-800">🐱 貓貓性格／特性</p>
              <div v-for="cat in cats" :key="'ho-pers-' + cat.id"
                   class="rounded-xl border theme-accent-border bg-slate-50/80 p-2.5 space-y-2">
                <p class="text-[10px] font-black text-slate-800">🐱 {{ cat.name }}</p>
                <div class="grid grid-cols-3 gap-2">
                  <div class="min-w-0">
                    <label class="text-[9px] font-black text-slate-500">與人親近程度</label>
                    <select v-model="handoverSheet.personalities[cat.id].affinity" @change="persistHandover"
                            class="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[9px] font-bold">
                      <option value="">— 選擇 —</option>
                      <option v-for="o in HANDOVER_AFFINITY_OPTIONS" :key="o" :value="o">{{ o }}</option>
                    </select>
                  </div>
                  <div class="min-w-0">
                    <label class="text-[9px] font-black text-slate-500">可否觸摸</label>
                    <select v-model="handoverSheet.personalities[cat.id].touchable" @change="persistHandover"
                            class="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[9px] font-bold">
                      <option value="">— 選擇 —</option>
                      <option v-for="o in HANDOVER_TOUCH_OPTIONS" :key="o" :value="o">{{ o }}</option>
                    </select>
                  </div>
                  <div class="min-w-0">
                    <label class="text-[9px] font-black text-slate-500">攻擊力</label>
                    <select v-model="handoverSheet.personalities[cat.id].aggression" @change="persistHandover"
                            class="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-[9px] font-bold">
                      <option value="">— 選擇 —</option>
                      <option v-for="o in HANDOVER_AGGRESSION_OPTIONS" :key="o" :value="o">{{ o }}</option>
                    </select>
                  </div>
                </div>
                <input v-model="handoverSheet.personalities[cat.id].hidingSpots" @input="persistHandover"
                       placeholder="習慣藏身處"
                       class="w-full bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold" />
                <input v-model="handoverSheet.personalities[cat.id].taboos" @input="persistHandover"
                       placeholder="特殊禁忌／地雷"
                       class="w-full bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold" />
                <input v-model="handoverSheet.personalities[cat.id].preferences" @input="persistHandover"
                       placeholder="特別喜好"
                       class="w-full bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold" />
                <input v-model="handoverSheet.personalities[cat.id].notes" @input="persistHandover"
                       placeholder="其他備註"
                       class="w-full bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-black text-slate-800">特別提示</label>
              <textarea v-model="handoverSheet.overallNotes" @input="persistHandover" rows="3"
                        placeholder="貓貓一開門會跑出街、貓貓識開門所以要上安全鎖…"
                        class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold resize-none leading-relaxed" />
            </div>
          </div>

          <div v-else-if="handoverSheet.activeTab === 'feeding'" class="space-y-3">
            <p class="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 leading-relaxed">
              每個時段可以分別設定每隻貓吃什麼，份量各自獨立。
            </p>
            <p v-if="!handoverSheet.feedingSlots.length"
               class="text-[10px] font-bold text-slate-500 text-center py-4">尚未設定餵食時段，點下方新增</p>
            <div v-for="slot in handoverSheet.feedingSlots" :key="slot.id"
                 class="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 space-y-2">
              <div class="flex gap-2 items-center">
                <input v-model="slot.timeLabel" @input="persistHandover" placeholder="時段，例：早上 8:00"
                       class="flex-1 bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold min-w-0" />
                <button type="button" @click="removeHandoverFeedingSlot(slot.id)" class="text-rose-400 text-sm shrink-0">×</button>
              </div>
              <div v-for="cat in cats" :key="'ho-feed-' + slot.id + cat.id" class="space-y-1">
                <p class="text-[9px] font-black theme-accent-text">{{ cat.name }}</p>
                <textarea v-model="slot.meals[cat.id]" @input="persistHandover" rows="2" placeholder="例：乾糧 10g + 濕食半罐"
                          class="w-full bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold resize-none" />
              </div>
            </div>
            <button type="button" @click="addHandoverFeedingSlot"
                    class="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-[10px] font-black text-slate-600 hover:bg-slate-50">
              ＋ 新增餵食時段
            </button>
            <div class="pt-2 border-t border-slate-100 space-y-2">
              <p class="text-[10px] font-black text-slate-800">🍬 零食／保健品（每次到訪）</p>
              <div v-for="snack in handoverSheet.snacks" :key="snack.id"
                   class="flex gap-1.5 items-center">
                <input v-model="snack.name" @input="persistHandover" placeholder="名稱"
                       class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold min-w-0" />
                <button type="button" @click="removeHandoverSnack(snack.id)" class="text-rose-400 shrink-0">×</button>
              </div>
              <button type="button" @click="addHandoverSnack"
                      class="w-full py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-700 hover:bg-slate-50">
                ＋ 新增零食／保健品
              </button>
            </div>
          </div>

          <div v-else-if="handoverSheet.activeTab === 'checklist'" class="space-y-3">
            <p class="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 leading-relaxed">
              此清單僅用於交接單，不影響主照護清單。
            </p>
            <ul class="space-y-1.5">
              <li v-for="item in handoverSheet.checklistItems" :key="item.id"
                  class="flex items-start gap-2 text-[11px] font-bold text-slate-700">
                <span class="text-slate-500 shrink-0 leading-relaxed">•</span>
                <span class="flex-1 min-w-0 leading-relaxed">{{ item.label }}</span>
                <button type="button" @click="removeHandoverChecklistItem(item.id)"
                        class="text-slate-300 hover:text-rose-400 text-sm shrink-0">×</button>
              </li>
            </ul>
            <div class="flex gap-2">
              <input v-model="handoverChecklistDraft" type="text" placeholder="新增自訂項目…"
                     @keyup.enter="addHandoverChecklistItem"
                     class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold min-w-0" />
              <button type="button" @click="addHandoverChecklistItem"
                      class="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black text-slate-700 border border-slate-200 bg-white">
                新增
              </button>
            </div>
          </div>
        </section>

        <section v-else-if="activeCareModule === 'inventory'" class="space-y-3">
          <button type="button" @click="addInventoryItem"
                  class="w-full py-2 rounded-xl text-[10px] font-black theme-accent-text theme-accent-bg border theme-accent-border">
            ＋ 新增品項
          </button>
          <div v-for="item in currentInventoryItems" :key="item.id"
               class="rounded-xl border-2 p-2.5 space-y-2 transition-colors"
               :class="isInventoryLow(item)
                 ? 'border-rose-300 bg-rose-50/40'
                 : 'border-slate-100 bg-slate-50/50'">
            <div class="flex gap-1.5 items-center">
              <input v-model="item.name" @blur="updateInventoryDoc(item, { name: item.name })" placeholder="品項名稱"
                     class="flex-1 min-w-0 bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold" />
              <button type="button" @click="removeInventoryItem(item.id)" class="text-rose-400 text-sm shrink-0">×</button>
            </div>
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5 min-w-0">
                <button type="button" @click="adjustInventoryCurrent(item, -1)"
                        class="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 text-base font-black leading-none hover:bg-slate-50 active:scale-95 transition-all"
                        title="減少庫存">−</button>
                <span class="min-w-[2rem] text-center text-sm font-black text-slate-800 tabular-nums px-1">
                  {{ getInventoryDisplayQty(item) }}
                </span>
                <button type="button" @click="adjustInventoryCurrent(item, 1)"
                        class="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 text-base font-black leading-none hover:bg-slate-50 active:scale-95 transition-all"
                        title="增加庫存">+</button>
                <select v-if="!isInventoryCustomUnitMode(item)"
                        :value="getInventoryUnitSelectValue(item)"
                        @change="onInventoryUnitSelectChange(item, $event)"
                        class="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 shrink-0 w-[4.25rem]">
                  <option v-for="u in INVENTORY_UNIT_SELECT_OPTIONS" :key="u" :value="u">{{ u }}</option>
                </select>
                <input v-else
                       type="text"
                       :value="getInventoryCustomUnitDraft(item)"
                       placeholder="輸入單位"
                       maxlength="4"
                       @input="onInventoryCustomUnitInput(item, $event)"
                       @blur="commitInventoryCustomUnit(item)"
                       @keydown.enter.prevent="commitInventoryCustomUnit(item)"
                       class="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 shrink-0 w-[4.25rem]" />
              </div>
              <p v-if="isInventoryLow(item)"
                 class="text-[10px] text-rose-500/90 font-bold leading-snug shrink-0">
                ⚠️ 庫存變少，記得補貨
              </p>
            </div>
          </div>
        </section>

        <section v-else-if="activeCareModule === 'favorites'" class="space-y-3">
          <div class="flex justify-end">
            <button type="button" @click="exportFavoritesPdf" :disabled="carePdfExporting"
                    class="text-[9px] font-black theme-accent-text theme-accent-bg border theme-accent-border px-2 py-1 rounded-lg">
              📄 匯出 PDF
            </button>
          </div>
          <div class="space-y-2">
            <div>
              <label class="text-[10px] font-black text-emerald-700">❤️ 最鍾意</label>
              <textarea v-model="currentCat.favoritesMap.loves" @blur="persistCats" rows="2" placeholder="玩具、零食、互動方式…"
                        class="w-full mt-1 bg-emerald-50/50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none" />
            </div>
            <div>
              <label class="text-[10px] font-black text-sky-700">😴 舒適瞓覺位</label>
              <textarea v-model="currentCat.favoritesMap.sleepSpots" @blur="persistCats" rows="2"
                        class="w-full mt-1 bg-sky-50/50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none" />
            </div>
            <div>
              <label class="text-[10px] font-black text-amber-700">⚠️ 避雷區／厭惡</label>
              <textarea v-model="currentCat.favoritesMap.dislikes" @blur="persistCats" rows="2" placeholder="唔鍾意嘅聲音、氣味、地方…"
                        class="w-full mt-1 bg-amber-50/50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none" />
            </div>
          </div>
        </section>

        <section v-else-if="activeCareModule === 'careMed'" class="space-y-3">
          <p class="text-[9px] font-bold text-slate-500 leading-relaxed">日常／居家餵藥排程（與醫療紀錄內嘅餵藥表分開儲存）</p>
          <div v-for="(med, medIdx) in currentCat.careMedSchedule.medications" :key="'care-med-' + medIdx"
               class="rounded-xl border theme-accent-border bg-slate-50/80 p-2.5 space-y-1.5">
            <div class="flex gap-1.5 items-center">
              <input v-model="med.drugName" @blur="onCareMedScheduleBlur" placeholder="藥名"
                     class="flex-1 bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold min-w-0" />
              <button v-if="currentCat.careMedSchedule.medications.length > 1"
                      type="button" @click="removeCareMedRow(medIdx)"
                      class="text-rose-400 text-sm shrink-0">×</button>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <input v-model="med.totalDays" @blur="onCareMedScheduleBlur" placeholder="總日數" type="text"
                     class="bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-center" />
              <input v-model="med.timesPerDay" @blur="onCareMedScheduleBlur" placeholder="每日次數" type="text"
                     class="bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-center" />
              <input v-model="med.dosePerTime" @blur="onCareMedScheduleBlur" placeholder="每次劑量" type="text"
                     class="bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold col-span-2" />
              <input v-model="med.mealTiming" @blur="onCareMedScheduleBlur" placeholder="服藥時間（例：飯前）" type="text"
                     class="bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-bold col-span-2" />
            </div>
          </div>
          <button type="button" @click="addCareMedRow"
                  class="w-full py-2 rounded-xl text-[10px] font-black theme-accent-text theme-accent-bg border theme-accent-border">
            ＋ 新增藥物
          </button>
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <label class="flex items-center gap-2 cursor-pointer min-w-0">
              <input v-model="currentCat.careMedSchedule.needMedicationChart"
                     type="checkbox"
                     @change="onCareMedChartToggle"
                     class="rounded theme-accent-border theme-accent-text w-3.5 h-3.5" />
              <span class="text-[10px] font-black text-slate-800">顯示餵藥打卡表</span>
            </label>
            <button v-if="currentCat.careMedSchedule.needMedicationChart"
                    type="button"
                    @click="toggleMedicationChartExpanded(currentCat.careMedSchedule)"
                    class="shrink-0 px-2 py-1 rounded-full border text-[9px] font-black bg-white theme-accent-text theme-accent-border">
              {{ currentCat.careMedSchedule.medicationChartExpanded ? '收起' : '展開' }}
            </button>
          </div>
          <div v-if="currentCat.careMedSchedule.needMedicationChart && currentCat.careMedSchedule.medicationChartExpanded"
               class="space-y-3">
            <p v-if="activeCareMedChartPlans.length === 0"
               class="text-[10px] font-bold text-slate-500 text-center py-3 border border-dashed border-slate-200 rounded-xl">
              請填寫「總日數」及「每日次數」
            </p>
            <div v-for="plan in activeCareMedChartPlans"
                 :key="'care-chart-' + plan.medIdx"
                 class="rounded-xl border theme-accent-border theme-accent-bg p-2.5 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <p class="text-[10px] font-black theme-accent-text truncate min-w-0">{{ plan.name }}</p>
                <span class="text-[9px] font-bold theme-accent-text shrink-0">{{ plan.days }} 日 · 每日 {{ plan.times }} 次</span>
              </div>
              <div class="overflow-x-auto -mx-0.5">
                <table class="w-full min-w-[12rem] border-collapse text-[9px]">
                  <thead>
                    <tr>
                      <th class="text-left font-black text-slate-500 py-1 pr-2">日數</th>
                      <th v-for="doseIdx in plan.times" :key="'care-dose-h-' + plan.medIdx + '-' + doseIdx"
                          class="text-center font-black text-slate-500 py-1 px-1">第{{ doseIdx }}次</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, dayIdx) in plan.checks" :key="'care-day-' + plan.medIdx + '-' + dayIdx"
                        class="border-t theme-divider">
                      <td class="font-bold text-slate-600 py-1.5 pr-2">第{{ dayIdx + 1 }}日</td>
                      <td v-for="(checked, doseIdx) in row" :key="'care-cell-' + plan.medIdx + '-' + dayIdx + '-' + doseIdx"
                          class="text-center py-1.5 px-1">
                        <input type="checkbox" :checked="checked"
                               @change="toggleMedicationCheck(currentCat.careMedSchedule, plan.medIdx, dayIdx, doseIdx)"
                               class="rounded theme-accent-border text-emerald-600 w-3.5 h-3.5" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-[9px] font-bold text-slate-400 text-right">
                已完成 {{ countMedicationChartDone(plan) }} / {{ plan.days * plan.times }} 次
              </p>
            </div>
          </div>
        </section>

        <section v-else-if="activeCareModule === 'weight'" class="weight-track space-y-3">

          <!-- 第一層：目前體重 -->
          <div class="weight-track-hero rounded-2xl p-4">
            <p class="text-[9px] font-black text-slate-500 uppercase tracking-wider">目前體重</p>
            <div class="flex items-end gap-2 mt-1">
              <span class="text-3xl font-black text-slate-800 tabular-nums leading-none">
                {{ weightTrackingLatestDisplay }}
              </span>
              <span class="text-sm font-bold text-slate-400 pb-0.5">kg</span>
            </div>
            <p v-if="weightTrackingLatestDate" class="text-[9px] font-bold text-slate-400 mt-2">
              最近紀錄 · {{ weightTrackingLatestDate }}
            </p>
          </div>
          <p class="text-xs text-slate-400 mt-2 block text-center leading-relaxed px-1">
            💡 建議大約每兩星期量一次體重，可以更有效追蹤貓貓健康。
          </p>

          <!-- 第二層：新增秤重紀錄 -->
          <div class="weight-track-input-card rounded-2xl p-3.5 space-y-2.5 min-w-0 overflow-hidden">
            <p class="text-[10px] font-black text-slate-700">⚖️ 新增秤重紀錄</p>
            <div class="datetime-input-group">
              <div class="datetime-input-group__cell">
                <label class="datetime-input-group__label font-black text-slate-400">日期</label>
                <input v-model="weightLogDraft.date" type="date"
                       class="datetime-field weight-track-field font-bold" />
              </div>
              <div class="datetime-input-group__cell">
                <label class="datetime-input-group__label font-black text-slate-400">體重 (kg)</label>
                <input v-model="weightLogDraft.weight"
                       @blur="formatWeightLogDraftInput"
                       type="text" inputmode="decimal" placeholder="4.52"
                       class="datetime-field weight-track-field font-bold text-center tabular-nums" />
              </div>
            </div>
            <div>
              <label class="text-[8px] font-black text-slate-400 block mb-1">目標體重 (kg)</label>
              <input v-model="targetWeightInput"
                     @blur="formatTargetWeightInput"
                     type="text" inputmode="decimal" placeholder="例：4.00"
                     class="w-full weight-track-field rounded-xl px-3 py-2.5 text-xs font-bold text-center tabular-nums" />
              <p class="text-[10px] text-gray-400 mt-1 leading-relaxed">
                ＊請根據獸醫建議輸入主子的理想目標體重。
              </p>
            </div>
            <input v-model="weightLogDraft.note" type="text" placeholder="備註（選填）"
                   class="w-full weight-track-field rounded-xl px-3 py-2 text-[10px] font-bold" />
            <button type="button" @click="addWeightLog"
                    class="w-full py-2.5 rounded-xl text-[10px] font-black text-white weight-track-submit-btn">
              ＋ 記錄體重
            </button>
          </div>

          <!-- 第三層：月變動率 -->
          <div class="weight-track-metric rounded-2xl p-3.5"
               :class="weightTrackingMonthlyChange.alertClass">
            <p class="text-[9px] font-black text-slate-500">📉 月變動率</p>
            <p class="text-lg font-black mt-1 tabular-nums" :class="weightTrackingMonthlyChange.textClass">
              {{ weightTrackingMonthlyChange.display }}
            </p>
            <p class="text-[9px] font-bold mt-1 leading-relaxed" :class="weightTrackingMonthlyChange.subClass">
              {{ weightTrackingMonthlyChange.hint }}
            </p>
            <p v-if="weightTrackingMonthlyChange.baselineDate"
               class="text-[8px] font-bold text-slate-400 mt-1">
              對比 {{ weightTrackingMonthlyChange.baselineDate }}（{{ weightTrackingMonthlyChange.baselineWeight }} kg）
            </p>
          </div>

          <!-- 第四層：目標進度 -->
          <div class="weight-track-metric rounded-2xl p-3.5">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[9px] font-black text-slate-500">🎯 目標進度</p>
              <span class="text-[9px] font-black px-2 py-0.5 rounded-full"
                    :class="weightTrackingBodyStatus.badgeClass">
                {{ weightTrackingBodyStatus.label }}
              </span>
            </div>
            <div class="mt-3">
              <div class="weight-track-progress-track relative h-3 rounded-full overflow-hidden">
                <div class="absolute inset-0 weight-track-zone-under"></div>
                <div class="absolute inset-y-0 left-[28%] right-[28%] weight-track-zone-standard"></div>
                <div class="absolute inset-y-0 right-0 w-[28%] weight-track-zone-over"></div>
                <div class="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-slate-400/60 rounded-full z-10"
                     style="left: 50%"></div>
                <div v-if="weightTrackingBodyStatus.markerPercent != null"
                     class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-500"
                     :style="{ left: weightTrackingBodyStatus.markerPercent + '%' }">
                  <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
                       :class="weightTrackingBodyStatus.markerClass"></div>
                </div>
              </div>
              <div class="flex justify-between text-[8px] font-bold text-slate-400 mt-1.5 px-0.5">
                <span>偏瘦</span>
                <span>標準</span>
                <span>超重</span>
              </div>
            </div>
            <p class="text-[9px] font-bold text-slate-500 mt-2 leading-relaxed text-center">
              目標體重 {{ weightTrackingTargetDisplay }} kg · 目前 {{ weightTrackingLatestDisplay }} kg
            </p>
          </div>

          <!-- 秤重歷史 -->
          <div class="space-y-2">
            <p class="text-[10px] font-black text-slate-600">📋 秤重歷史</p>
            <div v-if="!weightTrackingHistoryCards.length"
                 class="weight-track-empty rounded-2xl py-8 text-center text-[10px] font-bold text-slate-400">
              尚未有體重紀錄，快幫主子秤一次吧～
            </div>
            <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-0.5">
              <div v-for="item in weightTrackingHistoryCards" :key="item.log.id"
                   class="weight-track-history-card rounded-2xl px-3.5 py-3 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[11px] font-black text-slate-800 tabular-nums">
                    {{ item.weightDisplay }} <span class="text-[9px] font-bold text-slate-400">kg</span>
                  </p>
                  <p class="text-[9px] font-bold text-slate-400 mt-0.5">{{ item.date }}</p>
                  <p v-if="item.note" class="text-[8px] font-bold text-slate-400 mt-0.5 truncate">{{ item.note }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <p v-if="item.delta != null"
                     class="text-[10px] font-black tabular-nums"
                     :class="item.delta > 0 ? 'text-rose-400' : item.delta < 0 ? 'text-sky-500' : 'text-slate-400'">
                    {{ item.delta > 0 ? '🔺' : item.delta < 0 ? '🔻' : '—' }}
                    {{ item.deltaAbs }} kg
                  </p>
                  <p v-else class="text-[9px] font-bold text-slate-300">首次紀錄</p>
                </div>
                <button type="button" @click="removeWeightLog(item.log.id)"
                        class="shrink-0 text-slate-300 hover:text-rose-400 text-sm leading-none">×</button>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activeCareModule === 'insurance'" class="space-y-3">
          <div class="space-y-2">
            <div>
              <label class="text-[10px] font-black text-slate-600">保險公司</label>
              <input v-model="currentCat.insuranceInfo.company" @blur="persistCats"
                     class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold" />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-600">保單號碼</label>
              <input v-model="currentCat.insuranceInfo.policyNo" @blur="persistCats"
                     class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold" />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-600">客服／理賠電話</label>
              <input v-model="currentCat.insuranceInfo.phone" @blur="persistCats" inputmode="tel"
                     class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold" />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-600">保障內容摘要</label>
              <textarea v-model="currentCat.insuranceInfo.coverage" @blur="persistCats" rows="2"
                        class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none" />
            </div>
            <div class="date-field-shell">
              <label class="text-[10px] font-black text-slate-600">到期日</label>
              <input v-model="currentCat.insuranceInfo.expiryDate" @blur="persistCats" type="date"
                     class="datetime-field datetime-field--block w-full mt-1 bg-slate-50 border border-slate-200 font-bold" />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-600">其他備註</label>
              <textarea v-model="currentCat.insuranceInfo.note" @blur="persistCats" rows="2"
                        class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none" />
            </div>
          </div>
        </section>

        <section v-else-if="activeCareModule === 'medHistory'" class="space-y-3">
          <div class="flex justify-end">
            <button type="button" @click="exportMedHistoryPdf" :disabled="carePdfExporting"
                    class="text-[9px] font-black theme-accent-text theme-accent-bg border theme-accent-border px-2 py-1 rounded-lg">
              📄 匯出 PDF
            </button>
          </div>
          <p class="text-[9px] font-bold text-slate-500 leading-relaxed">終身備忘：換診所或緊急情況時，獸醫可快速掌握主子既往病史</p>
          <div class="space-y-2">
            <div>
              <label class="text-[10px] font-black text-slate-600">重大手術</label>
              <textarea v-model="currentCat.medHistory.majorSurgeries" @blur="persistCats" rows="3"
                        placeholder="例：2019 年絕育、2022 年膀胱結石手術…"
                        class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none leading-relaxed" />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-600">慢性病史</label>
              <textarea v-model="currentCat.medHistory.chronicConditions" @blur="persistCats" rows="3"
                        placeholder="例：腎病 Stage 2、甲狀腺亢進…"
                        class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none leading-relaxed" />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-600">藥物過敏</label>
              <textarea v-model="currentCat.medHistory.drugAllergies" @blur="persistCats" rows="3"
                        placeholder="例：對某類抗生素過敏、麻醉藥反應…"
                        class="w-full mt-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold resize-none leading-relaxed" />
            </div>
          </div>

          <div v-if="currentCat.medHistory.customFields.length" class="space-y-2 pt-1">
            <div v-for="field in currentCat.medHistory.customFields" :key="field.id"
                 class="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 space-y-1.5">
              <div class="flex gap-1.5 items-center">
                <input v-model="field.title" @blur="persistCats"
                       placeholder="自訂欄位標題"
                       class="flex-1 bg-white border-none rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-700 min-w-0" />
                <button type="button" @click="removeMedHistoryCustomField(field.id)"
                        class="text-rose-400 hover:text-rose-600 text-sm shrink-0 leading-none px-0.5">×</button>
              </div>
              <textarea v-model="field.content" @blur="persistCats" rows="3"
                        placeholder="填寫內容…"
                        class="w-full bg-white border-none rounded-xl px-3 py-2 text-xs font-bold resize-none leading-relaxed" />
            </div>
          </div>

          <button type="button" @click="addMedHistoryCustomField"
                  class="w-full py-2.5 rounded-xl border-2 border-dashed border-pink-300 text-[10px] font-black text-pink-600 bg-pink-50/40 hover:bg-pink-50 transition-colors">
            ＋ 新增自訂欄位
          </button>
        </section>

        <section v-else-if="activeCareModule === 'guide'" class="space-y-3">
          <div class="flex justify-end">
            <button type="button" @click="resetUserGuideTemplate"
                    class="text-[9px] font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
              還原範本
            </button>
          </div>
          <p class="text-[9px] font-bold text-slate-500">可自訂給貓保母或家人睇嘅 App 使用說明</p>
          <textarea v-model="currentCat.userGuide.content" @blur="persistCats" rows="12"
                    class="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[11px] font-bold resize-none leading-relaxed" />
        </section>
        </div>

        <div v-if="activeCareModule === 'manual'" class="app-modal-footer">
          <button type="button" @click="closeCareModule" class="app-modal-btn app-modal-btn--secondary">
            關閉
          </button>
          <button type="button" @click="generateHandoverPdf" :disabled="carePdfExporting"
                  class="app-modal-btn app-modal-btn--slate app-modal-btn--grow disabled:opacity-60">
            {{ carePdfExporting ? '生成中…' : '生成交接單 →' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showExcretionModal"
         class="app-modal-overlay"
         @click.self="closeExcretionModal">
      <div class="app-modal-panel app-modal-panel--sm" @click.stop>
        <div class="app-modal-header">
          <div class="modal-header">
            <h3 class="text-base font-black text-slate-900">新增排泄紀錄</h3>
            <button type="button" @click="closeExcretionModal" class="text-slate-400 text-xl leading-none px-1">×</button>
          </div>
        </div>

        <div class="app-modal-body min-w-0">
          <p v-if="excretionFormError" class="text-[10px] font-bold text-rose-600 bg-rose-50 border theme-accent-border rounded-xl px-3 py-2 mb-3">{{ excretionFormError }}</p>

          <div class="space-y-3 min-w-0 overflow-hidden w-full">
          <div>
            <label class="text-[10px] font-black text-slate-600">類型</label>
            <select v-model="excretionForm.recordType"
                    class="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-bold">
              <option v-for="t in EXCRETION_RECORD_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="datetime-input-group">
            <div class="datetime-input-group__cell">
              <label class="datetime-input-group__label font-black text-slate-600">日期</label>
              <input v-model="excretionForm.date" type="date"
                     class="datetime-field datetime-field--muted bg-slate-50 border border-slate-200 font-bold" />
            </div>
            <div class="datetime-input-group__cell">
              <label class="datetime-input-group__label font-black text-slate-600">觀察時間</label>
              <input v-model="excretionForm.time" type="time"
                     class="datetime-field datetime-field--muted bg-slate-50 border border-slate-200 font-bold" />
            </div>
          </div>

          <p class="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 leading-relaxed">
            每次清理砂盆時順手觀察並記錄。任何紅色警示項目建議盡早諮詢獸醫。
          </p>

          <div>
            <label class="text-[10px] font-black text-slate-600 block mb-1.5">這次發生了什麼？</label>
            <div class="flex gap-2">
              <button v-for="ev in EXCRETION_EVENT_OPTIONS" :key="ev.key"
                      type="button"
                      @click="toggleExcretionEvent(ev.key)"
                      :class="excretionEventChipClass(ev.key, excretionForm.events[ev.key])">
                <span class="text-base leading-none">{{ ev.icon }}</span>
                <span>{{ ev.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="excretionForm.events.pee"
               class="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-2">
            <p class="text-[10px] font-black text-sky-800">💧 排尿狀況</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] font-bold text-slate-500">尿量</label>
                <select v-model="excretionForm.pee.volume"
                        :class="['w-full mt-0.5 bg-white border rounded-lg px-2 py-1.5 text-[10px] font-bold', isExcretionAlertValue(excretionForm.pee.volume) ? 'border-rose-300 text-rose-700' : 'border-sky-100']">
                  <option v-for="o in EXCRETION_PEE_VOLUME" :key="o" :value="o">{{ o }}</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-500">尿液顏色</label>
                <select v-model="excretionForm.pee.urineColor"
                        :class="['w-full mt-0.5 bg-white border rounded-lg px-2 py-1.5 text-[10px] font-bold', isExcretionAlertValue(excretionForm.pee.urineColor) ? 'border-rose-300 text-rose-700' : 'border-sky-100']">
                  <option v-for="o in EXCRETION_PEE_COLOR" :key="o" :value="o">{{ o }}</option>
                </select>
              </div>
            </div>
            <input v-model="excretionForm.pee.behaviorNote" type="text" placeholder="如廁行為備註（選填）例：蹲很久、叫聲…"
                   class="w-full bg-white border border-sky-100 rounded-lg px-2 py-1.5 text-[10px] font-bold" />
          </div>

          <div v-if="excretionForm.events.poop"
               class="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <p class="text-[10px] font-black text-amber-900">💩 排便狀況</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] font-bold text-slate-500">排便情況</label>
                <select v-model="excretionForm.poop.condition"
                        :class="['w-full mt-0.5 bg-white border rounded-lg px-2 py-1.5 text-[10px] font-bold', isExcretionAlertValue(excretionForm.poop.condition) ? 'border-rose-300 text-rose-700' : 'border-amber-100']">
                  <option v-for="o in EXCRETION_POOP_CONDITION" :key="o" :value="o">{{ o }}</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-500">便便形狀</label>
                <select v-model="excretionForm.poop.shape"
                        :class="['w-full mt-0.5 bg-white border rounded-lg px-2 py-1.5 text-[10px] font-bold', isExcretionAlertValue(excretionForm.poop.shape) ? 'border-rose-300 text-rose-700' : 'border-amber-100']">
                  <option v-for="o in EXCRETION_POOP_SHAPE" :key="o" :value="o">{{ o }}</option>
                </select>
              </div>
            </div>
            <input v-model="excretionForm.poop.behaviorNote" type="text" placeholder="如廁行為備註（選填）例：蹲很久、在砂盆外…"
                   class="w-full bg-white border border-amber-100 rounded-lg px-2 py-1.5 text-[10px] font-bold" />
          </div>

          <div v-if="excretionForm.events.vomit"
               class="rounded-xl border theme-accent-border bg-rose-50/50 p-3 space-y-2">
            <p class="text-[10px] font-black text-rose-800">🤢 嘔吐狀況</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] font-bold text-slate-500">嘔吐物類型</label>
                <select v-model="excretionForm.vomit.matterType"
                        :class="['w-full mt-0.5 bg-white border rounded-lg px-2 py-1.5 text-[10px] font-bold', isExcretionAlertValue(excretionForm.vomit.matterType) ? 'border-rose-300 text-rose-700' : 'theme-accent-border']">
                  <option v-for="o in EXCRETION_VOMIT_TYPES" :key="o" :value="o">{{ o }}</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-500">次數</label>
                <input v-model.number="excretionForm.vomit.count" type="number" min="1" max="20"
                       class="w-full mt-0.5 bg-white border theme-accent-border rounded-lg px-2 py-1.5 text-[10px] font-bold text-center" />
              </div>
            </div>
          </div>

          <div>
            <label class="text-[10px] font-black text-slate-600">📷 附上照片（選填，可多張）</label>
            <input ref="excretionPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple class="hidden"
                   @change="onExcretionPhotosSelect" />
            <button type="button" @click="excretionPhotoInput?.click()"
                    :disabled="imageUploadLoading"
                    class="w-full mt-1.5 py-6 rounded-xl border-2 border-dashed theme-accent-border theme-accent-bg/30 hover:theme-accent-bg transition-colors disabled:opacity-60 disabled:pointer-events-none">
              <p class="text-[11px] font-black theme-accent-text">{{ imageUploadLoading ? '上傳處理中…' : '點擊上傳照片' }}</p>
              <p class="text-[9px] font-bold text-slate-400 mt-0.5">便便／嘔吐物／異常狀況 · 今日最多 {{ UPLOAD_LIMITS.excretion }} 張</p>
            </button>
            <div v-if="excretionForm.photos.length" class="flex flex-wrap gap-2 mt-2">
              <div v-for="(ph, idx) in excretionForm.photos" :key="'ex-form-ph-' + idx" class="relative shrink-0">
                <img :src="ph" alt="" class="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                <button type="button" @click="removeExcretionFormPhoto(idx)"
                        class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] leading-none">×</button>
              </div>
            </div>
          </div>
        </div>

        <div class="app-modal-footer">
          <button type="button" @click="closeExcretionModal" class="app-modal-btn app-modal-btn--secondary">
            取消
          </button>
          <button type="button" @click="saveExcretionRecord" class="app-modal-btn app-modal-btn--primary">
            儲存紀錄
          </button>
        </div>
      </div>
    </div>

    </div>

    <Teleport to="body">
      <nav v-if="!showSplash"
           class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[96%] max-w-lg bg-slate-900/90 backdrop-blur-lg rounded-full px-1 py-2 shadow-2xl flex items-center z-[90]"
           style="margin-bottom: env(safe-area-inset-bottom, 0px);">
        <button v-for="tab in APP_NAV_TABS" :key="'mob-nav-' + tab.id"
                type="button"
                @click="currentTab = tab.id"
                :title="tab.title"
                class="flex-1 flex justify-center items-center min-w-0 p-2"
                :class="navTabActiveShellClass(tab)">
          <span v-if="tab.iconType === 'clipboard'" class="inline-flex shrink-0" :class="tab.isCenter ? 'scale-[1.15]' : ''">
            <svg :class="tab.isCenter ? 'w-[22px] h-[22px]' : 'w-[18px] h-[18px]'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
            </svg>
          </span>
          <span v-else
                class="leading-none shrink-0"
                :class="tab.isCenter ? 'text-[22px]' : 'text-lg'">{{ tab.icon }}</span>
        </button>
      </nav>
    </Teleport>

    <div v-if="showPrefModal" class="app-modal-overlay" @click.self="showPrefModal = false">
      <div class="app-modal-panel app-modal-panel--sm" @click.stop>
        <div class="app-modal-header">
          <div>
            <h4 class="text-sm font-black text-slate-900">❤️ 請選擇【{{ getTargetFoodLabel() }}】嘅喜好程度</h4>
            <p class="text-[10px] text-slate-400 mt-0.5">評分會化為正字點數：搶食(+5)、正常(+3)、勉強(+2)、走開(+1)</p>
          </div>
        </div>
        <div class="app-modal-body space-y-2">
          <button v-for="lvl in preferenceLevels" :key="lvl.value"
                  @click="selectPreferenceValue(lvl.value)"
                  class="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border theme-accent-border flex items-center justify-between transition-colors">
            <div class="flex flex-col items-center text-xs font-bold text-slate-700 min-w-0 flex-1">
              <span class="leading-none">{{ lvl.icon }}</span>
              <span class="leading-tight mt-0.5 text-center">{{ lvl.text }}</span>
            </div>
            <span v-if="getSelectedPrefValue() === lvl.value" class="theme-accent-text font-bold text-xs shrink-0 ml-2">✓</span>
          </button>
        </div>
        </div>
        <div class="app-modal-footer">
          <button type="button" @click="showPrefModal = false" class="app-modal-btn app-modal-btn--dark">
            確定
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBookingModal" class="app-modal-overlay" @click.self="showBookingModal = false">
      <div class="app-modal-panel app-modal-panel--sm text-center" @click.stop>
        <div class="app-modal-header">
          <div class="space-y-1">
            <p class="text-3xl">🛁</p>
            <h3 class="text-lg font-black text-slate-900">預約專業貓貓沖涼美毛服務</h3>
            <p class="text-xs text-slate-400">請選取你喜好的聯絡方式向我預約：</p>
          </div>
        </div>
        <div class="app-modal-body">
          <div class="grid grid-cols-1 gap-3 pt-2">
          <a :href="getWhatsAppLink()" target="_blank" class="flex items-center justify-center gap-2.5 w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-sm rounded-2xl shadow-sm transition-all active:scale-98"><span>💬</span> 透過 WhatsApp 快速預約</a>
          <a :href="getInstagramLink()" target="_blank" class="flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-sm transition-all active:scale-98"><span>📸</span> 瀏覽 IG 專頁 / 私訊預約</a>
          </div>
        </div>
        <div class="app-modal-footer">
          <button type="button" @click="showBookingModal = false" class="app-modal-btn app-modal-btn--ghost">
            返回主頁
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRemindersModal" class="app-modal-overlay" @click.self="closeRemindersModal">
      <div class="app-modal-panel app-modal-panel--sm" @click.stop>
        <div class="app-modal-header">
          <div class="modal-header text-left">
            <div>
              <h3 class="text-lg font-black text-slate-900">📅 設定日程提醒</h3>
              <p class="text-[10px] font-bold text-slate-400 mt-1">調整日期、新增或刪除照顧事項</p>
            </div>
          </div>
        </div>

        <div class="app-modal-body space-y-4">
        <p v-if="remindersModalError" class="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-left">{{ remindersModalError }}</p>

        <div class="space-y-3 text-left">
          <div v-if="!editReminders.length" class="text-center py-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80">
            <p class="text-xs font-bold text-slate-400">尚無事項，請下方新增</p>
          </div>
          <div v-for="(rem, idx) in editReminders" :key="rem.id || 'rem-' + idx"
               class="bg-slate-50 p-3.5 rounded-2xl border theme-accent-border space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <input v-if="isReminderTextEditing(idx) || isCustomReminder(rem)"
                       v-model="rem.icon"
                       type="text"
                       maxlength="4"
                       class="w-9 text-center bg-white border border-slate-200 rounded-lg text-base shrink-0"
                       title="圖示（emoji）" />
                <span v-else class="text-lg shrink-0">{{ rem.icon }}</span>
                <input v-if="isReminderTextEditing(idx) || isCustomReminder(rem)"
                       v-model="rem.title"
                       type="text"
                       placeholder="事項名稱"
                       class="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-xs text-slate-800" />
                <span v-else
                      class="text-xs font-black truncate"
                      :class="isReminderPlaceholder(rem) ? 'text-slate-400' : 'text-slate-700'">
                  {{ getMilestoneDisplayTitle(rem, resolveMilestoneCatalog(rem)) }}
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button type="button" @click="toggleEditReminderText(idx)"
                        :class="[
                          'p-0.5 text-sm leading-none bg-transparent border-0 shadow-none transition-colors active:opacity-70',
                          isReminderTextEditing(idx) ? 'text-slate-700' : 'text-slate-400 hover:text-slate-600'
                        ]"
                        :title="isReminderTextEditing(idx) ? '完成編輯文字' : '編輯文字'">✏️</button>
                <button type="button" @click="removeEditReminder(idx)"
                        class="text-rose-400 hover:text-rose-600 text-lg leading-none px-0.5 bg-transparent border-0 shadow-none transition-colors active:opacity-70"
                        title="刪除此項">×</button>
              </div>
            </div>
            <div class="date-field-shell">
              <label class="text-[9px] font-bold text-slate-400">下次日期</label>
              <input v-model="rem.nextDate" type="date"
                     class="datetime-field datetime-field--block w-full mt-0.5 bg-white border border-slate-200 font-bold text-slate-700" />
            </div>
            <div v-if="isCustomReminder(rem)" class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] font-bold text-slate-400">完成後週期</label>
                <select v-model="rem.periodType"
                        class="w-full mt-0.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-[10px] text-slate-700">
                  <option v-for="opt in REMINDER_PERIOD_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400">間隔</label>
                <input v-model.number="rem.periodValue" type="number" min="1" max="365"
                       class="w-full mt-0.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-xs text-center text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="catalogRemindersAvailable.length" class="text-left space-y-2 pt-1 border-t border-slate-100">
          <p class="text-[10px] font-black text-slate-500">快速加入範本</p>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="c in catalogRemindersAvailable" :key="'cat-add-' + c.id"
                    type="button"
                    @click="addReminderFromCatalog(c)"
                    class="text-[10px] font-bold theme-chip-btn px-2.5 py-1.5 rounded-xl">
              <span v-if="c.id === 'bath'">{{ c.title }}</span>
              <span v-else>{{ c.icon }} {{ c.title }}</span>
            </button>
          </div>
        </div>

        <div class="text-left space-y-2 pt-1 border-t border-slate-100">
          <button type="button" @click="showNewReminderForm = !showNewReminderForm"
                  class="w-full py-2.5 rounded-xl border-2 border-dashed theme-accent-border theme-accent-text text-[11px] font-black theme-accent-bg hover:theme-accent-bg-strong transition-colors">
            {{ showNewReminderForm ? '收起自訂表單' : '＋ 新增自訂事項' }}
          </button>
          <div v-if="showNewReminderForm" class="bg-slate-50 rounded-2xl border theme-accent-border p-3.5 space-y-2.5">
            <div class="grid grid-cols-[3rem_1fr] gap-2">
              <div>
                <label class="text-[9px] font-bold text-slate-400">圖示</label>
                <input v-model="newReminderDraft.icon" type="text" maxlength="4" placeholder="📌"
                       class="w-full mt-0.5 bg-white border border-slate-200 rounded-xl px-1 py-2 text-center text-base" />
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400">事項名稱 <span class="text-rose-500">*</span></label>
                <input v-model="newReminderDraft.title" type="text" placeholder="例：清潔換水機、買砂"
                       class="w-full mt-0.5 bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs text-slate-800" />
              </div>
            </div>
            <div class="date-field-shell">
              <label class="text-[9px] font-bold text-slate-400">下次日期 <span class="text-rose-500">*</span></label>
              <input v-model="newReminderDraft.nextDate" type="date"
                     class="datetime-field datetime-field--block w-full mt-0.5 bg-white border border-slate-200 font-bold text-slate-700" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[9px] font-bold text-slate-400">完成後週期</label>
                <select v-model="newReminderDraft.periodType"
                        class="w-full mt-0.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-[10px]">
                  <option v-for="opt in REMINDER_PERIOD_OPTIONS" :key="'new-' + opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[9px] font-bold text-slate-400">間隔</label>
                <input v-model.number="newReminderDraft.periodValue" type="number" min="1" max="365"
                       class="w-full mt-0.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-xs text-center" />
              </div>
            </div>
            <button type="button" @click="addCustomReminderFromDraft"
                    class="w-full py-2.5 rounded-xl text-[11px] font-black text-white theme-btn-primary shadow-sm">
              加入清單
            </button>
          </div>
        </div>
        </div>

        <div class="app-modal-footer">
          <button type="button" @click="closeRemindersModal" class="app-modal-btn app-modal-btn--ghost">取消</button>
          <button type="button" @click="saveRemindersOnly" class="app-modal-btn app-modal-btn--primary">確認儲存</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="app-modal-overlay" @click.self="closeEditModal">
      <div class="app-modal-panel app-modal-panel--xs" @click.stop>
        <div class="app-modal-header">
          <div class="modal-header">
            <h3 class="text-lg font-black text-slate-900 text-left">⚙️ 更改設定與貓貓檔案</h3>
            <button type="button" @click="deleteCat" class="text-rose-500 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-xl shrink-0">🗑️ 刪除</button>
          </div>
        </div>
        <div class="app-modal-body space-y-3 text-left">
        <p v-if="editFormError" class="text-[10px] font-bold text-rose-600 bg-rose-50 border theme-accent-border rounded-xl px-3 py-2 text-left">{{ editFormError }}</p>

        <div class="space-y-3 text-left">
          <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-black text-slate-500">帳戶</p>
              <p class="text-[11px] font-bold text-slate-700 truncate mt-0.5">{{ authEmail }}</p>
            </div>
            <button type="button" @click="handleLogout"
                    class="shrink-0 text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl">
              登出
            </button>
          </div>

          <div class="bg-slate-50 p-3 rounded-2xl border theme-accent-border flex items-center gap-3">
            <input ref="editPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" class="hidden" @change="onEditPhotoSelect" />
            <div class="w-14 h-14 rounded-full border-[3px] theme-accent-border theme-accent-bg overflow-hidden shadow-md flex items-center justify-center shrink-0">
              <img v-if="editPhoto" :src="editPhoto" alt="預覽" class="w-full h-full object-cover" />
              <span v-else class="text-3xl opacity-60">🐱</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-black text-slate-900 leading-tight">貓咪大頭照</p>
              <p class="text-[10px] font-bold text-slate-400 mt-0.5">支持 JPG、PNG，建議正方形比例</p>
              <button type="button" @click="editPhotoInput?.click()"
                      :disabled="imageUploadLoading"
                      class="mt-2 w-full py-2 rounded-xl border theme-accent-border bg-white hover:bg-slate-50 theme-accent-text text-[11px] font-black active:scale-95 transition-all disabled:opacity-60">
                {{ imageUploadLoading ? '上傳處理中…' : '選擇相片' }}
              </button>
              <p class="text-[8px] font-bold theme-accent-text/70 mt-1">自動壓縮 WebP · 今日最多 {{ UPLOAD_LIMITS.avatar }} 張</p>
              <button v-if="editPhoto" type="button" @click="clearEditPhoto"
                      class="text-[8px] font-bold text-rose-500 underline mt-1 w-fit">
                移除相片
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 block">貓貓名 <span class="text-rose-500">*</span></label>
            <input v-model="editName" type="text" placeholder="例如：孖寶"
                   class="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 font-bold text-sm" />
          </div>

          <div class="flex items-center gap-3">
            <label class="text-[10px] font-bold text-slate-500 shrink-0">主題顏色</label>
            <div class="flex flex-1 justify-end items-center gap-1 min-w-0 flex-wrap justify-end">
              <button v-for="colorKey in CAT_THEME_COLOR_KEYS" :key="'edit-color-' + colorKey"
                      type="button"
                      @click="editColor = colorKey"
                      :title="themeColors[colorKey].primaryHex"
                      :class="[
                        'w-[18px] h-[18px] rounded-full shrink-0 transition-all shadow-sm',
                        editColor === colorKey
                          ? 'ring-[1.5px] ring-offset-1 ring-slate-900'
                          : 'ring-1 ring-slate-200/80'
                      ]"
                      :style="{ backgroundColor: themeColors[colorKey].primaryHex }" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">品種</label>
              <input v-model="editBreed" type="text" placeholder="例如：英短"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">性別</label>
              <div class="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl h-[42px] items-center">
                <button type="button" @click="editGender = '男'"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', editGender === '男' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">仔仔</button>
                <button type="button" @click="editGender = '女'"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', editGender === '女' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">囡囡</button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">體重 (kg) <span class="text-rose-500">*</span></label>
              <input v-model="editWeight" type="number" step="0.1" min="0.1" placeholder="4.2"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">絕育</label>
              <div class="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl h-[42px] items-center">
                <button type="button" @click="editNeutered = true"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', editNeutered ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">已絕育</button>
                <button type="button" @click="editNeutered = false"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', !editNeutered ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">未絕育</button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">出生年月</label>
              <input v-model="editBirthYearMonth" type="month"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">出生日</label>
              <input v-model="editBirthDay" type="text" inputmode="numeric" maxlength="2"
                     placeholder="不確定可不填"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm placeholder:text-slate-400 placeholder:font-bold" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 block">備註</label>
            <textarea v-model="editNotes" rows="3" placeholder="例如：慢性疾病、特別飲食需求…"
                      class="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 font-bold text-xs resize-none leading-relaxed"></textarea>
          </div>
        </div>
        </div>

        <div class="app-modal-footer">
          <button type="button" @click="closeEditModal" class="app-modal-btn app-modal-btn--ghost">取消</button>
          <button type="button" @click="saveProfile" class="app-modal-btn app-modal-btn--primary">確認儲存</button>
        </div>
      </div>
    </div>

    <div v-if="showAddCatModal" class="app-modal-overlay" @click.self="closeAddCatModal">
      <div class="app-modal-panel app-modal-panel--xs" @click.stop>
        <div class="app-modal-header">
          <h3 class="text-lg font-black text-slate-900 text-left modal-header-title !mb-0">➕ 新增貓貓</h3>
        </div>
        <div class="app-modal-body space-y-3 text-left">
        <p v-if="newCatFormError" class="text-[10px] font-bold text-rose-600 bg-rose-50 border theme-accent-border rounded-xl px-3 py-2 text-left">{{ newCatFormError }}</p>

        <div class="space-y-3 text-left">
          <div class="bg-slate-50 p-3 rounded-2xl border theme-accent-border flex items-center gap-3">
            <input ref="newCatPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" class="hidden" @change="onNewCatPhotoSelect" />
            <div class="w-14 h-14 rounded-full border-[3px] theme-accent-border theme-accent-bg overflow-hidden shadow-md flex items-center justify-center shrink-0">
              <img v-if="newCatPhoto" :src="newCatPhoto" alt="預覽" class="w-full h-full object-cover" />
              <span v-else class="text-3xl opacity-60">🐱</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-black text-slate-900 leading-tight">貓咪大頭照</p>
              <p class="text-[10px] font-bold text-slate-400 mt-0.5">支持 JPG、PNG，建議正方形比例</p>
              <button type="button" @click="newCatPhotoInput?.click()"
                      :disabled="imageUploadLoading"
                      class="mt-2 w-full py-2 rounded-xl border theme-accent-border bg-white hover:bg-slate-50 theme-accent-text text-[11px] font-black active:scale-95 transition-all disabled:opacity-60">
                {{ imageUploadLoading ? '上傳處理中…' : '選擇相片' }}
              </button>
              <p class="text-[8px] font-bold theme-accent-text/70 mt-1">自動壓縮 WebP · 今日最多 {{ UPLOAD_LIMITS.avatar }} 張</p>
              <button v-if="newCatPhoto" type="button" @click="clearNewCatPhoto"
                      class="text-[8px] font-bold text-rose-500 underline mt-1 w-fit">
                移除相片
              </button>
            </div>
          </div>

          <!-- 2 貓貓名：全闊 -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 block">貓貓名 <span class="text-rose-500">*</span></label>
            <input v-model="newCatName" type="text" placeholder="例如：孖寶"
                   class="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 font-bold text-sm" />
          </div>

          <div class="flex items-center gap-3">
            <label class="text-[10px] font-bold text-slate-500 shrink-0">主題顏色</label>
            <div class="flex flex-1 justify-end items-center gap-1 min-w-0 flex-wrap justify-end">
              <button v-for="colorKey in CAT_THEME_COLOR_KEYS" :key="colorKey"
                      type="button"
                      @click="newCatColor = colorKey"
                      :title="themeColors[colorKey].primaryHex"
                      :class="[
                        'w-[18px] h-[18px] rounded-full shrink-0 transition-all shadow-sm',
                        newCatColor === colorKey
                          ? 'ring-[1.5px] ring-offset-1 ring-slate-900'
                          : 'ring-1 ring-slate-200/80'
                      ]"
                      :style="{ backgroundColor: themeColors[colorKey].primaryHex }" />
            </div>
          </div>

          <!-- 3 品種 | 4 性別 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">品種</label>
              <input v-model="newCatBreed" type="text" placeholder="例如：英短"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">性別</label>
              <div class="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl h-[42px] items-center">
                <button type="button" @click="newCatGender = '男'"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', newCatGender === '男' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">仔仔</button>
                <button type="button" @click="newCatGender = '女'"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', newCatGender === '女' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">囡囡</button>
              </div>
            </div>
          </div>

          <!-- 5 體重 | 6 絕育 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">體重 (kg) <span class="text-rose-500">*</span></label>
              <input v-model="newCatWeight" type="number" step="0.1" min="0.1" placeholder="4.2"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">絕育</label>
              <div class="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl h-[42px] items-center">
                <button type="button" @click="newCatNeutered = true"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', newCatNeutered ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">已絕育</button>
                <button type="button" @click="newCatNeutered = false"
                        :class="['py-1.5 rounded-lg text-[11px] font-bold h-full', !newCatNeutered ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400']">未絕育</button>
              </div>
            </div>
          </div>

          <!-- 7 出生年月 | 8 日 -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">出生年月</label>
              <input v-model="newCatBirthYearMonth" type="month"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-bold text-slate-500 block">出生日</label>
              <input v-model="newCatBirthDay" type="text" inputmode="numeric" maxlength="2"
                     placeholder="不確定可不填"
                     class="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 font-bold text-sm placeholder:text-slate-400 placeholder:font-bold" />
            </div>
          </div>

          <!-- 10 備註 -->
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-500 block">備註</label>
            <textarea v-model="newCatNotes" rows="3" placeholder="例如：慢性疾病、特別飲食需求…"
                      class="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 font-bold text-xs resize-none leading-relaxed"></textarea>
          </div>
        </div>
        </div>

        <div class="app-modal-footer">
          <button type="button" @click="closeAddCatModal" class="app-modal-btn app-modal-btn--ghost">取消</button>
          <button type="button" @click="addNewCat" class="app-modal-btn app-modal-btn--dark">建立檔案</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="careMaintenanceDeleteModalOpen"
           class="app-modal-overlay"
           @click.self="closeCareMaintenanceDeleteConfirm">
        <div class="app-modal-panel app-modal-panel--sm" @click.stop>
          <div class="app-modal-body space-y-4">
          <p class="text-[12px] font-black text-slate-800 leading-relaxed">
            確定要永久刪除「<span class="text-rose-600">{{ careMaintenanceDeleteTarget?.title || '此項目' }}</span>」這個需處理項目嗎？
          </p>
          <p class="text-[9px] font-bold text-slate-400">刪除後可按「↩ 復原已刪除」加返項目。</p>
          </div>
          <div class="app-modal-footer">
            <button type="button" @click="closeCareMaintenanceDeleteConfirm"
                    class="app-modal-btn app-modal-btn--secondary">取消</button>
            <button type="button" @click="executeCareMaintenanceDelete"
                    class="app-modal-btn app-modal-btn--primary !bg-rose-500 !border-rose-500 hover:!bg-rose-600">
              確定刪除
            </button>
          </div>
        </div>
      </div>

      <div v-if="careMaintenanceEditModalOpen"
           class="app-modal-overlay"
           @click.self="closeCareMaintenanceEditModal">
        <div class="app-modal-panel app-modal-panel--sm" @click.stop>
          <div class="app-modal-header">
            <div class="flex items-start justify-between gap-2">
              <p class="text-[12px] font-black theme-accent-text">✏️ 修改需處理項目</p>
              <button type="button" @click="closeCareMaintenanceEditModal"
                      class="text-slate-400 text-lg leading-none shrink-0 px-1">×</button>
            </div>
          </div>
          <div class="app-modal-body space-y-3">
          <div>
            <label class="text-[9px] font-black text-slate-500">標題</label>
            <input v-model="careMaintenanceEditDraft.title" type="text" placeholder="項目名稱"
                   class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-200" />
          </div>
          <div>
            <label class="text-[9px] font-black text-slate-500">描述</label>
            <textarea v-model="careMaintenanceEditDraft.description" rows="4" placeholder="描述（選填）"
                      class="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-200" />
          </div>
          </div>
          <div class="app-modal-footer">
            <button type="button" @click="closeCareMaintenanceEditModal"
                    class="app-modal-btn app-modal-btn--secondary">取消</button>
            <button type="button" @click="saveCareMaintenanceEditItem"
                    class="app-modal-btn app-modal-btn--primary">儲存修改</button>
          </div>
        </div>
      </div>

      <div v-if="careMaintenanceDateModalOpen"
           class="app-modal-overlay"
           @click.self="closeCareMaintenanceDateModal">
        <div class="app-modal-panel app-modal-panel--sm" @click.stop>
          <div class="app-modal-header">
            <div class="flex items-start justify-between gap-2">
              <p class="text-[12px] font-black text-amber-800">📅 上次完成日期</p>
              <button type="button" @click="closeCareMaintenanceDateModal"
                      class="text-slate-400 text-lg leading-none shrink-0 px-1">×</button>
            </div>
          </div>
          <div class="app-modal-body space-y-3">
          <p class="text-[9px] font-bold text-slate-500 leading-relaxed">
            {{ careMaintenanceDateTarget?.title || '此項目' }} — 設定上次完成日期，系統會依週期計算下次到期提醒。
          </p>
          <div class="date-field-shell">
            <label class="text-[9px] font-black text-slate-500">完成日期</label>
            <input v-model="careMaintenanceDateDraft" type="date"
                   class="datetime-field datetime-field--block w-full mt-1 bg-slate-50 border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-200" />
          </div>
          <p class="text-[8px] font-bold text-slate-400">留空並按「清除日期」可重設為尚未記錄。</p>
          </div>
          <div class="app-modal-footer">
            <button type="button"
                    @click="careMaintenanceDateDraft = ''"
                    class="app-modal-btn app-modal-btn--ghost !text-slate-500 !bg-slate-100">
              清除日期
            </button>
            <button type="button" @click="closeCareMaintenanceDateModal"
                    class="app-modal-btn app-modal-btn--secondary">取消</button>
            <button type="button" @click="saveCareMaintenanceCompletionDate"
                    class="app-modal-btn app-modal-btn--primary !bg-amber-500 !border-amber-500 hover:!bg-amber-600">
              儲存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
  </template>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import splashVideoSrc from './assets/Brown One Line Pet Sitting Logo 2.mp4'
import AuthScreen from './components/AuthScreen.vue'
import { watchAuthState, signOutUser } from './auth'
import { db } from './firebase'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import {
  registerAppSyncPayload,
  registerAppSyncHandlers,
  scheduleAppSyncPush,
  flushAppSyncPush,
  pullAppSyncFromServer,
  subscribeToAppSync,
  destroyAppSync,
  initAppSyncForUser,
  pauseAppSyncPush,
  pauseRemoteApply,
  resetAppSyncPushFingerprint,
  markAppSyncLocalAuthoritative,
} from './appSync'
import {
  registerCareSync,
  pushCareSync,
  pullCareSyncFromServer,
  getCareSyncStatus,
  subscribeCareSync,
  destroyCareSync,
  initCareSyncForUser,
  pauseCareSyncPush,
  pauseCareRemoteApply,
  resetCareSyncPushFingerprint,
  markCareSyncLocalAuthoritative,
} from './careSync'
import { handleImageUpload, UPLOAD_LIMITS, setImageUploadUserId } from './imageUpload'
import { APP_BRAND_NAME, APP_BRAND_TAGLINE } from './branding'

const authUser = ref(null)
const authReady = ref(false)
let activeSessionUid = null
let storageUserPrefix = ''

const authEmail = computed(() => authUser.value?.email || '')

const showSplash = ref(true)
const splashVideo = ref(null)
const splashVideoFailed = ref(false)

const PTR_THRESHOLD = 70
const ptrPull = ref(0)
const ptrRefreshing = ref(false)
const ptrShowSuccess = ref(false)
const ptrTracking = ref(false)
const ptrStartY = ref(0)

const ptrReady = computed(() => ptrPull.value >= PTR_THRESHOLD)
const ptrHintText = computed(() => {
  if (ptrShowSuccess.value) return '更新成功'
  if (ptrRefreshing.value) return '正在更新…'
  if (ptrReady.value) return '放開以重新整理'
  return '下拉更新'
})
const ptrIndicatorOpacity = computed(() => {
  if (ptrRefreshing.value || ptrShowSuccess.value) return 1
  return Math.min(1, ptrPull.value / PTR_THRESHOLD)
})
const ptrContentStyle = computed(() => {
  if (ptrRefreshing.value || ptrShowSuccess.value) return {}
  if (ptrPull.value > 0) return { transform: `translateY(${Math.min(ptrPull.value * 0.42, 52)}px)` }
  return {}
})

const isPullRefreshBlocked = () => {
  if (showSplash.value || ptrRefreshing.value) return true
  if (isAppModalOpen.value) return true
  if (showHeaderSettingsMenu.value || careMaintenanceCustomModalOpen.value) return true
  return false
}

const onPullRefreshStart = (e) => {
  if (isPullRefreshBlocked()) return
  if (window.scrollY > 8) return
  ptrStartY.value = e.touches[0]?.clientY ?? 0
  ptrTracking.value = true
}

const onPullRefreshMove = (e) => {
  if (!ptrTracking.value || ptrRefreshing.value || isPullRefreshBlocked()) return
  if (window.scrollY > 8) {
    ptrTracking.value = false
    ptrPull.value = 0
    return
  }
  const dy = (e.touches[0]?.clientY ?? 0) - ptrStartY.value
  if (dy <= 0) {
    ptrPull.value = 0
    return
  }
  e.preventDefault()
  ptrPull.value = Math.min(dy * 0.55, 108)
}

const onPullRefreshEnd = () => {
  if (!ptrTracking.value || ptrRefreshing.value) return
  ptrTracking.value = false
  if (ptrPull.value >= PTR_THRESHOLD) {
    triggerPullRefresh()
    return
  }
  ptrPull.value = 0
}

const triggerPullRefresh = async () => {
  if (ptrRefreshing.value) return
  ptrRefreshing.value = true
  ptrShowSuccess.value = false
  ptrPull.value = PTR_THRESHOLD
  try {
    await fetchLatestData({ preserveView: true })
    ptrRefreshing.value = false
    ptrPull.value = 0
    ptrShowSuccess.value = true
    setTimeout(() => {
      ptrShowSuccess.value = false
    }, 1400)
  } catch (err) {
    console.error('Pull refresh failed:', err)
    ptrRefreshing.value = false
    ptrPull.value = 0
  }
}

const enterApp = () => {
  if (!showSplash.value) return
  showSplash.value = false
}
const onSplashVideoError = () => {
  splashVideoFailed.value = true
  setTimeout(enterApp, 600)
}
const onSplashTap = () => enterApp()
const onSplashTimeUpdate = () => {
  const video = splashVideo.value
  if (!video || splashVideoFailed.value || !showSplash.value) return
  if (video.duration > 0 && video.currentTime >= video.duration - 0.15) enterApp()
}
onMounted(() => {
  if (splashVideo.value) {
    splashVideo.value.muted = true
    splashVideo.value.play().catch(() => {})
    if (splashVideo.value.error) onSplashVideoError()
  }
  setTimeout(() => {
    if (!splashVideo.value?.error && splashVideo.value?.readyState === 0) onSplashVideoError()
  }, 800)
})

const currentTab = ref('home')

const APP_NAV_TABS = [
  { id: 'diet', icon: '🍽️', label: '餐飲紀錄', title: '餐飲紀錄' },
  { id: 'excretion', icon: '🚽', label: '排便紀錄', title: '排便紀錄' },
  { id: 'stats', icon: '🐱', label: '互動紀錄', title: '互動紀錄' },
  { id: 'home', icon: '🏠', label: '主頁', title: '主頁', isCenter: true },
  { id: 'care', icon: '📋', label: '照護清單', title: '照護清單', iconType: 'clipboard' },
  { id: 'medical', icon: '💉', label: '醫療紀錄', title: '醫療紀錄' },
  { id: 'docs', icon: '📁', label: '表單檔案', title: '表單檔案' }
]

const isNavTabActive = (tab) => currentTab.value === tab.id

const navTabActiveShellClass = (tab) => {
  const active = isNavTabActive(tab)
  const base = 'rounded-full border-2 transition-all duration-200 ease-in-out'
  if (active) {
    return `${base} border-[#D4AF37] bg-[#ffffff10] text-white`
  }
  return `${base} border-transparent bg-transparent text-slate-400 hover:text-slate-200`
}

const getTodayString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getDateStringDaysAgo = (days) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getDateStringDaysFromNow = (days) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const selectedDate = ref(getTodayString())

const hexToRgb = (hex) => {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return [0, 0, 0]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')
const mixHex = (a, b, ratio) => {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex(A.map((v, i) => v * (1 - ratio) + B[i] * ratio))
}

const buildThemeEntry = ({ primaryHex, bgHex, gradient }) => ({
  primaryHex,
  bgHex,
  gradient,
  borderHex: mixHex(primaryHex, '#ffffff', 0.72),
  accentBgHex: mixHex(primaryHex, '#ffffff', 0.88),
  accentBgStrongHex: mixHex(primaryHex, '#ffffff', 0.78),
  accentBorderHex: mixHex(primaryHex, '#ffffff', 0.58),
  accentTextHex: mixHex(primaryHex, '#1e293b', 0.42),
  panelBgHex: mixHex(primaryHex, '#ffffff', 0.92),
  dividerHex: mixHex(primaryHex, '#ffffff', 0.9)
})

const themeColorDefinitions = {
  morandiPink: { primaryHex: '#C7A099', bgHex: '#F6F1F0', gradient: 'linear-gradient(135deg, #C7A099 0%, #A8837C 100%)' },
  slateBlue: { primaryHex: '#8B9DBA', bgHex: '#F0F3F7', gradient: 'linear-gradient(135deg, #8B9DBA 0%, #6E82A1 100%)' },
  dustyPurple: { primaryHex: '#9F7F9B', bgHex: '#F5EFF4', gradient: 'linear-gradient(135deg, #9F7F9B 0%, #83627F 100%)' },
  coralRed: { primaryHex: '#F07C7C', bgHex: '#FDF2F2', gradient: 'linear-gradient(135deg, #F07C7C 0%, #D45F5F 100%)' },
  slateGray: { primaryHex: '#82898D', bgHex: '#EFF1F2', gradient: 'linear-gradient(135deg, #82898D 0%, #6B7278 100%)' },
  lilacMist: { primaryHex: '#ECE3E8', bgHex: '#F9F6F8', gradient: 'linear-gradient(135deg, #ECE3E8 0%, #D4C5CE 100%)' },
  sageGold: { primaryHex: '#CECB88', bgHex: '#F6F5E9', gradient: 'linear-gradient(135deg, #CECB88 0%, #B0AD6E 100%)' },
  forestGreen: { primaryHex: '#478058', bgHex: '#EDF3EF', gradient: 'linear-gradient(135deg, #478058 0%, #3A6647 100%)' },
  warmBeige: { primaryHex: '#E1D1CC', bgHex: '#F7F2F0', gradient: 'linear-gradient(135deg, #E1D1CC 0%, #C9B5AE 100%)' }
}

const themeColors = Object.fromEntries(
  Object.entries(themeColorDefinitions).map(([key, def]) => [key, buildThemeEntry(def)])
)

const CAT_THEME_COLOR_KEYS = [
  'morandiPink', 'slateBlue', 'dustyPurple', 'coralRed', 'slateGray',
  'lilacMist', 'sageGold', 'forestGreen', 'warmBeige'
]

const resolveCatThemeColor = (color) =>
  (color && CAT_THEME_COLOR_KEYS.includes(color) && themeColors[color]) ? color : 'morandiPink'

const LEGACY_MEAL_KEYS = {
  breakfast: '1',
  lunch: '2',
  dinner: '3',
  '早餐': '1',
  '午餐': '2',
  '晚餐': '3'
}

const MEAL_DEFAULT_TIMES = ['08:00', '12:00', '18:00', '10:00', '14:00', '16:00', '20:00', '09:00', '11:00', '19:00']

const isNumericMealKey = (k) => /^([1-9]|10)$/.test(String(k))

const sortMealKeys = (keys) => [...keys].sort((a, b) => Number(a) - Number(b))

// 主食/副食/零食等分類：用於「一筆時間」內的快速選填（9項）
const FOOD_TYPE_OPTIONS = [
  { value: '乾糧', label: '乾糧', chipLabel: '乾糧' },
  { value: '濕糧（正餐）', label: '濕糧（正餐）', chipLabel: '濕·正' },
  { value: '濕糧（副食罐）', label: '濕糧（副食罐）', chipLabel: '濕·副' },
  { value: '湯湯', label: '湯湯', chipLabel: '湯' },
  { value: '凍乾', label: '凍乾', chipLabel: '凍乾' },
  { value: '生食/鮮食', label: '生食/鮮食', chipLabel: '生食' },
  { value: '處方糧', label: '處方糧', chipLabel: '處方' },
  { value: '保健品', label: '保健品', chipLabel: '保健' },
  { value: '零食', label: '零食', chipLabel: '零食' }
]

const DRY_FOOD_TYPES = ['乾糧', '凍乾', '處方糧']
const WET_FOOD_TYPES = ['濕糧（正餐）', '濕糧（副食罐）', '湯湯', '生食/鮮食']
/** 與食物類型 chip（如「零食」）同尺寸 */
const mealFoodSaveBtnClass = 'shrink-0 px-0.5 py-0.5 rounded-full border text-[9px] font-black transition-all whitespace-nowrap leading-none text-center theme-btn-primary shadow-sm'
const isDryFoodType = (t) => DRY_FOOD_TYPES.includes(t)
const isWetFoodType = (t) => WET_FOOD_TYPES.includes(t)

const createEmptyFoodRecord = () => ({ brand: '', flavor: '', amount: '', love: null })

const foodRecordHasContent = (rec) => {
  if (!rec) return false
  return !!(rec.brand?.trim() || rec.flavor?.trim() || rec.amount?.trim() || rec.love != null)
}

/** 未填欄位：淺色字；已填：深色字 */
const mealFieldTextClass = (val) => {
  return String(val ?? '').trim()
    ? 'text-slate-800 placeholder:text-slate-400/80'
    : 'text-slate-400 placeholder:text-slate-400/80'
}

const createEmptySavedFoodSnapshot = () => ({
  dryByCategory: {},
  wetByCategory: {},
  supplementRecord: null,
  treatRecord: null
})

const ensureSavedFoodSnapshot = (slot) => {
  if (!slot) return
  if (!slot.savedFoodSnapshot || typeof slot.savedFoodSnapshot !== 'object') {
    slot.savedFoodSnapshot = createEmptySavedFoodSnapshot()
  }
  if (!slot.savedFoodSnapshot.dryByCategory) slot.savedFoodSnapshot.dryByCategory = {}
  if (!slot.savedFoodSnapshot.wetByCategory) slot.savedFoodSnapshot.wetByCategory = {}
}

const cloneFoodRecord = (rec) => ({
  brand: rec?.brand || '',
  flavor: rec?.flavor || '',
  amount: rec?.amount || '',
  love: rec?.love ?? null
})

const cloneSupplementRecord = (rec) => ({
  supplements: Array.isArray(rec?.supplements) ? [...rec.supplements] : [],
  supplementOther: rec?.supplementOther || ''
})

const cloneTreatRecord = (rec) => ({
  treatsType: rec?.treatsType || '',
  treatsLove: rec?.treatsLove ?? null
})

const createEmptySupplementRecord = () => ({ supplements: [], supplementOther: '' })
const createEmptyTreatRecord = () => ({ treatsType: '', treatsLove: null })

/** 按「儲存」時，將目前食物/項目寫入一覽用快照 */
const commitSavedFoodForActiveType = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  ensureSavedFoodSnapshot(slot)
  const snap = slot.savedFoodSnapshot
  const ft = slot.foodType || '乾糧'

  if (isDryFoodType(ft)) {
    const rec = slot.dryByCategory[ft] || createEmptyFoodRecord()
    if (foodRecordHasContent(rec)) {
      snap.dryByCategory[ft] = cloneFoodRecord(rec)
    } else {
      delete snap.dryByCategory[ft]
    }
    return
  }

  if (isWetFoodType(ft)) {
    const rec = slot.wetByCategory[ft] || createEmptyFoodRecord()
    if (foodRecordHasContent(rec)) {
      snap.wetByCategory[ft] = cloneFoodRecord(rec)
    } else {
      delete snap.wetByCategory[ft]
    }
    return
  }

  if (ft === '保健品') {
    const rec = slot.supplementRecord || createEmptySupplementRecord()
    snap.supplementRecord = supplementRecordHasContent(rec) ? cloneSupplementRecord(rec) : null
    return
  }

  if (ft === '零食') {
    const rec = slot.treatRecord || createEmptyTreatRecord()
    snap.treatRecord = treatRecordHasContent(rec) ? cloneTreatRecord(rec) : null
  }
}

const supplementRecordHasContent = (rec) => {
  if (!rec) return false
  return (Array.isArray(rec.supplements) && rec.supplements.length > 0) || !!rec.supplementOther?.trim()
}

const treatRecordHasContent = (rec) => !!rec?.treatsType?.trim()

const ensureCategoryMaps = (slot) => {
  if (!slot) return
  if (!slot.dryByCategory || typeof slot.dryByCategory !== 'object') slot.dryByCategory = {}
  if (!slot.wetByCategory || typeof slot.wetByCategory !== 'object') slot.wetByCategory = {}
  if (!slot.supplementRecord) slot.supplementRecord = createEmptySupplementRecord()
  if (!slot.treatRecord) slot.treatRecord = createEmptyTreatRecord()

  const dryCat = isDryFoodType(slot.dryCategory) ? slot.dryCategory : '乾糧'
  const hasFlatDry = !!(slot.dryBrand?.trim() || slot.dryFlavor?.trim() || slot.dryAmount?.trim() || slot.dryLove != null)
  // 僅在目前編輯類型與乾糧類一致時，才把畫面欄位寫入對應分類（避免經保健切換後誤寫入處方）
  if (isDryFoodType(slot.foodType) && slot.foodType === dryCat && hasFlatDry && !foodRecordHasContent(slot.dryByCategory[dryCat])) {
    slot.dryByCategory[dryCat] = {
      brand: slot.dryBrand || '',
      flavor: slot.dryFlavor || '',
      amount: slot.dryAmount || '',
      love: slot.dryLove ?? null
    }
  }

  const wetCat = isWetFoodType(slot.wetCategory) ? slot.wetCategory : '濕糧（正餐）'
  const hasFlatWet = !!(slot.wetBrand?.trim() || slot.wetFlavor?.trim() || slot.wetAmount?.trim() || slot.wetLove != null)
  if (isWetFoodType(slot.foodType) && slot.foodType === wetCat && hasFlatWet && !foodRecordHasContent(slot.wetByCategory[wetCat])) {
    slot.wetByCategory[wetCat] = {
      brand: slot.wetBrand || '',
      flavor: slot.wetFlavor || '',
      amount: slot.wetAmount || '',
      love: slot.wetLove ?? null
    }
  }

  const hasFlatSupp = (Array.isArray(slot.supplements) && slot.supplements.length > 0) || slot.supplementOther?.trim()
  if (slot.foodType === '保健品' && hasFlatSupp && !supplementRecordHasContent(slot.supplementRecord)) {
    slot.supplementRecord = {
      supplements: Array.isArray(slot.supplements) ? [...slot.supplements] : [],
      supplementOther: slot.supplementOther || ''
    }
  }

  const hasFlatTreat = slot.treatsType?.trim()
  if (slot.foodType === '零食' && hasFlatTreat && !treatRecordHasContent(slot.treatRecord)) {
    slot.treatRecord = {
      treatsType: slot.treatsType || '',
      treatsLove: slot.treatsLove ?? null
    }
  }
}

const clearDryFlatFields = (slot) => {
  if (!slot) return
  slot.dryBrand = ''
  slot.dryFlavor = ''
  slot.dryAmount = ''
  slot.dryLove = null
}

const clearWetFlatFields = (slot) => {
  if (!slot) return
  slot.wetBrand = ''
  slot.wetFlavor = ''
  slot.wetAmount = ''
  slot.wetLove = null
}

const clearSupplementFlatFields = (slot) => {
  if (!slot) return
  slot.supplements = []
  slot.supplementOther = ''
}

const clearTreatsFlatFields = (slot) => {
  if (!slot) return
  slot.treatsType = ''
  slot.treatsLove = null
}

const stashDryToCategory = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  const cat = isDryFoodType(slot.foodType) ? slot.foodType : (isDryFoodType(slot.dryCategory) ? slot.dryCategory : null)
  if (!cat) return
  slot.dryByCategory[cat] = {
    brand: slot.dryBrand || '',
    flavor: slot.dryFlavor || '',
    amount: slot.dryAmount || '',
    love: slot.dryLove ?? null
  }
  slot.dryCategory = cat
}

const stashWetToCategory = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  const cat = isWetFoodType(slot.foodType) ? slot.foodType : (isWetFoodType(slot.wetCategory) ? slot.wetCategory : null)
  if (!cat) return
  slot.wetByCategory[cat] = {
    brand: slot.wetBrand || '',
    flavor: slot.wetFlavor || '',
    amount: slot.wetAmount || '',
    love: slot.wetLove ?? null
  }
  slot.wetCategory = cat
}

const stashSupplementsToSlot = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  slot.supplementRecord = {
    supplements: Array.isArray(slot.supplements) ? [...slot.supplements] : [],
    supplementOther: slot.supplementOther || ''
  }
}

const stashTreatsToSlot = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  slot.treatRecord = {
    treatsType: slot.treatsType || '',
    treatsLove: slot.treatsLove ?? null
  }
}

const loadSupplementsToFlat = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  const rec = slot.supplementRecord || createEmptySupplementRecord()
  slot.supplements = Array.isArray(rec.supplements) ? [...rec.supplements] : []
  slot.supplementOther = rec.supplementOther || ''
}

const loadTreatsToFlat = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  const rec = slot.treatRecord || createEmptyTreatRecord()
  slot.treatsType = rec.treatsType || ''
  slot.treatsLove = rec.treatsLove ?? null
}

const stashActiveFoodFields = (slot) => {
  if (!slot) return
  if (isDryFoodType(slot.foodType)) stashDryToCategory(slot)
  if (isWetFoodType(slot.foodType)) stashWetToCategory(slot)
  if (slot.foodType === '保健品') stashSupplementsToSlot(slot)
  if (slot.foodType === '零食') stashTreatsToSlot(slot)
}

const loadDryFromCategory = (slot, category) => {
  if (!slot || !isDryFoodType(category)) return
  ensureCategoryMaps(slot)
  const rec = slot.dryByCategory[category] || createEmptyFoodRecord()
  slot.dryBrand = rec.brand || ''
  slot.dryFlavor = rec.flavor || ''
  slot.dryAmount = rec.amount || ''
  slot.dryLove = rec.love ?? null
  slot.dryCategory = category
}

const loadWetFromCategory = (slot, category) => {
  if (!slot || !isWetFoodType(category)) return
  ensureCategoryMaps(slot)
  const rec = slot.wetByCategory[category] || createEmptyFoodRecord()
  slot.wetBrand = rec.brand || ''
  slot.wetFlavor = rec.flavor || ''
  slot.wetAmount = rec.amount || ''
  slot.wetLove = rec.love ?? null
  slot.wetCategory = category
}

const switchMealFoodType = (slot, newType) => {
  if (!slot || !newType) return
  const prev = slot.foodType || '乾糧'
  if (isDryFoodType(prev)) stashDryToCategory(slot)
  if (isWetFoodType(prev)) stashWetToCategory(slot)
  if (prev === '保健品') stashSupplementsToSlot(slot)
  if (prev === '零食') stashTreatsToSlot(slot)

  slot.foodType = newType

  if (!isDryFoodType(newType)) clearDryFlatFields(slot)
  if (!isWetFoodType(newType)) clearWetFlatFields(slot)
  if (newType !== '保健品') clearSupplementFlatFields(slot)
  if (newType !== '零食') clearTreatsFlatFields(slot)

  if (isDryFoodType(newType)) {
    slot.dryCategory = newType
    loadDryFromCategory(slot, newType)
  } else if (isWetFoodType(newType)) {
    slot.wetCategory = newType
    loadWetFromCategory(slot, newType)
  } else if (newType === '保健品') {
    loadSupplementsToFlat(slot)
  } else if (newType === '零食') {
    loadTreatsToFlat(slot)
  }
}

const getDryRecordForCategory = (slot, category, editingSlotId = null) => {
  if (!slot) return createEmptyFoodRecord()
  ensureCategoryMaps(slot)
  if (editingSlotId && slot.id === editingSlotId && slot.foodType === category && isDryFoodType(category)) {
    return {
      brand: slot.dryBrand || '',
      flavor: slot.dryFlavor || '',
      amount: slot.dryAmount || '',
      love: slot.dryLove ?? null
    }
  }
  return slot.dryByCategory[category] || createEmptyFoodRecord()
}

const getWetRecordForCategory = (slot, category, editingSlotId = null) => {
  if (!slot) return createEmptyFoodRecord()
  ensureCategoryMaps(slot)
  if (editingSlotId && slot.id === editingSlotId && slot.foodType === category && isWetFoodType(category)) {
    return {
      brand: slot.wetBrand || '',
      flavor: slot.wetFlavor || '',
      amount: slot.wetAmount || '',
      love: slot.wetLove ?? null
    }
  }
  return slot.wetByCategory[category] || createEmptyFoodRecord()
}

const getSupplementRecord = (slot, editingSlotId = null) => {
  if (!slot) return createEmptySupplementRecord()
  ensureCategoryMaps(slot)
  if (editingSlotId && slot.id === editingSlotId && slot.foodType === '保健品') {
    return {
      supplements: Array.isArray(slot.supplements) ? [...slot.supplements] : [],
      supplementOther: slot.supplementOther || ''
    }
  }
  return slot.supplementRecord || createEmptySupplementRecord()
}

const getTreatRecord = (slot, editingSlotId = null) => {
  if (!slot) return createEmptyTreatRecord()
  ensureCategoryMaps(slot)
  if (editingSlotId && slot.id === editingSlotId && slot.foodType === '零食') {
    return {
      treatsType: slot.treatsType || '',
      treatsLove: slot.treatsLove ?? null
    }
  }
  return slot.treatRecord || createEmptyTreatRecord()
}

const SUPPLEMENT_PRESETS = ['益生菌', '排毛粉', '離胺酸']
const SUPPLEMENT_OTHER = '其他'

const activeMealId = ref('')

const formatMealTimeDisplay = (at) => {
  if (!at) return '—'
  const m = String(at).match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : String(at)
}

const getNowDatetimeLocal = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getDatetimeForSelectedDate = () => {
  const dateKey = selectedDate.value
  if (dateKey === getTodayString()) return getNowDatetimeLocal()
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${dateKey}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const dayMealEntries = computed(() => {
  const day = activeDiet.value
  if (!Array.isArray(day?.mealEntries)) return []
  return [...day.mealEntries].sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
})

const selectMealEntry = (id) => {
  if (!id) return
  activeMealId.value = id
}

const addMealEntry = () => {
  const day = activeDiet.value
  if (!Array.isArray(day.mealEntries)) day.mealEntries = []
  const entry = createMealEntry(getDatetimeForSelectedDate())
  // 預設揀乾糧，避免新紀錄時下拉顯示空白
  entry.foodType = '乾糧'
  entry.dryCategory = '乾糧'
  day.mealEntries.push(entry)
  activeMealId.value = entry.id
}

const deleteActiveMealEntry = () => {
  if (!activeMealId.value) return
  if (!confirm('確定刪除此筆餵食紀錄？')) return
  const day = activeDiet.value
  if (!Array.isArray(day.mealEntries)) return
  const idx = day.mealEntries.findIndex(e => e.id === activeMealId.value)
  if (idx >= 0) day.mealEntries.splice(idx, 1)
  syncActiveMealIdForDay()
}

const syncActiveMealIdForDay = () => {
  const entries = dayMealEntries.value
  if (entries.length === 0) {
    activeMealId.value = ''
    return
  }
  if (!entries.some(e => e.id === activeMealId.value)) {
    activeMealId.value = entries[entries.length - 1].id
  }
}

const MEDICAL_TYPE_PRESETS = ['睇醫生', '打針', '手術', '身體檢查', '覆診']
const MEDICAL_TYPE_OTHER = '其他'
const MEDICAL_TYPE_LEGACY_MAP = {
  睇醫: '睇醫生',
  食藥: '覆診',
  檢查: '身體檢查'
}

const MEDICATION_FORM_OPTIONS = ['膠囊', '毫升', '滴']
const MEDICATION_MEAL_TIMING_OPTIONS = ['飯前服', '飯後服', '需要時服']

const getMedicationFormLabel = (value) => value || ''

const createEmptyMedicationRow = () => ({
  drugName: '',
  totalDays: '',
  form: '',
  timesPerDay: '',
  dosePerTime: '',
  mealTiming: ''
})

const createMedicalEntry = (at) => ({
  id: safeUUID(),
  at,
  type: '睇醫生',
  typeOther: '',
  registrationNo: '',
  title: '',
  clinic: '',
  doctorName: '',
  diagnosis: '',
  nextVisitDate: '',
  nextVisitTime: '',
  addReminderToHome: false,
  reminderId: '',
  medications: [createEmptyMedicationRow()],
  completeFullCourse: false,
  needMedicationChart: false,
  medicationChecks: [],
  medicationChartExpanded: true,
  isCollapsed: false,
  detail: '',
  saved: false
})

const ensureMedicalMedications = (entry) => {
  if (!entry) return
  if (!Array.isArray(entry.medications) || entry.medications.length === 0) {
    entry.medications = [createEmptyMedicationRow()]
  }
  entry.medications.forEach(row => {
    if (row.drugName === undefined) row.drugName = ''
    if (row.totalDays === undefined) row.totalDays = ''
    if (row.form === undefined) row.form = ''
    if (row.timesPerDay === undefined) row.timesPerDay = ''
    if (row.dosePerTime === undefined) row.dosePerTime = row.amount || ''
    if (row.mealTiming === undefined) row.mealTiming = ''
    if (Array.isArray(row.mealTiming)) row.mealTiming = row.mealTiming[0] || ''
  })
}

const addMedicalMedicationRow = (entry) => {
  if (!entry) return
  ensureMedicalMedications(entry)
  entry.medications.push(createEmptyMedicationRow())
}

const removeMedicalMedicationRow = (entry, index) => {
  if (!entry?.medications || entry.medications.length <= 1) return
  entry.medications.splice(index, 1)
  if (entry.needMedicationChart) ensureMedicationChartChecks(entry)
}

const MEDICATION_CHART_MAX_DAYS = 90
const MEDICATION_CHART_MAX_TIMES = 12

const parseMedScheduleCount = (value, max) => {
  const n = parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(n, max)
}

const ensureMedicationChartChecks = (entry) => {
  if (!entry) return
  if (entry.needMedicationChart === undefined) entry.needMedicationChart = false
  if (!Array.isArray(entry.medicationChecks)) entry.medicationChecks = []
  ensureMedicalMedications(entry)
  const meds = entry.medications
  while (entry.medicationChecks.length < meds.length) entry.medicationChecks.push([])
  entry.medicationChecks.length = meds.length
  meds.forEach((med, medIdx) => {
    const days = parseMedScheduleCount(med.totalDays, MEDICATION_CHART_MAX_DAYS)
    const times = parseMedScheduleCount(med.timesPerDay, MEDICATION_CHART_MAX_TIMES)
    const oldChart = entry.medicationChecks[medIdx]
    const nextChart = []
    for (let dayIdx = 0; dayIdx < days; dayIdx++) {
      const oldRow = Array.isArray(oldChart?.[dayIdx]) ? oldChart[dayIdx] : []
      const row = []
      for (let doseIdx = 0; doseIdx < times; doseIdx++) {
        row.push(oldRow[doseIdx] === true)
      }
      nextChart.push(row)
    }
    entry.medicationChecks[medIdx] = nextChart
  })
}

const getMedicationChartPlans = (entry) => {
  if (!entry?.needMedicationChart) return []
  ensureMedicationChartChecks(entry)
  return entry.medications
    .map((med, medIdx) => {
      const days = parseMedScheduleCount(med.totalDays, MEDICATION_CHART_MAX_DAYS)
      const times = parseMedScheduleCount(med.timesPerDay, MEDICATION_CHART_MAX_TIMES)
      const name = med.drugName?.trim() || `藥物 ${medIdx + 1}`
      return {
        medIdx,
        name,
        days,
        times,
        checks: entry.medicationChecks[medIdx] || []
      }
    })
    .filter(plan => plan.days > 0 && plan.times > 0)
}

const countMedicationChartDone = (plan) => {
  if (!plan?.checks?.length) return 0
  return plan.checks.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
}

const toggleMedicationCheck = (entry, medIdx, dayIdx, doseIdx) => {
  if (!entry) return
  ensureMedicationChartChecks(entry)
  const row = entry.medicationChecks?.[medIdx]?.[dayIdx]
  if (!row || doseIdx >= row.length) return
  row[doseIdx] = !row[doseIdx]
  persistCats()
}

const onMedicationChartToggle = () => {
  if (!activeMedicalRecord.value) return
  ensureMedicationChartChecks(activeMedicalRecord.value)
  if (activeMedicalRecord.value.needMedicationChart && activeMedicalRecord.value.medicationChartExpanded === undefined) {
    activeMedicalRecord.value.medicationChartExpanded = true
  }
  persistCats()
}

const toggleMedicationChartExpanded = (entry) => {
  if (!entry) return
  if (entry.medicationChartExpanded === undefined) entry.medicationChartExpanded = true
  entry.medicationChartExpanded = !entry.medicationChartExpanded
  persistCats()
}

const formatMedicalMedicationsSummary = (entry) => {
  if (!entry?.medications?.length) return ''
  return entry.medications
    .filter(m =>
      m.drugName?.trim() ||
      m.totalDays?.trim() ||
      m.form?.trim() ||
      m.dosePerTime?.trim() ||
      m.amount?.trim() ||
      m.timesPerDay?.trim() ||
      m.mealTiming?.trim()
    )
    .map(m => {
      const name = stripOverviewText(m.drugName) || '藥物'
      const form = getMedicationFormLabel(m.form)
      const dose = stripOverviewText(m.dosePerTime || m.amount)
      const days = stripOverviewText(m.totalDays)
      const times = stripOverviewText(m.timesPerDay)
      const timing = stripOverviewText(m.mealTiming)
      let s = name
      if (form) s += `（${form}）`
      if (days) s += `·共${days}日`
      if (dose) s += ` 每次${dose}`
      if (times) s += `·每日${times}次`
      if (timing) s += `·${timing}`
      return s
    })
    .join('；')
}

const upsertMedicalFollowUpReminder = (cat, entry) => {
  if (!cat || !entry?.nextVisitDate) return
  if (!Array.isArray(cat.reminders)) cat.reminders = []
  const label = entry.title?.trim() || getMedicalTypeDisplay(entry)
  const payload = {
    icon: '🏥',
    title: `覆診：${label}`,
    nextDate: entry.nextVisitDate,
    periodType: 'day',
    periodValue: 14
  }
  if (entry.reminderId) {
    const idx = cat.reminders.findIndex(r => r.id === entry.reminderId)
    if (idx >= 0) {
      Object.assign(cat.reminders[idx], payload)
      return
    }
  }
  const id = safeUUID()
  entry.reminderId = id
  cat.reminders.push({ id, ...payload })
}

const removeMedicalFollowUpReminder = (cat, entry) => {
  if (!cat?.reminders || !entry?.reminderId) return
  const idx = cat.reminders.findIndex(r => r.id === entry.reminderId)
  if (idx >= 0) cat.reminders.splice(idx, 1)
  entry.reminderId = ''
}

const getMedicalTypeDisplay = (entry) => {
  if (!entry) return ''
  if (entry.type === MEDICAL_TYPE_OTHER) {
    return stripOverviewText(entry.typeOther) || '其他'
  }
  return entry.type || '睇醫生'
}

const selectMedicalType = (opt) => {
  if (!activeMedicalRecord.value) return
  activeMedicalRecord.value.type = opt
  if (opt !== MEDICAL_TYPE_OTHER) activeMedicalRecord.value.typeOther = ''
}

const ensureMedicalEntry = (entry) => {
  if (!entry) return
  if (!entry.id) entry.id = safeUUID()
  if (entry.type && MEDICAL_TYPE_LEGACY_MAP[entry.type]) {
    entry.type = MEDICAL_TYPE_LEGACY_MAP[entry.type]
  }
  if (!entry.type) entry.type = '睇醫生'
  if (entry.typeOther === undefined) entry.typeOther = ''
  if (entry.registrationNo === undefined) entry.registrationNo = ''
  if (entry.title === undefined) entry.title = ''
  if (entry.clinic === undefined) entry.clinic = ''
  if (entry.doctorName === undefined) entry.doctorName = ''
  if (entry.diagnosis === undefined) entry.diagnosis = ''
  if (entry.nextVisitDate === undefined) entry.nextVisitDate = ''
  if (entry.nextVisitTime === undefined) entry.nextVisitTime = ''
  if (entry.addReminderToHome === undefined) entry.addReminderToHome = !!entry.reminderId
  if (entry.reminderId === undefined) entry.reminderId = ''
  ensureMedicalMedications(entry)
  if (entry.completeFullCourse === undefined) entry.completeFullCourse = false
  if (entry.needMedicationChart === undefined) entry.needMedicationChart = false
  if (!Array.isArray(entry.medicationChecks)) entry.medicationChecks = []
  if (entry.medicationChartExpanded === undefined) entry.medicationChartExpanded = true
  if (entry.isCollapsed === undefined) entry.isCollapsed = false
  if (entry.needMedicationChart) ensureMedicationChartChecks(entry)
  if (entry.detail === undefined) entry.detail = ''
  if (entry.saved === undefined) {
    entry.saved = !!(
      getMedicalTypeDisplay(entry) ||
      entry.registrationNo?.trim() ||
      entry.title?.trim() ||
      entry.clinic?.trim() ||
      entry.doctorName?.trim() ||
      entry.diagnosis?.trim() ||
      entry.nextVisitTime?.trim() ||
      entry.detail?.trim() ||
      entry.completeFullCourse ||
      formatMedicalMedicationsSummary(entry)
    )
  }
}

const activeMedicalId = ref('')
const medicalSaveMessage = ref('')
let medicalSaveMessageTimer = null

const EXCRETION_RECORD_TYPES = ['排泄觀察']

const EXCRETION_EVENT_OPTIONS = [
  { key: 'pee', label: '排尿', icon: '💧' },
  { key: 'poop', label: '排便', icon: '💩' },
  { key: 'vomit', label: '嘔吐', icon: '🤢' }
]

const EXCRETION_PEE_VOLUME = ['正常', '偏少', '偏多', '很少']
const EXCRETION_PEE_COLOR = ['正常（淡黃）', '深黃', '渾濁', '帶血（紅色警示）', '其他']
const EXCRETION_POOP_CONDITION = ['順利排出', '有用力', '排不出', '帶血（紅色警示）', '腹瀉']
const EXCRETION_POOP_SHAPE = ['正常（成形）', '軟便', '稀爛', '乾硬', '極少']
const EXCRETION_VOMIT_TYPES = ['毛球', '未消化食物', '黃色液體', '帶血（紅色警示）', '其他']

const createEmptyExcretionForm = () => ({
  recordType: '排泄觀察',
  date: getTodayString(),
  time: '12:00',
  events: { pee: false, poop: false, vomit: false },
  pee: { volume: '正常', urineColor: '正常（淡黃）', behaviorNote: '' },
  poop: { condition: '順利排出', shape: '正常（成形）', behaviorNote: '' },
  vomit: { matterType: '毛球', count: 1 },
  photos: []
})

const showExcretionModal = ref(false)
const excretionFormError = ref('')
const excretionPhotoInput = ref(null)
const excretionForm = ref(createEmptyExcretionForm())

const isExcretionAlertValue = (val) => {
  const s = String(val || '')
  return s.includes('紅色警示') || s.includes('帶血')
}

const excretionEventChipClass = (key, selected) => {
  const base = 'flex-1 py-2 rounded-xl border text-[10px] font-black transition-all flex flex-col items-center gap-0.5 min-w-0'
  if (!selected) return `${base} bg-white border-slate-200 text-slate-500`
  if (key === 'pee') return `${base} bg-sky-50 border-sky-400 text-sky-800`
  if (key === 'poop') return `${base} bg-amber-50 border-amber-400 text-amber-900`
  return `${base} bg-rose-50 border-rose-400 text-rose-800`
}

const migrateLegacyExcretionLog = (log) => {
  if (log.events && typeof log.events === 'object') return log
  const legacyType = log.type
  log.events = {
    pee: legacyType === 'pee' || legacyType === 'both',
    poop: legacyType === 'poop' || legacyType === 'both',
    vomit: false
  }
  log.recordType = log.recordType || '排泄觀察'
  if (!log.pee) {
    log.pee = {
      volume: '正常',
      urineColor: legacyType === 'pee' || legacyType === 'both' ? '正常（淡黃）' : '正常（淡黃）',
      behaviorNote: ''
    }
  }
  if (!log.poop) {
    const st = log.status || '正常'
    log.poop = {
      condition: st === '腹瀉' ? '腹瀉' : st === '便秘' ? '有用力' : '順利排出',
      shape: st === '軟便' ? '軟便' : st.includes('血') ? '正常（成形）' : '正常（成形）',
      behaviorNote: log.note || ''
    }
  }
  if (!log.vomit) log.vomit = { matterType: '毛球', count: 1 }
  if (!Array.isArray(log.photos)) log.photos = []
  delete log.type
  delete log.status
  delete log.note
  return log
}

const ensureExcretionData = (cat) => {
  if (!cat) return
  if (!Array.isArray(cat.excretionLogs)) cat.excretionLogs = []
  cat.excretionLogs = cat.excretionLogs.map(migrateLegacyExcretionLog)
  cat.excretionLogs.forEach(log => {
    if (!log.id) log.id = safeUUID()
    if (!log.at) log.at = getNowDatetimeLocal()
    if (!log.recordType) log.recordType = '排泄觀察'
    if (!log.events) log.events = { pee: false, poop: false, vomit: false }
    if (!log.pee) log.pee = { volume: '正常', urineColor: '正常（淡黃）', behaviorNote: '' }
    if (!log.poop) log.poop = { condition: '順利排出', shape: '正常（成形）', behaviorNote: '' }
    if (!log.vomit) log.vomit = { matterType: '毛球', count: 1 }
    if (!Array.isArray(log.photos)) log.photos = []
    log.vomit.count = Math.max(1, parseInt(String(log.vomit.count ?? 1), 10) || 1)
  })
}

const formatExcretionLogTime = (log) => {
  const time = formatMealTimeDisplay(log?.at)
  return time && time !== '—' ? time : String(log?.at || '').slice(11, 16)
}

const formatExcretionLogDetail = (log) => {
  const parts = []
  if (log.events?.pee) {
    parts.push(`尿量 ${log.pee?.volume || '—'} · 顏色 ${log.pee?.urineColor || '—'}`)
    if (log.pee?.behaviorNote?.trim()) parts.push(log.pee.behaviorNote.trim())
  }
  if (log.events?.poop) {
    parts.push(`${log.poop?.condition || '—'} · ${log.poop?.shape || '—'}`)
    if (log.poop?.behaviorNote?.trim()) parts.push(log.poop.behaviorNote.trim())
  }
  if (log.events?.vomit) {
    parts.push(`${log.vomit?.matterType || '—'} × ${log.vomit?.count || 1}`)
  }
  return parts.join(' · ') || '—'
}

const logHasExcretionAlert = (log) => {
  if (!log?.events) return false
  if (log.events.pee && (isExcretionAlertValue(log.pee?.urineColor) || isExcretionAlertValue(log.pee?.volume))) return true
  if (log.events.poop && isPoopAbnormal(log.poop)) return true
  if (log.events.vomit && isExcretionAlertValue(log.vomit?.matterType)) return true
  return false
}

const isPoopNormal = (poop) => {
  if (!poop) return false
  if (isExcretionAlertValue(poop.condition) || isExcretionAlertValue(poop.shape)) return false
  return poop.condition === '順利排出' && poop.shape === '正常（成形）'
}

const isPoopAbnormal = (poop) => {
  if (!poop) return false
  if (isExcretionAlertValue(poop.condition) || isExcretionAlertValue(poop.shape)) return true
  return !isPoopNormal(poop)
}

const getPoopLogsForDate = (cat, dateKey) => {
  if (!cat?.excretionLogs?.length) return []
  return cat.excretionLogs.filter(log =>
    String(log?.at || '').slice(0, 10) === dateKey && log.events?.poop
  )
}

const excretionLogsForSelectedDate = computed(() => {
  if (!currentCat.value?.excretionLogs) return []
  const dk = selectedDate.value
  return currentCat.value.excretionLogs
    .filter(log => String(log?.at || '').slice(0, 10) === dk)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
})

const excretionDaySummary = computed(() => {
  const logs = excretionLogsForSelectedDate.value
  if (!logs.length) return null
  return logs.reduce((acc, log) => {
    if (log.events?.pee) acc.pee++
    if (log.events?.poop) acc.poop++
    if (log.events?.vomit) acc.vomit++
    return acc
  }, { pee: 0, poop: 0, vomit: 0 })
})

const openExcretionModal = () => {
  excretionFormError.value = ''
  const now = getNowDatetimeLocal()
  excretionForm.value = createEmptyExcretionForm()
  excretionForm.value.date = selectedDate.value || getTodayString()
  excretionForm.value.time = now.slice(11, 16) || '12:00'
  if (excretionPhotoInput.value) excretionPhotoInput.value.value = ''
  showExcretionModal.value = true
}

const closeExcretionModal = () => {
  showExcretionModal.value = false
  excretionFormError.value = ''
  excretionForm.value = createEmptyExcretionForm()
  if (excretionPhotoInput.value) excretionPhotoInput.value.value = ''
}

const toggleExcretionEvent = (key) => {
  excretionForm.value.events[key] = !excretionForm.value.events[key]
}

const onExcretionPhotosSelect = async (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  if (!currentCat.value?.id) {
    excretionFormError.value = '請先選擇貓咪'
    e.target.value = ''
    return
  }
  excretionFormError.value = ''
  const dateKey = excretionForm.value.date || selectedDate.value || getTodayString()
  imageUploadLoading.value = true
  try {
    for (const file of files) {
      const { url } = await handleImageUpload({
        file,
        type: 'excretion',
        catId: currentCat.value.id,
        dateKey,
      })
      excretionForm.value.photos.push(url)
    }
  } catch (err) {
    excretionFormError.value = err.message || '相片上傳失敗'
  } finally {
    imageUploadLoading.value = false
    e.target.value = ''
  }
}

const removeExcretionFormPhoto = (index) => {
  excretionForm.value.photos.splice(index, 1)
}

const saveExcretionRecord = () => {
  if (!currentCat.value) return
  excretionFormError.value = ''
  const f = excretionForm.value
  if (!f.events.pee && !f.events.poop && !f.events.vomit) {
    excretionFormError.value = '請至少選擇一項：排尿、排便或嘔吐'
    return
  }
  const time = f.time?.trim() || '12:00'
  const date = f.date || selectedDate.value || getTodayString()
  ensureExcretionData(currentCat.value)
  currentCat.value.excretionLogs.unshift({
    id: safeUUID(),
    at: `${date}T${time}`,
    recordType: f.recordType || '排泄觀察',
    events: { pee: !!f.events.pee, poop: !!f.events.poop, vomit: !!f.events.vomit },
    pee: { ...f.pee },
    poop: { ...f.poop },
    vomit: { matterType: f.vomit.matterType, count: Math.max(1, parseInt(String(f.vomit.count ?? 1), 10) || 1) },
    photos: [...f.photos]
  })
  closeExcretionModal()
  persistCats()
}

const removeExcretionLog = (id) => {
  if (!currentCat.value?.excretionLogs) return
  currentCat.value.excretionLogs = currentCat.value.excretionLogs.filter(l => l.id !== id)
  persistCats()
}

const dayMedicalEntries = computed(() => {
  if (!currentCat.value) return []
  if (!Array.isArray(currentCat.value.medicalRecords)) return []
  const dk = selectedDate.value
  return currentCat.value.medicalRecords
    .filter(e => String(e.at || '').slice(0, 10) === dk)
    .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
})

const activeMedicalRecord = computed(() => {
  const id = activeMedicalId.value
  if (!id || !currentCat.value?.medicalRecords) return null
  const entry = currentCat.value.medicalRecords.find(e => e.id === id)
  if (!entry) return null
  ensureMedicalEntry(entry)
  return entry
})

const activeMedicationChartPlans = computed(() => {
  if (!activeMedicalRecord.value?.needMedicationChart) return []
  return getMedicationChartPlans(activeMedicalRecord.value)
})

watch(
  () => {
    const meds = activeMedicalRecord.value?.medications
    if (!meds?.length) return ''
    return `${meds.length}:${meds.map(m => `${m.totalDays}|${m.timesPerDay}|${m.drugName}`).join(';')}`
  },
  () => {
    if (!activeMedicalRecord.value?.needMedicationChart) return
    ensureMedicationChartChecks(activeMedicalRecord.value)
  }
)

const activeMedicalDatePart = computed({
  get: () => String(activeMedicalRecord.value?.at || '').slice(0, 10) || selectedDate.value,
  set: (datePart) => {
    if (!activeMedicalRecord.value) return
    const d = String(datePart || '').slice(0, 10) || selectedDate.value
    const t = String(activeMedicalRecord.value.at || '').slice(11, 16) || '12:00'
    activeMedicalRecord.value.at = `${d}T${t}`
  }
})

const activeMedicalTimePart = computed({
  get: () => String(activeMedicalRecord.value?.at || '').slice(11, 16) || '12:00',
  set: (timePart) => {
    if (!activeMedicalRecord.value) return
    const d = String(activeMedicalRecord.value.at || '').slice(0, 10) || selectedDate.value
    const t = String(timePart || '').slice(0, 5) || '12:00'
    activeMedicalRecord.value.at = `${d}T${t}`
  }
})

const toggleMedicalRecordCollapse = (entry) => {
  if (!entry?.saved) return
  if (entry.isCollapsed === undefined) entry.isCollapsed = false
  entry.isCollapsed = !entry.isCollapsed
  persistCats()
}

const getMedicalDateLabel = (at) => {
  return String(at || '').slice(0, 10) || selectedDate.value
}

const getNextVisitDisplay = (entry) => {
  const date = stripOverviewText(entry?.nextVisitDate)
  const time = stripOverviewText(entry?.nextVisitTime)
  if (date && time) return `${date} ${time}`
  return date || ''
}

const buildMedicalOverviewFields = (entry) => {
  ensureMedicalEntry(entry)
  const type = getMedicalTypeDisplay(entry)
  const title = stripOverviewText(entry.title)
  const item = title ? `${type} · ${title}` : type
  return {
    item,
    dateLabel: getMedicalDateLabel(entry.at),
    registrationNo: stripOverviewText(entry.registrationNo),
    diagnosis: stripOverviewText(entry.diagnosis),
    medications: formatMedicalMedicationsSummary(entry),
    completeFullCourse: !!entry.completeFullCourse,
    nextVisitDate: getNextVisitDisplay(entry)
  }
}

const medicalOverviewHasContent = (fields) => {
  if (!fields) return false
  return !!(fields.item || fields.registrationNo || fields.diagnosis || fields.medications || fields.completeFullCourse || fields.nextVisitDate)
}

const formatMedicalSummary = (entry) => {
  if (!entry) return ''
  const type = getMedicalTypeDisplay(entry)
  const regNo = stripOverviewText(entry.registrationNo)
  const title = stripOverviewText(entry.title)
  const clinic = stripOverviewText(entry.clinic)
  const doctor = stripOverviewText(entry.doctorName)
  const diagnosis = stripOverviewText(entry.diagnosis)
  const meds = formatMedicalMedicationsSummary(entry)
  const detail = stripOverviewText(entry.detail)
  let s = type
  if (regNo) s += ` #${regNo}`
  if (title) s += `${regNo ? ' ' : '：'}${title}`
  const placeParts = [clinic, doctor].filter(Boolean)
  if (placeParts.length) s += `（${placeParts.join(' · ')}）`
  if (diagnosis) s += `｜診斷：${diagnosis}`
  if (meds) s += `｜藥：${meds}`
  if (entry.completeFullCourse) s += '｜需服完整個療程'
  const nextVisitText = getNextVisitDisplay(entry)
  if (nextVisitText) s += `｜覆診 ${nextVisitText}`
  if (detail) s += ` — ${detail}`
  return s
}

const medicalOverviewList = computed(() => {
  return dayMedicalEntries.value
    .filter(e => e.saved)
    .map(entry => {
      const fields = buildMedicalOverviewFields(entry)
      return {
        id: entry.id,
        dateLabel: getMedicalDateLabel(entry.at),
        timeLabel: formatMealTimeDisplay(entry.at),
        ...fields
      }
    })
    .filter(e => medicalOverviewHasContent(e))
})

const MEDICAL_OVERVIEW_MAX_ITEMS = 10
const medicalOverviewCollapsedById = ref({})
const latestMedicalOverviewId = computed(() => {
  const list = medicalOverviewListDisplay.value || []
  return list.length ? list[list.length - 1].id : ''
})

const isMedicalOverviewCollapsed = (id) => {
  if (!id) return true
  const map = medicalOverviewCollapsedById.value || {}
  if (Object.prototype.hasOwnProperty.call(map, id)) return !!map[id]
  return id !== latestMedicalOverviewId.value
}

const toggleMedicalOverviewCollapsed = (id) => {
  if (!id) return
  const map = medicalOverviewCollapsedById.value || {}
  medicalOverviewCollapsedById.value = {
    ...map,
    [id]: !isMedicalOverviewCollapsed(id)
  }
}

const medicalOverviewListDisplay = computed(() => {
  const list = medicalOverviewList.value || []
  if (list.length <= MEDICAL_OVERVIEW_MAX_ITEMS) return list
  return list.slice(list.length - MEDICAL_OVERVIEW_MAX_ITEMS)
})

const medicalPdfExporting = ref(false)

const escapeMedicalPdfHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const buildMedicalOverviewPdfHtml = () => {
  const catName = escapeMedicalPdfHtml(currentCat.value?.name || '貓咪')
  const dateLabel = escapeMedicalPdfHtml(selectedDate.value)
  const records = medicalOverviewList.value
  const recordBlocks = records.map((m, idx) => `
    <div style="margin-bottom:${idx < records.length - 1 ? '18px' : '0'};padding-bottom:${idx < records.length - 1 ? '16px' : '0'};border-bottom:${idx < records.length - 1 ? '1px solid #fecdd3' : 'none'};">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#be123c;">🕐 ${escapeMedicalPdfHtml(m.timeLabel)}</p>
      <ul style="margin:0;padding:0;list-style:none;font-size:12px;line-height:1.65;color:#334155;">
        <li style="margin-bottom:4px;"><span style="color:#64748b;">• 項目：</span>${escapeMedicalPdfHtml(m.item || '—')}</li>
        <li style="margin-bottom:4px;"><span style="color:#64748b;">• 登記號碼：</span>${escapeMedicalPdfHtml(m.registrationNo || '—')}</li>
        <li style="margin-bottom:4px;"><span style="color:#64748b;">• 診斷：</span>${escapeMedicalPdfHtml(m.diagnosis || '—')}</li>
        <li style="margin-bottom:4px;"><span style="color:#64748b;">• 用藥劑量：</span>${escapeMedicalPdfHtml(m.medications || '—')}</li>
        ${m.completeFullCourse ? '<li style="margin-bottom:4px;"><span style="color:#d97706;">* </span><span style="color:#be123c;font-weight:700;">需服完整個療程</span></li>' : ''}
        <li><span style="color:#64748b;">• 覆診日期：</span>${escapeMedicalPdfHtml(m.nextVisitDate || '—')}</li>
      </ul>
    </div>
  `).join('')

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Microsoft JhengHei',sans-serif;color:#1e293b;background:#fff;padding:32px;box-sizing:border-box;width:595px;">
      <div style="border-bottom:2px solid #fda4af;padding-bottom:12px;margin-bottom:20px;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#be123c;letter-spacing:0.08em;">醫療紀錄</p>
        <h1 style="margin:6px 0 0;font-size:22px;font-weight:900;color:#881337;">${catName} · ${dateLabel}</h1>
      </div>
      ${recordBlocks}
      <p style="margin:24px 0 0;font-size:10px;color:#94a3b8;text-align:right;">由貓咪照護 App 生成</p>
    </div>
  `
}

const exportMedicalOverviewPdf = async () => {
  if (medicalPdfExporting.value || medicalOverviewList.value.length === 0) return
  medicalPdfExporting.value = true
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;'
  container.innerHTML = buildMedicalOverviewPdfHtml()
  document.body.appendChild(container)
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ])
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2

    while (heightLeft > 0) {
      pdf.addPage()
      position = margin - (imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
    }

    const catName = (currentCat.value?.name || '貓咪').replace(/[\\/:*?"<>|]/g, '_')
    pdf.save(`${catName}-醫療紀錄-${selectedDate.value}.pdf`)
  } catch (err) {
    console.error(err)
    alert('PDF 生成失敗，請稍後再試')
  } finally {
    document.body.removeChild(container)
    medicalPdfExporting.value = false
  }
}

const selectMedicalEntry = (id) => {
  if (!id) return
  activeMedicalId.value = id
}

const addMedicalEntry = () => {
  if (!currentCat.value) return
  if (!Array.isArray(currentCat.value.medicalRecords)) currentCat.value.medicalRecords = []
  // 新增醫療紀錄一律以「今日」作為預設（避免沿用正在查看的舊日期）
  const today = getTodayString()
  selectedDate.value = today
  const entry = createMedicalEntry(getNowDatetimeLocal())
  currentCat.value.medicalRecords.push(entry)
  activeMedicalId.value = entry.id
}

const deleteActiveMedicalEntry = () => {
  if (!activeMedicalId.value || !currentCat.value?.medicalRecords) return
  if (!confirm('確定刪除此筆醫療紀錄？')) return
  const idx = currentCat.value.medicalRecords.findIndex(e => e.id === activeMedicalId.value)
  if (idx >= 0) {
    const entry = currentCat.value.medicalRecords[idx]
    removeMedicalFollowUpReminder(currentCat.value, entry)
    currentCat.value.medicalRecords.splice(idx, 1)
  }
  syncActiveMedicalIdForDay()
}

const syncActiveMedicalIdForDay = () => {
  const entries = dayMedicalEntries.value
  if (entries.length === 0) {
    activeMedicalId.value = ''
    return
  }
  if (!entries.some(e => e.id === activeMedicalId.value)) {
    activeMedicalId.value = entries[entries.length - 1].id
  }
}

const saveActiveMedicalEntry = () => {
  if (!currentCat.value || !activeMedicalRecord.value) return
  const entry = activeMedicalRecord.value
  ensureMedicalEntry(entry)
  if (entry.type === MEDICAL_TYPE_OTHER && !entry.typeOther?.trim()) {
    alert('請填寫「其他」類型')
    return
  }
  const hasMeds = !!formatMedicalMedicationsSummary(entry)
  if (!entry.title?.trim() && !entry.detail?.trim() && !hasMeds) {
    alert('請填寫項目、用藥劑量或備註')
    return
  }
  if (entry.addReminderToHome) {
    if (!entry.nextVisitDate) {
      alert(`請先選擇下次覆診日期，才可加入首頁${healthMemoTitle.value}提醒`)
      return
    }
    upsertMedicalFollowUpReminder(currentCat.value, entry)
  } else {
    removeMedicalFollowUpReminder(currentCat.value, entry)
  }
  entry.saved = true
  const entryDateKey = String(entry.at || '').slice(0, 10)
  if (entryDateKey) selectedDate.value = entryDateKey
  persistCats()
  medicalSaveMessage.value = '已儲存'
  if (medicalSaveMessageTimer) clearTimeout(medicalSaveMessageTimer)
  medicalSaveMessageTimer = setTimeout(() => { medicalSaveMessage.value = '' }, 2000)
}

const preferenceLevels = [
  { value: 5, icon: '🔥', text: '鍾意到搶食' },
  { value: 3, icon: '👍', text: '正常食' },
  { value: 2, icon: '😐', text: '聞一聞勉強食' },
  { value: 1, icon: '👎', text: '聞一聞走開' }
]

const showPrefModal = ref(false)
const activePrefType = ref('') 

const manualField = ref({
  dryBrand: false,
  dryFlavor: false,
  wetBrand: false,
  wetFlavor: false,
  treats: false
})

const toggleManualField = (field) => {
  manualField.value[field] = !manualField.value[field]
}

const onTreatsTypeChange = (val) => {
  activeMealSlot.value.treatsType = val
  if (val === '沒有') activeMealSlot.value.treatsLove = null
}

const isSupplementSelected = (opt) => {
  return Array.isArray(activeMealSlot.value?.supplements) && activeMealSlot.value.supplements.includes(opt)
}

const toggleSupplement = (opt) => {
  if (!Array.isArray(activeMealSlot.value.supplements)) {
    activeMealSlot.value.supplements = []
  }
  const arr = activeMealSlot.value.supplements
  const idx = arr.indexOf(opt)
  if (idx >= 0) {
    arr.splice(idx, 1)
    if (opt === SUPPLEMENT_OTHER) activeMealSlot.value.supplementOther = ''
  } else {
    arr.push(opt)
  }
}

const ensureSupplementOtherSelected = () => {
  if (!isSupplementSelected(SUPPLEMENT_OTHER)) toggleSupplement(SUPPLEMENT_OTHER)
}

// 排行榜手風琴摺疊狀態 (預設全展開，方便觀看)
const accordionOpen = ref({
  wet: true,
  dry: true,
  treats: true
})
const toggleAccordion = (type) => {
  accordionOpen.value[type] = !accordionOpen.value[type]
}

const openPreferencePicker = (type) => {
  activePrefType.value = type
  showPrefModal.value = true
}

const getTargetFoodLabel = () => {
  const food = activePrefType.value === 'dry' ? '乾糧' : activePrefType.value === 'wet' ? '濕糧' : '零食'
  const time = formatMealTimeDisplay(activeMealSlot.value?.at)
  return `${time} · ${food}`
}

const getSelectedPrefValue = () => {
  return activeMealSlot.value[`${activePrefType.value}Love`]
}

const selectPreferenceValue = (val) => {
  activeMealSlot.value[`${activePrefType.value}Love`] = val
  showPrefModal.value = false
}

const getPrefBtnInfo = (val) => {
  if (!val) return { icon: '❤️', text: '喜好' }
  const found = preferenceLevels.find(l => l.value === val)
  return found ? { icon: found.icon, text: found.text } : { icon: '❤️', text: '喜好' }
}

// iOS Safari 對 `crypto.randomUUID()` 兼容性可能唔同；加 fallback 避免直接噴錯導致白畫面
const safeUUID = () => {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID()
    }
  } catch {}
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const scopedStorageKey = (key) => (storageUserPrefix ? `${storageUserPrefix}${key}` : key)

const getStorage = (key, defaultValue) => {
  const saved = localStorage.getItem(scopedStorageKey(key))
  if (saved !== null) { try { return JSON.parse(saved) } catch { return saved } }
  return defaultValue
}

const setStorage = (key, value) => {
  try {
    localStorage.setItem(scopedStorageKey(key), JSON.stringify(value))
  } catch (err) {
    console.warn('localStorage write failed:', key, err)
  }
}

const getAppLocalStorageKeys = () => [
  'meow_cats_list_v30',
  'meow_cats_list_v29',
  'meow_currentCatIndex_v30',
  'meow_currentCatIndex_v29',
  'meow_behavior_social_logs_v1',
  'meow_behavior_social_custom_tags_v1',
  'meow_behavior_social_hidden_tags_v1',
  'meow_handover_sheet_v1',
  'meow_care_maintenance_v1',
]

const clearAllLocalCache = () => {
  getAppLocalStorageKeys().forEach((key) => {
    try { localStorage.removeItem(scopedStorageKey(key)) } catch {}
  })
}

let mirrorStorageTimer = null
const scheduleMirrorToLocalStorage = () => {
  clearTimeout(mirrorStorageTimer)
  mirrorStorageTimer = setTimeout(() => mirrorSyncStateToLocalStorage(), 300)
}

const isOzValue = (val) => {
  if (!val) return false
  return /oz/i.test(String(val))
}

const parseToGrams = (val) => {
  if (!val) return 0
  const str = String(val).trim()
  const num = parseFloat(str)
  if (isNaN(num)) return 0
  if (/oz/i.test(str)) return Math.round(num * 28.35)
  return Math.round(num)
}

const extractAmountNumericPart = (amountStr) => {
  const s = String(amountStr ?? '').trim()
  if (!s) return ''
  const m = s.match(/-?\d+(?:\.\d+)?/)
  return m ? m[0] : ''
}

const statsFromMealSlot = (slot) => {
  if (!slot) return { count: 0, grams: 0 }
  ensureCategoryMaps(slot)
  let grams = 0
  let count = 0
  DRY_FOOD_TYPES.forEach(cat => {
    const rec = getDryRecordForCategory(slot, cat)
    if (foodRecordHasContent(rec)) {
      count++
      grams += parseToGrams(rec.amount)
    }
  })
  WET_FOOD_TYPES.forEach(cat => {
    const rec = getWetRecordForCategory(slot, cat)
    if (foodRecordHasContent(rec)) {
      count++
      grams += parseToGrams(rec.amount)
    }
  })
  if (supplementRecordHasContent(getSupplementRecord(slot))) count++
  if (treatRecordHasContent(getTreatRecord(slot))) count++
  return { count, grams }
}

// 乾糧份量：提供 g/oz 選擇，但最終仍然寫回同一個字串欄位（例如：`45g` / `1.5oz`）
const dryAmountUnit = computed({
  get: () => isOzValue(activeMealSlot.value?.dryAmount) ? 'oz' : 'g',
  set: (u) => {
    if (!activeMealSlot.value) return
    const numStr = extractAmountNumericPart(activeMealSlot.value.dryAmount)
    if (!numStr) {
      activeMealSlot.value.dryAmount = ''
      return
    }
    const num = parseFloat(numStr)
    if (Number.isNaN(num)) {
      activeMealSlot.value.dryAmount = ''
      return
    }
    activeMealSlot.value.dryAmount = u === 'oz' ? `${num}oz` : `${num}g`
  }
})

const dryAmountValue = computed({
  get: () => extractAmountNumericPart(activeMealSlot.value?.dryAmount),
  set: (v) => {
    if (!activeMealSlot.value) return
    const s = String(v ?? '').trim()
    if (!s) {
      activeMealSlot.value.dryAmount = ''
      return
    }
    const num = parseFloat(s)
    if (Number.isNaN(num)) {
      activeMealSlot.value.dryAmount = ''
      return
    }
    const unit = dryAmountUnit.value
    activeMealSlot.value.dryAmount = unit === 'oz' ? `${num}oz` : `${num}g`
  }
})

// 濕糧份量：同上
const wetAmountUnit = computed({
  get: () => isOzValue(activeMealSlot.value?.wetAmount) ? 'oz' : 'g',
  set: (u) => {
    if (!activeMealSlot.value) return
    const numStr = extractAmountNumericPart(activeMealSlot.value.wetAmount)
    if (!numStr) {
      activeMealSlot.value.wetAmount = ''
      return
    }
    const num = parseFloat(numStr)
    if (Number.isNaN(num)) {
      activeMealSlot.value.wetAmount = ''
      return
    }
    activeMealSlot.value.wetAmount = u === 'oz' ? `${num}oz` : `${num}g`
  }
})

const wetAmountValue = computed({
  get: () => extractAmountNumericPart(activeMealSlot.value?.wetAmount),
  set: (v) => {
    if (!activeMealSlot.value) return
    const s = String(v ?? '').trim()
    if (!s) {
      activeMealSlot.value.wetAmount = ''
      return
    }
    const num = parseFloat(s)
    if (Number.isNaN(num)) {
      activeMealSlot.value.wetAmount = ''
      return
    }
    const unit = wetAmountUnit.value
    activeMealSlot.value.wetAmount = unit === 'oz' ? `${num}oz` : `${num}g`
  }
})

const statsFromDietDay = (day, dateKey = null) => {
  if (!day) return { count: 0, grams: 0 }
  migrateDayToMeals(day, dateKey)
  let count = 0
  let grams = 0
  ;(day.mealEntries || []).forEach(entry => {
    const s = statsFromMealSlot(entry)
    count += s.count
    grams += s.grams
  })
  return { count, grams }
}

const formatGramsDisplay = (amount) => {
  if (!amount) return ''
  const g = parseToGrams(amount)
  return g > 0 ? `${g}g` : ''
}

/** 總覽用文字：去掉 emoji，避免與喜好圖示混淆 */
const stripOverviewText = (text) => {
  if (!text) return ''
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatFoodRecordOverview = (category, rec) => {
  if (!foodRecordHasContent(rec)) return ''
  const brand = stripOverviewText(rec.brand)
  const flavor = stripOverviewText(rec.flavor)
  const grams = formatGramsDisplay(rec.amount)
  let s = category
  if (brand) s += ` ${brand}`
  if (flavor) s += `（${flavor}）`
  if (grams) s += ` ${grams}`
  return s
}

const formatSupplementsOverviewFromRecord = (rec) => {
  if (!supplementRecordHasContent(rec)) return ''
  const list = rec.supplements
  if (!Array.isArray(list) || list.length === 0) return ''
  return list.map(opt => {
    if (opt === SUPPLEMENT_OTHER) {
      const name = stripOverviewText(rec.supplementOther)
      return name ? `其他: ${name}` : '其他:'
    }
    return stripOverviewText(opt)
  }).filter(Boolean).join('、')
}

const formatTreatsOverviewFromRecord = (rec) => {
  if (!treatRecordHasContent(rec)) return ''
  return stripOverviewText(rec.treatsType)
}

/** 該日餵食時間一覽：只讀已按「儲存」的快照 */
const buildSavedFoodLines = (slot) => {
  if (!slot) return []
  ensureSavedFoodSnapshot(slot)
  const snap = slot.savedFoodSnapshot
  const lines = []

  DRY_FOOD_TYPES.forEach(cat => {
    const line = formatFoodRecordOverview(cat, snap.dryByCategory?.[cat])
    if (line) lines.push(line)
  })
  WET_FOOD_TYPES.forEach(cat => {
    const line = formatFoodRecordOverview(cat, snap.wetByCategory?.[cat])
    if (line) lines.push(line)
  })

  const supp = formatSupplementsOverviewFromRecord(snap.supplementRecord)
  if (supp) lines.push(`保健品 ${supp}`)

  const treat = formatTreatsOverviewFromRecord(snap.treatRecord)
  if (treat) lines.push(`零食 ${treat}`)

  return lines
}

const mealOverviewList = computed(() => {
  return dayMealEntries.value
    .map(entry => ({
      id: entry.id,
      timeLabel: formatMealTimeDisplay(entry.at),
      items: buildSavedFoodLines(entry)
    }))
    .filter(entry => entry.items.length > 0)
})

const mealSlotHasSavedOverview = (slot) => buildSavedFoodLines(slot).length > 0

const mealSlotHasContent = (slot) => {
  if (!slot) return false
  ensureCategoryMaps(slot)
  if (DRY_FOOD_TYPES.some(cat => foodRecordHasContent(slot.dryByCategory?.[cat]))) return true
  if (WET_FOOD_TYPES.some(cat => foodRecordHasContent(slot.wetByCategory?.[cat]))) return true
  if (supplementRecordHasContent(slot.supplementRecord)) return true
  if (treatRecordHasContent(slot.treatRecord)) return true
  return !!(
    slot.dryBrand?.trim() || slot.dryAmount?.trim() ||
    slot.wetBrand?.trim() || slot.wetAmount?.trim() ||
    slot.treatsType?.trim()
  )
}

const todayDietDay = computed(() => {
  if (!currentCat.value) return null
  const key = getTodayString()
  return currentCat.value.dietHistory?.[key] || null
})

const todayFeedingStats = computed(() => statsFromDietDay(todayDietDay.value, getTodayString()))

const todayFeedingProgress = computed(() => {
  const cat = currentCat.value
  const grams = todayFeedingStats.value.grams || 0
  const count = todayFeedingStats.value.count || 0
  if (!cat?.weight || cat.weight <= 0) {
    return { percent: count > 0 ? 100 : 0, targetGrams: 0, der: 0, hasTarget: false }
  }
  const der = calculateDER(cat.weight, cat.neutered)
  const targetGrams = Math.max(35, Math.round(der / 3.8))
  const percent = targetGrams > 0 ? Math.min(100, Math.round((grams / targetGrams) * 100)) : 0
  return { percent, targetGrams, der, grams, count, hasTarget: true }
})

const homeMilestoneItems = computed(() => {
  const list = currentCat.value?.reminders
  if (!Array.isArray(list) || !list.length) return []
  return list.map((event, index) => {
    const meta = resolveMilestoneCatalog(event)
    const urgency = getMilestoneUrgency(event.nextDate)
    return {
      event,
      index,
      meta,
      urgency,
      rowKey: event.id || event.catalogId || `rem-${index}`
    }
  }).sort((a, b) => {
    if (a.event.isBath || a.event.pinTop) return -1
    if (b.event.isBath || b.event.pinTop) return 1
    return 0
  })
})

const homeTodayDateLine = computed(() => {
  const ymd = getTodayString()
  const d = parseYmd(ymd)
  if (!d) return { main: ymd, weekday: '' }
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return {
    main: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`,
    weekday: `星期${weekdays[d.getDay()]}`
  }
})

const homeStatusBadgeClass = (tone) => {
  if (tone === 'ok') return 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300'
  if (tone === 'warn') return 'bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300'
  if (tone === 'alert') return 'bg-rose-50 text-rose-800 border border-rose-200/90 hover:bg-rose-100 hover:border-rose-300 attention-pulse'
  if (tone === 'theme') return 'theme-accent-bg theme-accent-text border theme-accent-border hover:theme-accent-bg-strong'
  return 'bg-slate-100/90 text-slate-600 border border-slate-200/90 hover:bg-slate-200/70'
}

const onHomeStatusBadgeClick = (badge) => {
  if (!badge?.action) return
  if (badge.action === 'diet') goToDietTab()
  else if (badge.action === 'reminders') openEditRemindersModal()
  else if (badge.action === 'stats') currentTab.value = 'stats'
  else if (badge.action === 'water') addWater()
  else if (badge.action === 'excretion') currentTab.value = 'excretion'
  else if (badge.action === 'checklist') goToCareChecklist()
}

const goToCareChecklist = () => {
  currentTab.value = 'care'
  if (!currentCat.value) return
  ensureCareData(currentCat.value)
  ensureCareMaintenanceState(true)
  startCarePoll()
  careMaintenanceEditMode.value = false
  careMaintenanceCustomModalOpen.value = false
  closeCareMaintenanceEditModal()
  closeCareMaintenanceDateModal()
  closeCareMaintenanceDeleteConfirm()
}

const homeProgressBarClass = (kind, status) => {
  if (kind === 'feeding') {
    const p = todayFeedingProgress.value.percent
    if (p >= 85) return 'bg-emerald-500'
    if (p >= 50) return 'bg-amber-400'
    return 'bg-[color:var(--theme-primary)]'
  }
  if (status === 'ok') return 'bg-emerald-500'
  if (status === 'warning') return 'bg-amber-500'
  if (status === 'low') return 'bg-rose-500'
  return 'bg-sky-400'
}

const dayFeedingStats = computed(() => statsFromDietDay(activeDiet.value, selectedDate.value))

const goToDietTab = () => { currentTab.value = 'diet' }

const statsRangeDays = ref(7)

const parseYmd = (ymd) => {
  const d = new Date(`${ymd}T12:00:00`)
  return isNaN(d.getTime()) ? null : d
}

const formatYmd = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const shiftYmd = (ymd, deltaDays) => {
  const d = parseYmd(ymd)
  if (!d) return ymd
  d.setDate(d.getDate() + deltaDays)
  return formatYmd(d)
}

const getLastNDates = (n, endYmd = getTodayString()) => {
  const list = []
  for (let i = n - 1; i >= 0; i--) {
    list.push(shiftYmd(endYmd, -i))
  }
  return list
}

const formatChartDayLabel = (ymd) => {
  const d = parseYmd(ymd)
  if (!d) return ymd.slice(5)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatRowDayLabel = (ymd) => {
  const d = parseYmd(ymd)
  if (!d) return ymd
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const today = getTodayString()
  if (ymd === today) return `今天 (${formatChartDayLabel(ymd)})`
  if (ymd === shiftYmd(today, -1)) return `昨天 (${formatChartDayLabel(ymd)})`
  return `${formatChartDayLabel(ymd)} 週${weekdays[d.getDay()]}`
}

const hydrationStatusBadge = (status) => {
  if (status === 'ok') return '水分達標'
  if (status === 'low') return '水分不足'
  if (status === 'warning') return '稍低'
  return '—'
}

const periodDailyStats = computed(() => {
  if (!currentCat.value) return []
  const cat = currentCat.value
  return getLastNDates(statsRangeDays.value).map(dateKey => {
    const day = cat.dietHistory?.[dateKey]
    const feed = statsFromDietDay(day, dateKey)
    const hydration = buildHydrationReport(cat, dateKey)
    const hasLog = feed.count > 0 || hydration.directWater > 0 || hydration.totalHydration > 0
    return {
      dateKey,
      chartLabel: formatChartDayLabel(dateKey),
      rowLabel: formatRowDayLabel(dateKey),
      grams: feed.grams,
      mealCount: feed.count,
      hydrationTotal: hydration.totalHydration,
      hydrationStatus: hydration.status,
      hydrationProgress: hydration.progressPercent,
      hydrationBadge: hydrationStatusBadge(hydration.status),
      hasLog
    }
  })
})

const statsSummary = computed(() => {
  const days = periodDailyStats.value
  const logged = days.filter(d => d.hasLog)
  const hydrationEligible = logged.filter(d => d.hydrationStatus !== 'unknown')
  const hydrationOk = hydrationEligible.filter(d => d.hydrationStatus === 'ok')
  const avgGrams = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.grams, 0) / logged.length)
    : 0
  const avgHydration = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.hydrationTotal, 0) / logged.length)
    : 0
  const hydrationOkRate = hydrationEligible.length
    ? Math.round((hydrationOk.length / hydrationEligible.length) * 100)
    : 0
  return {
    loggedDays: logged.length,
    hydrationOkDays: hydrationOk.length,
    avgGrams,
    avgHydration,
    hydrationOkRate
  }
})

const statsChartMaxGrams = computed(() => {
  const max = Math.max(0, ...periodDailyStats.value.map(d => d.grams))
  return max > 0 ? max : 0
})

const statsChartMaxHydration = computed(() => {
  const values = periodDailyStats.value.map(d => d.hydrationTotal)
  const max = Math.max(0, ...values)
  const minTarget = currentCat.value ? getWaterRangeMl(currentCat.value.weight).min : 0
  return Math.max(max, minTarget, 1)
})

const hydrationMinTarget = computed(() => {
  if (!currentCat.value) return 0
  return getWaterRangeMl(currentCat.value.weight).min
})

const goToDietForDate = (dateKey) => {
  selectedDate.value = dateKey
  currentTab.value = 'diet'
}

const iterateMealSlots = (cat, fn) => {
  if (!cat?.dietHistory) return
  Object.entries(cat.dietHistory).forEach(([dateKey, day]) => {
    migrateDayToMeals(day, dateKey)
    ;(day.mealEntries || []).forEach(entry => fn(entry))
  })
}

const collectBrands = (cat, kind) => {
  const set = new Set()
  const types = kind === 'dry' ? DRY_FOOD_TYPES : WET_FOOD_TYPES
  const mapKey = kind === 'dry' ? 'dryByCategory' : 'wetByCategory'
  iterateMealSlots(cat, slot => {
    ensureCategoryMaps(slot)
    types.forEach(catName => {
      const rec = slot[mapKey]?.[catName]
      const b = rec?.brand?.trim()
      if (b) set.add(b)
    })
    const flatB = slot[`${kind}Brand`]?.trim()
    if (flatB) set.add(flatB)
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
}

const collectFlavorsForBrand = (cat, kind, brand) => {
  const set = new Set()
  const b = brand?.trim()
  if (!b) return []
  const types = kind === 'dry' ? DRY_FOOD_TYPES : WET_FOOD_TYPES
  const mapKey = kind === 'dry' ? 'dryByCategory' : 'wetByCategory'
  iterateMealSlots(cat, slot => {
    ensureCategoryMaps(slot)
    types.forEach(catName => {
      const rec = slot[mapKey]?.[catName]
      if (rec?.brand?.trim() === b) {
        const f = rec?.flavor?.trim()
        if (f) set.add(f)
      }
    })
    if (slot[`${kind}Brand`]?.trim() === b) {
      const f = slot[`${kind}Flavor`]?.trim()
      if (f) set.add(f)
    }
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
}

const historicalDryBrands = computed(() => currentCat.value ? collectBrands(currentCat.value, 'dry') : [])
const historicalWetBrands = computed(() => currentCat.value ? collectBrands(currentCat.value, 'wet') : [])

const withCurrentFlavorOption = (flavors, current) => {
  const c = current?.trim()
  if (c && !flavors.includes(c)) return [c, ...flavors]
  return flavors
}

const dryFlavorsForActiveBrand = computed(() => {
  if (!currentCat.value || !activeMealSlot.value?.dryBrand?.trim()) return []
  const list = collectFlavorsForBrand(currentCat.value, 'dry', activeMealSlot.value.dryBrand)
  return withCurrentFlavorOption(list, activeMealSlot.value.dryFlavor)
})

const wetFlavorsForActiveBrand = computed(() => {
  if (!currentCat.value || !activeMealSlot.value?.wetBrand?.trim()) return []
  const list = collectFlavorsForBrand(currentCat.value, 'wet', activeMealSlot.value.wetBrand)
  return withCurrentFlavorOption(list, activeMealSlot.value.wetFlavor)
})

const historicalTreatsOptions = computed(() => {
  if (!currentCat.value) return []
  const set = new Set()
  iterateMealSlots(currentCat.value, slot => {
    ensureCategoryMaps(slot)
    const t = slot.treatRecord?.treatsType?.trim() || slot.treatsType?.trim()
    if (t && t !== '沒有') set.add(t)
  })
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-Hant'))
})

// 🔍 核心統計引擎：將總排行歸納，並拆分成三大不交叉大模組
const groupedLeaderboard = computed(() => {
  const result = { wet: [], dry: [], treats: [] }
  if (!currentCat.value || !currentCat.value.dietHistory) return result
  
  const wetMap = {}, dryMap = {}, treatsMap = {}

  Object.entries(currentCat.value.dietHistory).forEach(([dateKey, day]) => {
    migrateDayToMeals(day, dateKey)
    ;(day.mealEntries || []).forEach(slot => {
      ensureCategoryMaps(slot)
      DRY_FOOD_TYPES.forEach(cat => {
        const rec = slot.dryByCategory[cat]
        if (rec?.brand?.trim() && rec.love != null) {
          const b = rec.brand.trim(), f = rec.flavor?.trim() || '未知口味'
          const key = `${b}_${f}`
          if (!dryMap[key]) dryMap[key] = { brand: b, flavor: f, totalPoints: 0, count: 0 }
          dryMap[key].totalPoints += Number(rec.love)
          dryMap[key].count += 1
        }
      })
      WET_FOOD_TYPES.forEach(cat => {
        const rec = slot.wetByCategory[cat]
        if (rec?.brand?.trim() && rec.love != null) {
          const b = rec.brand.trim(), f = rec.flavor?.trim() || '未知口味'
          const key = `${b}_${f}`
          if (!wetMap[key]) wetMap[key] = { brand: b, flavor: f, totalPoints: 0, count: 0 }
          wetMap[key].totalPoints += Number(rec.love)
          wetMap[key].count += 1
        }
      })
      const treatRec = slot.treatRecord || { treatsType: slot.treatsType, treatsLove: slot.treatsLove }
      if (treatRec.treatsType?.trim() && treatRec.treatsLove != null) {
        const t = treatRec.treatsType.trim()
        if (!treatsMap[t]) treatsMap[t] = { brand: t, totalPoints: 0, count: 0 }
        treatsMap[t].totalPoints += Number(treatRec.treatsLove)
        treatsMap[t].count += 1
      }
    })
  })

  result.dry = Object.values(dryMap).sort((a,b) => b.totalPoints - a.totalPoints)
  result.wet = Object.values(wetMap).sort((a,b) => b.totalPoints - a.totalPoints)
  result.treats = Object.values(treatsMap).sort((a,b) => b.totalPoints - a.totalPoints)
  return result
})

const parseBirthdayParts = (birthdayYmd) => {
  if (!birthdayYmd) return null
  const parts = String(birthdayYmd).trim().split('-')
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null
  const dayRaw = parts.length >= 3 ? parseInt(parts[2], 10) : NaN
  const hasDay = Number.isFinite(dayRaw) && dayRaw >= 1 && dayRaw <= 31
  return {
    year,
    month,
    day: hasDay ? dayRaw : 1,
    yearMonthOnly: !hasDay
  }
}

const getNextBirthdayYmd = (birthdayYmd) => {
  const b = parseBirthdayParts(birthdayYmd)
  if (!b) return birthdayYmd
  const month = b.month - 1
  const day = b.day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  let next = new Date(year, month, day)
  next.setHours(0, 0, 0, 0)
  if (next < today) next = new Date(year + 1, month, day)
  return formatYmd(next)
}

const formatBirthdayDisplayLabel = (birthdayYmd) => {
  const b = parseBirthdayParts(birthdayYmd)
  if (!b) return ''
  if (b.yearMonthOnly) return `${b.month}月`
  return `${b.month}/${b.day}`
}

const getBirthdayCountdownText = (birthdayYmd) => {
  if (!birthdayYmd) return ''
  const next = getNextBirthdayYmd(birthdayYmd)
  const diff = getDaysDiff(next)
  const label = formatBirthdayDisplayLabel(birthdayYmd)
  if (diff === 0) return '今日生日 🎉'
  if (diff > 0 && diff <= 30) return `生日仲有 ${diff} 日（${label}）`
  if (diff > 30) return `下次生日 ${label}（仲有 ${diff} 日）`
  return ''
}

const ensureBirthdayReminder = (cat) => {
  if (!cat?.birthday || !cat.name) return
  if (!Array.isArray(cat.reminders)) cat.reminders = []
  const nextDate = getNextBirthdayYmd(cat.birthday)
  const title = `${cat.name} 生日`
  const existing = cat.reminders.find(r => r.isBirthday)
  if (existing) {
    existing.title = title
    existing.nextDate = nextDate
    existing.icon = '🎂'
    existing.periodType = 'year'
    existing.periodValue = 1
  } else {
    cat.reminders.push({
      icon: '🎂',
      title,
      nextDate,
      periodType: 'year',
      periodValue: 1,
      isBirthday: true
    })
  }
}

const getAgeString = (birthdayYmd) => {
  const b = parseBirthdayParts(birthdayYmd)
  if (!b) return '未填寫生日'
  const now = new Date()
  let years = now.getFullYear() - b.year
  let months = now.getMonth() + 1 - b.month
  if (b.yearMonthOnly) {
    if (months < 0) { years--; months += 12 }
    if (years < 0) return '未填寫生日'
    return years === 0 ? `${months}個月` : `${years}歲${months}個月`
  }
  const birth = new Date(b.year, b.month - 1, b.day)
  years = now.getFullYear() - birth.getFullYear()
  months = now.getMonth() - birth.getMonth()
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) { years--; months += 12 }
  if (now.getDate() < birth.getDate()) { months--; if (months < 0) { years--; months += 11 } }
  if (years < 0) return '未填寫生日'
  return years === 0 ? `${months}個月` : `${years}歲${months}個月`
}

const hasMilestoneDate = (nextDate) => {
  const raw = String(nextDate || '').trim()
  if (!raw) return false
  return !!parseYmd(raw.slice(0, 10))
}

const getDaysDiff = (targetDateStr) => {
  if (!hasMilestoneDate(targetDateStr)) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dateKey = String(targetDateStr).trim().slice(0, 10)
  const target = parseYmd(dateKey)
  if (!target) return null
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
const formatMilestoneNextDate = (nextDate) => {
  if (!hasMilestoneDate(nextDate)) return '未開始紀錄'
  return String(nextDate).trim().replace('T', ' ')
}
const getCountdownText = (targetDateStr) => {
  if (!hasMilestoneDate(targetDateStr)) return '未開始紀錄'
  const diff = getDaysDiff(targetDateStr)
  if (diff > 0) return `仲有 ${diff} 日`
  if (diff === 0) return `今日到期 🌟`
  return `已過期 ${Math.abs(diff)} 日 ⚠️`
}
const getCountdownClass = (targetDateStr) => {
  if (!hasMilestoneDate(targetDateStr)) return 'bg-slate-100 text-slate-500'
  const diff = getDaysDiff(targetDateStr)
  return diff < 0 ? 'bg-rose-100 text-rose-700 attention-pulse' : diff <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
}

const calculateRER = (weight) => (!weight || weight <= 0) ? 0 : Math.round(70 * Math.pow(weight, 0.75))
const calculateDER = (weight, isNeutered) => Math.round(calculateRER(weight) * (isNeutered ? 1.2 : 1.4))

/** 成貓飲水參考：40–60 ml/kg/日；乾糧 ~10% 水分；濕糧 ~75%（70–80% 中位） */
const WATER_RULES = {
  ML_PER_KG_MIN: 40,
  ML_PER_KG_MAX: 60,
  DRY_RATIO: 0.10,
  WET_RATIO: 0.75,
  get DRY_PERCENT() { return Math.round(this.DRY_RATIO * 100) },
  get WET_PERCENT() { return Math.round(this.WET_RATIO * 100) }
}

const getWaterRangeMl = (weightKg) => {
  const w = Number(weightKg)
  if (!w || w <= 0) return { min: 0, max: 0, mid: 0 }
  const min = Math.round(w * WATER_RULES.ML_PER_KG_MIN)
  const max = Math.round(w * WATER_RULES.ML_PER_KG_MAX)
  return { min, max, mid: Math.round((min + max) / 2) }
}

const formatWaterRange = (weightKg) => {
  const r = getWaterRangeMl(weightKg)
  return r.min > 0 ? `${r.min}–${r.max}` : '—'
}

const calculateRecommendedWaterMl = (weightKg) => getWaterRangeMl(weightKg).mid

const getFoodMoistureMlForDate = (cat, dateKey) => {
  if (!cat) return { dry: 0, wet: 0, treat: 0, total: 0 }
  const day = cat.dietHistory?.[dateKey]
  if (!day) return { dry: 0, wet: 0, treat: 0, total: 0 }
  migrateDayToMeals(day, dateKey)
  let dry = 0
  let wet = 0
  ;(day.mealEntries || []).forEach(entry => {
    ensureCategoryMaps(entry)
    DRY_FOOD_TYPES.forEach(cat => {
      const rec = entry.dryByCategory?.[cat]
      if (rec?.amount) dry += parseToGrams(rec.amount) * WATER_RULES.DRY_RATIO
    })
    WET_FOOD_TYPES.forEach(cat => {
      const rec = entry.wetByCategory?.[cat]
      if (rec?.amount) wet += parseToGrams(rec.amount) * WATER_RULES.WET_RATIO
    })
  })
  return { dry, wet, treat: 0, total: dry + wet }
}

const emptyHydrationReport = () => ({
  range: { min: 0, max: 0, mid: 0 },
  directWater: 0,
  foodMoistureDry: 0,
  foodMoistureWet: 0,
  foodMoistureTreat: 0,
  foodMoistureTotal: 0,
  totalHydration: 0,
  status: 'unknown',
  deficit: 0,
  progressPercent: 0,
  needsAlert: false
})

const buildHydrationReport = (cat, dateKey) => {
  if (!cat) return emptyHydrationReport()

  const range = getWaterRangeMl(cat.weight)
  const directWater = sumWaterMlForDate(cat, dateKey)
  const food = getFoodMoistureMlForDate(cat, dateKey)

  const foodMoistureDry = Math.round(food.dry)
  const foodMoistureWet = Math.round(food.wet)
  const foodMoistureTreat = Math.round(food.treat)
  const foodMoistureTotal = foodMoistureDry + foodMoistureWet + foodMoistureTreat
  const totalHydration = Math.round(directWater + foodMoistureTotal)

  let status = 'unknown'
  let deficit = 0
  let progressPercent = 0

  if (range.min > 0) {
    progressPercent = Math.round((totalHydration / range.min) * 100)
    if (totalHydration >= range.min) {
      status = 'ok'
    } else if (totalHydration >= range.min * 0.85) {
      status = 'warning'
      deficit = range.min - totalHydration
    } else {
      status = 'low'
      deficit = range.min - totalHydration
    }
  }

  return {
    range,
    directWater: Math.round(directWater),
    foodMoistureDry,
    foodMoistureWet,
    foodMoistureTreat,
    foodMoistureTotal,
    totalHydration,
    status,
    deficit,
    progressPercent,
    needsAlert: status === 'low'
  }
}

const sumWaterMlForDate = (cat, dateKey) => {
  if (!cat?.waterLogs?.length) return 0
  return cat.waterLogs
    .filter(log => log.at && String(log.at).startsWith(dateKey))
    .reduce((sum, log) => sum + (Number(log.amountMl) || 0), 0)
}

const syncDietWaterForDate = (cat, dateKey) => {
  if (!cat.dietHistory) cat.dietHistory = {}
  if (!cat.dietHistory[dateKey]) cat.dietHistory[dateKey] = createEmptyDietDay()
  cat.dietHistory[dateKey].waterMl = sumWaterMlForDate(cat, dateKey)
}

const waterLogsForSelectedDate = computed(() => {
  if (!currentCat.value?.waterLogs) return []
  const date = selectedDate.value
  return currentCat.value.waterLogs
    .filter(log => log.at && String(log.at).startsWith(date))
    .sort((a, b) => (a.at < b.at ? -1 : 1))
})

const todayWaterStats = computed(() => {
  const today = getTodayString()
  const logs = (currentCat.value?.waterLogs || []).filter(l => l.at?.startsWith(today))
  return {
    count: logs.length,
    total: sumWaterMlForDate(currentCat.value, today)
  }
})

const dayWaterStats = computed(() => ({
  count: waterLogsForSelectedDate.value.length,
  total: sumWaterMlForDate(currentCat.value, selectedDate.value)
}))

const todayHydrationReport = computed(() => {
  if (!currentCat.value) return emptyHydrationReport()
  return buildHydrationReport(currentCat.value, getTodayString())
})

const homeStatusBadges = computed(() => {
  const cat = currentCat.value
  if (!cat) return []
  const badges = []
  const todayKey = getTodayString()
  const feed = todayFeedingStats.value
  if (feed.count > 0) {
    badges.push({ id: 'fed', label: '今日已餵食', icon: '🍽️', tone: 'ok', action: 'diet' })
  } else {
    badges.push({ id: 'unfed', label: '尚未登記飲食', icon: '🍽️', tone: 'warn', action: 'diet' })
  }

  const nailEvent = (cat.reminders || []).find(r => resolveMilestoneCatalog(r).id === 'groom_nails' || /剪甲|清潔耳/.test(r.title || ''))
  if (nailEvent && hasMilestoneDate(nailEvent.nextDate)) {
    const diff = getDaysDiff(nailEvent.nextDate)
    if (diff < 0) badges.push({ id: 'nails', label: '需剪甲', icon: '✂️', tone: 'alert', action: 'reminders' })
    else if (diff <= 7) badges.push({ id: 'nails-soon', label: `${diff} 日內剪甲`, icon: '✂️', tone: 'warn', action: 'reminders' })
  }

  if (homeMidLongCareMaintenanceDue.value) {
    badges.push({ id: 'care-due', label: '照護到期', icon: '⏰', tone: 'alert', action: 'checklist' })
  }

  const todayPoopLogs = getPoopLogsForDate(cat, todayKey)
  if (!todayPoopLogs.length) {
    badges.push({ id: 'poop-missing', label: '未記錄便便', icon: '💩', tone: 'warn', action: 'excretion' })
  } else if (todayPoopLogs.some(log => isPoopAbnormal(log.poop))) {
    badges.push({ id: 'poop-alert', label: '便便異常', icon: '💩', tone: 'alert', action: 'excretion' })
  }

  const todaySocial = behaviorSocialLogs.value.find(log =>
    log.mode === 'single' &&
    log.catId === cat.id &&
    String(log.at || '').slice(0, 10) === todayKey
  )
  const socialTags = todaySocial
    ? [
      ...(todaySocial.quirkTags || []),
      ...(todaySocial.humanInteractionTags || []),
      ...(todaySocial.warningTags || [])
    ]
    : []
  if (socialTags.length) {
    const moodLabel = socialTags.length > 1 ? `${socialTags[0]} +${socialTags.length - 1}` : socialTags[0]
    badges.push({ id: 'mood', label: moodLabel, icon: '💗', tone: 'theme', action: 'stats' })
  } else if (todaySocial) {
    badges.push({ id: 'mood', label: '已記錄行為', icon: '💗', tone: 'theme', action: 'stats' })
  } else {
    badges.push({ id: 'mood', label: '未記錄行為', icon: '💭', tone: 'muted', action: 'stats' })
  }

  const hydro = todayHydrationReport.value
  if (cat.weight > 0 && hydro.status === 'ok') {
    badges.push({ id: 'water-ok', label: '水分達標', icon: '💧', tone: 'ok', action: 'water' })
  } else if (cat.weight > 0 && hydro.status === 'low') {
    badges.push({ id: 'water-low', label: '水分偏低', icon: '💧', tone: 'alert', action: 'water' })
  }

  return badges
})

const dayHydrationReport = computed(() => {
  if (!currentCat.value) return emptyHydrationReport()
  return buildHydrationReport(currentCat.value, selectedDate.value)
})

const dayWaterDraftMl = ref(0)
const dayWaterDraftSources = ref({ fountain: false, bowl: false, other: false })
const dayWaterDraftOther = ref('')
const mealSaveMessage = ref('')
let mealSaveMessageTimer = null

const getWaterLogForDate = (cat, dateKey) => {
  if (!cat?.waterLogs?.length) return null
  return cat.waterLogs.find(log => log.at && String(log.at).startsWith(dateKey)) || null
}

const formatWaterSourcesLabel = (sources, otherSource = '') => {
  if (!sources) return ''
  const parts = []
  if (sources.fountain) parts.push('飲水機')
  if (sources.bowl) parts.push('貓碗')
  if (sources.other) parts.push(String(otherSource || '').trim() || '其他')
  return parts.join('、')
}

const formatWaterSourcesFromLog = (log) => formatWaterSourcesLabel(log?.sources, log?.otherSource)

const dayWaterDraftSourceLabel = computed(() =>
  formatWaterSourcesLabel(dayWaterDraftSources.value, dayWaterDraftOther.value)
)

const dayWaterSourceLabel = computed(() =>
  formatWaterSourcesFromLog(getWaterLogForDate(currentCat.value, selectedDate.value))
)

const syncWaterDraftFromSaved = () => {
  if (!currentCat.value) {
    dayWaterDraftMl.value = 0
    dayWaterDraftSources.value = { fountain: false, bowl: false, other: false }
    dayWaterDraftOther.value = ''
    return
  }
  const log = getWaterLogForDate(currentCat.value, selectedDate.value)
  dayWaterDraftMl.value = sumWaterMlForDate(currentCat.value, selectedDate.value) || 0
  if (log?.sources) {
    dayWaterDraftSources.value = {
      fountain: !!log.sources.fountain,
      bowl: !!log.sources.bowl,
      other: !!log.sources.other
    }
    dayWaterDraftOther.value = log.otherSource || ''
  } else {
    dayWaterDraftSources.value = { fountain: false, bowl: false, other: false }
    dayWaterDraftOther.value = ''
  }
}

const setWaterTotalForDate = (cat, dateKey, ml, meta = {}) => {
  if (!cat.waterLogs) cat.waterLogs = []
  cat.waterLogs = cat.waterLogs.filter(log => !(log.at && String(log.at).startsWith(dateKey)))
  const amount = Math.round(Number(ml))
  if (amount > 0) {
    const at = dateKey === getTodayString()
      ? getNowDatetimeLocal()
      : `${dateKey}T12:00`
    cat.waterLogs.push({
      id: safeUUID(),
      at,
      amountMl: amount,
      notes: '',
      sources: {
        fountain: !!meta.sources?.fountain,
        bowl: !!meta.sources?.bowl,
        other: !!meta.sources?.other
      },
      otherSource: meta.otherSource?.trim() || ''
    })
  }
  syncDietWaterForDate(cat, dateKey)
}

const saveDayWaterTotal = () => {
  if (!currentCat.value) return
  const ml = Number(dayWaterDraftMl.value)
  if (Number.isNaN(ml) || ml < 0) {
    alert('請輸入有效飲水量 (ml)')
    return
  }
  if (dayWaterDraftSources.value.other && !dayWaterDraftOther.value.trim()) {
    alert('請填寫「其他」飲水來源')
    return
  }
  setWaterTotalForDate(currentCat.value, selectedDate.value, ml, {
    sources: { ...dayWaterDraftSources.value },
    otherSource: dayWaterDraftOther.value.trim()
  })
  syncWaterDraftFromSaved()
  persistCats()
}

const saveActiveMealEntry = () => {
  if (!currentCat.value || !activeMealSlot.value) return
  ensureMealEntry(activeMealSlot.value, selectedDate.value)
  stashActiveFoodFields(activeMealSlot.value)
  commitSavedFoodForActiveType(activeMealSlot.value)
  persistCats()
  mealSaveMessage.value = '已儲存'
  if (mealSaveMessageTimer) clearTimeout(mealSaveMessageTimer)
  mealSaveMessageTimer = setTimeout(() => { mealSaveMessage.value = '' }, 2000)
}

const addWaterIncrement = (forDate = null, delta = 20) => {
  if (!currentCat.value) return
  const dateKey = forDate || getTodayString()
  const current = sumWaterMlForDate(currentCat.value, dateKey)
  setWaterTotalForDate(currentCat.value, dateKey, current + delta)
  if (dateKey === selectedDate.value) syncWaterDraftFromSaved()
  persistCats()
}

const showHeaderSettingsMenu = ref(false)
const showRemindersModal = ref(false)
const showBookingModal = ref(false)
const editReminders = ref([])
const editingReminderIdx = ref(null)
const remindersModalError = ref('')
const showNewReminderForm = ref(false)

const REMINDER_PERIOD_OPTIONS = [
  { value: 'day', label: '每 N 日' },
  { value: 'week', label: '每 N 週' },
  { value: 'month', label: '每 N 月' },
  { value: 'year', label: '每 N 年' }
]

const createEmptyReminderDraft = () => ({
  icon: '📌',
  title: '',
  nextDate: getTodayString(),
  periodType: 'month',
  periodValue: 1
})

const newReminderDraft = ref(createEmptyReminderDraft())

const isCustomReminder = (rem) => {
  if (!rem) return false
  if (rem.catalogId === 'custom' || String(rem.id || '').startsWith('custom-')) return true
  return !CARE_MILESTONE_CATALOG.some(c => c.id === rem.catalogId || c.id === rem.id)
}

const isReminderTextEditing = (idx) => editingReminderIdx.value === idx

const toggleEditReminderText = (idx) => {
  editingReminderIdx.value = editingReminderIdx.value === idx ? null : idx
}

const catalogRemindersAvailable = computed(() => {
  const taken = new Set((editReminders.value || [])
    .filter(r => !isReminderPlaceholder(r))
    .map(r => r.catalogId || r.id)
    .filter(Boolean))
  return REMINDER_QUICK_TEMPLATE_IDS
    .map(id => CARE_MILESTONE_CATALOG.find(c => c.id === id))
    .filter(c => c && !taken.has(c.id))
})

const currentCatIndex = ref(0)

const myWhatsAppNumber = '85298462988'
const myInstagramUsername = 'meowmeowgrooming'

const getWhatsAppLink = () => {
  const catName = currentCat.value ? currentCat.value.name : '貓貓'
  const message = `你好 Sonia！我用緊你嘅貓咪智慧紀錄表，想幫【${catName}】預約專業貓貓沖涼美毛服務呀！`
  return `https://api.whatsapp.com/send?phone=${myWhatsAppNumber}&text=${encodeURIComponent(message)}`
}
const getInstagramLink = () => `https://www.instagram.com/${myInstagramUsername}/`

const REMINDER_QUICK_TEMPLATE_IDS = [
  'bath',
  'vaccine',
  'annual_checkup',
  'deworm',
  'adoption_anniversary',
  'groom_nails',
  'group_buy',
]

/** 可配置大事備忘錄類別（首頁列表＋日後擴充） */
const CARE_MILESTONE_CATALOG = [
  { id: 'bath', category: '美容清潔', icon: '🛁', title: '🛁🌟預約專業貓貓沖涼美毛服務', periodType: 'month', periodValue: 3, isBath: true, pinTop: true, matchTitle: /沖涼|洗護|毛髮|美毛|預約|上門|深層/ },
  { id: 'vaccine', category: '醫療保健', icon: '💉', title: '注射疫苗', periodType: 'year', periodValue: 1, matchTitle: /注射疫苗|施打疫苗|疫苗/ },
  { id: 'annual_checkup', category: '醫療保健', icon: '🩺', title: '年度身體檢查', periodType: 'year', periodValue: 1, matchTitle: /年度身體檢查|身體檢查|體檢/ },
  { id: 'deworm', category: '健康防護', icon: '🐛', title: '每月驅蟲/除蚤日', periodType: 'month', periodValue: 1, matchTitle: /驅蟲|除蚤/ },
  { id: 'adoption_anniversary', category: '貓奴備忘', icon: '🎈', title: '紀念日,領養三週年！要開高級罐罐！', periodType: 'year', periodValue: 1, matchTitle: /紀念|週年|領養|罐罐|金罐/ },
  { id: 'groom_nails', category: '美容清潔', icon: '✂️', title: '剪指甲', periodType: 'day', periodValue: 14, matchTitle: /剪甲|剪指甲/ },
  { id: 'group_buy', category: '日常補給', icon: '🛍️', title: '主子最愛罐罐開團預購！', periodType: 'month', periodValue: 1, matchTitle: /開團|罐罐|預購|補貨|補給/ },
  { id: 'vet_visit', category: '醫療覆診', icon: '🏥', title: '🏥 覆診睇對眼、施打疫苗', periodType: 'year', periodValue: 1, matchTitle: /覆診|VET|診所|睇對眼/ },
  { id: 'litter_deep', category: '家居清潔', icon: '🧹', title: '深層清潔貓砂盆', periodType: 'week', periodValue: 2, matchTitle: /貓砂盆|清潔砂/ },
  { id: 'supplement', category: '營養保健', icon: '🥣', title: '營養品補充檢查', periodType: 'day', periodValue: 7, matchTitle: /營養|保健品/ },
  { id: 'inventory', category: '補貨提醒', icon: '📦', title: '消耗品補貨檢查', periodType: 'week', periodValue: 2, matchTitle: /消耗品/ },
]

const buildNewCatReminders = () => {
  const bath = CARE_MILESTONE_CATALOG.find(c => c.id === 'bath')
  const placeholderIds = ['vaccine', 'group_buy', 'adoption_anniversary']
  return [
    {
      id: 'bath',
      catalogId: 'bath',
      icon: bath.icon,
      title: bath.title,
      category: bath.category,
      nextDate: '',
      periodType: bath.periodType,
      periodValue: bath.periodValue,
      isBath: true,
      pinTop: true,
      isPlaceholder: false,
      userConfigured: false,
    },
    ...placeholderIds.map((id) => {
      const catalog = CARE_MILESTONE_CATALOG.find(c => c.id === id)
      return {
        id,
        catalogId: id,
        icon: catalog.icon,
        title: '',
        category: catalog.category,
        nextDate: '',
        periodType: catalog.periodType,
        periodValue: catalog.periodValue,
        isPlaceholder: true,
        userConfigured: false,
      }
    }),
  ]
}

const buildDefaultReminders = () => [
  {
    id: 'bath',
    catalogId: 'bath',
    icon: '🛁',
    title: '🌟 專業貓咪深層毛髮沖涼洗護',
    category: '美容清潔',
    nextDate: '2026-06-21',
    periodType: 'month',
    periodValue: 3,
    isBath: true,
    pinTop: true
  },
  {
    id: 'vet_visit',
    catalogId: 'vet_visit',
    icon: '🏥',
    title: '🏥 覆診睇對眼、施打疫苗',
    category: '醫療覆診',
    nextDate: '2026-06-30 15:00',
    periodType: 'year',
    periodValue: 1
  },
  {
    id: 'group_buy',
    catalogId: 'group_buy',
    icon: '🛍️',
    title: '🛍️ 主子愛牌罐罐日本開團、預購生肉糧',
    category: '日常補給',
    nextDate: '2026-06-25',
    periodType: 'month',
    periodValue: 1
  },
  {
    id: 'adoption_anniversary',
    catalogId: 'adoption_anniversary',
    icon: '🎈',
    title: '🎈 仔寶領養 3 週年紀念日！要開高級金罐！',
    category: '貓奴備忘',
    nextDate: '2026-07-05',
    periodType: 'year',
    periodValue: 1
  }
]

const defaultReminders = buildDefaultReminders()

const isStockDefaultReminders = (reminders) => {
  if (!Array.isArray(reminders) || reminders.length !== 4) return false
  const defaults = buildDefaultReminders()
  const byId = Object.fromEntries(reminders.map(r => [r.catalogId || r.id, r]))
  return defaults.every((def) => {
    const id = def.catalogId || def.id
    const row = byId[id]
    if (!row) return false
    return String(row.title || '').trim() === def.title
      && String(row.nextDate || '').trim() === String(def.nextDate || '').trim()
  })
}

const MILESTONE_PLACEHOLDER_IDS = [
  'vaccine',
  'annual_checkup',
  'deworm',
  'adoption_anniversary',
  'groom_nails',
  'group_buy',
  'vet_visit',
]

const toPlaceholderReminder = (catalog) => ({
  id: catalog.id,
  catalogId: catalog.id,
  icon: catalog.icon,
  title: '',
  category: catalog.category,
  nextDate: '',
  periodType: catalog.periodType,
  periodValue: catalog.periodValue,
  isPlaceholder: true,
  userConfigured: false,
})

const isCatalogTemplateReminder = (reminder, catalog) => {
  const title = String(reminder.title || '').trim()
  if (!title) return true
  if (title === catalog.title) return true
  const stockDef = buildDefaultReminders().find(r => (r.catalogId || r.id) === catalog.id)
  if (stockDef && title === stockDef.title) return true
  if (catalog.matchTitle?.test(title)) return true
  return false
}

const migrateReminderSlotIfStock = (reminder) => {
  const id = reminder.catalogId || reminder.id
  const stockDef = buildDefaultReminders().find(r => (r.catalogId || r.id) === id)
  const catalog = CARE_MILESTONE_CATALOG.find(c => c.id === id)

  if (reminder.userConfigured && String(reminder.title || '').trim() && hasMilestoneDate(reminder.nextDate)) {
    return { ...reminder, isPlaceholder: false, userConfigured: true }
  }

  if (id === 'bath' && catalog) {
    const dateIsStock = !reminder.nextDate
      || String(reminder.nextDate).trim() === String(stockDef?.nextDate || '').trim()
    const shouldUseCatalogTitle = isCatalogTemplateReminder(reminder, catalog) && !reminder.userConfigured
    return {
      ...reminder,
      icon: catalog.icon,
      title: shouldUseCatalogTitle ? catalog.title : reminder.title,
      nextDate: dateIsStock ? '' : String(reminder.nextDate || '').trim(),
      isPlaceholder: false,
      isBath: true,
      pinTop: true,
      userConfigured: hasMilestoneDate(reminder.nextDate) && !dateIsStock,
    }
  }

  if (MILESTONE_PLACEHOLDER_IDS.includes(id) && catalog) {
    if (isCatalogTemplateReminder(reminder, catalog) || reminder.isPlaceholder) {
      return toPlaceholderReminder(catalog)
    }
    if (!hasMilestoneDate(reminder.nextDate)) {
      return toPlaceholderReminder(catalog)
    }
  }

  if (stockDef && catalog) {
    const titleIsStock = String(reminder.title || '').trim() === stockDef.title
    const dateIsStock = !reminder.nextDate
      || String(reminder.nextDate).trim() === String(stockDef.nextDate || '').trim()
    if (titleIsStock && dateIsStock) {
      return toPlaceholderReminder(catalog)
    }
  }

  return {
    ...reminder,
    isPlaceholder: !String(reminder.title || '').trim() || !hasMilestoneDate(reminder.nextDate),
    userConfigured: !!(String(reminder.title || '').trim() && hasMilestoneDate(reminder.nextDate)),
  }
}

const normalizeReminderList = (reminders) => {
  if (!hasValidReminders(reminders)) {
    return JSON.parse(JSON.stringify(buildNewCatReminders()))
  }
  if (isLegacyDefaultReminders(reminders) || isStockDefaultReminders(reminders)) {
    return JSON.parse(JSON.stringify(buildNewCatReminders()))
  }
  return reminders.map(migrateReminderSlotIfStock)
}

const isLegacyDefaultReminders = (reminders) => {
  if (!Array.isArray(reminders) || reminders.length < 3) return false
  const ids = new Set(reminders.map(r => r.catalogId || r.id))
  const hasNewDefaults = (ids.has('vet_visit') || ids.has('vaccine'))
    && ids.has('group_buy')
    && ids.has('adoption_anniversary')
  if (hasNewDefaults) return false
  if (ids.has('groom_nails') || ids.has('deworm') || ids.has('owner_supplies') || ids.has('vaccine')) return true
  return reminders.some(r =>
    r.title === '沖涼洗護' ||
    r.title === '去 VET 診所覆診 / 施打年度疫苗' ||
    r.title === '網購進口主食罐與日常用品補貨'
  )
}

const resolveMilestoneCatalog = (event) => {
  if (!event) return { id: 'custom', category: '照顧事項', icon: '📌', title: '自訂事項' }
  const byId = CARE_MILESTONE_CATALOG.find(c => c.id === event.catalogId || c.id === event.id)
  if (byId) return { ...byId, category: event.category || byId.category }
  const byTitle = CARE_MILESTONE_CATALOG.find(c => c.matchTitle?.test(event.title || ''))
  if (byTitle) return { ...byTitle, category: event.category || byTitle.category }
  return { id: 'custom', category: event.category || '照顧事項', icon: event.icon || '📌', title: event.title }
}

const getMilestoneUrgency = (nextDate) => {
  if (!hasMilestoneDate(nextDate)) return 'unset'
  const diff = getDaysDiff(nextDate)
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'soon'
  return 'ok'
}

const isReminderPlaceholder = (reminder) => {
  if (!reminder) return true
  if (reminder.isPlaceholder) return true
  return !String(reminder.title || '').trim()
}

const getMilestoneDisplayTitle = (event, meta) => {
  const title = String(event?.title || '').trim()
  if (title) return title
  if (isReminderPlaceholder(event)) return '待設定項目（可快速加入範本）'
  return meta?.title || '待設定項目'
}

const homeMilestoneUrgencyClass = (urgency) => {
  if (urgency === 'unset') return 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
  if (urgency === 'overdue') return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
  if (urgency === 'soon') return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
  return 'theme-accent-bg theme-accent-text ring-1 ring-[color:var(--theme-accent-border)]'
}

const createEmptyMealSlot = () => ({
  foodType: '乾糧',
  dryCategory: '乾糧',
  wetCategory: '濕糧（正餐）',
  dryByCategory: {},
  wetByCategory: {},
  supplementRecord: createEmptySupplementRecord(),
  treatRecord: createEmptyTreatRecord(),
  savedFoodSnapshot: createEmptySavedFoodSnapshot(),
  dryBrand: '', dryFlavor: '', dryAmount: '', dryLove: null,
  wetBrand: '', wetFlavor: '', wetAmount: '', wetLove: null,
  supplements: [],
  supplementOther: '',
  treatsType: '', treatsLove: null
})

const createMealEntry = (at) => ({
  id: safeUUID(),
  at,
  ...createEmptyMealSlot()
})

const inferFoodTypeFromSlot = (slot) => {
  if (!slot) return '乾糧'
  ensureCategoryMaps(slot)
  if (treatRecordHasContent(slot.treatRecord)) return '零食'
  if (supplementRecordHasContent(slot.supplementRecord)) return '保健品'
  for (const cat of WET_FOOD_TYPES) {
    if (foodRecordHasContent(slot.wetByCategory[cat])) return cat
  }
  for (const cat of DRY_FOOD_TYPES) {
    if (foodRecordHasContent(slot.dryByCategory[cat])) return cat
  }

  if (slot.wetBrand?.trim() || slot.wetAmount?.trim()) {
    return isWetFoodType(slot.wetCategory) ? slot.wetCategory : '濕糧（正餐）'
  }
  if (slot.dryBrand?.trim() || slot.dryAmount?.trim()) {
    return isDryFoodType(slot.dryCategory) ? slot.dryCategory : '乾糧'
  }

  return slot.foodType || '乾糧'
}

const ensureMealEntry = (entry, dateKey) => {
  if (!entry) return
  if (!entry.id) entry.id = safeUUID()
  if (!entry.at && dateKey) entry.at = `${dateKey}T12:00`
  ensureMealSlotFields(entry)
}

const mealEntryFromSlot = (slot, dateKey, timeIndex = 0) => {
  ensureMealSlotFields(slot)
  const t = MEAL_DEFAULT_TIMES[timeIndex] ?? '12:00'
  return {
    id: slot.id || safeUUID(),
    at: slot.at || (dateKey ? `${dateKey}T${t}` : getNowDatetimeLocal()),
    foodType: inferFoodTypeFromSlot(slot),
    dryCategory: slot.dryCategory || '乾糧',
    wetCategory: slot.wetCategory || '濕糧（正餐）',
    dryByCategory: slot.dryByCategory || {},
    wetByCategory: slot.wetByCategory || {},
    supplementRecord: slot.supplementRecord || createEmptySupplementRecord(),
    treatRecord: slot.treatRecord || createEmptyTreatRecord(),
    savedFoodSnapshot: slot.savedFoodSnapshot || createEmptySavedFoodSnapshot(),
    dryBrand: slot.dryBrand || '',
    dryFlavor: slot.dryFlavor || '',
    dryAmount: slot.dryAmount || '',
    dryLove: slot.dryLove ?? null,
    wetBrand: slot.wetBrand || '',
    wetFlavor: slot.wetFlavor || '',
    wetAmount: slot.wetAmount || '',
    wetLove: slot.wetLove ?? null,
    supplements: Array.isArray(slot.supplements) ? [...slot.supplements] : [],
    supplementOther: slot.supplementOther || '',
    treatsType: slot.treatsType || '',
    treatsLove: slot.treatsLove ?? null
  }
}

const ensureMealSlotFields = (slot) => {
  if (!slot) return
  ensureCategoryMaps(slot)
  if (slot.foodType === undefined) slot.foodType = inferFoodTypeFromSlot(slot)
  if (slot.dryCategory === undefined) slot.dryCategory = '乾糧'
  if (slot.wetCategory === undefined) slot.wetCategory = '濕糧（正餐）'
  if (!Array.isArray(slot.supplements)) {
    if (slot.supplementType) {
      slot.supplements = [slot.supplementType]
      delete slot.supplementType
    } else {
      slot.supplements = []
    }
  }
  if (slot.supplementOther === undefined) slot.supplementOther = ''
}

const createEmptyDietDay = () => ({
  mealEntries: [],
  waterMl: 0
})

const hasLegacyBldMeals = (meals) => {
  if (!meals) return false
  return ['breakfast', 'lunch', 'dinner'].some(k => Object.prototype.hasOwnProperty.call(meals, k))
}

const migrateDayToMeals = (day, dateKey = null) => {
  if (!day) return
  const dk = dateKey || getTodayString()

  if (Array.isArray(day.mealEntries)) {
    day.mealEntries.forEach(entry => ensureMealEntry(entry, dk))
    if (day.meals) delete day.meals
    return
  }

  const entries = []

  if (day.meals && typeof day.meals === 'object') {
    if (hasLegacyBldMeals(day.meals)) {
      ;[
        ['breakfast', 0],
        ['lunch', 1],
        ['dinner', 2]
      ].forEach(([fromKey, timeIndex]) => {
        const slot = day.meals[fromKey]
        if (slot && mealSlotHasContent(slot)) {
          entries.push(mealEntryFromSlot(slot, dk, timeIndex))
        }
      })
    } else {
      sortMealKeys(Object.keys(day.meals).filter(isNumericMealKey)).forEach(k => {
        const slot = day.meals[k]
        if (slot && mealSlotHasContent(slot)) {
          const timeIndex = Math.max(0, Number(k) - 1)
          entries.push(mealEntryFromSlot(slot, dk, timeIndex))
        }
      })
    }
  }

  const flatHasData = !!(
    day.dryBrand || day.dryFlavor || day.dryAmount ||
    day.wetBrand || day.wetFlavor || day.wetAmount ||
    day.treatsType
  )
  if (flatHasData) {
    const legacy = createEmptyMealSlot()
    legacy.dryBrand = day.dryBrand || ''
    legacy.dryFlavor = day.dryFlavor || ''
    legacy.dryAmount = day.dryAmount || ''
    legacy.dryLove = day.dryLove ?? null
    legacy.wetBrand = day.wetBrand || ''
    legacy.wetFlavor = day.wetFlavor || ''
    legacy.wetAmount = day.wetAmount || ''
    legacy.wetLove = day.wetLove ?? null
    legacy.treatsType = day.treatsType || ''
    legacy.treatsLove = day.treatsLove ?? null
    const mealLabel = day.dryMeal || day.wetMeal || day.treatsMeal || '早餐'
    const timeIndex = Math.max(0, Number(LEGACY_MEAL_KEYS[mealLabel] || '1') - 1)
    entries.push(mealEntryFromSlot(legacy, dk, timeIndex))
    const flatKeys = [
      'dryBrand', 'dryFlavor', 'dryMeal', 'dryAmount', 'dryLove',
      'wetBrand', 'wetFlavor', 'wetMeal', 'wetAmount', 'wetLove',
      'treatsType', 'treatsMeal', 'treatsLove'
    ]
    flatKeys.forEach(k => { delete day[k] })
  }

  day.mealEntries = entries
  delete day.meals
  day.mealEntries.forEach(entry => ensureMealEntry(entry, dk))
}

const migrateWaterToLogs = (cat) => {
  if (!cat.waterLogs) cat.waterLogs = []
  if (cat.waterLogs.length > 0) return
  Object.entries(cat.dietHistory || {}).forEach(([date, day]) => {
    const ml = Number(day.waterMl)
    if (ml > 0) {
      cat.waterLogs.push({
        id: `mw-${date}`,
        at: `${date}T12:00`,
        amountMl: ml,
        notes: ''
      })
    }
  })
}

const hasValidReminders = (reminders) => {
  return Array.isArray(reminders) && reminders.length > 0
}

const CARE_MODULE_TILES = [
  { id: 'manual', title: '貓貓說明書', desc: 'Petsitter / 貓酒店交接詳細資料' },
  { id: 'inventory', title: '消耗品補貨清單', desc: '貓糧、貓砂等用品庫存管理' },
  { id: 'favorites', title: '喜好地圖\n(最愛/厭惡清單)', desc: '主子最愛同最討厭事項或地方' },
  { id: 'careMed', title: '餵藥表', desc: '醫療用藥排程與每日服藥紀錄' },
  { id: 'weight', title: '體重追蹤', desc: '體重紀錄與目標進度追蹤' },
  { id: 'insurance', title: '保險資料', desc: '保單資料隨時查閱' },
  { id: 'guide', title: '使用指南', desc: '快速上手教學與設定秘笈' },
  { id: 'medHistory', title: '歷史醫療病歷紀錄', desc: '重大手術、慢性病史與藥物過敏終身備忘' }
]

const activeCareModule = ref('')

const getCareModuleMeta = (id) => CARE_MODULE_TILES.find(m => m.id === id) || { title: '', desc: '' }
const getCareModuleLabel = (id) => getCareModuleMeta(id).title.replace(/\n/g, ' ')
const getCareModuleDesc = (id) => getCareModuleMeta(id).desc

const openCareModule = (id) => {
  if (!currentCat.value) return
  ensureCareData(currentCat.value)
  if (id === 'manual') {
    ensureHandoverSheet()
    syncHandoverDailyVisits()
  }
  if (id === 'weight') {
    syncTargetWeightInput()
  }
  activeCareModule.value = id
}

const closeCareModule = () => {
  activeCareModule.value = ''
  careMaintenanceEditMode.value = false
  careMaintenanceCustomModalOpen.value = false
  closeCareMaintenanceEditModal()
  closeCareMaintenanceDateModal()
  closeCareMaintenanceDeleteConfirm()
}

const BEHAVIOR_SOCIAL_AFFECTION_TAGS = ['互相舔毛', '一齊瞓', '鼻碰鼻']
const BEHAVIOR_SOCIAL_CONFLICT_TAGS = ['哈氣', '堵塞砂盆路口', '搶食', '打大交']

const BEHAVIOR_SOCIAL_INTIMACY_BASE = 50
const BEHAVIOR_SOCIAL_INTIMACY_AFFECTION_WEIGHT = 15
const BEHAVIOR_SOCIAL_INTIMACY_CONFLICT_WEIGHT = -15
const BEHAVIOR_SOCIAL_INTIMACY_TAG_WEIGHTS = {
  互相舔毛: 15,
  一齊瞓: 15,
  鼻碰鼻: 15,
  哈氣: -15,
  堵塞砂盆路口: -15,
  搶食: -15,
  打大交: -15
}
const BEHAVIOR_SINGLE_QUIRK_TAGS = ['瘋狂衝刺', '定格望牆角', '反肚', '踩奶']
const BEHAVIOR_SINGLE_WARNING_TAGS = ['亂尿尿', '過度舔毛到禿', '無故大叫', '突然匿埋']
const BEHAVIOR_SINGLE_HUMAN_AFFECTION_TAGS = ['主動陪訓', '瘋狂踩奶', '跟出跟入', '主動討摸', '煲水']
const BEHAVIOR_SINGLE_HUMAN_REJECTION_TAGS = ['摸兩下咬人', '全日無視奴才', '哈氣/飛機耳', '出爪抓人']
const BEHAVIOR_HUMAN_TAG_LEGACY_ALIASES = { '煲老藕（咕嚕嚕）': '煲水' }

const BEHAVIOR_MOOD_SCORE_BASE = 50
const BEHAVIOR_MOOD_TAG_WEIGHTS = {
  反肚: 10,
  踩奶: 10,
  主動陪訓: 10,
  瘋狂踩奶: 10,
  跟出跟入: 10,
  主動討摸: 10,
  煲水: 10,
  瘋狂衝刺: 0,
  定格望牆角: 0,
  testing: 0,
  亂尿尿: -20,
  過度舔毛到禿: -20,
  無故大叫: -20,
  突然匿埋: -20,
  摸兩下咬人: -15,
  全日無視奴才: -15,
  '哈氣/飛機耳': -15,
  出爪抓人: -15
}

const BEHAVIOR_SOCIAL_STORAGE_KEY = 'meow_behavior_social_logs_v1'
const BEHAVIOR_SOCIAL_CUSTOM_TAGS_KEY = 'meow_behavior_social_custom_tags_v1'
const BEHAVIOR_SOCIAL_HIDDEN_TAGS_KEY = 'meow_behavior_social_hidden_tags_v1'

const BEHAVIOR_SOCIAL_SINGLE_TAG_GROUPS = {
  quirk: {
    presets: BEHAVIOR_SINGLE_QUIRK_TAGS,
    storeKey: 'quirk',
    tagKey: 'quirkTags',
    toggleGroup: 'quirk'
  },
  warning: {
    presets: BEHAVIOR_SINGLE_WARNING_TAGS,
    storeKey: 'warning',
    tagKey: 'warningTags',
    toggleGroup: 'warning'
  },
  humanAffection: {
    presets: BEHAVIOR_SINGLE_HUMAN_AFFECTION_TAGS,
    storeKey: 'humanAffection',
    tagKey: 'humanInteractionTags',
    toggleGroup: 'humanAffection'
  },
  humanRejection: {
    presets: BEHAVIOR_SINGLE_HUMAN_REJECTION_TAGS,
    storeKey: 'humanRejection',
    tagKey: 'humanInteractionTags',
    toggleGroup: 'humanRejection'
  }
}

const normalizeBehaviorSocialHiddenTags = (data) => {
  const base = { quirk: [], warning: [], humanAffection: [], humanRejection: [] }
  if (!data || typeof data !== 'object') return base
  base.quirk = Array.isArray(data.quirk) ? data.quirk.filter(t => String(t || '').trim()) : []
  base.warning = Array.isArray(data.warning) ? data.warning.filter(t => String(t || '').trim()) : []
  base.humanAffection = Array.isArray(data.humanAffection) ? data.humanAffection.filter(t => String(t || '').trim()) : []
  base.humanRejection = Array.isArray(data.humanRejection) ? data.humanRejection.filter(t => String(t || '').trim()) : []
  return base
}

const normalizeBehaviorSocialCustomTags = (data) => {
  const base = { affection: [], conflict: [], quirk: [], warning: [], humanAffection: [], humanRejection: [] }
  if (!data || typeof data !== 'object') return base
  base.affection = Array.isArray(data.affection) ? data.affection.filter(t => String(t || '').trim()) : []
  base.conflict = Array.isArray(data.conflict) ? data.conflict.filter(t => String(t || '').trim()) : []
  base.quirk = Array.isArray(data.quirk) ? data.quirk.filter(t => String(t || '').trim()) : []
  base.warning = Array.isArray(data.warning) ? data.warning.filter(t => String(t || '').trim()) : []
  base.humanAffection = Array.isArray(data.humanAffection) ? data.humanAffection.filter(t => String(t || '').trim()) : []
  base.humanRejection = Array.isArray(data.humanRejection) ? data.humanRejection.filter(t => String(t || '').trim()) : []
  return base
}

const migrateBehaviorSocialHumanTagLabel = (tag) => BEHAVIOR_HUMAN_TAG_LEGACY_ALIASES[tag] || tag

const migrateBehaviorSocialLogShape = (log) => {
  if (!Array.isArray(log.tags)) {
    log.tags = [
      ...(log.affectionTags || []),
      ...(log.conflictTags || []),
      ...(log.quirkTags || []),
      ...(log.warningTags || []),
      ...(log.humanInteractionTags || [])
    ]
  }
  if (log.mode === 'interaction') return log
  if (log.mode === 'multi' && !log.primaryCat) {
    log.primaryCat = log.actorName || '貓貓'
    log.primaryCatId = log.actorCatId
    log.targetCats = log.partnerName ? [log.partnerName] : []
    log.targetCatIds = log.partnerCatId ? [log.partnerCatId] : []
  }
  if (log.mode === 'group' && !log.primaryCat) {
    const names = log.participantNames || []
    const ids = log.participantCatIds || []
    log.primaryCat = names[0] || '貓貓'
    log.primaryCatId = ids[0]
    log.targetCats = names.slice(1)
    log.targetCatIds = ids.slice(1)
  }
  return log
}

const normalizeBehaviorSocialLog = (log) => {
  if (!log.id) log.id = safeUUID()
  if (!log.at) log.at = getNowDatetimeLocal()
  if (!log.mode) log.mode = 'single'
  if (!Array.isArray(log.tags)) log.tags = []
  if (!Array.isArray(log.affectionTags)) log.affectionTags = []
  if (!Array.isArray(log.conflictTags)) log.conflictTags = []
  if (!Array.isArray(log.quirkTags)) log.quirkTags = []
  if (!Array.isArray(log.warningTags)) log.warningTags = []
  if (!Array.isArray(log.humanInteractionTags)) log.humanInteractionTags = []
  log.humanInteractionTags = log.humanInteractionTags.map(migrateBehaviorSocialHumanTagLabel)
  if (Array.isArray(log.tags)) {
    log.tags = log.tags.map(t => migrateBehaviorSocialHumanTagLabel(t))
  }
  if (!Array.isArray(log.targetCats)) log.targetCats = []
  if (!Array.isArray(log.targetCatIds)) log.targetCatIds = []
  if (log.note === undefined) log.note = ''
  if (log.intimacy === undefined || Number.isNaN(Number(log.intimacy))) log.intimacy = 50
  if (log.moodScore === undefined || Number.isNaN(Number(log.moodScore))) log.moodScore = 50
  migrateBehaviorSocialLogShape(log)
  return log
}

const behaviorSocialLogs = ref([])
const behaviorSocialCustomTags = ref(normalizeBehaviorSocialCustomTags(null))
const behaviorSocialHiddenTags = ref(normalizeBehaviorSocialHiddenTags(null))
const behaviorSocialCustomAffectionDraft = ref('')
const behaviorSocialCustomConflictDraft = ref('')
const behaviorSocialCustomQuirkDraft = ref('')
const behaviorSocialCustomWarningDraft = ref('')
const behaviorSocialCustomHumanAffectionDraft = ref('')
const behaviorSocialCustomHumanRejectionDraft = ref('')
const showBehaviorSocialCustomAffection = ref(false)
const showBehaviorSocialCustomConflict = ref(false)
const showBehaviorSocialCustomQuirk = ref(false)
const showBehaviorSocialCustomWarning = ref(false)
const showBehaviorSocialCustomHumanAffection = ref(false)
const showBehaviorSocialCustomHumanRejection = ref(false)
const behaviorSocialSaveMessage = ref('')
let behaviorSocialSaveMessageTimer = null
const behaviorSocialSubTab = ref('status')
const behaviorSocialEditingGroup = ref(null)

const isBehaviorSocialSectionEditing = (groupKey) => behaviorSocialEditingGroup.value === groupKey

const toggleBehaviorSocialSectionEdit = (groupKey) => {
  behaviorSocialEditingGroup.value = behaviorSocialEditingGroup.value === groupKey ? null : groupKey
}

const onBehaviorSocialTagChipClick = (groupKey, tag) => {
  if (isBehaviorSocialSectionEditing(groupKey)) return
  const config = BEHAVIOR_SOCIAL_SINGLE_TAG_GROUPS[groupKey]
  if (!config) return
  toggleBehaviorSocialTag(config.toggleGroup, tag)
}

const getBehaviorMoodTagWeight = (tag) => {
  if (Object.prototype.hasOwnProperty.call(BEHAVIOR_MOOD_TAG_WEIGHTS, tag)) {
    return BEHAVIOR_MOOD_TAG_WEIGHTS[tag]
  }
  return 0
}

const computeBehaviorMoodScore = (draft) => {
  const allTags = [
    ...(draft.quirkTags || []),
    ...(draft.warningTags || []),
    ...(draft.humanInteractionTags || [])
  ]
  let score = BEHAVIOR_MOOD_SCORE_BASE
  for (const tag of allTags) score += getBehaviorMoodTagWeight(tag)
  return Math.max(0, Math.min(100, score))
}

const syncBehaviorSocialMoodScore = () => {
  behaviorSocialDraft.value.moodScore = computeBehaviorMoodScore(behaviorSocialDraft.value)
}

const getBehaviorIntimacyTagWeight = (tag, group) => {
  if (Object.prototype.hasOwnProperty.call(BEHAVIOR_SOCIAL_INTIMACY_TAG_WEIGHTS, tag)) {
    return BEHAVIOR_SOCIAL_INTIMACY_TAG_WEIGHTS[tag]
  }
  if (group === 'affection') return BEHAVIOR_SOCIAL_INTIMACY_AFFECTION_WEIGHT
  if (group === 'conflict') return BEHAVIOR_SOCIAL_INTIMACY_CONFLICT_WEIGHT
  return 0
}

const computeBehaviorIntimacyScore = (draft) => {
  let score = BEHAVIOR_SOCIAL_INTIMACY_BASE
  for (const tag of draft.affectionTags || []) score += getBehaviorIntimacyTagWeight(tag, 'affection')
  for (const tag of draft.conflictTags || []) score += getBehaviorIntimacyTagWeight(tag, 'conflict')
  return Math.max(0, Math.min(100, score))
}

const syncBehaviorSocialIntimacyScore = () => {
  if (!isMultiCatHousehold.value) return
  behaviorSocialDraft.value.intimacy = computeBehaviorIntimacyScore(behaviorSocialDraft.value)
}

const CARE_CHECKLIST_TASKS = [
  { key: 'water', label: '換清水' },
  { key: 'litter', label: '清理貓砂' },
  { key: 'food', label: '餵食' },
  { key: 'observe', label: '觀察精神食慾' },
  { key: 'play', label: '陪玩互動' },
  { key: 'meds', label: '餵藥' }
]

const CARE_MAINTENANCE_STORAGE_KEY = 'meow_care_maintenance_v1'

const CARE_MAINTENANCE_FREQ_TABS = [
  { id: 'daily', label: '每日' },
  { id: 'weekly', label: '每星期' },
  { id: 'biweekly', label: '每兩星期' },
  { id: 'monthly', label: '每月' },
  { id: 'quarterly', label: '每三個月' },
  { id: 'semiannual', label: '每半年' },
  { id: 'annual', label: '每年' }
]

const CARE_MAINTENANCE_FREQ_HINTS = {
  weekly: '每週進行基礎「五官」與環境小維護，細菌油垢通通 Out！',
  biweekly: '兩週一次局部修毛與微體檢，爪子不抓人，PP 不沾屎。',
  monthly: '每個月的深層大除菌，全體用品除舊迎新！',
  quarterly: '季節交替的深度修護，重頭戲是預約專業貓貓沖涼美毛服務！',
  semiannual: '每半年的溫馨回顧，看看主子最近過得爽不爽。',
  annual: '年度健康大檢閱，為未來一年的幸福生活續期。'
}

const DEFAULT_CARE_MAINTENANCE_ITEMS = [
  // 每日
  { id: 'daily-bowl-clean', frequency: 'daily', section: 'care', scope: 'household', builtIn: true,
    title: '清潔貓糧及水兜',
    description: '徹底洗淨食盆與水碗，唔好等口水油脂變成病菌溫床。' },
  { id: 'daily-fresh-water', frequency: 'daily', section: 'care', scope: 'household', builtIn: true,
    title: '更換新鮮水',
    description: '斟滿新鮮靚水，留意水位變化。如果主子突然唔飲水或者飲極都唔夠，就要留意健康警報。' },
  { id: 'daily-litter', frequency: 'daily', section: 'care', scope: 'household', builtIn: true,
    title: '清理貓砂盆',
    description: '每日清砂兼密密觀察。留意尿量有冇變少、便便形狀靚唔靚，有怪異就即刻去排泄日誌記低！' },
  { id: 'daily-brush', frequency: 'daily', section: 'care', scope: 'perCat', builtIn: true,
    title: '梳毛毛時間',
    description: '梳理廢毛減少打結，同毛球 say bye！順便摸下主子全身上下，睇下有冇邊度唔舒服。' },
  { id: 'daily-play', frequency: 'daily', section: 'care', scope: 'perCat', builtIn: true,
    title: '放電大作戰',
    description: '每日專屬放電時間，攞條貓棒扮獵物，瘋狂互動，順便觀察佢跳躍身手敏唔敏捷。' },
  { id: 'daily-teeth', frequency: 'daily', section: 'care', scope: 'perCat', builtIn: true,
    title: '靚齒保衛戰',
    description: '每日堅持刷刷牙，減低牙石形成問題。保持口氣清新。如果主子極度抗拒或者流口水，小心可能係牙肉痛！' },
  { id: 'daily-desensitize', frequency: 'daily', section: 'care', scope: 'perCat', builtIn: true,
    title: '乖乖小訓練',
    description: '摸摸手摸摸腳、習慣入貓袋。用零食做獎勵，等下次去睇醫生時唔會嚇到變飛機耳。' },
  // 每星期 — 局部清潔與日常補給
  { id: 'weekly-nose-clean', frequency: 'weekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '👃 清潔鼻哥',
    description: '溫柔抹走鼻邊乾涸的分泌物與小黑鼻屎，保持主子呼吸順暢、鼻仔粉嫩。' },
  { id: 'weekly-ear-clean', frequency: 'weekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '👂 清潔耳仔',
    description: '檢查耳道，用寵物洗耳水清走油脂與耳垢，預防耳蟎與發炎。' },
  { id: 'weekly-chin-clean', frequency: 'weekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '🐱 清潔下巴',
    description: '飯後用溫水或專用濕紙巾擦拭，預防油脂積聚，遠離「黑頭粉刺下巴」。' },
  { id: 'weekly-fountain-clean', frequency: 'weekly', section: 'care', scope: 'household', builtIn: true,
    title: '⛲ 清洗智能飲水機 / 水碗深層消毒',
    description: '拆洗水泵與濾芯，徹底刷走滑潺潺的唾液與生物膜，主子飲得健康。' },
  { id: 'weekly-litter-refill', frequency: 'weekly', section: 'care', scope: 'household', builtIn: true,
    title: '⏳ 補加貓砂',
    description: '每日鏟屎後補回足夠厚度的乾淨貓砂，維持主子最愛的「掘深坑」腳感。' },
  // 每兩星期 — 美容修剪與身體指標監測
  { id: 'biweekly-anus-check', frequency: 'biweekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '🍑 檢查菊花與肛門腺',
    description: '觀察主子屁屁是否有紅腫、異味或分泌物，預防肛門腺阻塞與發炎。' },
  { id: 'biweekly-paw-butt-trim', frequency: 'biweekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '✂️ 腳底毛同屁屁毛修剪',
    description: '剃短腳底毛防止奔跑滑倒，修短屁屁毛讓便便順暢落地、不沾毛。' },
  { id: 'biweekly-nails', frequency: 'biweekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '💅 剪指甲',
    description: '定期修剪爪尖透明部分，防止指甲過長倒刺入肉，或抓傷家具與奴才。' },
  { id: 'biweekly-weight', frequency: 'biweekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '⚖️ 測量體重',
    description: '精準記錄體重微小變化，體重是貓咪健康的晴雨表，過肥過瘦要警惕。' },
  { id: 'biweekly-skin-check', frequency: 'biweekly', section: 'care', scope: 'perCat', builtIn: true,
    title: '🔍 檢查皮膚狀態',
    description: '撥開毛髮檢查是否有皮屑、紅腫或跳蚤蹤跡，及早防範皮膚病。' },
  // 每月 — 寢具大掃除與消耗品更換
  { id: 'monthly-toy-clean', frequency: 'monthly', section: 'care', scope: 'household', builtIn: true,
    title: '🧸 玩具消毒清潔',
    description: '貓咪經常用口咬與用唾液舔玩具，每月需用寵物專用消毒水洗滌曬乾。' },
  { id: 'monthly-bed-wash', frequency: 'monthly', section: 'care', scope: 'household', builtIn: true,
    title: '🛏️ 貓窩 / 毯子清潔',
    description: '徹底清洗、高溫烘乾或晾曬主子最愛的睡墊，清除積聚的皮屑與廢毛。' },
  { id: 'monthly-base-clean', frequency: 'monthly', section: 'care', scope: 'household', builtIn: true,
    title: '📦 貓貓基地清理',
    description: '清理貓咪平時最常窩著的角落、紙箱或專屬空間，還原乾淨秘密基地。' },
  { id: 'monthly-litter-deep', frequency: 'monthly', section: 'care', scope: 'household', builtIn: true,
    title: '🚽 全面清理貓砂盆 / 更換貓砂',
    description: '舊砂全倒掉，整個貓砂盆用熱水與肥皂深層刷洗，換上一整盆全新香砂。' },
  { id: 'monthly-filter-replace', frequency: 'monthly', section: 'care', scope: 'household', builtIn: true,
    title: '🧬 飲水機換濾芯',
    description: '濾芯壽命到期，準時更換才能確保持續過濾水中的毛髮、重金屬與雜質。' },
  { id: 'monthly-feeder-desiccant', frequency: 'monthly', section: 'care', scope: 'household', builtIn: true,
    title: '🌾 餵食機乾燥劑更換',
    description: '定期更換自動餵食機內的防潮包，確保每一粒乾糧都保持香脆不霉變。' },
  // 每三個月 — 皇牌美容與環境深層大掃除
  { id: 'quarterly-spa-bath', frequency: 'quarterly', section: 'care', scope: 'perCat', builtIn: true,
    title: '🛁 預約專業貓貓沖涼美毛服務',
    description: '預約專業沖涼美毛服務，季節性去油去廢毛，全面激活皮膚健康，預防毛球症！',
    isBath: true, pinTop: true },
  { id: 'quarterly-scratch-board', frequency: 'quarterly', section: 'care', scope: 'household', builtIn: true,
    title: '📦 更換貓爪板',
    description: '檢查磨損程度，粉碎或起毛球的抓板要果斷更換，防止碎屑落入眼睛或誤食。' },
  { id: 'quarterly-cat-tree', frequency: 'quarterly', section: 'care', scope: 'household', builtIn: true,
    title: '🧗 貓爬架清理',
    description: '利用吸塵機與除毛刷深層清理貓爬架布面，噴上寵物安全除菌噴霧。' },
  { id: 'quarterly-deep-clean', frequency: 'quarterly', section: 'care', scope: 'household', builtIn: true,
    title: '🧹 環境深層清潔',
    description: '全屋地板、傢俬死角大消毒，特別注意貓咪活動區域的防蟎與除菌。' },
  { id: 'quarterly-air-purifier', frequency: 'quarterly', section: 'care', scope: 'household', builtIn: true,
    title: '🍃 寵物空氣清淨機更換濾網',
    description: '滿滿的貓毛與皮屑會塞飽濾網，定期更換才能維持全屋空氣清新、告別敏感。' },
  { id: 'quarterly-safety-check', frequency: 'quarterly', section: 'care', scope: 'household', builtIn: true,
    title: '🦺 裝置安全性檢查',
    description: '檢查吸盤貓吊床、上牆貓天梯或高空防護網的螺絲與穩定度，確保主子飛簷走壁極度安全。' },
  // 每半年 — 階段性健康與喜好盤點
  { id: 'semiannual-health-review', frequency: 'semiannual', section: 'care', scope: 'perCat', builtIn: true,
    title: '📊 階段性健康評估',
    description: '整合過去半年的體重、飲食與排便數據，檢視是否有潛在的慢性轉變。' },
  { id: 'semiannual-toy-refresh', frequency: 'semiannual', section: 'care', scope: 'household', builtIn: true,
    title: '🪁 更新 / 更換貓玩具',
    description: '舊玩具玩膩了？斷線了？是時候淘一些新奇有趣的互動玩具激發主子捕獵心。' },
  { id: 'semiannual-food-preference', frequency: 'semiannual', section: 'care', scope: 'perCat', builtIn: true,
    title: '🥩 檢查糧食喜好',
    description: '觀察主子最近對主食罐、生肉或乾糧的熱情，適時微調口味，拒絕挑食。' },
  // 每年 — 醫療大關卡與保障更新
  { id: 'annual-health-check', frequency: 'annual', section: 'care', scope: 'perCat', builtIn: true,
    title: '🏥 年度健康檢查',
    description: '熟齡貓的關鍵任務！透過驗血、超聲波或尿檢，及早揪出隱形疾病。' },
  { id: 'annual-vaccine', frequency: 'annual', section: 'care', scope: 'perCat', builtIn: true,
    title: '💉 預防疫苗注射',
    description: '定期前往獸醫診所補打核心疫苗，築起對抗致命病毒的堅固免疫防護牆。' },
  { id: 'annual-dental', frequency: 'annual', section: 'care', scope: 'perCat', builtIn: true,
    title: '🦷 專業牙仔與牙石評估',
    description: '由註冊獸醫進行口腔深度檢查，評估是否需要洗牙，遠離口炎與牙周病。' },
  { id: 'annual-insurance', frequency: 'annual', section: 'care', scope: 'household', builtIn: true,
    title: '🛡️ 寵物保險更新',
    description: '檢視並續期主子的醫療保險，確保在需要高昂醫療費用時有最強後盾。' }
]

const createDefaultCareMaintenanceState = () => ({
  activeFrequency: 'daily',
  activeFrequencyByCatId: {},
  hiddenBuiltinIds: [],
  builtinOverrides: {},
  customItems: [],
  trashedCustomItems: [],
  completions: {},
  midLongOffsetsSeeded: false,
  seededCareCatIds: []
})

const CARE_MAINTENANCE_LEGACY_BATH_TITLES = new Set([
  '🛁 專業貓咪深層毛髮沖涼美容',
  '🌟 專業貓咪深層毛髮沖涼洗護',
  '專業貓咪深層毛髮沖涼美容',
  '專業貓咪深層毛髮沖涼洗護',
  '沖涼洗護',
  '預約貓貓沖涼洗護',
])

const CARE_MAINTENANCE_LEGACY_BATH_DESCRIPTIONS = new Set([
  '季節性專業去油、去廢毛深層毛髮洗護，全面激活皮膚健康，預防毛球症！',
])

const NEW_CARE_BATH_TITLE = '🛁 預約專業貓貓沖涼美毛服務'
const NEW_CARE_BATH_DESCRIPTION = '預約專業沖涼美毛服務，季節性去油去廢毛，全面激活皮膚健康，預防毛球症！'

const isLegacyCareBathTitle = (title) => {
  const text = String(title || '').trim()
  if (!text) return false
  if (CARE_MAINTENANCE_LEGACY_BATH_TITLES.has(text)) return true
  return /專業貓咪深層毛髮沖涼|沖涼洗護/.test(text) && !/預約專業貓貓沖涼美毛/.test(text)
}

const isLegacyCareBathDescription = (description) => {
  const text = String(description || '').trim()
  if (!text) return false
  if (CARE_MAINTENANCE_LEGACY_BATH_DESCRIPTIONS.has(text)) return true
  return /深層毛髮洗護/.test(text) && !/預約專業沖涼美毛/.test(text)
}

const migrateCareMaintenanceItemText = (item) => {
  if (!item || typeof item !== 'object') return item
  let next = item
  if (isLegacyCareBathTitle(item.title)) {
    next = { ...next, title: NEW_CARE_BATH_TITLE, isBath: true, pinTop: true }
  }
  if (isLegacyCareBathDescription(item.description)) {
    next = { ...next, description: NEW_CARE_BATH_DESCRIPTION }
  }
  return next
}

const migrateCareMaintenanceBuiltinOverrides = (overrides = {}) => {
  const next = { ...overrides }
  Object.entries(next).forEach(([id, ov]) => {
    if (!ov || typeof ov !== 'object') {
      delete next[id]
      return
    }
    const cleaned = { ...ov }
    if (id === 'quarterly-spa-bath') {
      if (cleaned.title && isLegacyCareBathTitle(cleaned.title)) delete cleaned.title
      if (isLegacyCareBathDescription(cleaned.description)) delete cleaned.description
    }
    if (!cleaned.title && cleaned.description === undefined) delete next[id]
    else next[id] = cleaned
  })
  return next
}

const normalizeCareMaintenanceState = (raw) => {
  const base = createDefaultCareMaintenanceState()
  if (!raw || typeof raw !== 'object') return base
  const merged = { ...base, ...raw }
  if (!CARE_MAINTENANCE_FREQ_TABS.some(t => t.id === merged.activeFrequency)) {
    merged.activeFrequency = 'daily'
  }
  merged.activeFrequencyByCatId = merged.activeFrequencyByCatId && typeof merged.activeFrequencyByCatId === 'object'
    ? Object.fromEntries(
      Object.entries(merged.activeFrequencyByCatId).filter(([catId, freq]) =>
        typeof catId === 'string' && CARE_MAINTENANCE_FREQ_TABS.some(t => t.id === freq)
      )
    )
    : {}
  merged.hiddenBuiltinIds = Array.isArray(merged.hiddenBuiltinIds)
    ? merged.hiddenBuiltinIds.filter(id => typeof id === 'string')
    : []
  merged.customItems = Array.isArray(merged.customItems)
    ? merged.customItems.map(item => migrateCareMaintenanceItemText({
      id: item?.id || safeUUID(),
      frequency: CARE_MAINTENANCE_FREQ_TABS.some(t => t.id === item?.frequency) ? item.frequency : 'daily',
      section: item?.section === 'review' ? 'review' : 'care',
      scope: item?.scope === 'perCat' ? 'perCat' : 'household',
      builtIn: false,
      title: String(item?.title || '').trim(),
      description: String(item?.description || '').trim()
    })).filter(item => item.title)
    : []
  merged.trashedCustomItems = Array.isArray(merged.trashedCustomItems)
    ? merged.trashedCustomItems.map(item => migrateCareMaintenanceItemText({
      id: item?.id || safeUUID(),
      frequency: CARE_MAINTENANCE_FREQ_TABS.some(t => t.id === item?.frequency) ? item.frequency : 'daily',
      section: item?.section === 'review' ? 'review' : 'care',
      scope: item?.scope === 'perCat' ? 'perCat' : 'household',
      builtIn: false,
      title: String(item?.title || '').trim(),
      description: String(item?.description || '').trim()
    })).filter(item => item.title)
    : []
  merged.completions = merged.completions && typeof merged.completions === 'object' ? merged.completions : {}
  merged.midLongOffsetsSeeded = !!merged.midLongOffsetsSeeded
  merged.seededCareCatIds = Array.isArray(merged.seededCareCatIds)
    ? merged.seededCareCatIds.filter(id => typeof id === 'string')
    : []
  merged.builtinOverrides = migrateCareMaintenanceBuiltinOverrides(
    merged.builtinOverrides && typeof merged.builtinOverrides === 'object'
      ? Object.fromEntries(
        Object.entries(merged.builtinOverrides).filter(([id, ov]) => {
          return typeof id === 'string' && ov && typeof ov === 'object'
        }).map(([id, ov]) => [
          id,
          {
            title: typeof ov.title === 'string' ? ov.title : undefined,
            description: typeof ov.description === 'string' ? ov.description : undefined
          }
        ])
      )
      : {}
  )
  return merged
}

const careMaintenanceState = ref(createDefaultCareMaintenanceState())
const careMaintenanceEditMode = ref(false)
const careMaintenanceCustomModalOpen = ref(false)
const careMaintenanceEditModalOpen = ref(false)
const careMaintenanceDeleteModalOpen = ref(false)
const careMaintenanceDeleteTarget = ref(null)
const careMaintenanceCustomDraft = ref({ title: '', description: '' })
const careMaintenanceEditDraft = ref({ id: '', title: '', description: '', builtIn: false })
const careMaintenanceDateModalOpen = ref(false)
const careMaintenanceDateTarget = ref(null)
const careMaintenanceDateDraft = ref('')

const careSyncStatus = ref(getCareSyncStatus())
let carePollTimer = null

const startCarePoll = () => {
  clearInterval(carePollTimer)
  pullAllCloudData()
  carePollTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && currentTab.value === 'care') {
      pullAllCloudData()
    }
  }, 8000)
}

const stopCarePoll = () => {
  clearInterval(carePollTimer)
  carePollTimer = null
}

const pullCareFromCloud = async () => {
  const result = await pullCareSyncFromServer(true)
  if (result?.ok === false) {
    alert(`拉取失敗：${result.reason || '未知錯誤'}`)
  }
}

const persistCareMaintenance = () => {
  pushCareSync().catch((err) => {
    console.error('Care sync push failed:', err)
    alert('照護清單同步失敗，請檢查網路或 Firebase 設定')
  })
}

const applyCareMaintenanceRemoteState = (raw) => {
  careMaintenanceState.value = normalizeCareMaintenanceState(
    JSON.parse(JSON.stringify(raw))
  )
  purgeOrphanedRemoteData()
}

const ensureCareMaintenanceState = (skipPersist = false) => {
  careMaintenanceState.value = normalizeCareMaintenanceState(careMaintenanceState.value)
  const catIds = cats.value?.map(cat => cat.id).filter(Boolean) || []
  const seededCatIds = new Set(careMaintenanceState.value.seededCareCatIds || [])
  const nextSeeded = [...seededCatIds]
  let changed = false
  catIds.forEach((id) => {
    if (!seededCatIds.has(id)) {
      nextSeeded.push(id)
      changed = true
    }
  })
  if (changed) {
    careMaintenanceState.value = {
      ...careMaintenanceState.value,
      seededCareCatIds: nextSeeded,
    }
    if (!skipPersist) persistCareMaintenance()
  }
}

const CARE_MAINTENANCE_INITIAL_OFFSET_DAYS = {
  biweekly: 7,
  monthly: 15,
  quarterly: 45,
  semiannual: 91,
  annual: 182
}

const seedCareMaintenanceMidLongCompletions = (catIds = [], skipPersist = false) => {
  const state = careMaintenanceState.value
  const completions = { ...state.completions }
  let changed = false
  const seededCatIds = new Set(state.seededCareCatIds || [])
  const isFirstSeed = !state.midLongOffsetsSeeded

  getCareMaintenanceCatalog()
    .filter(item => CARE_MAINTENANCE_INITIAL_OFFSET_DAYS[item.frequency] != null)
    .forEach(item => {
      const offset = CARE_MAINTENANCE_INITIAL_OFFSET_DAYS[item.frequency]
      const seedDate = getDateStringDaysAgo(offset)
      if (item.scope === 'household') {
        if (isFirstSeed && !completions[item.id]) {
          completions[item.id] = seedDate
          changed = true
        }
      } else if (item.scope === 'perCat') {
        catIds.forEach(catId => {
          const key = `${item.id}::${catId}`
          if (!completions[key] && (isFirstSeed || !seededCatIds.has(catId))) {
            completions[key] = seedDate
            changed = true
          }
        })
      }
    })

  catIds.forEach(id => seededCatIds.add(id))
  const nextState = {
    ...state,
    completions: changed ? completions : state.completions,
    midLongOffsetsSeeded: true,
    seededCareCatIds: [...seededCatIds]
  }
  if (changed || isFirstSeed) {
    careMaintenanceState.value = nextState
    if (!skipPersist) persistCareMaintenance()
  } else if (nextState.seededCareCatIds.length !== (state.seededCareCatIds || []).length) {
    careMaintenanceState.value = nextState
    if (!skipPersist) persistCareMaintenance()
  }
}

const seedCareMaintenanceItemCompletion = (item) => {
  const offset = CARE_MAINTENANCE_INITIAL_OFFSET_DAYS[item.frequency]
  if (offset == null) return
  const completions = { ...careMaintenanceState.value.completions }
  const seedDate = getDateStringDaysAgo(offset)
  let changed = false
  if (item.scope === 'household') {
    if (!completions[item.id]) {
      completions[item.id] = seedDate
      changed = true
    }
  } else if (item.scope === 'perCat') {
    const catIds = cats.value?.map(cat => cat.id).filter(Boolean) || []
    catIds.forEach(catId => {
      const key = `${item.id}::${catId}`
      if (!completions[key]) {
        completions[key] = seedDate
        changed = true
      }
    })
  }
  if (changed) {
    careMaintenanceState.value = { ...careMaintenanceState.value, completions }
    persistCareMaintenance()
  }
}

const getCareMaintenanceCatalog = () => {
  const hidden = new Set(careMaintenanceState.value.hiddenBuiltinIds || [])
  const overrides = careMaintenanceState.value.builtinOverrides || {}
  const builtins = DEFAULT_CARE_MAINTENANCE_ITEMS
    .filter(item => !hidden.has(item.id))
    .map(item => {
      const ov = overrides[item.id]
      const merged = { ...item }
      if (ov) {
        if (ov.title?.trim()) merged.title = ov.title.trim()
        if (ov.description !== undefined) merged.description = String(ov.description)
      }
      return merged
    })
  return [...builtins, ...(careMaintenanceState.value.customItems || [])]
}

const getCareMaintenanceActiveFrequency = () => {
  const catId = currentCat.value?.id
  const byCat = careMaintenanceState.value.activeFrequencyByCatId || {}
  if (catId && byCat[catId]) return byCat[catId]
  return careMaintenanceState.value.activeFrequency || 'daily'
}

const setCareMaintenanceActiveFrequency = (freq) => {
  if (!CARE_MAINTENANCE_FREQ_TABS.some(t => t.id === freq)) return
  const catId = currentCat.value?.id
  if (!catId) return
  careMaintenanceState.value = {
    ...careMaintenanceState.value,
    activeFrequencyByCatId: {
      ...(careMaintenanceState.value.activeFrequencyByCatId || {}),
      [catId]: freq,
    },
  }
  persistCareMaintenance()
}

const activeCareMaintenanceFreqLabel = computed(() => {
  const tab = CARE_MAINTENANCE_FREQ_TABS.find(t => t.id === getCareMaintenanceActiveFrequency())
  return tab ? tab.label : ''
})

const activeCareMaintenanceFreqHint = computed(() =>
  CARE_MAINTENANCE_FREQ_HINTS[getCareMaintenanceActiveFrequency()] || ''
)

const activeCareMaintenanceItems = computed(() => {
  const freq = getCareMaintenanceActiveFrequency()
  return sortCareMaintenanceItems(
    getCareMaintenanceCatalog().filter(item => item.frequency === freq)
  )
})

const activeCareMaintenanceCareItems = computed(() =>
  sortCareMaintenanceItems(
    activeCareMaintenanceItems.value.filter(item => item.section !== 'review')
  )
)

const activeCareMaintenanceReviewItems = computed(() =>
  sortCareMaintenanceItems(
    activeCareMaintenanceItems.value.filter(item => item.section === 'review')
  )
)

const getCareMaintenanceCompletionKey = (item) => {
  if (item.scope === 'perCat' && currentCat.value?.id) return `${item.id}::${currentCat.value.id}`
  return item.id
}

const getCareMaintenanceCompletionDate = (item) => {
  const key = getCareMaintenanceCompletionKey(item)
  const val = careMaintenanceState.value.completions?.[key]
  return typeof val === 'string' ? val : ''
}

const isCareMaintenanceItemDone = (item) => {
  const lastDone = getCareMaintenanceCompletionDate(item)
  if (!lastDone) return false
  return !isCareMaintenanceItemOverdue(item)
}

const sortCareMaintenanceItems = (items) => {
  return [...items].sort((a, b) => {
    const aPin = a.pinTop ? 1 : 0
    const bPin = b.pinTop ? 1 : 0
    if (bPin !== aPin) return bPin - aPin
    const aOver = isCareMaintenanceItemOverdue(a) ? 1 : 0
    const bOver = isCareMaintenanceItemOverdue(b) ? 1 : 0
    return bOver - aOver
  })
}

const careMaintenanceCardClass = (item) => {
  const classes = []
  if (careMaintenanceEditMode.value) {
    classes.push('ring-1 ring-rose-100/80')
  } else {
    classes.push('cursor-pointer active:scale-[0.99]')
  }
  if (isCareMaintenanceItemOverdue(item) && !careMaintenanceEditMode.value) {
    classes.push('attention-pulse border-2 border-rose-300 bg-rose-50')
  } else {
    classes.push('border border-slate-200 bg-white')
  }
  return classes
}

const activeCareMaintenanceDoneCount = computed(() =>
  activeCareMaintenanceItems.value.filter(item => isCareMaintenanceItemDone(item)).length
)

const activeCareMaintenancePendingCount = computed(() =>
  Math.max(0, activeCareMaintenanceItems.value.length - activeCareMaintenanceDoneCount.value)
)

const careMaintenanceRecoverableCount = computed(() => {
  const hidden = careMaintenanceState.value.hiddenBuiltinIds?.length || 0
  const trashed = careMaintenanceState.value.trashedCustomItems?.length || 0
  return hidden + trashed
})

const CARE_MAINTENANCE_REMINDER_FREQS = ['biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']

const CARE_MAINTENANCE_CYCLE_DAYS = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  semiannual: 182,
  annual: 365
}

const getDaysSinceCareDate = (dateStr) => {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateKey = String(dateStr).trim().slice(0, 10)
  const d = parseYmd(dateKey)
  if (!d) return null
  d.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

const isCareMaintenanceItemOverdue = (item) => {
  const cycleDays = CARE_MAINTENANCE_CYCLE_DAYS[item.frequency]
  if (cycleDays == null) return false
  const lastDone = getCareMaintenanceCompletionDate(item)
  if (!lastDone) return true
  const daysSince = getDaysSinceCareDate(lastDone)
  if (daysSince === null) return true
  return daysSince >= cycleDays
}

const careMaintenanceOverdueFreqSet = computed(() => {
  const overdue = new Set()
  if (!currentCat.value) return overdue
  CARE_MAINTENANCE_FREQ_TABS.forEach(tab => {
    const hasOverdue = getCareMaintenanceCatalog()
      .filter(item => item.frequency === tab.id)
      .some(item => isCareMaintenanceItemOverdue(item))
    if (hasOverdue) overdue.add(tab.id)
  })
  return overdue
})

const isCareMaintenanceItemCycleDue = (item) => isCareMaintenanceItemOverdue(item)

const homeMidLongCareMaintenanceDue = computed(() => {
  if (!currentCat.value) return false
  return getCareMaintenanceCatalog()
    .filter(item => CARE_MAINTENANCE_REMINDER_FREQS.includes(item.frequency))
    .some(item => isCareMaintenanceItemOverdue(item))
})

const formatCareMaintenanceStatus = (item) => {
  const date = getCareMaintenanceCompletionDate(item)
  return date || '尚未記錄'
}

const openCareMaintenanceDateModal = (item) => {
  if (!careMaintenanceEditMode.value || !item?.id) return
  careMaintenanceDateTarget.value = item
  careMaintenanceDateDraft.value = getCareMaintenanceCompletionDate(item) || ''
  careMaintenanceDateModalOpen.value = true
}

const closeCareMaintenanceDateModal = () => {
  careMaintenanceDateModalOpen.value = false
  careMaintenanceDateTarget.value = null
  careMaintenanceDateDraft.value = ''
}

const saveCareMaintenanceCompletionDate = () => {
  const item = careMaintenanceDateTarget.value
  if (!item?.id) return
  ensureCareMaintenanceState(true)
  const key = getCareMaintenanceCompletionKey(item)
  const completions = { ...careMaintenanceState.value.completions }
  const nextDate = careMaintenanceDateDraft.value.trim()
  if (nextDate) completions[key] = nextDate
  else delete completions[key]
  careMaintenanceState.value = { ...careMaintenanceState.value, completions }
  persistCareMaintenance()
  closeCareMaintenanceDateModal()
}

const toggleCareMaintenanceItem = (item) => {
  ensureCareMaintenanceState(true)
  const key = getCareMaintenanceCompletionKey(item)
  const completions = { ...careMaintenanceState.value.completions }
  if (completions[key]) delete completions[key]
  else completions[key] = getTodayString()
  careMaintenanceState.value = { ...careMaintenanceState.value, completions }
  persistCareMaintenance()
}

const toggleCareMaintenanceEditMode = () => {
  careMaintenanceEditMode.value = !careMaintenanceEditMode.value
  if (!careMaintenanceEditMode.value) {
    closeCareMaintenanceEditModal()
    closeCareMaintenanceDateModal()
  }
}

const onCareMaintenanceCardClick = (item) => {
  if (careMaintenanceEditMode.value) return
  toggleCareMaintenanceItem(item)
}

const openCareMaintenanceEditModal = (item) => {
  careMaintenanceEditDraft.value = {
    id: item.id,
    title: item.title || '',
    description: item.description || '',
    builtIn: !!item.builtIn
  }
  careMaintenanceEditModalOpen.value = true
}

const closeCareMaintenanceEditModal = () => {
  careMaintenanceEditModalOpen.value = false
  careMaintenanceEditDraft.value = { id: '', title: '', description: '', builtIn: false }
}

const saveCareMaintenanceEditItem = () => {
  const title = careMaintenanceEditDraft.value.title.trim()
  if (!title) {
    alert('請填寫項目名稱')
    return
  }
  const { id, builtIn } = careMaintenanceEditDraft.value
  if (!id) return
  const description = careMaintenanceEditDraft.value.description.trim()
  ensureCareMaintenanceState(true)
  if (builtIn) {
    careMaintenanceState.value = {
      ...careMaintenanceState.value,
      builtinOverrides: {
        ...(careMaintenanceState.value.builtinOverrides || {}),
        [id]: { title, description }
      }
    }
  } else {
    careMaintenanceState.value = {
      ...careMaintenanceState.value,
      customItems: careMaintenanceState.value.customItems.map(entry =>
        entry.id === id ? { ...entry, title, description } : entry
      )
    }
  }
  persistCareMaintenance()
  closeCareMaintenanceEditModal()
}

const openCareMaintenanceDeleteConfirm = (item) => {
  if (!item?.id) return
  careMaintenanceDeleteTarget.value = item
  careMaintenanceDeleteModalOpen.value = true
}

const closeCareMaintenanceDeleteConfirm = () => {
  careMaintenanceDeleteModalOpen.value = false
  careMaintenanceDeleteTarget.value = null
}

const executeCareMaintenanceDelete = () => {
  const item = careMaintenanceDeleteTarget.value
  if (!item) return
  removeCareMaintenanceItem(item)
  closeCareMaintenanceDeleteConfirm()
}

const removeCareMaintenanceItem = (item) => {
  if (!item?.id) return
  ensureCareMaintenanceState(true)
  const id = item.id
  if (item.builtIn) {
    const hidden = careMaintenanceState.value.hiddenBuiltinIds || []
    if (!hidden.includes(id)) {
      careMaintenanceState.value.hiddenBuiltinIds = [...hidden, id]
    }
    const overrides = { ...(careMaintenanceState.value.builtinOverrides || {}) }
    delete overrides[id]
    careMaintenanceState.value.builtinOverrides = overrides
  } else {
    const removed = careMaintenanceState.value.customItems.find(entry => entry.id === id)
    if (removed) {
      careMaintenanceState.value.trashedCustomItems = [
        ...(careMaintenanceState.value.trashedCustomItems || []),
        { ...removed }
      ]
    }
    careMaintenanceState.value.customItems = careMaintenanceState.value.customItems.filter(entry => entry.id !== id)
  }
  const completions = { ...careMaintenanceState.value.completions }
  Object.keys(completions).forEach(key => {
    if (key === id || key.startsWith(`${id}::`)) delete completions[key]
  })
  careMaintenanceState.value.completions = completions
  persistCareMaintenance()
}

const restoreCareMaintenanceDeletedItems = () => {
  ensureCareMaintenanceState(true)
  const hiddenIds = [...(careMaintenanceState.value.hiddenBuiltinIds || [])]
  const trashed = [...(careMaintenanceState.value.trashedCustomItems || [])]
  if (!hiddenIds.length && !trashed.length) return
  careMaintenanceState.value.hiddenBuiltinIds = []
  trashed.forEach(entry => {
    if (!careMaintenanceState.value.customItems.some(item => item.id === entry.id)) {
      careMaintenanceState.value.customItems.push({ ...entry })
    }
  })
  careMaintenanceState.value.trashedCustomItems = []
  persistCareMaintenance()
}

const resetCareMaintenanceChecks = () => {
  if (!activeCareMaintenanceItems.value.length) return
  const label = activeCareMaintenanceFreqLabel.value
  if (!confirm(`確定要重置「${label}」分頁的所有打勾紀錄？`)) return
  const ids = new Set(activeCareMaintenanceItems.value.map(item => getCareMaintenanceCompletionKey(item)))
  const completions = { ...careMaintenanceState.value.completions }
  ids.forEach(id => { delete completions[id] })
  careMaintenanceState.value = { ...careMaintenanceState.value, completions }
  persistCareMaintenance()
}

const openCareMaintenanceCustomModal = () => {
  careMaintenanceCustomDraft.value = { title: '', description: '' }
  careMaintenanceCustomModalOpen.value = true
}

const addCareMaintenanceCustomItem = () => {
  const title = careMaintenanceCustomDraft.value.title.trim()
  if (!title) {
    alert('請填寫項目名稱')
    return
  }
  ensureCareMaintenanceState(true)
  careMaintenanceState.value.customItems.push({
    id: safeUUID(),
    frequency: getCareMaintenanceActiveFrequency(),
    section: 'care',
    scope: 'household',
    builtIn: false,
    title,
    description: careMaintenanceCustomDraft.value.description.trim()
  })
  const added = careMaintenanceState.value.customItems[careMaintenanceState.value.customItems.length - 1]
  seedCareMaintenanceItemCompletion(added)
  careMaintenanceCustomModalOpen.value = false
  careMaintenanceCustomDraft.value = { title: '', description: '' }
  persistCareMaintenance()
}

const DEFAULT_USER_GUIDE_TEXT = `【貓咪照護 App 使用指南】

1. 底部導覽
· 🏠 首頁：貓貓檔案、提醒事項
· 🍽️ 飲食：每日餐食與飲水紀錄
· 💉 醫療：就診紀錄、用藥與覆診提醒
· 📊 統計：飲食與體重概覽
· 📁 照顧資料：本頁各類表單與 PDF 匯出

2. 照顧資料方格
點選方格開啟表單，填寫後會自動儲存並同步至雲端。可按「匯出 PDF」列印或傳送給貓保母。

3. 多裝置同步
手機與電腦會透過 Firebase 自動同步；另一部裝置約數秒內更新，亦可下拉刷新。

4. 緊急情況
請以獸醫指示為準；本 App 紀錄僅供日常照顧參考。`

const careChecklistDraft = ref({
  date: getTodayString(),
  water: false,
  litter: false,
  food: false,
  observe: false,
  play: false,
  meds: false,
  note: ''
})

const weightLogDraft = ref({
  date: getTodayString(),
  weight: '',
  note: ''
})

const targetWeightInput = ref('')

const WEIGHT_STANDARD_LOW_RATIO = 0.92
const WEIGHT_STANDARD_HIGH_RATIO = 1.08
const WEIGHT_PROGRESS_MIN_RATIO = 0.7
const WEIGHT_PROGRESS_MAX_RATIO = 1.3

const parseWeightKg = (val) => {
  const n = parseFloat(String(val ?? '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

const formatWeightKg = (val) => {
  const n = typeof val === 'number' ? val : parseWeightKg(val)
  if (n == null) return '—'
  return n.toFixed(2)
}

const roundWeightKg = (val) => {
  const n = parseWeightKg(val)
  if (n == null) return null
  return Math.round(n * 100) / 100
}

const formatWeightLogDraftInput = () => {
  const rounded = roundWeightKg(weightLogDraft.value.weight)
  if (rounded != null) weightLogDraft.value.weight = rounded.toFixed(2)
}

const formatTargetWeightInput = () => {
  const rounded = roundWeightKg(targetWeightInput.value)
  if (rounded != null) targetWeightInput.value = rounded.toFixed(2)
  saveTargetWeight()
}

const getCatTargetWeightKg = (cat) => {
  if (!cat) return null
  return parseWeightKg(cat.targetWeight) ?? parseWeightKg(cat.idealWeight) ?? parseWeightKg(cat.weight)
}

const syncTargetWeightInput = () => {
  const cat = currentCat.value
  if (!cat) {
    targetWeightInput.value = ''
    return
  }
  ensureCareData(cat)
  const target = getCatTargetWeightKg(cat)
  targetWeightInput.value = target != null ? target.toFixed(2) : ''
}

const saveTargetWeight = () => {
  if (!currentCat.value) return
  const rounded = roundWeightKg(targetWeightInput.value)
  if (rounded == null) {
    syncTargetWeightInput()
    return
  }
  currentCat.value.targetWeight = rounded
  targetWeightInput.value = rounded.toFixed(2)
  persistCats()
}

const getSortedWeightLogsDesc = (logs) => {
  return [...(logs || [])].sort((a, b) => {
    const da = String(a?.at || '').slice(0, 10)
    const db = String(b?.at || '').slice(0, 10)
    return db.localeCompare(da)
  })
}

const subtractCalendarMonth = (dateStr) => {
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

const findWeightLogNearDate = (logs, targetDate) => {
  if (!targetDate || !logs?.length) return null
  const targetMs = new Date(`${targetDate}T12:00:00`).getTime()
  if (Number.isNaN(targetMs)) return null
  let best = null
  let bestDiff = Infinity
  logs.forEach(log => {
    const date = String(log?.at || '').slice(0, 10)
    const ms = new Date(`${date}T12:00:00`).getTime()
    if (Number.isNaN(ms)) return
    const diff = Math.abs(ms - targetMs)
    if (diff < bestDiff) {
      bestDiff = diff
      best = log
    }
  })
  return best
}

const getWeightBodyStatus = (currentKg, idealKg) => {
  if (currentKg == null || idealKg == null || idealKg <= 0) {
    return {
      label: '待設定',
      badgeClass: 'bg-slate-100 text-slate-500',
      markerClass: 'bg-slate-400',
      markerPercent: null
    }
  }
  const ratio = currentKg / idealKg
  let label = '標準'
  let badgeClass = 'bg-emerald-100 text-emerald-700'
  let markerClass = 'bg-emerald-500'
  if (ratio < WEIGHT_STANDARD_LOW_RATIO) {
    label = '偏瘦'
    badgeClass = 'bg-sky-100 text-sky-700'
    markerClass = 'bg-sky-500'
  } else if (ratio > WEIGHT_STANDARD_HIGH_RATIO) {
    label = '超重'
    badgeClass = 'bg-amber-100 text-amber-800'
    markerClass = 'bg-amber-500'
  }
  const minW = idealKg * WEIGHT_PROGRESS_MIN_RATIO
  const maxW = idealKg * WEIGHT_PROGRESS_MAX_RATIO
  const markerPercent = Math.min(96, Math.max(4, ((currentKg - minW) / (maxW - minW)) * 100))
  return { label, badgeClass, markerClass, markerPercent, ratio }
}

const weightTrackingSortedLogs = computed(() => {
  if (!currentCat.value?.weightLogs) return []
  return getSortedWeightLogsDesc(currentCat.value.weightLogs)
})

const weightTrackingLatestKg = computed(() => {
  const latestLog = weightTrackingSortedLogs.value[0]
  const fromLog = latestLog ? parseWeightKg(latestLog.weight) : null
  if (fromLog != null) return fromLog
  return parseWeightKg(currentCat.value?.weight)
})

const weightTrackingLatestDisplay = computed(() => formatWeightKg(weightTrackingLatestKg.value))

const weightTrackingLatestDate = computed(() => {
  const latestLog = weightTrackingSortedLogs.value[0]
  if (latestLog?.at) return String(latestLog.at).slice(0, 10)
  return ''
})

const weightTrackingTargetKg = computed(() => getCatTargetWeightKg(currentCat.value))

const weightTrackingTargetDisplay = computed(() => formatWeightKg(weightTrackingTargetKg.value))

const weightTrackingMonthlyChange = computed(() => {
  const current = weightTrackingLatestKg.value
  const logs = currentCat.value?.weightLogs || []
  const latestDate = weightTrackingLatestDate.value || getTodayString()
  const none = {
    display: '—',
    hint: '尚無足夠歷史紀錄，累積多筆後即可計算月變動率。',
    textClass: 'text-slate-500',
    subClass: 'text-slate-400',
    alertClass: '',
    baselineDate: '',
    baselineWeight: ''
  }
  if (current == null || logs.length < 2) return none

  const targetDate = subtractCalendarMonth(latestDate)
  const baselineLog = findWeightLogNearDate(
    logs.filter(log => String(log?.at || '').slice(0, 10) !== latestDate),
    targetDate
  )
  const baselineWeight = baselineLog ? parseWeightKg(baselineLog.weight) : null
  if (baselineWeight == null || baselineWeight <= 0) return none

  const percent = ((current - baselineWeight) / baselineWeight) * 100
  const rounded = Math.round(percent * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  const display = `${sign}${rounded}%`

  let hint = '與約一個月前相比體重變化在正常範圍。'
  let textClass = 'text-slate-700'
  let subClass = 'text-slate-500'
  let alertClass = ''

  if (rounded <= -10) {
    hint = '【健康警號】體重跌幅達 10% 或以上，建議盡快諮詢獸醫。'
    textClass = 'text-rose-600'
    subClass = 'text-rose-500'
    alertClass = 'weight-track-alert-danger'
  } else if (rounded <= -5) {
    hint = '體重跌幅達 5% 或以上，請留意食慾與精神狀態。'
    textClass = 'text-amber-700'
    subClass = 'text-amber-600'
    alertClass = 'weight-track-alert-warn'
  } else if (rounded > 0) {
    hint = '體重較一個月前有所增加。'
    textClass = 'text-rose-500'
    subClass = 'text-slate-500'
  }

  return {
    display,
    hint,
    textClass,
    subClass,
    alertClass,
    baselineDate: String(baselineLog.at || '').slice(0, 10),
    baselineWeight: formatWeightKg(baselineWeight)
  }
})

const weightTrackingBodyStatus = computed(() =>
  getWeightBodyStatus(weightTrackingLatestKg.value, weightTrackingTargetKg.value)
)

const weightTrackingHistoryCards = computed(() => {
  const sorted = weightTrackingSortedLogs.value
  return sorted.map((log, index) => {
    const weight = parseWeightKg(log.weight)
    const older = sorted[index + 1]
    const olderWeight = older ? parseWeightKg(older.weight) : null
    let delta = null
    if (weight != null && olderWeight != null) delta = Math.round((weight - olderWeight) * 100) / 100
    return {
      log,
      date: String(log.at || '').slice(0, 10),
      weightDisplay: formatWeightKg(weight),
      note: log.note?.trim() || '',
      delta,
      deltaAbs: delta != null ? formatWeightKg(Math.abs(delta)) : ''
    }
  })
})

const carePdfExporting = ref(false)

const activeCareMedChartPlans = computed(() => {
  if (!currentCat.value?.careMedSchedule?.needMedicationChart) return []
  return getMedicationChartPlans(currentCat.value.careMedSchedule)
})

const inventoryItems = ref([])
let unsubscribeInventory = null
let inventoryMigrationAttempted = false

const getInventoryCollection = () => {
  const uid = authUser.value?.uid
  if (!uid) return null
  return collection(db, 'users', uid, 'inventory')
}

const getInventoryDocRef = (itemId) => {
  const uid = authUser.value?.uid
  if (!uid || !itemId) return null
  return doc(db, 'users', uid, 'inventory', itemId)
}

const updateInventoryDoc = async (item, patch) => {
  if (!item?.id) return
  const docRef = getInventoryDocRef(item.id)
  if (!docRef) return
  try {
    await updateDoc(docRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('Inventory sync failed:', err)
    alert('庫存同步失敗，請檢查網路或 Firebase 設定')
  }
}

const INVENTORY_PRESET_UNITS = ['件', '包', '罐', '條']
const INVENTORY_UNIT_CUSTOM_OPTION = '✍️ 自訂...'
const INVENTORY_UNIT_SELECT_OPTIONS = [...INVENTORY_PRESET_UNITS, INVENTORY_UNIT_CUSTOM_OPTION]
const inventoryPickingCustomIds = ref(new Set())
const inventoryCustomUnitDraft = ref({})

const isInventoryPresetUnit = (unit) => INVENTORY_PRESET_UNITS.includes(String(unit ?? '').trim())

const isInventoryCustomUnitMode = (item) => {
  if (!item?.id) return false
  if (inventoryPickingCustomIds.value.has(item.id)) return true
  const u = String(item.unit ?? '').trim()
  return u !== '' && !isInventoryPresetUnit(u)
}

const getInventoryUnitSelectValue = (item) => {
  const u = String(item?.unit ?? '').trim()
  return isInventoryPresetUnit(u) ? u : '件'
}

const getInventoryCustomUnitDraft = (item) => {
  if (!item?.id) return ''
  if (inventoryCustomUnitDraft.value[item.id] !== undefined) {
    return inventoryCustomUnitDraft.value[item.id]
  }
  return String(item.unit ?? '').trim()
}

const onInventoryUnitSelectChange = (item, event) => {
  const val = event.target.value
  if (val === INVENTORY_UNIT_CUSTOM_OPTION) {
    inventoryPickingCustomIds.value = new Set([...inventoryPickingCustomIds.value, item.id])
    inventoryCustomUnitDraft.value = { ...inventoryCustomUnitDraft.value, [item.id]: '' }
    return
  }
  item.unit = val
  updateInventoryDoc(item, { unit: val })
}

const onInventoryCustomUnitInput = (item, event) => {
  if (!item?.id) return
  inventoryCustomUnitDraft.value = {
    ...inventoryCustomUnitDraft.value,
    [item.id]: String(event.target.value ?? '').slice(0, 4),
  }
}

const commitInventoryCustomUnit = (item) => {
  if (!item?.id) return
  const draft = inventoryCustomUnitDraft.value[item.id]
  const raw = draft !== undefined ? draft : String(item.unit ?? '')
  const next = raw.trim().slice(0, 4)
  const { [item.id]: _, ...restDraft } = inventoryCustomUnitDraft.value
  inventoryCustomUnitDraft.value = restDraft
  const nextPicking = new Set(inventoryPickingCustomIds.value)
  nextPicking.delete(item.id)
  inventoryPickingCustomIds.value = nextPicking
  item.unit = next || '件'
  updateInventoryDoc(item, { unit: next || '件' })
}

const parseInventoryQty = (val) => {
  const n = parseFloat(String(val ?? '').trim())
  return Number.isFinite(n) ? n : null
}

const formatInventoryQty = (n) => {
  if (n == null) return '0'
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)))
}

const getInventoryLowThreshold = (unit) => {
  const u = String(unit ?? '').trim()
  if (u === '罐' || u === '條') return 5
  if (u === '包') return 2
  return 1
}

const getInventoryDisplayQty = (item) => formatInventoryQty(parseInventoryQty(item?.current) ?? 0)

const adjustInventoryCurrent = (item, delta) => {
  if (!item?.id) return
  const base = parseInventoryQty(item.current) ?? 0
  const next = Math.max(0, base + delta)
  updateInventoryDoc(item, { current: formatInventoryQty(next) })
}

const isInventoryLow = (item) => {
  const cur = parseInventoryQty(item?.current) ?? 0
  return cur <= getInventoryLowThreshold(item?.unit)
}

const ensureCareData = (cat) => {
  if (!cat) return
  if (!cat.catManual || typeof cat.catManual !== 'object') {
    cat.catManual = { taboos: '', quirks: '', preferences: '', sitterNotes: '' }
  } else {
    if (cat.catManual.taboos === undefined) cat.catManual.taboos = ''
    if (cat.catManual.quirks === undefined) cat.catManual.quirks = ''
    if (cat.catManual.preferences === undefined) cat.catManual.preferences = ''
    if (cat.catManual.sitterNotes === undefined) cat.catManual.sitterNotes = ''
  }
  delete cat.inventoryItems
  if (!cat.favoritesMap || typeof cat.favoritesMap !== 'object') {
    cat.favoritesMap = { loves: '', sleepSpots: '', dislikes: '' }
  } else {
    if (cat.favoritesMap.loves === undefined) cat.favoritesMap.loves = ''
    if (cat.favoritesMap.sleepSpots === undefined) cat.favoritesMap.sleepSpots = ''
    if (cat.favoritesMap.dislikes === undefined) cat.favoritesMap.dislikes = ''
  }
  if (!Array.isArray(cat.careChecklistLogs)) cat.careChecklistLogs = []
  cat.careChecklistLogs.forEach(log => {
    if (!log.id) log.id = safeUUID()
    if (!log.at) log.at = getTodayString() + 'T12:00'
    CARE_CHECKLIST_TASKS.forEach(t => { if (log[t.key] === undefined) log[t.key] = false })
    if (log.note === undefined) log.note = ''
  })
  if (!cat.careMedSchedule || typeof cat.careMedSchedule !== 'object') {
    cat.careMedSchedule = {
      needMedicationChart: false,
      medicationChartExpanded: true,
      medications: [createEmptyMedicationRow()],
      medicationChecks: []
    }
  } else {
    if (cat.careMedSchedule.needMedicationChart === undefined) cat.careMedSchedule.needMedicationChart = false
    if (cat.careMedSchedule.medicationChartExpanded === undefined) cat.careMedSchedule.medicationChartExpanded = true
    ensureMedicalMedications(cat.careMedSchedule)
    if (!Array.isArray(cat.careMedSchedule.medicationChecks)) cat.careMedSchedule.medicationChecks = []
    if (cat.careMedSchedule.needMedicationChart) ensureMedicationChartChecks(cat.careMedSchedule)
  }
  if (!Array.isArray(cat.weightLogs)) cat.weightLogs = []
  cat.weightLogs.forEach(log => {
    if (!log.id) log.id = safeUUID()
    if (!log.at) log.at = getTodayString()
    if (log.weight === undefined) log.weight = ''
    if (log.note === undefined) log.note = ''
  })
  if (!cat.insuranceInfo || typeof cat.insuranceInfo !== 'object') {
    cat.insuranceInfo = { company: '', policyNo: '', phone: '', coverage: '', expiryDate: '', note: '' }
  } else {
    const ins = cat.insuranceInfo
    if (ins.company === undefined) ins.company = ''
    if (ins.policyNo === undefined) ins.policyNo = ''
    if (ins.phone === undefined) ins.phone = ''
    if (ins.coverage === undefined) ins.coverage = ''
    if (ins.expiryDate === undefined) ins.expiryDate = ''
    if (ins.note === undefined) ins.note = ''
  }
  if (!cat.userGuide || typeof cat.userGuide !== 'object') {
    cat.userGuide = { content: DEFAULT_USER_GUIDE_TEXT }
  } else if (cat.userGuide.content === undefined || cat.userGuide.content === '') {
    cat.userGuide.content = DEFAULT_USER_GUIDE_TEXT
  }
  if (!cat.medHistory || typeof cat.medHistory !== 'object') {
    cat.medHistory = { majorSurgeries: '', chronicConditions: '', drugAllergies: '', customFields: [] }
  } else {
    if (cat.medHistory.majorSurgeries === undefined) cat.medHistory.majorSurgeries = ''
    if (cat.medHistory.chronicConditions === undefined) cat.medHistory.chronicConditions = ''
    if (cat.medHistory.drugAllergies === undefined) cat.medHistory.drugAllergies = ''
    if (!Array.isArray(cat.medHistory.customFields)) cat.medHistory.customFields = []
    cat.medHistory.customFields.forEach(field => {
      if (!field.id) field.id = safeUUID()
      if (field.title === undefined) field.title = ''
      if (field.content === undefined) field.content = ''
    })
  }
}

const addInventoryItem = async () => {
  const catId = currentCat.value?.id
  const col = getInventoryCollection()
  if (!catId || !col) return
  try {
    await addDoc(col, {
      catId,
      name: '',
      current: '0',
      unit: '件',
      note: '',
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error(err)
    alert('新增品項失敗，請檢查 Firebase 設定')
  }
}

const addMedHistoryCustomField = () => {
  if (!currentCat.value) return
  ensureCareData(currentCat.value)
  currentCat.value.medHistory.customFields.push({
    id: safeUUID(), title: '', content: ''
  })
  persistCats()
}

const removeMedHistoryCustomField = (id) => {
  if (!currentCat.value?.medHistory?.customFields) return
  currentCat.value.medHistory.customFields = currentCat.value.medHistory.customFields.filter(f => f.id !== id)
  persistCats()
}

const removeInventoryItem = async (id) => {
  if (!id) return
  const docRef = getInventoryDocRef(id)
  if (!docRef) return
  try {
    await deleteDoc(docRef)
  } catch (err) {
    console.error(err)
    alert('刪除品項失敗，請檢查 Firebase 設定')
  }
}

const clearRemoteInventoryItems = async () => {
  const ids = inventoryItems.value.map(item => item.id).filter(Boolean)
  inventoryItems.value = []
  if (!ids.length) return
  await Promise.allSettled(
    ids.map(id => {
      const docRef = getInventoryDocRef(id)
      return docRef ? deleteDoc(docRef) : Promise.resolve()
    })
  )
}

const deleteRemoteInventoryByCatId = async (catId) => {
  if (!catId) return
  const ids = inventoryItems.value
    .filter(item => item?.catId === catId)
    .map(item => item.id)
    .filter(Boolean)
  inventoryItems.value = inventoryItems.value.filter(item => item?.catId !== catId)
  if (!ids.length) return
  await Promise.allSettled(
    ids.map(id => {
      const docRef = getInventoryDocRef(id)
      return docRef ? deleteDoc(docRef) : Promise.resolve()
    })
  )
}

const purgeHandoverCatData = (catId) => {
  if (!catId || !handoverSheet.value) return false
  let changed = false
  const personalities = { ...(handoverSheet.value.personalities || {}) }
  if (personalities[catId]) {
    delete personalities[catId]
    handoverSheet.value.personalities = personalities
    changed = true
  }
  if (Array.isArray(handoverSheet.value.feedingSlots)) {
    handoverSheet.value.feedingSlots.forEach((slot) => {
      if (!slot?.meals || slot.meals[catId] === undefined) return
      const meals = { ...slot.meals }
      delete meals[catId]
      slot.meals = meals
      changed = true
    })
  }
  return changed
}

/** 批次清除指定 catId 的所有子資料（備忘、照護 tick、行為紀錄、交接單、庫存） */
const purgeCatDataById = (catId) => {
  if (!catId) return false
  let changed = false

  const nextLogs = behaviorSocialLogs.value.filter((log) => {
    if (log.mode === 'single') return log.catId !== catId
    const targetIds = [
      ...(Array.isArray(log.targetCatIds) ? log.targetCatIds : []),
      ...(Array.isArray(log.targetCats) ? log.targetCats.map(cat => cat?.id).filter(Boolean) : []),
      log.catId,
    ].filter(Boolean)
    return !targetIds.includes(catId)
  })
  if (nextLogs.length !== behaviorSocialLogs.value.length) {
    behaviorSocialLogs.value = nextLogs
    changed = true
  }

  if (purgeHandoverCatData(catId)) changed = true

  const state = careMaintenanceState.value
  const nextCompletions = Object.fromEntries(
    Object.entries(state.completions || {}).filter(([key]) => {
      const parts = String(key).split('::')
      return parts.length < 2 || parts[1] !== catId
    })
  )
  const nextFrequencyByCat = { ...(state.activeFrequencyByCatId || {}) }
  if (nextFrequencyByCat[catId]) {
    delete nextFrequencyByCat[catId]
    changed = true
  }
  const nextSeededCatIds = (state.seededCareCatIds || []).filter(id => id !== catId)
  if (
    Object.keys(nextCompletions).length !== Object.keys(state.completions || {}).length
    || nextSeededCatIds.length !== (state.seededCareCatIds || []).length
    || changed
  ) {
    careMaintenanceState.value = {
      ...state,
      completions: nextCompletions,
      activeFrequencyByCatId: nextFrequencyByCat,
      seededCareCatIds: nextSeededCatIds,
    }
    changed = true
  }

  const nextInventory = inventoryItems.value.filter(item => item?.catId !== catId)
  if (nextInventory.length !== inventoryItems.value.length) {
    inventoryItems.value = nextInventory
    changed = true
  }

  return changed
}

const persistAllRemoteState = async ({ force = false } = {}) => {
  mirrorSyncStateToLocalStorage()
  if (force) {
    resetAppSyncPushFingerprint()
    resetCareSyncPushFingerprint()
    markAppSyncLocalAuthoritative()
    markCareSyncLocalAuthoritative()
  }
  const appOk = await flushAppSyncPush({ force })
  let careOk = false
  try {
    await pushCareSync({ force })
    careOk = true
  } catch (err) {
    console.error('Remote state sync failed:', err)
  }
  if (force && (appOk || careOk)) {
    markAppSyncLocalAuthoritative()
    markCareSyncLocalAuthoritative()
  }
}

const createEmptyCatScopedRecords = () => ({
  feedingKcal: 0,
  waterMl: 0,
  targetWeight: null,
  lastBcsScore: null,
  reminders: JSON.parse(JSON.stringify(buildNewCatReminders())),
  dietHistory: {},
  waterLogs: [],
  excretionLogs: [],
  medicalRecords: [],
  weightLogs: [],
  careChecklistLogs: [],
  catManual: { taboos: '', quirks: '', preferences: '', sitterNotes: '' },
  favoritesMap: { loves: '', sleepSpots: '', dislikes: '' },
  careMedSchedule: {
    needMedicationChart: false,
    medicationChartExpanded: true,
    medications: [createEmptyMedicationRow()],
    medicationChecks: [],
  },
  insuranceInfo: { company: '', policyNo: '', phone: '', coverage: '', expiryDate: '', note: '' },
  userGuide: { content: DEFAULT_USER_GUIDE_TEXT },
  medHistory: { majorSurgeries: '', chronicConditions: '', drugAllergies: '', customFields: [] },
})

/** 新增貓時：確保 catId 下所有紀錄為空白初始狀態，清除殘留 tick */
const initializeNewCat = (cat) => {
  if (!cat?.id) return cat
  purgeCatDataById(cat.id)
  Object.assign(cat, createEmptyCatScopedRecords())
  normalizeCat(cat)
  ensureCareMaintenanceState(true)
  return cat
}

const resetGlobalRecordsLocal = ({ clearCats = false } = {}) => {
  if (clearCats) {
    cats.value = []
    currentCatIndex.value = 0
    currentTab.value = 'home'
  }
  behaviorSocialLogs.value = []
  behaviorSocialCustomTags.value = normalizeBehaviorSocialCustomTags(null)
  behaviorSocialHiddenTags.value = normalizeBehaviorSocialHiddenTags(null)
  handoverSheet.value = normalizeHandoverSheet(null)
  careMaintenanceState.value = createDefaultCareMaintenanceState()
  inventoryItems.value = []
  inventoryMigrationAttempted = false
  resetSessionUiState({ keepTab: clearCats ? false : true })
}

const persistFreshStartToRemote = async () => {
  await clearRemoteInventoryItems()
  mirrorSyncStateToLocalStorage()
  resetAppSyncPushFingerprint()
  resetCareSyncPushFingerprint()
  markAppSyncLocalAuthoritative()
  markCareSyncLocalAuthoritative()
  await flushAppSyncPush({ force: true })
  try {
    await pushCareSync({ force: true })
  } catch (err) {
    console.error('Care checklist reset sync failed:', err)
  }
  markAppSyncLocalAuthoritative()
  markCareSyncLocalAuthoritative()
}

const prepareFreshTrialSession = async ({ clearCats = false } = {}) => {
  pauseAllRemoteSync()
  try {
    resetGlobalRecordsLocal({ clearCats })
    await persistFreshStartToRemote()
  } finally {
    resumeAllRemoteSync()
  }
}

const persistBehaviorSocialLogs = () => {
  scheduleMirrorToLocalStorage()
  scheduleAppSyncPush()
  flushAppSyncPush()
}

const persistBehaviorSocialCustomTags = () => {
  scheduleMirrorToLocalStorage()
  scheduleAppSyncPush()
  flushAppSyncPush()
}

const persistBehaviorSocialHiddenTags = () => {
  scheduleMirrorToLocalStorage()
  scheduleAppSyncPush()
  flushAppSyncPush()
}

const buildBehaviorSocialTagOptions = (presets, storeKey) => {
  const hidden = new Set(behaviorSocialHiddenTags.value[storeKey] || [])
  const custom = behaviorSocialCustomTags.value[storeKey] || []
  return [...presets, ...custom].filter(tag => !hidden.has(tag))
}

const removeBehaviorSocialTagOption = (groupKey, tag) => {
  const config = BEHAVIOR_SOCIAL_SINGLE_TAG_GROUPS[groupKey]
  if (!config || !tag) return
  const draftArr = behaviorSocialDraft.value[config.tagKey]
  const draftIdx = draftArr.indexOf(tag)
  if (draftIdx >= 0) draftArr.splice(draftIdx, 1)
  const customList = behaviorSocialCustomTags.value[config.storeKey]
  const customIdx = customList.indexOf(tag)
  if (customIdx >= 0) {
    customList.splice(customIdx, 1)
    persistBehaviorSocialCustomTags()
  } else if (config.presets.includes(tag)) {
    const hiddenList = behaviorSocialHiddenTags.value[config.storeKey]
    if (!hiddenList.includes(tag)) {
      hiddenList.push(tag)
      persistBehaviorSocialHiddenTags()
    }
  }
  syncBehaviorSocialMoodScore()
  syncBehaviorSocialIntimacyScore()
}

const resetBehaviorSocialCustomInputs = () => {
  behaviorSocialCustomAffectionDraft.value = ''
  behaviorSocialCustomConflictDraft.value = ''
  behaviorSocialCustomQuirkDraft.value = ''
  behaviorSocialCustomWarningDraft.value = ''
  behaviorSocialCustomHumanAffectionDraft.value = ''
  behaviorSocialCustomHumanRejectionDraft.value = ''
  showBehaviorSocialCustomAffection.value = false
  showBehaviorSocialCustomConflict.value = false
  showBehaviorSocialCustomQuirk.value = false
  showBehaviorSocialCustomWarning.value = false
  showBehaviorSocialCustomHumanAffection.value = false
  showBehaviorSocialCustomHumanRejection.value = false
  behaviorSocialEditingGroup.value = null
}

const resetBehaviorSocialTagSelection = () => {
  behaviorSocialDraft.value.affectionTags = []
  behaviorSocialDraft.value.conflictTags = []
  behaviorSocialDraft.value.quirkTags = []
  behaviorSocialDraft.value.warningTags = []
  behaviorSocialDraft.value.humanInteractionTags = []
  behaviorSocialDraft.value.moodScore = BEHAVIOR_MOOD_SCORE_BASE
  behaviorSocialDraft.value.intimacy = BEHAVIOR_SOCIAL_INTIMACY_BASE
}

const syncBehaviorSocialDraftCats = () => {
  const d = behaviorSocialDraft.value
  const primaryId = currentCat.value?.id
  if (!Array.isArray(d.targetCatIds)) d.targetCatIds = []
  if (primaryId) d.targetCatIds = d.targetCatIds.filter(id => id !== primaryId)
}

const toggleBehaviorSocialTargetCat = (catId) => {
  if (!catId) return
  const primaryId = currentCat.value?.id
  if (catId === primaryId) return
  const arr = behaviorSocialDraft.value.targetCatIds
  const idx = arr.indexOf(catId)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(catId)
}

const toggleBehaviorSocialTag = (group, tag) => {
  const key = group === 'affection' ? 'affectionTags'
    : group === 'conflict' ? 'conflictTags'
    : group === 'quirk' ? 'quirkTags'
    : group === 'human' || group === 'humanAffection' || group === 'humanRejection' ? 'humanInteractionTags'
    : 'warningTags'
  const arr = behaviorSocialDraft.value[key]
  const idx = arr.indexOf(tag)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(tag)
  syncBehaviorSocialMoodScore()
  syncBehaviorSocialIntimacyScore()
}

const addBehaviorSocialCustomTag = (group) => {
  const groupConfig = {
    affection: {
      draft: behaviorSocialCustomAffectionDraft,
      storeKey: 'affection',
      tagKey: 'affectionTags',
      presets: BEHAVIOR_SOCIAL_AFFECTION_TAGS
    },
    conflict: {
      draft: behaviorSocialCustomConflictDraft,
      storeKey: 'conflict',
      tagKey: 'conflictTags',
      presets: BEHAVIOR_SOCIAL_CONFLICT_TAGS
    },
    quirk: {
      draft: behaviorSocialCustomQuirkDraft,
      storeKey: 'quirk',
      tagKey: 'quirkTags',
      presets: BEHAVIOR_SINGLE_QUIRK_TAGS
    },
    warning: {
      draft: behaviorSocialCustomWarningDraft,
      storeKey: 'warning',
      tagKey: 'warningTags',
      presets: BEHAVIOR_SINGLE_WARNING_TAGS
    },
    humanAffection: {
      draft: behaviorSocialCustomHumanAffectionDraft,
      storeKey: 'humanAffection',
      tagKey: 'humanInteractionTags',
      presets: BEHAVIOR_SINGLE_HUMAN_AFFECTION_TAGS
    },
    humanRejection: {
      draft: behaviorSocialCustomHumanRejectionDraft,
      storeKey: 'humanRejection',
      tagKey: 'humanInteractionTags',
      presets: BEHAVIOR_SINGLE_HUMAN_REJECTION_TAGS
    }
  }
  const config = groupConfig[group]
  if (!config) return
  const label = config.draft.value?.trim()
  if (!label) return
  const customList = behaviorSocialCustomTags.value[config.storeKey]
  if (!config.presets.includes(label) && !customList.includes(label)) {
    customList.push(label)
    persistBehaviorSocialCustomTags()
  }
  if (!behaviorSocialDraft.value[config.tagKey].includes(label)) {
    behaviorSocialDraft.value[config.tagKey].push(label)
  }
  config.draft.value = ''
  syncBehaviorSocialMoodScore()
  syncBehaviorSocialIntimacyScore()
}

const behaviorSocialDraftHasContent = (draft) => {
  if (draft.note?.trim()) return true
  if (isMultiCatHousehold.value) {
    return draft.affectionTags.length > 0 || draft.conflictTags.length > 0
      || draft.humanInteractionTags.length > 0
  }
  return draft.quirkTags.length > 0 || draft.warningTags.length > 0
    || draft.humanInteractionTags.length > 0
}

const saveBehaviorSocialRecord = () => {
  const draft = behaviorSocialDraft.value
  if (!behaviorSocialDraftHasContent(draft)) {
    alert(isMultiCatHousehold.value
      ? '請選擇貓間關係或人貓互動標籤、調整評分或填寫詳細行為觀察備忘'
      : '請選擇標籤、調整心情評分或填寫詳細行為觀察備忘')
    return
  }
  const at = `${draft.date}T${getNowDatetimeLocal().slice(11, 19)}`
  if (isMultiCatHousehold.value) {
    const primary = currentCat.value
    if (!primary) return
    const targetCatIds = (draft.targetCatIds || []).filter(id => id && id !== primary.id)
    const targetCats = targetCatIds
      .map(id => cats.value.find(c => c.id === id)?.name)
      .filter(Boolean)
    const hasInterCatContent = draft.affectionTags.length > 0 || draft.conflictTags.length > 0
    if (hasInterCatContent && !targetCats.length) {
      alert('記錄貓間關係時請至少選擇一隻對象貓')
      return
    }
    const tags = [...draft.affectionTags, ...draft.conflictTags, ...draft.humanInteractionTags]
    behaviorSocialLogs.value.unshift(normalizeBehaviorSocialLog({
      id: safeUUID(),
      mode: 'interaction',
      at,
      primaryCat: primary.name,
      primaryCatId: primary.id,
      targetCats,
      targetCatIds: [...targetCatIds],
      tags,
      affectionTags: [...draft.affectionTags],
      conflictTags: [...draft.conflictTags],
      humanInteractionTags: [...draft.humanInteractionTags],
      intimacy: computeBehaviorIntimacyScore(draft),
      moodScore: computeBehaviorMoodScore(draft),
      note: draft.note?.trim() || ''
    }))
  } else {
    const cat = currentCat.value
    if (!cat) return
    behaviorSocialLogs.value.unshift(normalizeBehaviorSocialLog({
      id: safeUUID(),
      mode: 'single',
      at,
      catId: cat.id,
      catName: cat.name,
      tags: [...draft.quirkTags, ...draft.warningTags, ...draft.humanInteractionTags],
      quirkTags: [...draft.quirkTags],
      warningTags: [...draft.warningTags],
      humanInteractionTags: [...draft.humanInteractionTags],
      moodScore: computeBehaviorMoodScore(draft),
      note: draft.note?.trim() || ''
    }))
  }
  persistBehaviorSocialLogs()
  behaviorSocialDraft.value = createBehaviorSocialDraft()
  behaviorSocialSubTab.value = 'status'
  resetBehaviorSocialCustomInputs()
  resetBehaviorSocialTagSelection()
  behaviorSocialSaveMessage.value = '已儲存紀錄'
  if (behaviorSocialSaveMessageTimer) clearTimeout(behaviorSocialSaveMessageTimer)
  behaviorSocialSaveMessageTimer = setTimeout(() => { behaviorSocialSaveMessage.value = '' }, 2000)
}

const removeBehaviorSocialLog = (id) => {
  behaviorSocialLogs.value = behaviorSocialLogs.value.filter(log => log.id !== id)
  persistBehaviorSocialLogs()
}

const formatBehaviorSocialLogHeadline = (log) => {
  const date = String(log?.at || '').slice(0, 10)
  if (log.mode === 'interaction' || log.mode === 'multi' || log.mode === 'group') {
    migrateBehaviorSocialLogShape(log)
    const primary = log.primaryCat || log.actorName || '貓貓'
    const targets = formatBehaviorSocialLogTargets(log)
    return `${date} · ${primary}${targets ? ` ➔ ${targets}` : ''}`
  }
  return `${date} · ${log.catName || currentCat.value?.name || '貓貓'}`
}

const formatBehaviorSocialLogTargets = (log) => {
  if (log.mode === 'single') return ''
  migrateBehaviorSocialLogShape(log)
  if (log.targetCats?.length) return log.targetCats.join('、')
  if (log.partnerName) return log.partnerName
  if (log.participantNames?.length > 1) return log.participantNames.slice(1).join('、')
  return (log.targetCatIds || [])
    .map(id => cats.value.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join('、')
}

const formatBehaviorSocialLogTags = (log) => {
  if (log.tags?.length) return log.tags.join('、')
  if (log.mode === 'interaction' || log.mode === 'multi' || log.mode === 'group') {
    const parts = []
    if (log.affectionTags?.length) parts.push(`💕 ${log.affectionTags.join('、')}`)
    if (log.conflictTags?.length) parts.push(`⚔️ ${log.conflictTags.join('、')}`)
    if (log.humanInteractionTags?.length) parts.push(`❤️ ${log.humanInteractionTags.join('、')}`)
    return parts.join(' · ')
  }
  const parts = []
  if (log.quirkTags?.length) parts.push(`🌀 ${log.quirkTags.join('、')}`)
  if (log.warningTags?.length) parts.push(`⚠️ ${log.warningTags.join('、')}`)
  if (log.humanInteractionTags?.length) parts.push(`❤️ ${log.humanInteractionTags.join('、')}`)
  return parts.join(' · ')
}

const formatCareChecklistLogLine = (log) => {
  const date = String(log?.at || '').slice(0, 10)
  const tasks = CARE_CHECKLIST_TASKS.filter(t => log?.[t.key]).map(t => t.label)
  const taskStr = tasks.length ? tasks.join('、') : '（未勾選項目）'
  const note = log?.note?.trim()
  return `${date} · ${taskStr}${note ? ` — ${note}` : ''}`
}

const addCareChecklistLog = () => {
  if (!currentCat.value) return
  ensureCareData(currentCat.value)
  const d = careChecklistDraft.value
  const hasAny = CARE_CHECKLIST_TASKS.some(t => d[t.key])
  if (!hasAny && !d.note?.trim()) {
    alert('請勾選至少一項照護項目或填寫備註')
    return
  }
  const row = {
    id: safeUUID(),
    at: `${d.date}T12:00`,
    note: d.note?.trim() || ''
  }
  CARE_CHECKLIST_TASKS.forEach(t => { row[t.key] = !!d[t.key] })
  currentCat.value.careChecklistLogs.unshift(row)
  careChecklistDraft.value = {
    date: getTodayString(),
    water: false, litter: false, food: false, observe: false, play: false, meds: false, note: ''
  }
  persistCats()
}

const removeCareChecklistLog = (id) => {
  if (!currentCat.value?.careChecklistLogs) return
  currentCat.value.careChecklistLogs = currentCat.value.careChecklistLogs.filter(l => l.id !== id)
  persistCats()
}

const onCareMedScheduleBlur = () => {
  if (!currentCat.value) return
  ensureCareData(currentCat.value)
  if (currentCat.value.careMedSchedule.needMedicationChart) {
    ensureMedicationChartChecks(currentCat.value.careMedSchedule)
  }
  persistCats()
}

const addCareMedRow = () => {
  if (!currentCat.value) return
  ensureCareData(currentCat.value)
  addMedicalMedicationRow(currentCat.value.careMedSchedule)
  persistCats()
}

const removeCareMedRow = (index) => {
  if (!currentCat.value?.careMedSchedule) return
  removeMedicalMedicationRow(currentCat.value.careMedSchedule, index)
  persistCats()
}

const onCareMedChartToggle = () => {
  if (!currentCat.value?.careMedSchedule) return
  ensureMedicationChartChecks(currentCat.value.careMedSchedule)
  persistCats()
}

const formatWeightLogLine = (log) => {
  const date = String(log?.at || '').slice(0, 10)
  const w = formatWeightKg(log?.weight)
  const note = log?.note?.trim()
  return `${date} · ${w} kg${note ? ` — ${note}` : ''}`
}

const addWeightLog = () => {
  if (!currentCat.value) return
  const w = roundWeightKg(weightLogDraft.value.weight)
  if (w == null) {
    alert('請輸入有效體重（kg），精準至小數點後兩位')
    return
  }
  ensureCareData(currentCat.value)
  currentCat.value.weightLogs.unshift({
    id: safeUUID(),
    at: weightLogDraft.value.date || getTodayString(),
    weight: w.toFixed(2),
    note: weightLogDraft.value.note?.trim() || ''
  })
  currentCat.value.weight = w
  if (!getCatTargetWeightKg(currentCat.value)) {
    currentCat.value.targetWeight = w
    targetWeightInput.value = w.toFixed(2)
  }
  weightLogDraft.value = { date: getTodayString(), weight: '', note: '' }
  persistCats()
}

const removeWeightLog = (id) => {
  if (!currentCat.value?.weightLogs) return
  currentCat.value.weightLogs = currentCat.value.weightLogs.filter(l => l.id !== id)
  persistCats()
}

const resetUserGuideTemplate = () => {
  if (!currentCat.value) return
  if (!confirm('還原為預設使用指南範本？現有內容將被覆蓋。')) return
  ensureCareData(currentCat.value)
  currentCat.value.userGuide.content = DEFAULT_USER_GUIDE_TEXT
  persistCats()
}

const escapeCarePdfHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const exportCarePdfFromHtml = async (title, bodyHtml, filename) => {
  if (carePdfExporting.value || !currentCat.value) return
  carePdfExporting.value = true
  const catName = escapeCarePdfHtml(currentCat.value.name)
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Microsoft JhengHei',sans-serif;color:#1e293b;background:#fff;padding:32px;width:595px;box-sizing:border-box;">
      <div style="border-bottom:2px solid #c4b5fd;padding-bottom:12px;margin-bottom:16px;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#6d28d9;">${escapeCarePdfHtml(title)}</p>
        <h1 style="margin:6px 0 0;font-size:20px;font-weight:900;color:#4c1d95;">${catName}</h1>
      </div>
      ${bodyHtml}
      <p style="margin:24px 0 0;font-size:10px;color:#94a3b8;text-align:right;">由貓咪照護 App 生成</p>
    </div>`
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;'
  container.innerHTML = html
  document.body.appendChild(container)
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])
    const canvas = await html2canvas(container.firstElementChild, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = margin
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
    while (heightLeft > 0) {
      pdf.addPage()
      position = margin - (imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2
    }
    pdf.save(filename)
  } catch (err) {
    console.error(err)
    alert('PDF 生成失敗')
  } finally {
    document.body.removeChild(container)
    carePdfExporting.value = false
  }
}

const HANDOVER_STORAGE_KEY = 'meow_handover_sheet_v1'

const HANDOVER_TABS = [
  { id: 'basic', label: '基本資訊' },
  { id: 'feeding', label: '餵食計畫' },
  { id: 'checklist', label: '照護清單' }
]

const DEFAULT_HANDOVER_CHECKLIST_LABELS = [
  '更換新鮮飲用水',
  '清理貓砂盆',
  '陪玩（逗貓棒）15分鐘',
  '貓碗清洗',
  '觀察食慾及精神狀態',
  '給貓草包',
  '梳毛'
]

const HANDOVER_AFFINITY_OPTIONS = ['非常親近', '普通', '有啲怕生', '極怕陌生人', '唔鍾意陌生人']
const HANDOVER_TOUCH_OPTIONS = ['可以摸', '只可以摸頭／背', '唔可以摸']
const HANDOVER_AGGRESSION_OPTIONS = [
  '貓貓好愛人類，零攻擊力',
  '貓貓會打人（不過收爪）',
  '貓貓會出爪（直接出擊）',
  '貓貓會咬人（命中目標）'
]

const HANDOVER_VISIT_TIME_OPTIONS = [
  { key: 'morning', label: '早' },
  { key: 'afternoon', label: '午' },
  { key: 'evening', label: '晚' }
]

const HANDOVER_ENTRY_OPTIONS = [
  { key: 'key', label: '鎖匙' },
  { key: 'card', label: '匙咭' },
  { key: 'password', label: '密碼' },
  { key: 'video', label: '拍咭' },
  { key: 'fingerprint', label: '指模' },
  { key: 'other', label: '其他' }
]

const createEmptyHandoverPersonality = (cat) => ({
  affinity: '',
  touchable: '',
  aggression: '',
  hidingSpots: '',
  taboos: cat?.catManual?.taboos || '',
  preferences: cat?.catManual?.preferences || '',
  notes: cat?.catManual?.sitterNotes || cat?.catManual?.quirks || ''
})

const createDefaultHandoverSheet = () => ({
  mode: 'visit',
  activeTab: 'basic',
  startDate: getTodayString(),
  endDate: getTodayString(),
  sitterName: '',
  boardingShopName: '',
  ownerContact: '',
  ownerAddress: '',
  entryMethods: { key: false, card: false, password: false, video: false, fingerprint: false, other: false },
  entryOtherNote: '',
  vetHospital: '',
  vetPhone: '',
  vetDoctor: '',
  vetAddress: '',
  dailyBoardingFee: '',
  visitsPerDayDefault: 1,
  visitTimes: { morning: false, afternoon: false, evening: false },
  dailyVisitsExpanded: false,
  dailyVisits: [{ date: getTodayString(), count: 1 }],
  overallNotes: '',
  personalities: {},
  feedingSlots: [],
  snacks: [],
  checklistItems: DEFAULT_HANDOVER_CHECKLIST_LABELS.map(label => ({ id: safeUUID(), label }))
})

const normalizeHandoverSheet = (raw) => {
  const base = createDefaultHandoverSheet()
  if (!raw || typeof raw !== 'object') return base
  const merged = { ...base, ...raw }
  if (!['visit', 'boarding'].includes(merged.mode)) merged.mode = 'visit'
  if (!['basic', 'feeding', 'checklist'].includes(merged.activeTab)) merged.activeTab = 'basic'
  if (!Array.isArray(merged.dailyVisits)) merged.dailyVisits = base.dailyVisits
  merged.dailyVisits = merged.dailyVisits.map(row => ({
    date: row?.date || getTodayString(),
    count: Math.max(1, parseInt(String(row?.count ?? 1), 10) || 1)
  }))
  if (!Array.isArray(merged.feedingSlots)) merged.feedingSlots = []
  merged.feedingSlots = merged.feedingSlots.map(slot => ({
    id: slot?.id || safeUUID(),
    timeLabel: slot?.timeLabel || '',
    meals: slot?.meals && typeof slot.meals === 'object' ? { ...slot.meals } : {}
  }))
  if (!Array.isArray(merged.snacks)) merged.snacks = []
  merged.snacks = merged.snacks.map(s => ({
    id: s?.id || safeUUID(),
    name: s?.name || ''
  }))
  if (!Array.isArray(merged.checklistItems) || !merged.checklistItems.length) {
    merged.checklistItems = base.checklistItems
  } else {
    merged.checklistItems = merged.checklistItems.map(item => ({
      id: item?.id || safeUUID(),
      label: String(item?.label || '').trim()
    })).filter(item => item.label)
  }
  if (!merged.personalities || typeof merged.personalities !== 'object') merged.personalities = {}
  if (merged.vetAddress === undefined) merged.vetAddress = ''
  if (!merged.visitTimes || typeof merged.visitTimes !== 'object') {
    merged.visitTimes = { morning: false, afternoon: false, evening: false }
  } else {
    HANDOVER_VISIT_TIME_OPTIONS.forEach(opt => {
      if (merged.visitTimes[opt.key] === undefined) merged.visitTimes[opt.key] = false
    })
  }
  if (merged.dailyVisitsExpanded === undefined) merged.dailyVisitsExpanded = false
  if (merged.ownerAddress === undefined) merged.ownerAddress = ''
  if (merged.entryOtherNote === undefined) merged.entryOtherNote = ''
  if (!merged.entryMethods || typeof merged.entryMethods !== 'object') {
    merged.entryMethods = { key: false, card: false, password: false, video: false, fingerprint: false, other: false }
  } else {
    HANDOVER_ENTRY_OPTIONS.forEach(opt => {
      if (merged.entryMethods[opt.key] === undefined) merged.entryMethods[opt.key] = false
    })
  }
  return merged
}

const handoverSheet = ref(normalizeHandoverSheet(null))
const handoverChecklistDraft = ref('')

const handoverModalTitle = computed(() =>
  handoverSheet.value.mode === 'boarding' ? '🏨 貓酒店交接單設定' : '🐾 上門照顧交接單設定'
)

const handoverTotalVisits = computed(() =>
  (handoverSheet.value.dailyVisits || []).reduce((sum, row) => sum + (Number(row.count) || 0), 0)
)

const persistHandover = () => {
  scheduleAppSyncPush()
}

const ensureHandoverSheet = () => {
  handoverSheet.value = normalizeHandoverSheet(handoverSheet.value)
  const personalities = { ...handoverSheet.value.personalities }
  cats.value.forEach(cat => {
    if (!personalities[cat.id]) personalities[cat.id] = createEmptyHandoverPersonality(cat)
    else {
      const p = personalities[cat.id]
      if (p.affinity === undefined) p.affinity = ''
      if (p.touchable === undefined) p.touchable = ''
      if (p.aggression === undefined) p.aggression = ''
      if (p.hidingSpots === undefined) p.hidingSpots = ''
      if (p.taboos === undefined) p.taboos = ''
      if (p.preferences === undefined) p.preferences = ''
      if (p.notes === undefined) p.notes = ''
    }
  })
  handoverSheet.value.personalities = personalities
  handoverSheet.value.feedingSlots.forEach(slot => {
    cats.value.forEach(cat => {
      if (slot.meals[cat.id] === undefined) slot.meals[cat.id] = ''
    })
  })
}

const handoverModeBtnClass = (mode) => [
  'py-2.5 rounded-xl text-[10px] font-black transition-all border',
  handoverSheet.value.mode === mode
    ? 'bg-slate-800 text-white border-slate-800'
    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
]

const handoverTabBtnClass = (tabId) => [
  'px-3 py-1.5 rounded-full text-[10px] font-black border transition-all',
  handoverSheet.value.activeTab === tabId
    ? 'bg-slate-800 text-white border-slate-800'
    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
]

const setHandoverMode = (mode) => {
  handoverSheet.value.mode = mode
  persistHandover()
}

const enumerateYmdRange = (startYmd, endYmd) => {
  if (!startYmd || !endYmd) return []
  let start = startYmd
  let end = endYmd
  if (start > end) { const t = start; start = end; end = t }
  const list = []
  let cur = start
  let guard = 0
  while (cur <= end && guard < 366) {
    list.push(cur)
    cur = shiftYmd(cur, 1)
    guard++
  }
  return list
}

const syncHandoverDailyVisits = () => {
  const dates = enumerateYmdRange(handoverSheet.value.startDate, handoverSheet.value.endDate)
  if (!dates.length) return
  const old = handoverSheet.value.dailyVisits || []
  const def = Math.max(1, parseInt(String(handoverSheet.value.visitsPerDayDefault ?? 1), 10) || 1)
  handoverSheet.value.dailyVisits = dates.map(date => {
    const existing = old.find(row => row.date === date)
    return { date, count: existing?.count ?? def }
  })
}

const onHandoverDateRangeChange = () => {
  syncHandoverDailyVisits()
  persistHandover()
}

const toggleHandoverVisitTime = (key) => {
  if (!handoverSheet.value.visitTimes) {
    handoverSheet.value.visitTimes = { morning: false, afternoon: false, evening: false }
  }
  handoverSheet.value.visitTimes[key] = !handoverSheet.value.visitTimes[key]
  persistHandover()
}

const toggleHandoverEntryMethod = (key) => {
  if (!handoverSheet.value.entryMethods) {
    handoverSheet.value.entryMethods = { key: false, card: false, password: false, video: false, fingerprint: false, other: false }
  }
  handoverSheet.value.entryMethods[key] = !handoverSheet.value.entryMethods[key]
  if (key === 'other' && !handoverSheet.value.entryMethods.other) {
    handoverSheet.value.entryOtherNote = ''
  }
  persistHandover()
}

const formatHandoverEntryMethodsLabel = (entryMethods, otherNote) => {
  const selected = HANDOVER_ENTRY_OPTIONS
    .filter(opt => opt.key !== 'other' && entryMethods?.[opt.key])
    .map(opt => opt.label)
  if (entryMethods?.other) {
    const note = String(otherNote || '').trim()
    selected.push(note ? `其他（${note}）` : '其他')
  }
  return selected.length ? selected.join('、') : '—'
}

const formatHandoverVisitTimesLabel = (visitTimes) => {
  const selected = HANDOVER_VISIT_TIME_OPTIONS
    .filter(opt => visitTimes?.[opt.key])
    .map(opt => opt.label)
  return selected.length ? selected.join('、') : '—'
}

const onHandoverDefaultVisitsChange = () => {
  const def = Math.max(1, parseInt(String(handoverSheet.value.visitsPerDayDefault ?? 1), 10) || 1)
  handoverSheet.value.visitsPerDayDefault = def
  handoverSheet.value.dailyVisits.forEach(row => { row.count = def })
  persistHandover()
}

const adjustHandoverDailyVisit = (date, delta) => {
  const row = handoverSheet.value.dailyVisits.find(r => r.date === date)
  if (!row) return
  row.count = Math.min(10, Math.max(1, (Number(row.count) || 1) + delta))
  persistHandover()
}

const formatHandoverVisitDayLabel = (ymd, index) => {
  const d = parseYmd(ymd)
  if (!d) return ymd
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const suffix = index === 0 ? ' 第一天' : ''
  return `${mm}-${dd} (${weekdays[d.getDay()]})${suffix}`
}

const formatHandoverDisplayDate = (ymd) => {
  const d = parseYmd(ymd)
  if (!d) return ymd
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const addHandoverFeedingSlot = () => {
  ensureHandoverSheet()
  const meals = {}
  cats.value.forEach(cat => { meals[cat.id] = '' })
  handoverSheet.value.feedingSlots.push({ id: safeUUID(), timeLabel: '', meals })
  persistHandover()
}

const removeHandoverFeedingSlot = (id) => {
  handoverSheet.value.feedingSlots = handoverSheet.value.feedingSlots.filter(s => s.id !== id)
  persistHandover()
}

const addHandoverSnack = () => {
  handoverSheet.value.snacks.push({ id: safeUUID(), name: '' })
  persistHandover()
}

const removeHandoverSnack = (id) => {
  handoverSheet.value.snacks = handoverSheet.value.snacks.filter(s => s.id !== id)
  persistHandover()
}

const addHandoverChecklistItem = () => {
  const label = handoverChecklistDraft.value.trim()
  if (!label) return
  handoverSheet.value.checklistItems.push({ id: safeUUID(), label })
  handoverChecklistDraft.value = ''
  persistHandover()
}

const removeHandoverChecklistItem = (id) => {
  handoverSheet.value.checklistItems = handoverSheet.value.checklistItems.filter(i => i.id !== id)
  persistHandover()
}

const buildHandoverPdfHtml = () => {
  ensureHandoverSheet()
  const h = handoverSheet.value
  const isBoarding = h.mode === 'boarding'
  const title = isBoarding ? '貓酒店交接單' : '上門照顧交接單'
  const block = (label, val) => `<div style="margin-bottom:10px;"><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;">${escapeCarePdfHtml(label)}</p><p style="margin:0;font-size:12px;white-space:pre-wrap;">${escapeCarePdfHtml(val || '—')}</p></div>`
  let body = `<p style="margin:0 0 12px;font-size:13px;font-weight:700;">${escapeCarePdfHtml(title)}</p>`
  body += block('照顧期間', `${formatHandoverDisplayDate(h.startDate)} 至 ${formatHandoverDisplayDate(h.endDate)}`)
  if (isBoarding) {
    body += block('貓酒店名稱', h.boardingShopName)
    body += block('每日費用', h.dailyBoardingFee ? `NT$ ${h.dailyBoardingFee}` : '')
  } else {
    body += block('Pet Sitter', h.sitterName)
    body += block('主人地址', h.ownerAddress)
    body += block('開門方式', formatHandoverEntryMethodsLabel(h.entryMethods, h.entryOtherNote))
    body += '<p style="margin:0 0 10px;font-size:10px;color:#94a3b8;">保安關係，密碼等等請私下提供***</p>'
    body += block('到訪時間', formatHandoverVisitTimesLabel(h.visitTimes))
    body += block('每日到訪次數', String(h.visitsPerDayDefault || 1))
    body += block('總到訪次數', `${handoverTotalVisits.value} 次`)
    if (h.dailyVisits?.length) {
      body += '<p style="margin:8px 0 4px;font-size:11px;font-weight:700;color:#64748b;">每日到訪</p>'
      h.dailyVisits.forEach((row, idx) => {
        body += `<p style="margin:0 0 4px;font-size:12px;">${escapeCarePdfHtml(formatHandoverVisitDayLabel(row.date, idx))}：${row.count} 次</p>`
      })
    }
  }
  body += block('主人聯絡資料', h.ownerContact)
  body += '<p style="margin:16px 0 8px;font-size:12px;font-weight:700;color:#1e293b;">獸醫聯絡資料</p>'
  body += block('醫院名稱', h.vetHospital) + block('醫生名稱', h.vetDoctor)
    + block('電話', h.vetPhone) + block('地址', h.vetAddress)
  body += '<p style="margin:16px 0 8px;font-size:12px;font-weight:700;color:#1e293b;">餵食計畫</p>'
  if (!h.feedingSlots?.length) {
    body += '<p style="font-size:12px;color:#64748b;">未設定餵食時段</p>'
  } else {
    h.feedingSlots.forEach(slot => {
      body += `<p style="margin:0 0 6px;font-size:12px;font-weight:700;">${escapeCarePdfHtml(slot.timeLabel || '時段')}</p>`
      cats.value.forEach(cat => {
        const meal = slot.meals?.[cat.id]?.trim()
        if (meal) body += `<p style="margin:0 0 4px 12px;font-size:12px;">${escapeCarePdfHtml(cat.name)}：${escapeCarePdfHtml(meal)}</p>`
      })
    })
  }
  if (h.snacks?.filter(s => s.name?.trim()).length) {
    body += '<p style="margin:12px 0 6px;font-size:11px;font-weight:700;color:#64748b;">零食／保健品</p>'
    h.snacks.filter(s => s.name?.trim()).forEach(s => {
      body += `<p style="margin:0 0 4px;font-size:12px;">· ${escapeCarePdfHtml(s.name)}</p>`
    })
  }
  body += '<p style="margin:16px 0 8px;font-size:12px;font-weight:700;color:#1e293b;">照護清單</p>'
  if (h.checklistItems?.length) {
    body += '<ul style="margin:0;padding-left:18px;font-size:12px;">'
    h.checklistItems.forEach(item => {
      body += `<li style="margin-bottom:6px;">${escapeCarePdfHtml(item.label)}</li>`
    })
    body += '</ul>'
  }
  body += '<p style="margin:16px 0 8px;font-size:12px;font-weight:700;color:#1e293b;">貓貓性格／特性</p>'
  cats.value.forEach(cat => {
    const p = h.personalities[cat.id] || {}
    body += `<p style="margin:0 0 6px;font-size:12px;font-weight:700;">${escapeCarePdfHtml(cat.name)}</p>`
    body += block('親近程度', p.affinity)
    body += block('可否觸摸', p.touchable)
    body += block('攻擊力', p.aggression)
    body += block('藏身處', p.hidingSpots)
    body += block('禁忌', p.taboos)
    body += block('喜好', p.preferences)
    body += block('備註', p.notes)
  })
  body += block('特別提示', h.overallNotes)
  return { title, body }
}

const generateHandoverPdf = () => {
  const { title, body } = buildHandoverPdfHtml()
  const names = cats.value.map(c => c.name).join('、') || '貓咪'
  exportCarePdfFromHtml(title, body, `${names}-交接單.pdf`)
}

const exportFavoritesPdf = () => {
  ensureCareData(currentCat.value)
  const f = currentCat.value.favoritesMap
  const block = (label, val) => `<div style="margin-bottom:12px;"><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;">${label}</p><p style="margin:0;font-size:12px;white-space:pre-wrap;">${escapeCarePdfHtml(val || '—')}</p></div>`
  const body = block('最鍾意', f.loves) + block('舒適瞓覺位', f.sleepSpots) + block('避雷區／厭惡', f.dislikes)
  exportCarePdfFromHtml('喜好地圖', body, `${currentCat.value.name}-喜好地圖.pdf`)
}

const exportCareChecklistPdf = () => {
  ensureCareMaintenanceState(true)
  const freq = getCareMaintenanceActiveFrequency()
  const tab = CARE_MAINTENANCE_FREQ_TABS.find(t => t.id === freq)
  const items = getCareMaintenanceCatalog().filter(item => item.frequency === freq)
  const rows = items.length
    ? items.map(item => {
      const done = getCareMaintenanceCompletionDate(item)
      return `<p style="margin:0 0 8px;font-size:12px;">${done ? '☑' : '☐'} ${escapeCarePdfHtml(item.title)}${done ? ` <span style="color:#64748b;">(${escapeCarePdfHtml(done)})</span>` : ''}</p>`
    }).join('')
    : '<p style="font-size:12px;color:#64748b;">暫無項目</p>'
  exportCarePdfFromHtml(`照護清單 · ${tab?.label || ''}`, rows, `${currentCat.value?.name || '貓咪'}-照護清單.pdf`)
}

const exportMedHistoryPdf = () => {
  ensureCareData(currentCat.value)
  const hist = currentCat.value.medHistory
  const block = (label, val) => `<div style="margin-bottom:12px;"><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748b;">${label}</p><p style="margin:0;font-size:12px;white-space:pre-wrap;">${escapeCarePdfHtml(val || '—')}</p></div>`
  let body = block('重大手術', hist.majorSurgeries) + block('慢性病史', hist.chronicConditions) + block('藥物過敏', hist.drugAllergies)
  ;(hist.customFields || []).forEach(field => {
    if (field.title?.trim() || field.content?.trim()) {
      body += block(field.title?.trim() || '自訂欄位', field.content)
    }
  })
  exportCarePdfFromHtml('歷史醫療病歷紀錄', body, `${currentCat.value.name}-病歷紀錄.pdf`)
}

const getCatDisplayNote = (cat) => {
  if (!cat) return ''
  return String(cat.notes ?? cat.note ?? '').trim()
}

const normalizeCat = (cat) => {
  if (!cat.id) cat.id = safeUUID()
  if (cat.photo === undefined) cat.photo = ''
  if (cat.breed === undefined) cat.breed = ''
  if (!cat.notes?.trim() && cat.note?.trim()) cat.notes = cat.note.trim()
  if (cat.notes === undefined) cat.notes = ''
  if (!cat.dietHistory) cat.dietHistory = {}
  if (!cat.waterLogs) cat.waterLogs = []
  ensureExcretionData(cat)
  if (!Array.isArray(cat.medicalRecords)) cat.medicalRecords = []
  cat.medicalRecords.forEach(entry => ensureMedicalEntry(entry))
  ensureCareData(cat)
  cat.reminders = normalizeReminderList(cat.reminders)
  // 移除「生日提醒」：只保留年齡計算，不再把生日轉成提醒條目
  if (Array.isArray(cat.reminders)) {
    cat.reminders = cat.reminders.filter(r => !r?.isBirthday)
    cat.reminders.forEach(r => {
      if (!r.id) r.id = safeUUID()
      const meta = resolveMilestoneCatalog(r)
      if (!r.catalogId && meta.id !== 'custom') r.catalogId = meta.id
      if (meta.id === 'groom_nails' && (!r.title || /剪甲甲|清潔耳仔|剪甲甲\/清潔耳仔/.test(r.title))) {
        r.title = meta.title
      }
    })
  }
  if (!cat.color || !themeColors[cat.color]) cat.color = 'morandiPink'
  if (typeof cat.weight !== 'number' || Number.isNaN(cat.weight)) {
    cat.weight = Number(cat.weight) || 4.2
  }
  if (cat.targetWeight == null && cat.idealWeight != null) {
    const migrated = parseWeightKg(cat.idealWeight)
    if (migrated != null) cat.targetWeight = migrated
  }
  const parsedTarget = getCatTargetWeightKg(cat)
  if (parsedTarget == null) cat.targetWeight = cat.weight
  else cat.targetWeight = parsedTarget
  if (cat.lastBcsScore != null) {
    const score = Number(cat.lastBcsScore)
    cat.lastBcsScore = Number.isFinite(score) ? score : null
  }
  Object.entries(cat.dietHistory || {}).forEach(([dateKey, day]) => migrateDayToMeals(day, dateKey))
  migrateWaterToLogs(cat)
  syncDietWaterForDate(cat, getTodayString())
}

const getValidCatIdSet = () => new Set(cats.value.map(cat => cat?.id).filter(Boolean))

const clampCurrentCatIndex = () => {
  if (!cats.value.length) {
    currentCatIndex.value = 0
    return
  }
  if (currentCatIndex.value < 0 || currentCatIndex.value >= cats.value.length) {
    currentCatIndex.value = 0
  }
}

const closeTransientModals = () => {
  showPrefModal.value = false
  showExcretionModal.value = false
  showRemindersModal.value = false
  showBookingModal.value = false
  showEditModal.value = false
  showAddCatModal.value = false
  showHeaderSettingsMenu.value = false
  showNewReminderForm.value = false
  activeCareModule.value = ''
  careMaintenanceCustomModalOpen.value = false
  careMaintenanceEditModalOpen.value = false
  careMaintenanceDeleteModalOpen.value = false
  careMaintenanceDateModalOpen.value = false
}

const resetSessionUiState = ({ keepTab = false } = {}) => {
  if (!keepTab) currentTab.value = 'home'
  activeMealId.value = ''
  activeMedicalId.value = ''
  selectedDate.value = getTodayString()
  behaviorSocialDraft.value = createBehaviorSocialDraft()
  behaviorSocialSubTab.value = 'status'
  behaviorSocialEditingGroup.value = null
  resetBehaviorSocialCustomInputs()
  resetBehaviorSocialTagSelection()
  careChecklistDraft.value = {
    date: getTodayString(),
    water: false, litter: false, food: false, observe: false, play: false, meds: false, note: ''
  }
  weightLogDraft.value = { date: getTodayString(), weight: '', note: '' }
  syncTargetWeightInput()
  closeTransientModals()
}

const resetAppSessionState = () => {
  resetGlobalRecordsLocal({ clearCats: true })
}

const purgeOrphanedRemoteData = () => {
  const validCatIds = getValidCatIdSet()
  if (!validCatIds.size) return false

  let changed = false

  const nextInventory = inventoryItems.value.filter(item => item?.catId && validCatIds.has(item.catId))
  if (nextInventory.length !== inventoryItems.value.length) {
    inventoryItems.value = nextInventory
    changed = true
  }

  const nextLogs = behaviorSocialLogs.value.filter((log) => {
    if (log.mode === 'single') {
      if (!log.catId) return true
      return validCatIds.has(log.catId)
    }
    const targetIds = [
      ...(Array.isArray(log.targetCatIds) ? log.targetCatIds : []),
      ...(Array.isArray(log.targetCats) ? log.targetCats.map(cat => cat?.id).filter(Boolean) : []),
      log.catId,
    ].filter(Boolean)
    if (!targetIds.length) return true
    return targetIds.some(id => validCatIds.has(id))
  })
  if (nextLogs.length !== behaviorSocialLogs.value.length) {
    behaviorSocialLogs.value = nextLogs
    changed = true
  }

  const state = careMaintenanceState.value
  const nextFrequencyByCat = Object.fromEntries(
    Object.entries(state.activeFrequencyByCatId || {}).filter(([catId]) => validCatIds.has(catId))
  )
  const nextCompletions = Object.fromEntries(
    Object.entries(state.completions || {}).filter(([key]) => {
      const parts = String(key).split('::')
      if (parts.length < 2) return true
      return validCatIds.has(parts[1])
    })
  )
  const nextSeededCatIds = (state.seededCareCatIds || []).filter(id => validCatIds.has(id))
  if (
    Object.keys(nextFrequencyByCat).length !== Object.keys(state.activeFrequencyByCatId || {}).length
    || Object.keys(nextCompletions).length !== Object.keys(state.completions || {}).length
    || nextSeededCatIds.length !== (state.seededCareCatIds || []).length
  ) {
    careMaintenanceState.value = {
      ...state,
      activeFrequencyByCatId: nextFrequencyByCat,
      completions: nextCompletions,
      seededCareCatIds: nextSeededCatIds,
    }
    changed = true
  }

  return changed
}

const initializeUser = ({ reason = 'boot' } = {}) => {
  const interactionLocked = isAppModalOpen.value

  if (!cats.value.length) {
    if (interactionLocked) {
      return { mode: 'empty-locked', reason }
    }
    clearAllLocalCache()
    void prepareFreshTrialSession({ clearCats: true })
    return { mode: 'empty', reason }
  }

  clampCurrentCatIndex()
  const purged = purgeOrphanedRemoteData()

  if (!interactionLocked) {
    if (reason === 'switch-cat') {
      resetSessionUiState({ keepTab: true })
    } else if (reason !== 'remote-sync' && reason !== 'preserve-view' && reason !== 'fetch') {
      resetSessionUiState({ keepTab: reason !== 'boot' })
    }
    ensureCareMaintenanceState(true)
    syncWaterDraftFromSaved()
    syncActiveMealIdForDay()
    syncActiveMedicalIdForDay()
    syncBehaviorSocialDraftCats()
  } else {
    ensureCareMaintenanceState(true)
  }

  if (purged) void persistAllRemoteState()
  mirrorSyncStateToLocalStorage()
  return { mode: 'ready', reason }
}

const teardownAppSession = () => {
  stopCarePoll()
  stopAppSyncPoll()
  clearTimeout(mirrorStorageTimer)
  resetAppSessionState()
}

const getAppSyncPayload = () => ({
  version: 30,
  cats: cats.value.map(({ inventoryItems: _inv, ...cat }) => JSON.parse(JSON.stringify(cat))),
  currentCatIndex: currentCatIndex.value,
  behaviorSocialLogs: JSON.parse(JSON.stringify(behaviorSocialLogs.value)),
  behaviorSocialCustomTags: JSON.parse(JSON.stringify(behaviorSocialCustomTags.value)),
  behaviorSocialHiddenTags: JSON.parse(JSON.stringify(behaviorSocialHiddenTags.value)),
  handoverSheet: JSON.parse(JSON.stringify(handoverSheet.value)),
})

const applyAppSyncRemotePayload = (data) => {
  applyAppSyncPayload(data, { preserveView: true })
}

const restoreActiveView = ({ catId, catIndex, tab }) => {
  if (!cats.value.length) {
    currentCatIndex.value = 0
    return
  }
  let nextIndex = null
  if (catId) {
    const byId = cats.value.findIndex(c => c.id === catId)
    if (byId >= 0) nextIndex = byId
  }
  if (nextIndex == null && typeof catIndex === 'number') {
    nextIndex = Math.min(Math.max(0, catIndex), cats.value.length - 1)
  }
  if (nextIndex != null) currentCatIndex.value = nextIndex
  if (tab) currentTab.value = tab
  syncWaterDraftFromSaved()
  syncActiveMealIdForDay()
  syncActiveMedicalIdForDay()
}

const mirrorSyncStateToLocalStorage = () => {
  setStorage('meow_cats_list_v30', cats.value.map(({ inventoryItems: _inv, ...cat }) => cat))
  setStorage('meow_currentCatIndex_v30', currentCatIndex.value)
  setStorage(BEHAVIOR_SOCIAL_STORAGE_KEY, behaviorSocialLogs.value)
  setStorage(BEHAVIOR_SOCIAL_CUSTOM_TAGS_KEY, behaviorSocialCustomTags.value)
  setStorage(BEHAVIOR_SOCIAL_HIDDEN_TAGS_KEY, behaviorSocialHiddenTags.value)
  setStorage(HANDOVER_STORAGE_KEY, handoverSheet.value)
}

const applyAppSyncPayload = (data, { preserveView = false } = {}) => {
  if (!data || typeof data !== 'object') return
  const viewSnapshot = preserveView
    ? { catId: currentCat.value?.id ?? null, catIndex: currentCatIndex.value, tab: currentTab.value }
    : null
  if (Array.isArray(data.cats)) {
    const nextCats = JSON.parse(JSON.stringify(data.cats))
    nextCats.forEach(cat => normalizeCat(cat))
    cats.value = nextCats
  }
  if (Array.isArray(data.behaviorSocialLogs)) {
    behaviorSocialLogs.value = data.behaviorSocialLogs.map(normalizeBehaviorSocialLog)
  }
  if (data.behaviorSocialCustomTags) {
    behaviorSocialCustomTags.value = normalizeBehaviorSocialCustomTags(data.behaviorSocialCustomTags)
  }
  if (data.behaviorSocialHiddenTags) {
    behaviorSocialHiddenTags.value = normalizeBehaviorSocialHiddenTags(data.behaviorSocialHiddenTags)
  }
  if (data.handoverSheet != null) {
    handoverSheet.value = normalizeHandoverSheet(data.handoverSheet)
  }
  purgeOrphanedRemoteData()
  if (viewSnapshot) restoreActiveView(viewSnapshot)
  else {
    syncWaterDraftFromSaved()
    syncActiveMealIdForDay()
    syncActiveMedicalIdForDay()
  }
  mirrorSyncStateToLocalStorage()
  initializeUser({ reason: 'remote-sync' })
}

const persistCats = () => {
  scheduleMirrorToLocalStorage()
  scheduleAppSyncPush()
  flushAppSyncPush()
}

const reloadAllLocalStorageData = ({ preserveView = false } = {}) => {
  const viewSnapshot = preserveView
    ? { catId: currentCat.value?.id ?? null, catIndex: currentCatIndex.value, tab: currentTab.value }
    : null
  const stored = getStorage('meow_cats_list_v30', getStorage('meow_cats_list_v29', null))
  if (Array.isArray(stored)) {
    if (stored.length === 0) {
      cats.value = []
      if (!preserveView) currentCatIndex.value = 0
    } else {
      stored.forEach(cat => normalizeCat(cat))
      cats.value = stored
      if (!preserveView) {
        const storedIndex = getStorage('meow_currentCatIndex_v30', getStorage('meow_currentCatIndex_v29', 0))
        if (typeof storedIndex === 'number' && storedIndex < stored.length) {
          currentCatIndex.value = storedIndex
        } else if (currentCatIndex.value >= stored.length) {
          currentCatIndex.value = 0
        }
      }
    }
  }

  const logs = getStorage(BEHAVIOR_SOCIAL_STORAGE_KEY, null)
  if (Array.isArray(logs)) {
    behaviorSocialLogs.value = logs.map(normalizeBehaviorSocialLog)
  }

  const customTags = getStorage(BEHAVIOR_SOCIAL_CUSTOM_TAGS_KEY, null)
  if (customTags) {
    behaviorSocialCustomTags.value = normalizeBehaviorSocialCustomTags(customTags)
  }

  const hiddenTags = getStorage(BEHAVIOR_SOCIAL_HIDDEN_TAGS_KEY, null)
  if (hiddenTags) {
    behaviorSocialHiddenTags.value = normalizeBehaviorSocialHiddenTags(hiddenTags)
  }

  const careRaw = getStorage(CARE_MAINTENANCE_STORAGE_KEY, null)
  if (careRaw) {
    careMaintenanceState.value = normalizeCareMaintenanceState(careRaw)
  }

  const handoverRaw = getStorage(HANDOVER_STORAGE_KEY, null)
  if (handoverRaw) {
    handoverSheet.value = normalizeHandoverSheet(handoverRaw)
  }

  syncWaterDraftFromSaved()
  syncActiveMealIdForDay()
  syncActiveMedicalIdForDay()
  if (viewSnapshot) restoreActiveView(viewSnapshot)
}

const pullInventoryFromServer = async () => {
  const col = getInventoryCollection()
  if (!col) return
  const snapshot = await getDocsFromServer(col)
  inventoryHasAppliedServerSnapshot = true
  inventoryItems.value = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

const fetchLatestData = async ({ preserveView = false } = {}) => {
  if (isRemoteApplyLocked() || !activeSessionUid) return
  const viewSnapshot = preserveView
    ? { catId: currentCat.value?.id ?? null, catIndex: currentCatIndex.value, tab: currentTab.value }
    : null

  await Promise.allSettled([
    pullAppSyncFromServer(),
    pullCareSyncFromServer(true),
    pullInventoryFromServer(),
  ])

  const purged = purgeOrphanedRemoteData()

  if (viewSnapshot) {
    restoreActiveView(viewSnapshot)
  }

  mirrorSyncStateToLocalStorage()
  ensureCareMaintenanceState(true)
  if (!isAppModalOpen.value && currentTab.value === 'stats') {
    behaviorSocialDraft.value = createBehaviorSocialDraft()
    syncBehaviorSocialDraftCats()
  }
  initializeUser({ reason: preserveView ? 'preserve-view' : 'fetch' })
  if (purged) await persistAllRemoteState()
}

const reloadCatsFromStorage = () => {
  reloadAllLocalStorageData()
}

const defaultCats = [
  {
    name: '孖寶', weight: 3.9, birthday: '2019-03-15', gender: '女', neutered: true, color: 'coralRed', feedingKcal: 278, waterMl: 127,
    reminders: JSON.parse(JSON.stringify(buildNewCatReminders())),
    dietHistory: {
      '2026-05-24': { dryBrand: '牌子A', dryFlavor: '肉類牛', dryAmount: '45g', dryLove: 5, wetBrand: 'CIAO', wetFlavor: '吞拿魚', wetAmount: '1.5oz', wetLove: 5, treatsType: '凍乾雞肉粒', treatsLove: 2, waterMl: 120 },
      '2026-05-25': { dryBrand: '牌子A', dryFlavor: '肉類雞', dryAmount: '40g', dryLove: 3, wetBrand: 'Thrive', wetFlavor: '純鮭魚', wetAmount: '75g', wetLove: 2, treatsType: '凍乾三文魚', treatsLove: 3, waterMl: 95 }
    }
  },
  {
    name: '肥丁', weight: 4.2, birthday: '2023-12-01', gender: '女', neutered: true, color: 'slateBlue', feedingKcal: 210, waterMl: 95,
    reminders: JSON.parse(JSON.stringify(buildNewCatReminders())),
    dietHistory: {
      '2026-05-26': { dryBrand: 'Hill\'s', dryFlavor: '深海魚', dryAmount: '2oz', dryLove: 3, wetBrand: 'Thrive', wetFlavor: '純雞肉', wetAmount: '40g', wetLove: 1, treatsType: '貓薄荷餅乾', treatsLove: 3, waterMl: 80 }
    }
  }
]

const cats = ref([])

let appSyncPollTimer = null
let inventoryHasAppliedServerSnapshot = false
let remoteApplyLockDepth = 0

const isRemoteApplyLocked = () => remoteApplyLockDepth > 0

const pauseAllRemoteSync = () => {
  remoteApplyLockDepth += 1
  if (remoteApplyLockDepth === 1) {
    pauseRemoteApply(true)
    pauseCareRemoteApply(true)
  }
}

const resumeAllRemoteSync = () => {
  remoteApplyLockDepth = Math.max(0, remoteApplyLockDepth - 1)
  if (remoteApplyLockDepth === 0) {
    pauseRemoteApply(false)
    pauseCareRemoteApply(false)
  }
}

const flushPendingCloudSync = () => {
  if (!activeSessionUid) return
  flushAppSyncPush()
  pushCareSync().catch(() => {})
}

const pullAllCloudData = async () => {
  if (isRemoteApplyLocked() || !activeSessionUid) return
  await Promise.allSettled([
    pullAppSyncFromServer(),
    pullCareSyncFromServer(true),
    pullInventoryFromServer(),
  ])
  purgeOrphanedRemoteData()
}

const startAppSyncPoll = () => {
  clearInterval(appSyncPollTimer)
  appSyncPollTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    pullAllCloudData()
  }, 8000)
}

const stopAppSyncPoll = () => {
  clearInterval(appSyncPollTimer)
  appSyncPollTimer = null
}

const onPageShow = () => {
  if (!authUser.value) return
  fetchLatestData({ preserveView: true })
}

const onVisibilityChange = () => {
  if (!authUser.value) return
  if (document.visibilityState === 'visible') {
    fetchLatestData({ preserveView: true })
  } else {
    flushPendingCloudSync()
  }
}

const stopUserSession = async () => {
  if (!activeSessionUid) return
  flushPendingCloudSync()
  destroyCareSync()
  destroyAppSync()
  if (unsubscribeInventory) {
    unsubscribeInventory()
    unsubscribeInventory = null
  }
  stopAppSyncPoll()
  teardownAppSession()
  resetGlobalRecordsLocal({ clearCats: true })
  inventoryHasAppliedServerSnapshot = false
  activeSessionUid = null
  storageUserPrefix = ''
  setImageUploadUserId(null)
  showSplash.value = true
}

const startUserSession = async (uid) => {
  if (!uid || activeSessionUid === uid) return
  if (activeSessionUid) await stopUserSession()

  activeSessionUid = uid
  storageUserPrefix = `u_${uid}_`
  initAppSyncForUser(uid)
  initCareSyncForUser(uid)
  setImageUploadUserId(uid)

  const legacyCareState = normalizeCareMaintenanceState(getStorage(CARE_MAINTENANCE_STORAGE_KEY, null))

  pauseAppSyncPush(true)
  pauseCareSyncPush(true)
  await pullAllCloudData()
  if (!cats.value.length) {
    reloadAllLocalStorageData({ preserveView: false })
  }
  initializeUser({ reason: 'boot' })
  pauseAppSyncPush(false)
  pauseCareSyncPush(false)

  subscribeCareSync(legacyCareState)
  try { localStorage.removeItem(scopedStorageKey(CARE_MAINTENANCE_STORAGE_KEY)) } catch {}
  subscribeToAppSync()

  const careBefore = JSON.stringify(careMaintenanceState.value)
  ensureCareMaintenanceState(true)
  const careMigrated = JSON.stringify(careMaintenanceState.value) !== careBefore
  let remindersMigrated = false
  cats.value.forEach((cat) => {
    const before = JSON.stringify(cat.reminders || [])
    normalizeCat(cat)
    if (JSON.stringify(cat.reminders || []) !== before) remindersMigrated = true
  })
  if (remindersMigrated) {
    mirrorSyncStateToLocalStorage()
    scheduleAppSyncPush()
  }
  if (careMigrated) {
    persistCareMaintenance()
  }
  subscribeToInventory()
  startAppSyncPoll()
}

const handleLogout = async () => {
  if (!confirm('確定要登出嗎？')) return
  closeEditModal()
  try {
    await signOutUser()
  } catch (err) {
    alert(err?.message || '登出失敗')
  }
}

onMounted(() => {
  registerCareSync({
    getState: () => careMaintenanceState.value,
    onRemote: applyCareMaintenanceRemoteState,
    onError: (err) => {
      console.error('Care sync error:', err)
      careSyncStatus.value = { ...getCareSyncStatus(), lastError: err?.message || String(err) }
    },
    onStatus: (status) => {
      careSyncStatus.value = { ...status }
    },
  })

  registerAppSyncPayload(getAppSyncPayload)
  registerAppSyncHandlers({
    onRemote: applyAppSyncRemotePayload,
    onError: (err) => {
      console.error('Cloud sync error:', err)
    },
  })

  window.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pageshow', onPageShow)
  window.addEventListener('pagehide', flushPendingCloudSync)

  watchAuthState(async (user) => {
    authUser.value = user
    authReady.value = true
    if (user) {
      await startUserSession(user.uid)
    } else {
      await stopUserSession()
    }
  })
})

onUnmounted(() => {
  void stopUserSession()
  window.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pageshow', onPageShow)
  window.removeEventListener('pagehide', flushPendingCloudSync)
})

const currentCat = computed(() => {
  if (cats.value.length === 0) return null
  if (currentCatIndex.value >= cats.value.length) currentCatIndex.value = 0
  return cats.value[currentCatIndex.value]
})

const currentInventoryItems = computed(() => {
  const catId = currentCat.value?.id
  if (!catId) return []
  return inventoryItems.value.filter(item => item.catId === catId)
})

const migrateLegacyInventoryToFirestore = async () => {
  if (inventoryMigrationAttempted) return
  if (inventoryItems.value.length > 0) {
    inventoryMigrationAttempted = true
    return
  }

  const pending = []
  for (const cat of cats.value) {
    if (!cat?.id || !Array.isArray(cat.inventoryItems)) continue
    for (const item of cat.inventoryItems) {
      const qty = parseInventoryQty(item?.current) ?? 0
      const name = String(item?.name ?? '').trim()
      if (!name && qty === 0) continue
      pending.push({
        catId: cat.id,
        name,
        current: item.current ?? '0',
        unit: item.unit ?? '件',
        note: item.note ?? '',
      })
    }
  }
  if (pending.length === 0) {
    inventoryMigrationAttempted = true
    return
  }

  try {
    const col = getInventoryCollection()
    if (!col) return
    await Promise.all(
      pending.map(data =>
        addDoc(col, {
          ...data,
          updatedAt: serverTimestamp(),
        })
      )
    )
    inventoryMigrationAttempted = true
    cats.value.forEach(cat => { delete cat.inventoryItems })
    persistCats()
  } catch (err) {
    console.error('Legacy inventory migration failed:', err)
  }
}

const subscribeToInventory = () => {
  const col = getInventoryCollection()
  if (unsubscribeInventory || !col) return
  unsubscribeInventory = onSnapshot(
    col,
    (snapshot) => {
      if (isRemoteApplyLocked()) return
      if (snapshot.metadata.fromCache && inventoryHasAppliedServerSnapshot) return
      if (!snapshot.metadata.fromCache) inventoryHasAppliedServerSnapshot = true
      inventoryItems.value = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      const validCatIds = getValidCatIdSet()
      if (validCatIds.size) {
        const filtered = inventoryItems.value.filter(item => item?.catId && validCatIds.has(item.catId))
        if (filtered.length !== inventoryItems.value.length) {
          inventoryItems.value = filtered
        }
      }
      migrateLegacyInventoryToFirestore()
    },
    (err) => {
      console.error('Firestore inventory listener error:', err)
    }
  )
}

const homeContentKey = computed(() => {
  const cat = currentCat.value
  return cat?.id ? `home-${cat.id}` : `home-idx-${currentCatIndex.value}`
})

const healthMemoCatName = computed(() => {
  const name = currentCat.value?.name?.trim()
  return name || '貓貓'
})
const healthMemoTitle = computed(() => `${healthMemoCatName.value} 大事備忘錄`)

const createBehaviorSocialDraft = () => ({
  date: getTodayString(),
  targetCatIds: [],
  affectionTags: [],
  conflictTags: [],
  quirkTags: [],
  warningTags: [],
  humanInteractionTags: [],
  intimacy: 50,
  moodScore: 50,
  note: ''
})

const behaviorSocialDraft = ref(createBehaviorSocialDraft())

const isMultiCatHousehold = computed(() => cats.value.length > 1)

const behaviorSocialTargetCatOptions = computed(() => {
  const primaryId = currentCat.value?.id
  if (!primaryId) return cats.value
  return cats.value.filter(cat => cat.id !== primaryId)
})

const behaviorSocialAffectionTagOptions = computed(() => [
  ...BEHAVIOR_SOCIAL_AFFECTION_TAGS,
  ...(behaviorSocialCustomTags.value.affection || [])
])

const behaviorSocialConflictTagOptions = computed(() => [
  ...BEHAVIOR_SOCIAL_CONFLICT_TAGS,
  ...(behaviorSocialCustomTags.value.conflict || [])
])

const behaviorSocialQuirkTagOptions = computed(() =>
  buildBehaviorSocialTagOptions(BEHAVIOR_SINGLE_QUIRK_TAGS, 'quirk')
)

const behaviorSocialWarningTagOptions = computed(() =>
  buildBehaviorSocialTagOptions(BEHAVIOR_SINGLE_WARNING_TAGS, 'warning')
)

const behaviorSocialHumanAffectionTagOptions = computed(() =>
  buildBehaviorSocialTagOptions(BEHAVIOR_SINGLE_HUMAN_AFFECTION_TAGS, 'humanAffection')
)

const behaviorSocialHumanRejectionTagOptions = computed(() =>
  buildBehaviorSocialTagOptions(BEHAVIOR_SINGLE_HUMAN_REJECTION_TAGS, 'humanRejection')
)

const behaviorSocialLogsForView = computed(() => {
  if (!isMultiCatHousehold.value) {
    const catId = currentCat.value?.id
    return behaviorSocialLogs.value
      .filter(log => log.mode === 'single' && (!catId || log.catId === catId))
      .slice(0, 20)
  }
  return behaviorSocialLogs.value
    .filter(log => log.mode === 'interaction' || log.mode === 'multi' || log.mode === 'group')
    .slice(0, 20)
})

watch(
  () => behaviorSocialSubTab.value,
  () => { behaviorSocialEditingGroup.value = null }
)

watch(currentCatIndex, () => {
  behaviorSocialDraft.value = createBehaviorSocialDraft()
  behaviorSocialSubTab.value = 'status'
  resetBehaviorSocialCustomInputs()
  resetBehaviorSocialTagSelection()
  syncBehaviorSocialDraftCats()
  careChecklistDraft.value = {
    date: getTodayString(),
    water: false, litter: false, food: false, observe: false, play: false, meds: false, note: ''
  }
  weightLogDraft.value = { date: getTodayString(), weight: '', note: '' }
  syncTargetWeightInput()
})

watch(
  () => cats.value.length,
  () => {
    syncBehaviorSocialDraftCats()
    behaviorSocialSubTab.value = 'status'
  }
)

watch(
  () => currentTab.value,
  (tab) => {
    if (tab !== 'docs') activeCareModule.value = ''
    if (tab === 'docs' && currentCat.value) ensureCareData(currentCat.value)
    if (tab === 'care') {
      ensureCareMaintenanceState(true)
      startCarePoll()
      careMaintenanceEditMode.value = false
      careMaintenanceCustomModalOpen.value = false
    }
    if (tab !== 'care') {
      stopCarePoll()
      careMaintenanceEditMode.value = false
      careMaintenanceCustomModalOpen.value = false
      closeCareMaintenanceEditModal()
      closeCareMaintenanceDateModal()
      closeCareMaintenanceDeleteConfirm()
    }
    if (tab === 'stats') {
      behaviorSocialDraft.value.date = getTodayString()
      syncBehaviorSocialDraftCats()
    }
  }
)

const currentTheme = computed(() => {
  const key = currentCat.value ? resolveCatThemeColor(currentCat.value.color) : 'morandiPink'
  return themeColors[key]
})

const themePageStyle = computed(() => {
  const t = currentTheme.value
  const bg = currentCat.value ? t.bgHex : '#f8fafc'
  return {
    backgroundColor: bg,
    '--theme-primary': t.primaryHex,
    '--theme-bg': t.bgHex,
    '--theme-border': t.borderHex,
    '--theme-accent-bg': t.accentBgHex,
    '--theme-accent-bg-strong': t.accentBgStrongHex,
    '--theme-accent-border': t.accentBorderHex,
    '--theme-accent-text': t.accentTextHex,
    '--theme-panel-bg': t.panelBgHex,
    '--theme-divider': t.dividerHex,
    '--theme-gradient': t.gradient
  }
})

const activeDiet = computed(() => {
  if (!currentCat.value) return createEmptyDietDay()
  const dateKey = selectedDate.value
  if (!currentCat.value.dietHistory[dateKey]) {
    currentCat.value.dietHistory[dateKey] = createEmptyDietDay()
  }
  migrateDayToMeals(currentCat.value.dietHistory[dateKey], dateKey)
  return currentCat.value.dietHistory[dateKey]
})

const activeMealSlot = computed(() => {
  const id = activeMealId.value
  if (!id) return null
  const entry = activeDiet.value?.mealEntries?.find(e => e.id === id)
  if (!entry) return null
  ensureMealEntry(entry, selectedDate.value)
  return entry
})

// 9項「食物/項目」下拉選擇：用 mealEntry.foodType 作為目前編輯類型
const activeFoodType = computed({
  get: () => activeMealSlot.value?.foodType || '乾糧',
  set: (val) => {
    if (!activeMealSlot.value) return
    const t = String(val || '').trim()
    if (!t || t === activeMealSlot.value.foodType) return
    switchMealFoodType(activeMealSlot.value, t)
  }
})

const activeMealDatePart = computed({
  get: () => String(activeMealSlot.value?.at || '').slice(0, 10) || selectedDate.value,
  set: (datePart) => {
    if (!activeMealSlot.value) return
    const d = String(datePart || '').slice(0, 10) || selectedDate.value
    const t = String(activeMealSlot.value.at || '').slice(11, 16) || '12:00'
    activeMealSlot.value.at = `${d}T${t}`
  }
})

const activeMealTimePart = computed({
  get: () => String(activeMealSlot.value?.at || '').slice(11, 16) || '12:00',
  set: (timePart) => {
    if (!activeMealSlot.value) return
    const d = String(activeMealSlot.value.at || '').slice(0, 10) || selectedDate.value
    const t = String(timePart || '').slice(0, 5) || '12:00'
    activeMealSlot.value.at = `${d}T${t}`
  }
})

watch(cats, () => {
  scheduleAppSyncPush()
  scheduleMirrorToLocalStorage()
}, { deep: true })
watch(handoverSheet, () => {
  scheduleAppSyncPush()
  scheduleMirrorToLocalStorage()
}, { deep: true })
watch(currentCatIndex, () => {
  scheduleAppSyncPush()
  syncWaterDraftFromSaved()
  syncActiveMealIdForDay()
  syncActiveMedicalIdForDay()
})
watch(selectedDate, () => {
  syncWaterDraftFromSaved()
  syncActiveMealIdForDay()
  syncActiveMedicalIdForDay()
})

watch(activeMealId, (newId, oldId) => {
  if (oldId && activeDiet.value?.mealEntries) {
    const prev = activeDiet.value.mealEntries.find(e => e.id === oldId)
    if (prev) stashActiveFoodFields(prev)
  }
  const slot = activeDiet.value?.mealEntries?.find(e => e.id === newId)
  if (!slot) return
  ensureMealEntry(slot, selectedDate.value)
  const ft = slot.foodType || '乾糧'
  clearDryFlatFields(slot)
  clearWetFlatFields(slot)
  clearSupplementFlatFields(slot)
  clearTreatsFlatFields(slot)
  if (isDryFoodType(ft)) loadDryFromCategory(slot, ft)
  else if (isWetFoodType(ft)) loadWetFromCategory(slot, ft)
  else if (ft === '保健品') loadSupplementsToFlat(slot)
  else if (ft === '零食') loadTreatsToFlat(slot)
})

const showEditModal = ref(false)
const editPhotoInput = ref(null)
const editPhoto = ref('')
const editName = ref('')
const editColor = ref('morandiPink')
const editBreed = ref('')
const editGender = ref('男')
const editWeight = ref('')
const editBirthYearMonth = ref('')
const editBirthDay = ref('')
const editNeutered = ref(true)
const editNotes = ref('')
const editFormError = ref('')

const showAddCatModal = ref(false)
const newCatPhotoInput = ref(null)
const newCatPhoto = ref('')
const newCatName = ref('')
const newCatBreed = ref('')
const newCatGender = ref('女')
const newCatWeight = ref('')
const newCatBirthYearMonth = ref('')
const newCatBirthDay = ref('')
const newCatNeutered = ref(true)
const newCatNotes = ref('')
const newCatColor = ref('morandiPink')
const newCatFormError = ref('')
const pendingNewCatId = ref('')
const imageUploadLoading = ref(false)

const parseBirthDayInput = (dayInput) => {
  const s = String(dayInput ?? '').trim()
  if (!s) return ''
  const num = parseInt(s, 10)
  if (Number.isNaN(num) || num < 1 || num > 31) return ''
  return String(num)
}

const buildBirthdayFromParts = (yearMonth, dayInput) => {
  if (!yearMonth) return ''
  const day = parseBirthDayInput(dayInput)
  if (!day) return yearMonth
  return `${yearMonth}-${day.padStart(2, '0')}`
}

const splitBirthdayToParts = (birthdayYmd) => {
  if (!birthdayYmd) return { yearMonth: '', day: '' }
  const parts = String(birthdayYmd).trim().split('-')
  if (parts.length < 2) return { yearMonth: '', day: '' }
  if (parts.length === 2) return { yearMonth: `${parts[0]}-${parts[1]}`, day: '' }
  const dayNum = Number(parts[2])
  return {
    yearMonth: `${parts[0]}-${parts[1]}`,
    day: dayNum > 0 ? String(dayNum) : ''
  }
}

const newCatBirthdayCombined = computed(() =>
  buildBirthdayFromParts(newCatBirthYearMonth.value, newCatBirthDay.value)
)

const editBirthdayCombined = computed(() =>
  buildBirthdayFromParts(editBirthYearMonth.value, editBirthDay.value)
)

const isAppModalOpen = computed(() => {
  if (showAddCatModal.value || showPrefModal.value) return true
  if (showExcretionModal.value || showRemindersModal.value || showBookingModal.value) return true
  if (showEditModal.value) return true
  if (activeCareModule.value) return true
  if (careMaintenanceEditModalOpen.value || careMaintenanceDeleteModalOpen.value) return true
  if (careMaintenanceDateModalOpen.value) return true
  return false
})

const themeColorKeys = Object.keys(themeColors)

const resetNewCatForm = () => {
  pendingNewCatId.value = safeUUID()
  newCatPhoto.value = ''
  newCatName.value = ''
  newCatBreed.value = ''
  newCatGender.value = '女'
  newCatWeight.value = ''
  newCatBirthYearMonth.value = ''
  newCatBirthDay.value = ''
  newCatNeutered.value = true
  newCatNotes.value = ''
  newCatColor.value = 'morandiPink'
  newCatFormError.value = ''
  if (newCatPhotoInput.value) newCatPhotoInput.value.value = ''
}

const openAddCatModal = () => {
  resetNewCatForm()
  showAddCatModal.value = true
}

const closeAddCatModal = () => {
  showAddCatModal.value = false
  resetNewCatForm()
}

const clearNewCatPhoto = () => {
  newCatPhoto.value = ''
  if (newCatPhotoInput.value) newCatPhotoInput.value.value = ''
}

const onNewCatPhotoSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!pendingNewCatId.value) pendingNewCatId.value = safeUUID()
  newCatFormError.value = ''
  imageUploadLoading.value = true
  try {
    const { url } = await handleImageUpload({
      file,
      type: 'avatar',
      catId: pendingNewCatId.value,
      dateKey: getTodayString(),
    })
    newCatPhoto.value = url
  } catch (err) {
    newCatFormError.value = err.message || '圖片上傳失敗'
    e.target.value = ''
  } finally {
    imageUploadLoading.value = false
  }
}

const onEditPhotoSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!currentCat.value?.id) {
    editFormError.value = '請先選擇貓咪'
    e.target.value = ''
    return
  }
  editFormError.value = ''
  imageUploadLoading.value = true
  try {
    const { url } = await handleImageUpload({
      file,
      type: 'avatar',
      catId: currentCat.value.id,
      dateKey: getTodayString(),
    })
    editPhoto.value = url
    currentCat.value.photo = url
    persistCats()
  } catch (err) {
    editFormError.value = err.message || '圖片上傳失敗'
    e.target.value = ''
  } finally {
    imageUploadLoading.value = false
  }
}

const clearEditPhoto = () => {
  editPhoto.value = ''
  if (editPhotoInput.value) editPhotoInput.value.value = ''
}

const closeEditModal = () => {
  showEditModal.value = false
  editFormError.value = ''
}

const toggleHeaderSettingsMenu = () => {
  showHeaderSettingsMenu.value = !showHeaderSettingsMenu.value
}

const closeHeaderSettingsMenu = () => {
  showHeaderSettingsMenu.value = false
}

const switchCat = (index) => {
  if (index === currentCatIndex.value) return
  closeHeaderSettingsMenu()
  currentCatIndex.value = index
  currentTab.value = 'home'
  initializeUser({ reason: 'switch-cat' })
  setStorage('meow_currentCatIndex_v30', currentCatIndex.value)
}

const addWater = (forDate = null) => {
  addWaterIncrement(forDate, 20)
}

const renewEvent = (event) => {
  if (!hasMilestoneDate(event?.nextDate)) {
    openEditRemindersModal()
    return
  }
  const raw = String(event.nextDate || '').trim()
  const dateKey = raw.slice(0, 10)
  const timePart = raw.length > 10 ? raw.slice(10).trim() : ''
  const current = parseYmd(dateKey) || new Date()
  if (Number.isNaN(current.getTime())) return
  const n = Math.max(1, parseInt(String(event.periodValue ?? 1), 10) || 1)
  if (event.periodType === 'day') current.setDate(current.getDate() + n)
  else if (event.periodType === 'week') current.setDate(current.getDate() + n * 7)
  else if (event.periodType === 'month') current.setMonth(current.getMonth() + n)
  else if (event.periodType === 'year') current.setFullYear(current.getFullYear() + n)
  const nextDateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
  event.nextDate = timePart ? `${nextDateKey} ${timePart}` : nextDateKey
  persistCats()
}

const restoreDefaultReminders = () => {
  if (!currentCat.value) return
  currentCat.value.reminders = JSON.parse(JSON.stringify(buildDefaultReminders()))
  persistCats()
}

const addReminderFromCatalog = (catalogItem) => {
  remindersModalError.value = ''
  if (!catalogItem) return
  const placeholderIdx = editReminders.value.findIndex(
    r => (r.catalogId || r.id) === catalogItem.id && isReminderPlaceholder(r)
  )
  if (placeholderIdx >= 0) {
    editReminders.value[placeholderIdx] = {
      ...editReminders.value[placeholderIdx],
      title: catalogItem.title,
      category: catalogItem.category,
      periodType: catalogItem.periodType,
      periodValue: catalogItem.periodValue,
      isPlaceholder: false,
      userConfigured: false,
      ...(catalogItem.isBath ? { isBath: true, pinTop: true } : {}),
    }
    return
  }
  const exists = editReminders.value.some(
    r => (r.catalogId || r.id) === catalogItem.id && !isReminderPlaceholder(r)
  )
  if (exists) {
    remindersModalError.value = '此範本已在清單中'
    return
  }
  editReminders.value.push({
    id: catalogItem.id,
    catalogId: catalogItem.id,
    icon: catalogItem.icon,
    title: catalogItem.title,
    category: catalogItem.category,
    nextDate: '',
    periodType: catalogItem.periodType,
    periodValue: catalogItem.periodValue,
    isPlaceholder: false,
    ...(catalogItem.isBath ? { isBath: true, pinTop: true } : {}),
  })
}

const addCustomReminderFromDraft = () => {
  remindersModalError.value = ''
  const d = newReminderDraft.value
  if (!d.title?.trim()) {
    remindersModalError.value = '請填寫事項名稱'
    return
  }
  if (!d.nextDate) {
    remindersModalError.value = '請選擇下次日期'
    return
  }
  editReminders.value.push({
    id: `custom-${safeUUID()}`,
    catalogId: 'custom',
    icon: String(d.icon || '📌').trim().slice(0, 4) || '📌',
    title: d.title.trim(),
    nextDate: d.nextDate,
    periodType: d.periodType || 'month',
    periodValue: Math.max(1, parseInt(String(d.periodValue ?? 1), 10) || 1)
  })
  newReminderDraft.value = createEmptyReminderDraft()
  showNewReminderForm.value = false
}

const removeEditReminder = (idx) => {
  editReminders.value.splice(idx, 1)
  if (editingReminderIdx.value === idx) editingReminderIdx.value = null
  else if (editingReminderIdx.value != null && editingReminderIdx.value > idx) {
    editingReminderIdx.value -= 1
  }
}

const closeRemindersModal = () => {
  showRemindersModal.value = false
  editingReminderIdx.value = null
  remindersModalError.value = ''
  showNewReminderForm.value = false
  newReminderDraft.value = createEmptyReminderDraft()
}

const openEditRemindersModal = () => {
  if (!currentCat.value) return
  editingReminderIdx.value = null
  remindersModalError.value = ''
  showNewReminderForm.value = false
  newReminderDraft.value = createEmptyReminderDraft()
  if (!hasValidReminders(currentCat.value.reminders)) {
    currentCat.value.reminders = JSON.parse(JSON.stringify(buildNewCatReminders()))
  }
  editReminders.value = JSON.parse(JSON.stringify(currentCat.value.reminders))
  editReminders.value.forEach(r => {
    if (!r.periodType) r.periodType = 'month'
    if (!r.periodValue) r.periodValue = 1
  })
  showRemindersModal.value = true
}

const saveRemindersOnly = () => {
  if (!currentCat.value) return
  remindersModalError.value = ''
  const cleaned = editReminders.value.map(r => ({
    ...r,
    title: String(r.title || '').trim(),
    nextDate: String(r.nextDate || '').trim(),
    periodType: r.periodType || 'month',
    periodValue: Math.max(1, parseInt(String(r.periodValue ?? 1), 10) || 1),
    isPlaceholder: isReminderPlaceholder(r),
  }))
  if (cleaned.some(r => r.title && !hasMilestoneDate(r.nextDate))) {
    remindersModalError.value = '已填寫名稱的項目請設定下次日期'
    return
  }
  currentCat.value.reminders = cleaned.map(r => ({
    ...r,
    isPlaceholder: !r.title || !hasMilestoneDate(r.nextDate),
    userConfigured: !!(r.title && hasMilestoneDate(r.nextDate)),
  }))
  persistCats()
  editingReminderIdx.value = null
  closeRemindersModal()
}
const openEditProfile = () => {
  if (!currentCat.value) return
  const cat = currentCat.value
  editFormError.value = ''
  editPhoto.value = cat.photo || ''
  editName.value = cat.name || ''
  editBreed.value = cat.breed || ''
  editGender.value = cat.gender || '女'
  editWeight.value = cat.weight != null ? String(cat.weight) : ''
  editNeutered.value = cat.neutered !== undefined ? cat.neutered : true
  editNotes.value = cat.notes || ''
  editColor.value = resolveCatThemeColor(cat.color)
  if (cat.birthday) {
    const { yearMonth, day } = splitBirthdayToParts(cat.birthday)
    editBirthYearMonth.value = yearMonth
    editBirthDay.value = day
  } else {
    editBirthYearMonth.value = ''
    editBirthDay.value = ''
  }
  if (editPhotoInput.value) editPhotoInput.value.value = ''
  showEditModal.value = true
}
const saveProfile = () => {
  if (!currentCat.value) return
  editFormError.value = ''
  const name = editName.value.trim()
  const weight = Number(editWeight.value)
  if (!name) {
    editFormError.value = '請填寫貓貓名稱'
    return
  }
  if (!editWeight.value || Number.isNaN(weight) || weight <= 0) {
    editFormError.value = '請填寫有效體重 (kg)'
    return
  }
  currentCat.value.name = name
  currentCat.value.photo = editPhoto.value || ''
  currentCat.value.breed = editBreed.value.trim()
  currentCat.value.weight = weight
  currentCat.value.birthday = editBirthdayCombined.value
  currentCat.value.gender = editGender.value
  currentCat.value.neutered = editNeutered.value
  currentCat.value.notes = editNotes.value.trim()
  currentCat.value.color = resolveCatThemeColor(editColor.value)
  if (Array.isArray(currentCat.value.reminders)) {
    currentCat.value.reminders = currentCat.value.reminders.filter(r => !r?.isBirthday)
  }
  persistCats()
  closeEditModal()
}
const deleteCat = async () => {
  if (!currentCat.value) return
  if (!confirm(`確定永久刪除 ${currentCat.value.name}？`)) return

  const deletedId = currentCat.value.id
  const deletedIndex = currentCatIndex.value

  pauseAllRemoteSync()
  try {
    closeEditModal()
    cats.value.splice(deletedIndex, 1)
    clampCurrentCatIndex()

    await deleteRemoteInventoryByCatId(deletedId)
    purgeCatDataById(deletedId)

    if (!cats.value.length) {
      clearAllLocalCache()
      resetGlobalRecordsLocal({ clearCats: true })
      await persistFreshStartToRemote()
    } else {
      purgeOrphanedRemoteData()
      resetSessionUiState({ keepTab: true })
      ensureCareMaintenanceState(true)
      await persistAllRemoteState({ force: true })
    }
  } finally {
    resumeAllRemoteSync()
  }
}
const addNewCat = async () => {
  newCatFormError.value = ''
  const name = newCatName.value.trim()
  const weight = Number(newCatWeight.value)
  if (!name) {
    newCatFormError.value = '請填寫貓貓名稱'
    return
  }
  if (!newCatWeight.value || Number.isNaN(weight) || weight <= 0) {
    newCatFormError.value = '請填寫有效體重 (kg)'
    return
  }
  const birthday = newCatBirthdayCombined.value
  const color = resolveCatThemeColor(newCatColor.value)

  pauseAllRemoteSync()
  try {
    const newCat = {
      id: pendingNewCatId.value || safeUUID(),
      name,
      photo: newCatPhoto.value || '',
      breed: newCatBreed.value.trim(),
      notes: newCatNotes.value.trim(),
      weight,
      birthday,
      gender: newCatGender.value,
      neutered: newCatNeutered.value,
      color,
    }
    initializeNewCat(newCat)
    cats.value.push(newCat)
    currentCatIndex.value = cats.value.length - 1

    if (cats.value.length === 1) {
      resetGlobalRecordsLocal({ clearCats: false })
      await persistFreshStartToRemote()
    }

    await persistAllRemoteState({ force: true })
  } finally {
    resumeAllRemoteSync()
  }

  resetSessionUiState({ keepTab: false })
  closeAddCatModal()
}
</script>

<style>
@import url('https://fonts.cdnfonts.com/css/garet');

.app-header-brand {
  font-family: 'Garet', sans-serif;
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fff;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.app-header-tagline {
  margin: 0.3rem 0 0;
  font-size: 0.5625rem;
  font-weight: 600;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.9);
}

/* 貓貓主題色：由 themePageStyle 注入 CSS 變數 */
.theme-section {
  background-color: #fff;
  border: 1px solid var(--theme-border);
}
.theme-section-soft {
  background-color: color-mix(in srgb, var(--theme-bg) 35%, #fff);
  border: 1px solid var(--theme-border);
}
.theme-accent-bg { background-color: var(--theme-accent-bg); }
.theme-accent-bg-strong { background-color: var(--theme-accent-bg-strong); }
.theme-accent-border { border-color: var(--theme-accent-border); }
.theme-accent-text { color: var(--theme-accent-text); }
.theme-divider { border-color: var(--theme-divider); }
.theme-chip-btn {
  color: var(--theme-accent-text);
  background-color: var(--theme-accent-bg);
  transition: background-color 0.2s, color 0.2s;
}
.theme-chip-btn:hover { background-color: var(--theme-accent-bg-strong); }
.theme-btn-primary {
  background-color: var(--theme-primary);
  border-color: var(--theme-primary);
  color: #fff;
  transition: filter 0.2s;
}
.theme-btn-primary:hover { filter: brightness(0.92); }
.theme-btn-outline {
  color: var(--theme-accent-text);
  border: 1px solid var(--theme-accent-border);
  background-color: #fff;
  transition: background-color 0.2s;
}
.theme-btn-outline:hover { background-color: var(--theme-accent-bg); }
.theme-panel {
  border: 2px solid var(--theme-accent-border);
  background: linear-gradient(to bottom, var(--theme-panel-bg), #fff);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--theme-accent-border) 25%, transparent);
}
.theme-panel-dashed {
  border: 2px dashed var(--theme-accent-border);
  background-color: var(--theme-accent-bg);
}
.theme-input-border { border-color: var(--theme-accent-border); }
.theme-gradient-btn {
  background: var(--theme-gradient);
  color: #fff;
}
.theme-gradient-btn:hover { filter: brightness(0.95); }
.theme-selected-chip {
  background-color: var(--theme-primary);
  border-color: var(--theme-primary);
  color: #fff;
}
.theme-selected-chip-muted {
  background-color: var(--theme-accent-bg-strong);
  border-color: var(--theme-accent-border);
  color: var(--theme-accent-text);
}

.care-module-tile {
  border: 2px solid var(--theme-accent-border);
  background: linear-gradient(145deg, color-mix(in srgb, var(--theme-accent-bg) 85%, #fff), #fff);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--theme-accent-border) 22%, transparent);
}
.care-module-tile:hover {
  background: linear-gradient(145deg, color-mix(in srgb, var(--theme-accent-bg-strong) 75%, #fff), #fff);
}
.care-module-shell {
  background: linear-gradient(165deg, color-mix(in srgb, var(--theme-accent-bg) 55%, #fff) 0%, #fff 48%);
  border: 1px solid var(--theme-border);
  box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--theme-primary) 16%, transparent);
}
.care-module-content input:not([type="checkbox"]):not([type="radio"]),
.care-module-content select,
.care-module-content textarea {
  background-color: var(--theme-accent-bg) !important;
  border: 1px solid var(--theme-accent-border) !important;
}
.care-module-content label.flex.items-center.gap-1\.5 {
  background-color: var(--theme-accent-bg);
  border-color: var(--theme-accent-border);
}
.care-module-content .rounded-xl.border.p-2\.5,
.care-module-content .rounded-xl.border.p-3,
.care-module-content [class*="bg-slate-50/"] {
  background-color: color-mix(in srgb, var(--theme-accent-bg) 58%, #fff) !important;
  border-color: var(--theme-accent-border) !important;
}
.care-module-content [class*="border-dashed"][class*="border-slate"] {
  border-color: var(--theme-accent-border) !important;
  background-color: color-mix(in srgb, var(--theme-accent-bg) 32%, #fff) !important;
}
.care-module-content div.bg-slate-50.rounded-lg,
.care-module-content div.text-\[10px\].font-bold.text-slate-700.bg-slate-50 {
  background-color: var(--theme-accent-bg) !important;
  border: 1px solid color-mix(in srgb, var(--theme-accent-border) 45%, transparent);
}
.care-module-content .bg-emerald-50\/50,
.care-module-content .bg-sky-50\/50,
.care-module-content .bg-amber-50\/50 {
  background-color: color-mix(in srgb, var(--theme-accent-bg) 70%, #fff) !important;
  border: 1px solid var(--theme-accent-border) !important;
}
.care-module-content .border-amber-300.bg-amber-50\/60 {
  background-color: color-mix(in srgb, #fef3c7 55%, var(--theme-accent-bg)) !important;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.modal-header-title {
  margin-bottom: 0.5rem;
}

/* 全 App 響應式彈窗：手機全螢幕 + 可捲動內容 + 底部固定按鈕 */
.app-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  overflow: hidden;
}
.app-modal-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  text-align: left;
  animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@media (max-width: 639px) {
  .app-modal-overlay {
    padding: 0;
  }
  .app-modal-panel {
    height: 100%;
    max-height: 100%;
    border-radius: 0;
    padding-top: env(safe-area-inset-top, 0px);
  }
}
@media (min-width: 640px) {
  .app-modal-overlay {
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .app-modal-panel {
    max-height: min(92vh, calc(100% - 2rem));
    border-radius: 1.75rem;
  }
  .app-modal-panel--xs { max-width: 20rem; }
  .app-modal-panel--sm { max-width: 24rem; }
  .app-modal-panel--md { max-width: 28rem; }
}
.app-modal-header {
  flex-shrink: 0;
  padding: 1.25rem 1.25rem 0.5rem;
}
.app-modal-header .modal-header {
  margin-bottom: 0;
}
.app-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 0.25rem 1.25rem 1rem;
}
.app-modal-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid #f1f5f9;
  background: #fff;
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.06);
}
@media (min-width: 640px) {
  .app-modal-footer {
    flex-direction: row;
    gap: 0.5rem;
    box-shadow: none;
  }
}
.app-modal-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 800;
  line-height: 1.2;
}
@media (min-width: 640px) {
  .app-modal-btn {
    flex: 1 1 0%;
    width: auto;
    padding: 0.625rem 1rem;
  }
}
.app-modal-btn--secondary {
  color: var(--theme-accent-text, #be123c);
  background: #fff;
  border: 1px solid var(--theme-accent-border, #fecdd3);
}
.app-modal-btn--ghost {
  color: #94a3b8;
  background: transparent;
  border: none;
  font-weight: 700;
}
.app-modal-btn--primary {
  color: #fff;
  background-color: var(--theme-primary, #be123c);
  border: 1px solid var(--theme-primary, #be123c);
}
.app-modal-btn--dark {
  color: #fff;
  background: #0f172a;
  border: none;
  font-weight: 700;
}
.app-modal-btn--slate {
  color: #fff;
  background: #1e293b;
  border: none;
}
@media (min-width: 640px) {
  .app-modal-btn--grow {
    flex: 1.4 1 0%;
  }
}

/* 喜好按鈕顯示位：text-xs 細 30%（彈窗選項唔改） */
.text-pref-display {
  font-size: calc(0.75rem * 0.7);
  line-height: 1.15;
}

.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
.fade-splash-leave-active { transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1); }
.fade-splash-leave-to { opacity: 0; backdrop-filter: blur(10px); transform: scale(1.05); }

.home-hero { isolation: isolate; }
.home-stat-card:active { transform: translateY(0); }
.home-milestone-row:last-child { margin-bottom: 0; }

.home-today-date-underline {
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--theme-accent-border) 18%,
    var(--theme-primary) 50%,
    var(--theme-accent-border) 82%,
    transparent 100%
  );
  opacity: 0.55;
}

.home-status-badge {
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
}

/* 警示閃爍：只動邊框光暈，不降低文字透明度（避免 iOS 上 animate-pulse 令文字消失） */
.attention-pulse {
  animation: attention-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes attention-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.45);
    border-color: #fda4af;
  }
  50% {
    box-shadow: 0 0 0 5px rgba(244, 63, 94, 0);
    border-color: #f43f5e;
  }
}

.home-cat-panel {
  animation: home-cat-in 0.22s ease-out;
}
@keyframes home-cat-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.behavior-intimacy-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 0.4rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, #cbd5e1 0%, var(--theme-primary) 100%);
  outline: none;
}
.behavior-intimacy-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid var(--theme-primary);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.15);
  cursor: pointer;
}
.behavior-intimacy-slider::-moz-range-thumb {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid var(--theme-primary);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.15);
  cursor: pointer;
}
.behavior-intimacy-slider--readonly {
  opacity: 0.92;
  pointer-events: none;
}
.behavior-intimacy-slider--readonly::-webkit-slider-thumb {
  cursor: default;
}
.behavior-intimacy-slider--readonly::-moz-range-thumb {
  cursor: default;
}

@keyframes behavior-tag-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-1.25deg); }
  75% { transform: rotate(1.25deg); }
}
.behavior-tag-chip--editing {
  animation: behavior-tag-wiggle 0.4s ease-in-out infinite;
  border-color: rgba(244, 63, 94, 0.45) !important;
  box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.2);
}

/* 體重追蹤：溫馨粉／藍灰圓角 */
.weight-track-hero {
  background: linear-gradient(135deg, #fdf2f8 0%, #f1f5f9 55%, #eef2ff 100%);
  border: 1px solid #e8d8e4;
  box-shadow: 0 4px 14px rgba(148, 163, 184, 0.12);
}
.weight-track-metric {
  background: linear-gradient(160deg, #fff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(148, 163, 184, 0.08);
}
.weight-track-alert-warn {
  background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fcd34d;
}
.weight-track-alert-danger {
  background: linear-gradient(160deg, #fff1f2 0%, #ffe4e6 100%);
  border-color: #fda4af;
}
.weight-track-input-card {
  background: linear-gradient(180deg, #fdf2f8 0%, #f8fafc 100%);
  border: 1px solid #e8d8e4;
}
.weight-track-field {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e2e8f0;
  color: #334155;
}
.weight-track-field:focus {
  outline: none;
  border-color: #cbd5e1;
  box-shadow: 0 0 0 2px rgba(203, 213, 225, 0.45);
}
.weight-track-ideal-input {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.1rem 0.25rem;
  font-size: 9px;
  font-weight: 800;
  color: #475569;
}
.weight-track-ideal-input:focus {
  outline: none;
  border-color: #cbd5e1;
}
.weight-track-submit-btn {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  box-shadow: 0 3px 10px rgba(100, 116, 139, 0.25);
}
.weight-track-submit-btn:hover {
  filter: brightness(0.96);
}
.weight-track-outline-btn {
  color: #64748b;
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.9);
}
.weight-track-empty {
  background: linear-gradient(180deg, #f8fafc 0%, #fdf2f8 100%);
  border: 1px dashed #cbd5e1;
}
.weight-track-history-card {
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(148, 163, 184, 0.06);
}
.weight-track-progress-track {
  background: #e2e8f0;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.06);
}
.weight-track-zone-under {
  width: 28%;
  background: linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%);
}
.weight-track-zone-standard {
  background: linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%);
}
.weight-track-zone-over {
  background: linear-gradient(90deg, #fde68a 0%, #fcd34d 100%);
}

/* Pull-to-refresh（手機） */
.ptr-indicator {
  position: fixed;
  inset: 0;
  z-index: 180;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: opacity 0.2s ease, background 0.25s ease;
}
.ptr-indicator--busy {
  background: rgba(248, 250, 252, 0.62);
  backdrop-filter: blur(3px);
}
.ptr-indicator__pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(10px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.ptr-indicator__pill--ready {
  border-color: color-mix(in srgb, var(--theme-primary, #64748b) 45%, #cbd5e1);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--theme-primary, #64748b) 16%, transparent);
}
.ptr-indicator__pill--loading {
  border-color: color-mix(in srgb, var(--theme-primary, #64748b) 55%, #cbd5e1);
  padding: 12px 22px;
  transform: scale(1.02);
}
.ptr-indicator__pill--success {
  border-color: #86efac;
  background: rgba(240, 253, 244, 0.98);
  padding: 12px 22px;
  box-shadow: 0 8px 28px rgba(22, 163, 74, 0.15);
}
.ptr-indicator__check {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  color: #16a34a;
  flex-shrink: 0;
}
.ptr-indicator__spinner {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid #e2e8f0;
  border-top-color: var(--theme-primary, #64748b);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.ptr-indicator__spinner--spin {
  animation: ptr-spin 0.65s linear infinite;
}
.ptr-indicator__text {
  font-size: 11px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.ptr-scroll {
  transition: transform 0.22s ease;
  will-change: transform;
  max-width: 100%;
  overflow-x: clip;
}
.ptr-scroll--refreshing {
  transition: transform 0.28s ease;
}
@keyframes ptr-spin {
  to { transform: rotate(360deg); }
}

/* 日期/時間並排：Flex 50/50 + iOS 原生欄位防溢出 */
.datetime-input-group {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.375rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
.datetime-input-group__cell {
  flex: 0 0 calc(50% - 0.1875rem);
  width: calc(50% - 0.1875rem);
  min-width: 0;
  max-width: calc(50% - 0.1875rem);
  overflow: hidden;
  box-sizing: border-box;
}
.datetime-input-group__label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 10px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.date-field-shell {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.datetime-field,
.datetime-input-group input[type="date"],
.datetime-input-group input[type="time"],
.datetime-input-group input[type="datetime-local"],
.datetime-input-group input[type="text"] {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin: 0;
  padding: 0.4375rem 0.125rem;
  font-size: 11px;
  line-height: 1.2;
  border-radius: 0.625rem;
  -webkit-appearance: none;
  appearance: none;
  -webkit-min-logical-width: 0;
}
.datetime-field--block {
  padding: 0.5rem 0.5rem;
  font-size: 12px;
}
@media (min-width: 768px) {
  .datetime-input-group {
    gap: 0.625rem;
  }
  .datetime-input-group__cell {
    flex-basis: calc(50% - 0.3125rem);
    width: calc(50% - 0.3125rem);
    max-width: calc(50% - 0.3125rem);
  }
  .datetime-field,
  .datetime-input-group input[type="date"],
  .datetime-input-group input[type="time"],
  .datetime-input-group input[type="datetime-local"],
  .datetime-input-group input[type="text"] {
    padding: 0.5rem 0.5rem;
    font-size: 12px;
    border-radius: 0.75rem;
  }
  .datetime-field--block {
    padding: 0.625rem 0.75rem;
  }
}
.datetime-field[type="date"]::-webkit-date-and-time-value,
.datetime-field[type="time"]::-webkit-date-and-time-value,
.datetime-input-group input[type="date"]::-webkit-date-and-time-value,
.datetime-input-group input[type="time"]::-webkit-date-and-time-value {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  margin: 0;
  padding: 0;
}
.datetime-field[type="date"]::-webkit-datetime-edit,
.datetime-field[type="time"]::-webkit-datetime-edit,
.datetime-input-group input[type="date"]::-webkit-datetime-edit,
.datetime-input-group input[type="time"]::-webkit-datetime-edit {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
}
.datetime-field[type="date"]::-webkit-datetime-edit-fields-wrapper,
.datetime-field[type="time"]::-webkit-datetime-edit-fields-wrapper,
.datetime-input-group input[type="date"]::-webkit-datetime-edit-fields-wrapper,
.datetime-input-group input[type="time"]::-webkit-datetime-edit-fields-wrapper {
  min-width: 0;
  max-width: 100%;
  padding: 0;
}
.datetime-field[type="date"]::-webkit-datetime-edit-year-field,
.datetime-field[type="date"]::-webkit-datetime-edit-month-field,
.datetime-field[type="date"]::-webkit-datetime-edit-day-field,
.datetime-field[type="time"]::-webkit-datetime-edit-hour-field,
.datetime-field[type="time"]::-webkit-datetime-edit-minute-field,
.datetime-field[type="time"]::-webkit-datetime-edit-ampm-field,
.datetime-input-group input[type="date"]::-webkit-datetime-edit-year-field,
.datetime-input-group input[type="date"]::-webkit-datetime-edit-month-field,
.datetime-input-group input[type="date"]::-webkit-datetime-edit-day-field,
.datetime-input-group input[type="time"]::-webkit-datetime-edit-hour-field,
.datetime-input-group input[type="time"]::-webkit-datetime-edit-minute-field,
.datetime-input-group input[type="time"]::-webkit-datetime-edit-ampm-field {
  padding: 0;
}
.datetime-field[type="date"]::-webkit-calendar-picker-indicator,
.datetime-field[type="time"]::-webkit-calendar-picker-indicator,
.datetime-input-group input[type="date"]::-webkit-calendar-picker-indicator,
.datetime-input-group input[type="time"]::-webkit-calendar-picker-indicator {
  margin: 0 0 0 2px;
  padding: 0;
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0.75;
  flex-shrink: 0;
}

</style>
