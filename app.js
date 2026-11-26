/**
 * Hisaab - Progressive Web App for Flatmate Expenses & Splitwise Sync
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'hisaab_data_v1';
  const LEGACY_STORAGE_KEY = 'flatsplit_data_v1';

  const DEFAULT_CATEGORIES = [
    { id: 'society', name: 'Society Dues', icon: 'building' },
    { id: 'electricity', name: 'Electricity Bill', icon: 'zap' },
    { id: 'maid', name: 'Maid', icon: 'sparkles' },
    { id: 'cook', name: 'Cook', icon: 'utensils' },
    { id: 'gas', name: 'Gas Cylinder', icon: 'flame' },
    { id: 'wifi', name: 'WiFi / Internet', icon: 'wifi' },
    { id: 'water', name: 'Water Cans', icon: 'droplet' },
    { id: 'groceries', name: 'Groceries / Blinkit', icon: 'shopping-cart' },
    { id: 'repair', name: 'Repairs & Maintenance', icon: 'tool' },
    { id: 'misc', name: 'Miscellaneous', icon: 'tag' }
  ];

  const DEFAULT_RECURRING_TEMPLATES = [
    { id: 't_society', title: 'Society Maintenance', category: 'Society Dues', defaultAmount: 2500, dayOfMonth: 1, defaultPaidBy: 'user', active: true },
    { id: 't_maid', title: 'Maid Salary', category: 'Maid', defaultAmount: 3000, dayOfMonth: 5, defaultPaidBy: 'user', active: true },
    { id: 't_cook', title: 'Cook Salary', category: 'Cook', defaultAmount: 4000, dayOfMonth: 5, defaultPaidBy: 'flatmate', active: true },
    { id: 't_wifi', title: 'WiFi / Broadband', category: 'WiFi / Internet', defaultAmount: 999, dayOfMonth: 10, defaultPaidBy: 'user', active: true },
    { id: 't_elec', title: 'Electricity Bill', category: 'Electricity Bill', defaultAmount: 1800, dayOfMonth: 18, defaultPaidBy: 'user', active: true },
    { id: 't_gas', title: 'Gas Cylinder', category: 'Gas Cylinder', defaultAmount: 950, dayOfMonth: 22, defaultPaidBy: 'flatmate', active: true }
  ];

  // --- Nordic Paper Chart Palette ---
  const CHART_PALETTE = ['#0f766e', '#d97706', '#2563eb', '#7c3aed', '#be123c', '#4b5563', '#059669'];

  // --- Initial State ---
  let state = {
    expenses: [],
    recurringTemplates: DEFAULT_RECURRING_TEMPLATES,
    processedRecurringMonths: {},
    dismissedRecurringBanners: {},
    skippedRecurring: {},
    settings: {
      userName: 'Shivam',
      flatmateName: 'Sanket',
      currency: '₹',
      theme: 'nordic-paper'
    },
    activeTab: 'expenses',
    currentMonth: getTodayMonthString(), // 'YYYY-MM'
    activeFilter: 'all', // 'all' | 'pending' | 'synced'
    splitwiseFilter: 'pending' // 'pending' | 'synced' | 'all'
  };

  function getThemeChartPalette() {
    return CHART_PALETTE;
  }

  function applyTheme() {
    document.documentElement.removeAttribute('data-theme');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#f6f4ee');
    state.settings.theme = 'nordic-paper';
  }

  function getTodayMonthString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Persistence ---
  function loadData() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        state = {
          ...state,
          ...parsed,
          settings: { ...state.settings, ...(parsed.settings || {}) },
          recurringTemplates: parsed.recurringTemplates || DEFAULT_RECURRING_TEMPLATES,
          skippedRecurring: parsed.skippedRecurring || {}
        };
        // Ensure each template has a valid dayOfMonth
        state.recurringTemplates.forEach(t => {
          if (!t.dayOfMonth) {
            if (t.id === 't_society') t.dayOfMonth = 1;
            else if (t.id === 't_maid' || t.id === 't_cook') t.dayOfMonth = 5;
            else if (t.id === 't_wifi') t.dayOfMonth = 10;
            else if (t.id === 't_elec') t.dayOfMonth = 18;
            else if (t.id === 't_gas') t.dayOfMonth = 22;
            else t.dayOfMonth = 1;
          }
        });
        state.settings.theme = 'nordic-paper';
      } else {
        // First run: load initial sample month data so the user sees immediate value
        seedInitialData();
      }
      applyTheme();
    } catch (e) {
      console.error('Failed to load data from storage:', e);
      applyTheme();
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        expenses: state.expenses,
        recurringTemplates: state.recurringTemplates,
        processedRecurringMonths: state.processedRecurringMonths,
        dismissedRecurringBanners: state.dismissedRecurringBanners,
        skippedRecurring: state.skippedRecurring || {},
        settings: state.settings
      }));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  function seedInitialData() {
    const curMonth = state.currentMonth;
    state.expenses = [
      {
        id: 'exp_1',
        title: 'Society Maintenance',
        amount: 2500,
        date: `${curMonth}-01`,
        month: curMonth,
        category: 'Society Dues',
        paidBy: 'user',
        split: 'equal',
        inSplitwise: true,
        isRecurring: true,
        notes: 'Monthly flat maintenance'
      },
      {
        id: 'exp_2',
        title: 'Electricity Bill',
        amount: 1780,
        date: `${curMonth}-03`,
        month: curMonth,
        category: 'Electricity Bill',
        paidBy: 'user',
        split: 'equal',
        inSplitwise: false,
        isRecurring: true,
        notes: 'October-November power bill'
      },
      {
        id: 'exp_3',
        title: 'Maid Salary',
        amount: 3000,
        date: `${curMonth}-05`,
        month: curMonth,
        category: 'Maid',
        paidBy: 'user',
        split: 'equal',
        inSplitwise: true,
        isRecurring: true,
        notes: 'Monthly cleaning'
      },
      {
        id: 'exp_4',
        title: 'Cook Salary',
        amount: 4000,
        date: `${curMonth}-05`,
        month: curMonth,
        category: 'Cook',
        paidBy: 'flatmate',
        split: 'equal',
        inSplitwise: false,
        isRecurring: true,
        notes: 'Monthly cooking charges'
      },
      {
        id: 'exp_5',
        title: 'Gas Cylinder',
        amount: 950,
        date: `${curMonth}-08`,
        month: curMonth,
        category: 'Gas Cylinder',
        paidBy: 'flatmate',
        split: 'equal',
        inSplitwise: false,
        isRecurring: true,
        notes: 'Indane 14.2kg'
      },
      {
        id: 'exp_6',
        title: 'Blinkit Cleaning & Snacks',
        amount: 640,
        date: `${curMonth}-08`,
        month: curMonth,
        category: 'Groceries / Blinkit',
        paidBy: 'user',
        split: 'equal',
        inSplitwise: false,
        isRecurring: false,
        notes: 'Detergent, trash bags & biscuits'
      },
      {
        id: 'exp_7',
        title: 'Zepto Daily Essentials',
        amount: 480,
        date: `${curMonth}-12`,
        month: curMonth,
        category: 'Groceries / Blinkit',
        paidBy: 'flatmate',
        split: 'equal',
        inSplitwise: false,
        isRecurring: false,
        notes: 'Eggs, bread, butter & curd'
      },
      {
        id: 'exp_8',
        title: 'Supermarket Groceries',
        amount: 1450,
        date: `${curMonth}-19`,
        month: curMonth,
        category: 'Groceries / Blinkit',
        paidBy: 'user',
        split: 'equal',
        inSplitwise: false,
        isRecurring: false,
        notes: 'Rice, oil, spices & pulses'
      },
      {
        id: 'exp_9',
        title: 'Fresh Vegetables & Milk',
        amount: 380,
        date: `${curMonth}-24`,
        month: curMonth,
        category: 'Groceries / Blinkit',
        paidBy: 'flatmate',
        split: 'equal',
        inSplitwise: false,
        isRecurring: false,
        notes: 'Local market weekly veggies'
      }
    ];
    state.processedRecurringMonths[curMonth] = true;
    saveData();
  }

  // --- SVG Icons Provider ---
  function getIconSvg(name, size = 18) {
    const icons = {
      'building': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="12"></line><line x1="15" y1="22" x2="15" y2="12"></line><line x1="12" y1="6" x2="12" y2="6.01"></line><line x1="16" y1="6" x2="16" y2="6.01"></line><line x1="8" y1="6" x2="8" y2="6.01"></line><line x1="12" y1="10" x2="12" y2="10.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line></svg>`,
      'zap': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
      'sparkles': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
      'utensils': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"></path><path d="M15 11v11"></path><path d="M5 2v4a3 3 0 0 0 3 3v13"></path></svg>`,
      'flame': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
      'wifi': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
      'droplet': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2.69 5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`,
      'shopping-cart': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>`,
      'tool': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.7 6.3 5 5-3.3 3.3a4.5 4.5 0 0 1-6.4 0l-3.3-3.3 5-5z"></path><path d="M7 10 3.3 13.7a4.5 4.5 0 0 0 0 6.4l.6.6a4.5 4.5 0 0 0 6.4 0L14 17"></path></svg>`,
      'tag': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>`,
      'check': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      'circle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
      'plus': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
      'chevron-left': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
      'chevron-right': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
      'copy': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
      'trash': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>`,
      'edit': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`
    };
    return icons[name] || icons['tag'];
  }

  function getCategoryIcon(catName) {
    const found = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === (catName || '').toLowerCase());
    return found ? found.icon : 'tag';
  }

  // --- Formatters ---
  function formatMoney(amount) {
    const num = Math.round(Number(amount) || 0);
    return state.settings.currency + ' ' + num.toLocaleString('en-IN');
  }

  function formatMonthName(monthStr) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  // --- Computations for Current Month ---
  function getMonthExpenses(monthKey = state.currentMonth) {
    return state.expenses.filter(e => e.month === monthKey);
  }

  function computeMonthStats(monthKey = state.currentMonth) {
    const expenses = getMonthExpenses(monthKey);
    let totalSpend = 0;
    let userPaid = 0;
    let flatmatePaid = 0;
    let inSplitwiseCount = 0;
    let pendingSplitwiseCount = 0;
    let pendingSplitwiseAmount = 0;

    const categoryMap = {};

    expenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      totalSpend += amt;

      if (e.paidBy === 'user') {
        userPaid += amt;
      } else {
        flatmatePaid += amt;
      }

      if (e.inSplitwise) {
        inSplitwiseCount++;
      } else {
        pendingSplitwiseCount++;
        pendingSplitwiseAmount += amt;
      }

      const cat = e.category || 'Miscellaneous';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    });

    // Net balance calculation:
    // Split 50-50 assumption (or equal split)
    // Shivam owes 50% of total spend; Flatmate owes 50% of total spend.
    // Net: what Shivam paid minus Shivam's share
    const half = totalSpend / 2;
    const userBalance = userPaid - half;
    // userBalance > 0: Flatmate owes Shivam userBalance
    // userBalance < 0: Shivam owes Flatmate Math.abs(userBalance)

    // Category sorting
    const categoriesSorted = Object.keys(categoryMap).map(name => ({
      name,
      amount: categoryMap[name],
      percent: totalSpend > 0 ? Math.round((categoryMap[name] / totalSpend) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalSpend,
      userPaid,
      flatmatePaid,
      userBalance,
      inSplitwiseCount,
      pendingSplitwiseCount,
      pendingSplitwiseAmount,
      totalCount: expenses.length,
      categoriesSorted
    };
  }

  // --- Rendering UI ---
  function render() {
    renderMonthHeader();
    renderRecurringBanner();
    renderSummaryCard();
    renderExpensesView();
    renderSplitwiseView();
    renderAnalysisView();
    renderSettingsView();
    updateNavBadges();
  }

  function renderMonthHeader() {
    const labelEl = document.getElementById('currentMonthLabel');
    if (labelEl) {
      labelEl.textContent = formatMonthName(state.currentMonth);
    }
  }

  function renderRecurringBanner() {
    const bannerEl = document.getElementById('recurringPromptBanner');
    if (!bannerEl) return;

    const curMonth = state.currentMonth;
    const isProcessed = state.processedRecurringMonths[curMonth];
    const isDismissed = state.dismissedRecurringBanners[curMonth];

    if (!isProcessed && !isDismissed) {
      bannerEl.style.display = 'flex';
      const mName = formatMonthName(curMonth);
      bannerEl.innerHTML = `
        <div class="banner-content">
          <div class="banner-title">
            ${getIconSvg('sparkles', 15)} ${mName} Static Expenses
          </div>
          <div class="banner-subtitle">Add Society, Electricity, Maid & flat bills</div>
        </div>
        <button class="banner-action-btn" id="openRecurringPromptBtn">Review & Add</button>
      `;
      document.getElementById('openRecurringPromptBtn')?.addEventListener('click', openRecurringModal);
    } else {
      bannerEl.style.display = 'none';
    }
  }

  function renderSummaryCard() {
    const stats = computeMonthStats();
    const uName = state.settings.userName;
    const fName = state.settings.flatmateName;

    const totalEl = document.getElementById('summaryTotalSpend');
    if (totalEl) totalEl.textContent = formatMoney(stats.totalSpend);

    const userPaidEl = document.getElementById('summaryUserPaid');
    if (userPaidEl) userPaidEl.textContent = formatMoney(stats.userPaid);

    const flatmatePaidEl = document.getElementById('summaryFlatmatePaid');
    if (flatmatePaidEl) flatmatePaidEl.textContent = formatMoney(stats.flatmatePaid);

    const uLabel = document.getElementById('statLabelUser');
    if (uLabel) uLabel.textContent = `${uName} paid`;
    const fLabel = document.getElementById('statLabelFlatmate');
    if (fLabel) fLabel.textContent = `${fName} paid`;

    // Settlement Badge
    const badgeEl = document.getElementById('summaryBalanceBadge');
    if (badgeEl) {
      if (stats.totalSpend === 0 || Math.abs(stats.userBalance) < 1) {
        badgeEl.className = 'summary-badge badge-balanced';
        badgeEl.textContent = 'All settled up';
      } else if (stats.userBalance > 0) {
        badgeEl.className = 'summary-badge badge-owed';
        badgeEl.textContent = `${fName} owes you ${formatMoney(stats.userBalance)}`;
      } else {
        badgeEl.className = 'summary-badge badge-owes';
        badgeEl.textContent = `You owe ${fName} ${formatMoney(Math.abs(stats.userBalance))}`;
      }
    }

    // Mini Splitwise Tracker inside Hero card
    const splitwiseProgress = stats.totalCount > 0 ? Math.round((stats.inSplitwiseCount / stats.totalCount) * 100) : 0;
    const splitValEl = document.getElementById('miniSplitwiseValue');
    if (splitValEl) {
      splitValEl.textContent = `${stats.inSplitwiseCount} of ${stats.totalCount} in Splitwise (${splitwiseProgress}%)`;
    }
    const splitBarEl = document.getElementById('miniSplitwiseBar');
    if (splitBarEl) {
      splitBarEl.style.width = `${splitwiseProgress}%`;
    }
  }

  // --- Pending Static Monthly Bills Engine (Screenshot 2 Match) ---
  function getPendingStaticBills(monthKey = state.currentMonth) {
    const monthExpenses = getMonthExpenses(monthKey);
    const pending = [];

    const activeTemplates = state.recurringTemplates.filter(t => t.active);
    activeTemplates.forEach(tpl => {
      // Check if already confirmed for this month
      const isConfirmed = monthExpenses.some(e =>
        e.recurringTemplateId === tpl.id ||
        (e.isRecurring && e.title && e.title.toLowerCase().trim() === tpl.title.toLowerCase().trim())
      );

      // Check if skipped for this month
      const isSkipped = state.skippedRecurring && state.skippedRecurring[`${monthKey}_${tpl.id}`];

      if (!isConfirmed && !isSkipped) {
        const day = Math.min(Math.max(parseInt(tpl.dayOfMonth) || 1, 1), 31);
        const dayStr = String(day).padStart(2, '0');
        const scheduledDate = `${monthKey}-${dayStr}`;

        // Compute relative difference to today
        const billDate = new Date(`${monthKey}-${dayStr}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = today - billDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let statusText = '';
        const parts = monthKey.split('-');
        const formattedDate = `${dayStr}-${parts[1]}-${parts[0]}`;

        if (diffDays > 0) {
          const daysText = diffDays === 1 ? 'one day' : diffDays === 2 ? 'two days' : `${diffDays} days`;
          statusText = `Statement date ${formattedDate} · not updated after ${daysText}`;
        } else if (diffDays === 0) {
          statusText = `Statement date ${formattedDate} · due today`;
        } else {
          statusText = `Due date ${formattedDate} · Estimated ${formatMoney(tpl.defaultAmount)}`;
        }

        pending.push({
          template: tpl,
          scheduledDate,
          day,
          statusText
        });
      }
    });

    // Sort pending bills by scheduled day of month
    pending.sort((a, b) => a.day - b.day);
    return pending;
  }

  function renderPendingBills() {
    const container = document.getElementById('pendingBillsContainer');
    if (!container) return;

    if (state.activeFilter === 'synced') {
      container.style.display = 'none';
      return;
    }

    const pendingBills = getPendingStaticBills();

    if (pendingBills.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div class="pending-bills-card">
        <div class="pending-bills-header">
          <span class="pending-bills-title">
            ${getIconSvg('sparkles', 13)} Monthly Flat Bills · Needs Update
          </span>
          <span class="pending-bills-count">${pendingBills.length} pending</span>
        </div>
        ${pendingBills.map(item => `
          <div class="pending-bill-row">
            <div class="pending-bill-left" onclick="window.flatsplit.addBillDetails('${item.template.id}', '${item.scheduledDate}')">
              <div class="pending-bill-icon">
                ${getIconSvg(getCategoryIcon(item.template.category), 19)}
              </div>
              <div class="pending-bill-details">
                <div class="pending-bill-name">${escapeHtml(item.template.title)}</div>
                <div class="pending-bill-sub">${escapeHtml(item.statusText)}</div>
              </div>
            </div>
            <button class="pending-bill-btn" onclick="window.flatsplit.addBillDetails('${item.template.id}', '${item.scheduledDate}', event)">
              Add Bill Details
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderExpensesView() {
    renderPendingBills();

    const listEl = document.getElementById('expenseList');
    if (!listEl) return;

    const monthExpenses = getMonthExpenses();
    const pendingBills = getPendingStaticBills();

    // Filter
    let filtered = monthExpenses;
    if (state.activeFilter === 'pending') {
      filtered = monthExpenses.filter(e => !e.inSplitwise);
    } else if (state.activeFilter === 'synced') {
      filtered = monthExpenses.filter(e => e.inSplitwise);
    }

    // Update filter chip counts
    const countAll = monthExpenses.length;
    const countPending = monthExpenses.filter(e => !e.inSplitwise).length;
    const countSynced = monthExpenses.filter(e => e.inSplitwise).length;

    const chipAll = document.getElementById('chipFilterAll');
    if (chipAll) chipAll.innerHTML = `All <span class="chip-count">${countAll}</span>`;
    const chipPending = document.getElementById('chipFilterPending');
    if (chipPending) chipPending.innerHTML = `Pending Splitwise <span class="chip-count">${countPending}</span>`;
    const chipSynced = document.getElementById('chipFilterSynced');
    if (chipSynced) chipSynced.innerHTML = `In Splitwise <span class="chip-count">${countSynced}</span>`;

    if (filtered.length === 0) {
      if (pendingBills.length > 0 && state.activeFilter !== 'synced') {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 13px;">
            Update your monthly static bills above or tap + to log extra expenses.
          </div>
        `;
      } else {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">${getIconSvg('building', 40)}</div>
            <div class="empty-title">No expenses found</div>
            <div class="empty-desc">${state.activeFilter === 'pending' ? 'All expenses are synced to Splitwise!' : 'Tap the + button below to add flat expenses.'}</div>
          </div>
        `;
      }
      return;
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    listEl.innerHTML = filtered.map(exp => {
      const payerName = exp.paidBy === 'user' ? state.settings.userName : state.settings.flatmateName;
      const catIcon = getCategoryIcon(exp.category);
      const isSynced = exp.inSplitwise;
      const isGrocery = isGroceryExpense(exp);
      const cycleNum = isGrocery ? getGroceryCycle(exp.date) : null;
      const cyclePill = isGrocery ? `<span class="grocery-cycle-pill">Groceries • ${cycleNum === 1 ? '1–15th' : '16–End'}</span>` : '';

      return `
        <div class="expense-card" data-id="${exp.id}">
          <div class="expense-left" onclick="window.flatsplit.editExpense('${exp.id}')">
            <div class="category-icon-box">
              ${getIconSvg(catIcon, 20)}
            </div>
            <div class="expense-details">
              <div class="expense-title-row">
                <span class="expense-title">${escapeHtml(exp.title)}</span>
                ${exp.isRecurring ? '<span class="recurring-pill">Monthly</span>' : ''}
                ${cyclePill}
              </div>
              <div class="expense-meta">
                <span>${formatDateShort(exp.date)}</span>
                <span>•</span>
                <span class="meta-payer">${escapeHtml(payerName)} paid</span>
              </div>
            </div>
          </div>
          <div class="expense-right">
            <div class="expense-amount">${formatMoney(exp.amount)}</div>
            <button class="splitwise-status-btn ${isSynced ? 'synced' : ''}" onclick="window.flatsplit.toggleSplitwise('${exp.id}', event)">
              ${isSynced ? getIconSvg('check', 12) + ' In Splitwise' : getIconSvg('circle', 12) + ' Splitwise'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Bi-Monthly Grocery Batches Helpers ---
  function isGroceryExpense(exp) {
    if (!exp) return false;
    const cat = (exp.category || '').toLowerCase();
    const title = (exp.title || '').toLowerCase();
    return cat.includes('grocer') || cat.includes('blinkit') ||
           title.includes('blinkit') || title.includes('zepto') || title.includes('instamart') ||
           title.includes('grocery') || title.includes('groceries') || title.includes('supermarket') ||
           title.includes('vegetable') || title.includes('veggies') || title.includes('milk') ||
           exp.isGrocery === true;
  }

  function getGroceryCycle(dateStr) {
    if (!dateStr) return 1;
    const parts = dateStr.split('-');
    const day = parseInt(parts[2], 10) || 1;
    return day <= 15 ? 1 : 2;
  }

  function getGroceryBatches(monthKey = state.currentMonth) {
    const monthExpenses = getMonthExpenses(monthKey);
    const groceryExpenses = monthExpenses.filter(isGroceryExpense);

    const cycle1Items = groceryExpenses.filter(e => getGroceryCycle(e.date) === 1);
    const cycle2Items = groceryExpenses.filter(e => getGroceryCycle(e.date) === 2);

    function calcCycle(items, cycleNum) {
      let total = 0;
      let userPaid = 0;
      let flatmatePaid = 0;
      let syncedCount = 0;

      items.forEach(e => {
        const amt = Number(e.amount) || 0;
        total += amt;
        if (e.paidBy === 'user') userPaid += amt;
        else flatmatePaid += amt;
        if (e.inSplitwise) syncedCount++;
      });

      const allSynced = items.length > 0 && syncedCount === items.length;
      const anyPending = items.some(e => !e.inSplitwise);

      return {
        cycleNum,
        items,
        total,
        userPaid,
        flatmatePaid,
        syncedCount,
        allSynced,
        anyPending,
        count: items.length
      };
    }

    return {
      cycle1: calcCycle(cycle1Items, 1),
      cycle2: calcCycle(cycle2Items, 2),
      allGroceryCount: groceryExpenses.length
    };
  }

  function toggleGroceryBatch(cycleNum) {
    const batches = getGroceryBatches();
    const batch = cycleNum === 1 ? batches.cycle1 : batches.cycle2;
    if (batch.items.length === 0) return;

    const targetState = !batch.allSynced;
    batch.items.forEach(e => {
      e.inSplitwise = targetState;
    });

    saveData();
    render();
    showToast(targetState ? `Cycle ${cycleNum} Groceries marked as added to Splitwise!` : `Cycle ${cycleNum} Groceries unmarked from Splitwise`);
  }

  function copyGroceryBatch(cycleNum) {
    const batches = getGroceryBatches();
    const batch = cycleNum === 1 ? batches.cycle1 : batches.cycle2;
    if (batch.items.length === 0) {
      showToast('No grocery receipts recorded in this cycle.');
      return;
    }

    const uName = state.settings.userName;
    const fName = state.settings.flatmateName;
    const mName = formatMonthName(state.currentMonth);
    const cycleRange = cycleNum === 1 ? '1st - 15th' : '16th - End';

    let text = `🛒 Groceries Batch (${cycleRange} ${mName}):\n`;
    text += `Total: ${formatMoney(batch.total)}\n`;
    text += `Paid by ${uName}: ${formatMoney(batch.userPaid)}\n`;
    text += `Paid by ${fName}: ${formatMoney(batch.flatmatePaid)}\n`;
    text += `Split: Equally (50/50)\n`;
    text += `Individual Orders (${batch.items.length}):\n`;
    batch.items.forEach((item, idx) => {
      const payer = item.paidBy === 'user' ? uName : fName;
      text += `  ${idx + 1}. ${formatDateShort(item.date)} - ${item.title}: ${formatMoney(item.amount)} (${payer})\n`;
    });

    fallbackCopy(text);
    showToast(`Copied Groceries Cycle ${cycleNum} summary!`);
  }

  function renderGroceryBatchesSection(mName, uName, fName) {
    const container = document.getElementById('groceryBatchesSection');
    if (!container) return;

    const batches = getGroceryBatches();
    const cycle1 = batches.cycle1;
    const cycle2 = batches.cycle2;

    if (batches.allGroceryCount === 0) {
      container.innerHTML = `
        <div class="grocery-section-header">
          <span class="grocery-section-title">
            ${getIconSvg('shopping-cart', 15)} Bi-Monthly Groceries (1-15 & 16-End)
          </span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); background: var(--bg-surface); padding: 12px 14px; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          No grocery expenses recorded this month yet. Individual grocery entries will automatically batch here twice a month for Splitwise.
        </div>
      `;
      return;
    }

    function renderCard(batch, cycleRange) {
      if (batch.count === 0) {
        return `
          <div class="grocery-batch-card pending" style="opacity: 0.65;">
            <div class="grocery-batch-top">
              <span class="grocery-batch-title">
                ${getIconSvg('shopping-cart', 16)} Groceries (${cycleRange})
              </span>
              <span style="font-size: 11px; color: var(--text-muted);">0 receipts</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 3px;">
              Individual receipts logged in this period will automatically roll up here.
            </div>
          </div>
        `;
      }

      const isSynced = batch.allSynced;
      const cardClass = isSynced ? '' : 'pending';
      const statusPill = isSynced
        ? `<span class="splitwise-status-tag tag-done" style="font-size: 11px; padding: 2px 8px;">✓ In Splitwise</span>`
        : `<span class="splitwise-status-tag tag-pending" style="font-size: 11px; padding: 2px 8px;">Pending Entry</span>`;

      return `
        <div class="grocery-batch-card ${cardClass}" id="groceryCardCycle${batch.cycleNum}">
          <div class="grocery-batch-top">
            <span class="grocery-batch-title">
              ${getIconSvg('shopping-cart', 16)} Groceries (${cycleRange})
            </span>
            ${statusPill}
          </div>

          <div class="grocery-batch-amount" style="margin: 4px 0 6px 0;">
            ${formatMoney(batch.total)}
            <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">(${batch.count} ${batch.count === 1 ? 'receipt' : 'receipts'})</span>
          </div>

          <div class="grocery-batch-breakdown">
            <span>● ${escapeHtml(uName)}: <strong>${formatMoney(batch.userPaid)}</strong></span>
            <span>● ${escapeHtml(fName)}: <strong>${formatMoney(batch.flatmatePaid)}</strong></span>
            <span style="color: var(--text-muted);">• Split 50/50</span>
          </div>

          <div class="grocery-batch-actions">
            <button class="grocery-batch-btn primary" onclick="window.flatsplit.copyGroceryBatch(${batch.cycleNum})">
              ${getIconSvg('copy', 13)} Copy for Splitwise
            </button>
            <button class="grocery-batch-btn" onclick="window.flatsplit.toggleGroceryBatch(${batch.cycleNum})">
              ${isSynced ? getIconSvg('circle', 13) + ' Unmark Batch' : getIconSvg('check', 13) + ' Mark Batch Added'}
            </button>
          </div>

          <button class="grocery-receipts-toggle" onclick="window.flatsplit.toggleReceiptsView(${batch.cycleNum})">
            <span id="receiptsToggleText${batch.cycleNum}">View ${batch.count} receipts ▾</span>
          </button>

          <div class="grocery-receipts-list" id="receiptsListCycle${batch.cycleNum}">
            ${batch.items.map(item => {
              const p = item.paidBy === 'user' ? uName : fName;
              return `
                <div class="grocery-receipt-item">
                  <span>${formatDateShort(item.date)} · ${escapeHtml(item.title)} <span style="font-size: 10px; color: var(--text-muted);">(${escapeHtml(p)})</span></span>
                  <span style="font-weight: 600; font-feature-settings: 'tnum';">${formatMoney(item.amount)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="grocery-section-header">
        <span class="grocery-section-title">
          ${getIconSvg('shopping-cart', 15)} Bi-Monthly Groceries (1-15 & 16-End)
        </span>
        <span style="font-size: 11px; color: var(--text-muted); font-feature-settings: 'tnum';">
          ${batches.allGroceryCount} receipts
        </span>
      </div>
      <div class="grocery-batch-grid">
        ${renderCard(cycle1, '1st – 15th')}
        ${renderCard(cycle2, '16th – End')}
      </div>
    `;
  }

  function renderOtherSplitwiseExpenses(uName, fName) {
    const listEl = document.getElementById('splitwiseChecklist');
    const headerEl = document.getElementById('otherExpensesSectionHeader');
    if (!listEl) return;

    const monthExpenses = getMonthExpenses();
    // Exclude grocery expenses from the individual checklist since they are batched above
    const nonGrocery = monthExpenses.filter(e => !isGroceryExpense(e));

    let displayList = nonGrocery;
    if (state.splitwiseFilter === 'pending') {
      displayList = nonGrocery.filter(e => !e.inSplitwise);
    } else if (state.splitwiseFilter === 'synced') {
      displayList = nonGrocery.filter(e => e.inSplitwise);
    }

    displayList.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (displayList.length === 0) {
      if (headerEl) headerEl.style.display = 'none';
      listEl.innerHTML = `
        <div style="text-align: center; padding: 18px 12px; color: var(--text-muted); font-size: 12px; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          ${state.splitwiseFilter === 'pending' ? 'All non-grocery flat expenses are logged in Splitwise!' : 'No other flat expenses recorded.'}
        </div>
      `;
      return;
    }

    if (headerEl) headerEl.style.display = 'flex';

    listEl.innerHTML = displayList.map(exp => {
      const payerName = exp.paidBy === 'user' ? uName : fName;
      const isSynced = exp.inSplitwise;
      return `
        <div class="checklist-item ${isSynced ? 'selected' : ''}">
          <input type="checkbox" class="checklist-check" ${isSynced ? 'checked' : ''} onchange="window.flatsplit.toggleSplitwise('${exp.id}', event)">
          <div class="checklist-info">
            <div class="checklist-name">${escapeHtml(exp.title)}</div>
            <div class="checklist-sub">${formatDateShort(exp.date)} • Paid by ${escapeHtml(payerName)} • Split equally</div>
          </div>
          <div class="expense-amount">${formatMoney(exp.amount)}</div>
        </div>
      `;
    }).join('');
  }

  function renderSplitwiseView() {
    const stats = computeMonthStats();
    const countEl = document.getElementById('splitwisePendingCount');
    const amtEl = document.getElementById('splitwisePendingAmount');
    if (countEl) countEl.textContent = `${stats.pendingSplitwiseCount} expenses pending`;
    if (amtEl) amtEl.textContent = formatMoney(stats.pendingSplitwiseAmount);

    const mName = formatMonthName(state.currentMonth);
    const uName = state.settings.userName;
    const fName = state.settings.flatmateName;

    // 1. Render Bi-Monthly Grocery Batches
    renderGroceryBatchesSection(mName, uName, fName);

    // 2. Render Other Non-Grocery Expenses
    renderOtherSplitwiseExpenses(uName, fName);
  }

  function renderAnalysisView() {
    const stats = computeMonthStats();
    const uName = state.settings.userName;
    const fName = state.settings.flatmateName;

    // Analysis Header Cards
    const monthNameEl = document.getElementById('analysisMonthTitle');
    if (monthNameEl) monthNameEl.textContent = `Analysis for ${formatMonthName(state.currentMonth)}`;

    const avgDailyEl = document.getElementById('analysisDailyAvg');
    if (avgDailyEl) {
      const daysInMonth = 30;
      avgDailyEl.textContent = formatMoney(stats.totalSpend / daysInMonth);
    }

    // Split ratio bar
    const ratioTrack = document.getElementById('splitRatioBarTrack');
    const uSharePct = stats.totalSpend > 0 ? Math.round((stats.userPaid / stats.totalSpend) * 100) : 50;
    const fSharePct = 100 - uSharePct;

    if (ratioTrack) {
      ratioTrack.innerHTML = `
        <div class="split-ratio-seg-user" style="width: ${uSharePct}%;"></div>
        <div class="split-ratio-seg-flatmate" style="width: ${fSharePct}%;"></div>
      `;
    }

    const uLegend = document.getElementById('analysisUserLegend');
    if (uLegend) uLegend.innerHTML = `<span>● ${escapeHtml(uName)}: ${formatMoney(stats.userPaid)} (${uSharePct}%)</span>`;
    const fLegend = document.getElementById('analysisFlatmateLegend');
    if (fLegend) fLegend.innerHTML = `<span>● ${escapeHtml(fName)}: ${formatMoney(stats.flatmatePaid)} (${fSharePct}%)</span>`;

    // SVG Donut Chart
    renderDonutChart(stats);

    // Category ranked breakdown
    const catListEl = document.getElementById('categoryBreakdownList');
    if (catListEl) {
      if (stats.categoriesSorted.length === 0) {
        catListEl.innerHTML = `<div class="empty-desc" style="text-align: center; padding: 20px;">No expense data for this month.</div>`;
      } else {
        const colors = getThemeChartPalette();
        catListEl.innerHTML = stats.categoriesSorted.map((cat, idx) => {
          const color = colors[idx % colors.length];
          return `
            <div class="cat-bar-row">
              <div class="cat-bar-labels">
                <span class="cat-bar-name">
                  <span class="cat-dot" style="background-color: ${color};"></span>
                  ${escapeHtml(cat.name)}
                </span>
                <span class="cat-bar-amount">${formatMoney(cat.amount)} (${cat.percent}%)</span>
              </div>
              <div class="cat-progress-track">
                <div class="cat-progress-bar" style="width: ${cat.percent}%; background-color: ${color};"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  function renderDonutChart(stats) {
    const svgEl = document.getElementById('donutSvg');
    const centerTotalEl = document.getElementById('donutCenterTotal');
    if (!svgEl) return;

    if (centerTotalEl) centerTotalEl.textContent = formatMoney(stats.totalSpend);

    if (stats.totalSpend === 0 || stats.categoriesSorted.length === 0) {
      svgEl.innerHTML = `<circle cx="85" cy="85" r="65" fill="none" stroke="var(--border-subtle)" stroke-width="20"></circle>`;
      return;
    }

    const colors = getThemeChartPalette();
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    let paths = '';
    stats.categoriesSorted.forEach((cat, idx) => {
      const sliceFraction = cat.amount / stats.totalSpend;
      const strokeLength = sliceFraction * circumference;
      const strokeDashoffset = -accumulatedAngle;
      const color = colors[idx % colors.length];

      paths += `
        <circle cx="85" cy="85" r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="20"
          stroke-dasharray="${strokeLength} ${circumference - strokeLength}"
          stroke-dashoffset="${strokeDashoffset}"
        ></circle>
      `;
      accumulatedAngle += strokeLength;
    });

    svgEl.innerHTML = paths;
  }

  function renderSettingsView() {
    const uInput = document.getElementById('settingsUserName');
    if (uInput && document.activeElement !== uInput) uInput.value = state.settings.userName;

    const fInput = document.getElementById('settingsFlatmateName');
    if (fInput && document.activeElement !== fInput) fInput.value = state.settings.flatmateName;

    const currInput = document.getElementById('settingsCurrency');
    if (currInput && document.activeElement !== currInput) currInput.value = state.settings.currency;

    // Recurring Templates Manager
    const tListEl = document.getElementById('recurringTemplatesList');
    if (tListEl) {
      tListEl.innerHTML = state.recurringTemplates.map(tpl => {
        const payer = tpl.defaultPaidBy === 'flatmate' ? state.settings.flatmateName : state.settings.userName;
        const day = tpl.dayOfMonth || 1;
        const daySuffix = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
        return `
          <div class="template-item">
            <div class="template-left">
              <div class="template-name">${escapeHtml(tpl.title)}</div>
              <div class="template-info">Due on ${day}${daySuffix} of month • Default ${formatMoney(tpl.defaultAmount)} • Paid by ${escapeHtml(payer)}</div>
            </div>
            <div class="template-actions">
              <button class="icon-btn" title="Edit" onclick="window.flatsplit.editTemplate('${tpl.id}')">
                ${getIconSvg('edit', 16)}
              </button>
              <button class="icon-btn delete" title="Delete" onclick="window.flatsplit.deleteTemplate('${tpl.id}')">
                ${getIconSvg('trash', 16)}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function updateNavBadges() {
    const stats = computeMonthStats();
    const splitTabBadge = document.getElementById('splitwiseTabBadge');
    if (splitTabBadge) {
      if (stats.pendingSplitwiseCount > 0) {
        splitTabBadge.style.display = 'flex';
        splitTabBadge.textContent = stats.pendingSplitwiseCount;
      } else {
        splitTabBadge.style.display = 'none';
      }
    }
  }

  // --- Modal Sheets Handling ---
  function openAddExpenseModal(expenseToEdit = null) {
    const sheet = document.getElementById('expenseModalBackdrop');
    if (!sheet) return;

    const titleEl = document.getElementById('expenseModalTitle');
    const idInput = document.getElementById('formExpenseId');
    const tplIdInput = document.getElementById('formExpenseTemplateId');
    const titleInput = document.getElementById('formExpenseTitle');
    const amountInput = document.getElementById('formExpenseAmount');
    const dateInput = document.getElementById('formExpenseDate');
    const catSelect = document.getElementById('formExpenseCategory');
    const paidBySelect = document.getElementById('formExpensePaidBy');
    const inSplitwiseCheck = document.getElementById('formExpenseInSplitwise');
    const notesInput = document.getElementById('formExpenseNotes');
    const deleteBtn = document.getElementById('formExpenseDeleteBtn');
    const skipBtn = document.getElementById('formExpenseSkipBtn');

    // Populate category dropdown
    catSelect.innerHTML = DEFAULT_CATEGORIES.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');

    // Populate payer dropdown with flatmate names
    paidBySelect.innerHTML = `
      <option value="user">${escapeHtml(state.settings.userName)} (You)</option>
      <option value="flatmate">${escapeHtml(state.settings.flatmateName)}</option>
    `;

    if (skipBtn) skipBtn.style.display = 'none';

    if (expenseToEdit) {
      titleEl.textContent = 'Edit Expense';
      idInput.value = expenseToEdit.id;
      if (tplIdInput) tplIdInput.value = expenseToEdit.recurringTemplateId || '';
      titleInput.value = expenseToEdit.title;
      amountInput.value = expenseToEdit.amount;
      dateInput.value = expenseToEdit.date;
      catSelect.value = expenseToEdit.category;
      paidBySelect.value = expenseToEdit.paidBy || 'user';
      inSplitwiseCheck.checked = Boolean(expenseToEdit.inSplitwise);
      notesInput.value = expenseToEdit.notes || '';
      deleteBtn.style.display = 'block';
    } else {
      titleEl.textContent = 'Add Expense';
      idInput.value = '';
      if (tplIdInput) tplIdInput.value = '';
      titleInput.value = '';
      amountInput.value = '';
      dateInput.value = getTodayDateString();
      catSelect.value = 'Miscellaneous';
      paidBySelect.value = 'user';
      inSplitwiseCheck.checked = false;
      notesInput.value = '';
      deleteBtn.style.display = 'none';
    }

    sheet.classList.add('active');
  }

  function openAddBillDetailsModal(templateId, scheduledDate, event) {
    if (event) event.stopPropagation();

    const tpl = state.recurringTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    const sheet = document.getElementById('expenseModalBackdrop');
    if (!sheet) return;

    const titleEl = document.getElementById('expenseModalTitle');
    const idInput = document.getElementById('formExpenseId');
    const tplIdInput = document.getElementById('formExpenseTemplateId');
    const titleInput = document.getElementById('formExpenseTitle');
    const amountInput = document.getElementById('formExpenseAmount');
    const dateInput = document.getElementById('formExpenseDate');
    const catSelect = document.getElementById('formExpenseCategory');
    const paidBySelect = document.getElementById('formExpensePaidBy');
    const inSplitwiseCheck = document.getElementById('formExpenseInSplitwise');
    const notesInput = document.getElementById('formExpenseNotes');
    const deleteBtn = document.getElementById('formExpenseDeleteBtn');
    const skipBtn = document.getElementById('formExpenseSkipBtn');

    // Populate category dropdown
    catSelect.innerHTML = DEFAULT_CATEGORIES.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');

    // Populate payer dropdown with flatmate names
    paidBySelect.innerHTML = `
      <option value="user">${escapeHtml(state.settings.userName)} (You)</option>
      <option value="flatmate">${escapeHtml(state.settings.flatmateName)}</option>
    `;

    titleEl.textContent = `Update Bill: ${tpl.title}`;
    idInput.value = '';
    if (tplIdInput) tplIdInput.value = tpl.id;
    titleInput.value = tpl.title;
    amountInput.value = tpl.defaultAmount || '';
    dateInput.value = scheduledDate;
    catSelect.value = tpl.category || 'Miscellaneous';
    paidBySelect.value = tpl.defaultPaidBy || 'user';
    inSplitwiseCheck.checked = false;
    notesInput.value = tpl.notes || 'Monthly recurring flat bill';

    deleteBtn.style.display = 'none';
    if (skipBtn) {
      skipBtn.style.display = 'block';
      skipBtn.textContent = `Skip ${tpl.title} for ${formatMonthName(state.currentMonth)}`;
    }

    sheet.classList.add('active');
    setTimeout(() => {
      amountInput.focus();
      amountInput.select();
    }, 150);
  }

  function closeAddExpenseModal() {
    const sheet = document.getElementById('expenseModalBackdrop');
    if (sheet) sheet.classList.remove('active');
  }

  // Recurring Month Checklist Modal
  function openRecurringModal() {
    const sheet = document.getElementById('recurringModalBackdrop');
    if (!sheet) return;

    const titleEl = document.getElementById('recurringModalTitle');
    if (titleEl) titleEl.textContent = `${formatMonthName(state.currentMonth)} Static Expenses`;

    const listEl = document.getElementById('recurringModalChecklist');
    if (!listEl) return;

    const uName = state.settings.userName;
    const fName = state.settings.flatmateName;

    listEl.innerHTML = state.recurringTemplates.filter(t => t.active).map((tpl, i) => {
      const payer = tpl.defaultPaidBy === 'flatmate' ? fName : uName;
      return `
        <div class="checklist-item selected" id="recRow_${tpl.id}">
          <input type="checkbox" class="checklist-check rec-check" data-id="${tpl.id}" checked>
          <div class="checklist-info">
            <div class="checklist-name">${escapeHtml(tpl.title)}</div>
            <div class="checklist-sub">${escapeHtml(tpl.category)} • Paid by ${escapeHtml(payer)}</div>
          </div>
          <div class="amount-input-box" style="width: 100px;">
            <span class="currency-affix" style="left: 6px; font-size: 13px;">${state.settings.currency}</span>
            <input type="number" class="checklist-input rec-amount" data-id="${tpl.id}" value="${tpl.defaultAmount}" style="width: 100%; padding-left: 20px;">
          </div>
        </div>
      `;
    }).join('');

    sheet.classList.add('active');
  }

  function closeRecurringModal() {
    const sheet = document.getElementById('recurringModalBackdrop');
    if (sheet) sheet.classList.remove('active');
  }

  function submitRecurringModal() {
    const checks = document.querySelectorAll('.rec-check');
    let addedCount = 0;
    const curMonth = state.currentMonth;

    checks.forEach(chk => {
      if (chk.checked) {
        const id = chk.dataset.id;
        const tpl = state.recurringTemplates.find(t => t.id === id);
        if (tpl) {
          const amtInput = document.querySelector(`.rec-amount[data-id="${id}"]`);
          const amt = amtInput ? (parseFloat(amtInput.value) || 0) : tpl.defaultAmount;

          const newExp = {
            id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title: tpl.title,
            amount: amt,
            date: `${curMonth}-01`,
            month: curMonth,
            category: tpl.category,
            paidBy: tpl.defaultPaidBy || 'user',
            split: 'equal',
            inSplitwise: false,
            isRecurring: true,
            notes: 'Generated from monthly template'
          };
          state.expenses.push(newExp);
          addedCount++;
        }
      }
    });

    state.processedRecurringMonths[curMonth] = true;
    saveData();
    closeRecurringModal();
    render();
    showToast(`Added ${addedCount} recurring expenses for ${formatMonthName(curMonth)}!`);
  }

  // --- Splitwise Helper Features ---
  function toggleSplitwiseStatus(expenseId, event) {
    if (event) event.stopPropagation();
    const exp = state.expenses.find(e => e.id === expenseId);
    if (!exp) return;

    exp.inSplitwise = !exp.inSplitwise;
    saveData();
    render();
    showToast(exp.inSplitwise ? `Marked "${exp.title}" as entered in Splitwise` : `Unmarked "${exp.title}" from Splitwise`);
  }

  function copySplitwiseSummary() {
    const monthExpenses = getMonthExpenses();
    const pendingExpenses = monthExpenses.filter(e => !e.inSplitwise);

    if (pendingExpenses.length === 0) {
      showToast('All expenses for this month are already in Splitwise!');
      return;
    }

    const uName = state.settings.userName;
    const fName = state.settings.flatmateName;
    const mName = formatMonthName(state.currentMonth);

    const batches = getGroceryBatches();
    const cycle1 = batches.cycle1;
    const cycle2 = batches.cycle2;

    let text = `Flat Expenses - ${mName} (Pending for Splitwise):\n\n`;
    let count = 1;
    let total = 0;

    // 1. Grocery Cycle 1 (1st - 15th) if pending
    if (cycle1.anyPending && cycle1.count > 0) {
      text += `${count}. 🛒 Groceries (1-15 ${mName}): ${formatMoney(cycle1.total)}\n`;
      text += `   • Paid by ${uName}: ${formatMoney(cycle1.userPaid)}\n`;
      text += `   • Paid by ${fName}: ${formatMoney(cycle1.flatmatePaid)}\n`;
      text += `   • Split: 50/50 (${cycle1.count} receipts)\n\n`;
      total += cycle1.total;
      count++;
    }

    // 2. Grocery Cycle 2 (16th - End) if pending
    if (cycle2.anyPending && cycle2.count > 0) {
      text += `${count}. 🛒 Groceries (16-End ${mName}): ${formatMoney(cycle2.total)}\n`;
      text += `   • Paid by ${uName}: ${formatMoney(cycle2.userPaid)}\n`;
      text += `   • Paid by ${fName}: ${formatMoney(cycle2.flatmatePaid)}\n`;
      text += `   • Split: 50/50 (${cycle2.count} receipts)\n\n`;
      total += cycle2.total;
      count++;
    }

    // 3. Other Non-Grocery Expenses
    const otherPending = pendingExpenses.filter(e => !isGroceryExpense(e));
    otherPending.forEach((e) => {
      const payer = e.paidBy === 'user' ? uName : fName;
      text += `${count}. ${e.title}: ${formatMoney(e.amount)} (Paid by ${payer}, Split 50/50)\n`;
      total += Number(e.amount) || 0;
      count++;
    });

    text += `\nTotal Pending: ${formatMoney(total)}`;

    fallbackCopy(text);
    showToast('Copied Splitwise summary (Groceries batched 1-15 & 16-End)!');
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    showToast('Copied Splitwise summary to clipboard!');
  }

  function markAllInSplitwise() {
    const monthExpenses = getMonthExpenses();
    const pending = monthExpenses.filter(e => !e.inSplitwise);

    if (pending.length === 0) {
      showToast('All expenses already marked as entered.');
      return;
    }

    pending.forEach(e => {
      e.inSplitwise = true;
    });
    saveData();
    render();
    showToast(`Marked ${pending.length} expenses as added to Splitwise!`);
  }

  // --- Month Stepper ---
  function changeMonth(direction) {
    const [y, m] = state.currentMonth.split('-').map(Number);
    let date = new Date(y, m - 1 + direction, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    state.currentMonth = `${newY}-${newM}`;
    render();
  }

  // --- Add/Edit Recurring Template Modal ---
  function openTemplateModal(tplToEdit = null) {
    const sheet = document.getElementById('templateModalBackdrop');
    if (!sheet) return;

    const idInput = document.getElementById('tplId');
    const titleInput = document.getElementById('tplTitle');
    const amtInput = document.getElementById('tplAmount');
    const dayInput = document.getElementById('tplDayOfMonth');
    const catSelect = document.getElementById('tplCategory');
    const paidBySelect = document.getElementById('tplPaidBy');

    catSelect.innerHTML = DEFAULT_CATEGORIES.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
    paidBySelect.innerHTML = `
      <option value="user">${escapeHtml(state.settings.userName)} (You)</option>
      <option value="flatmate">${escapeHtml(state.settings.flatmateName)}</option>
    `;

    if (tplToEdit) {
      document.getElementById('tplModalTitle').textContent = 'Edit Recurring Expense';
      idInput.value = tplToEdit.id;
      titleInput.value = tplToEdit.title;
      amtInput.value = tplToEdit.defaultAmount;
      if (dayInput) dayInput.value = tplToEdit.dayOfMonth || 1;
      catSelect.value = tplToEdit.category;
      paidBySelect.value = tplToEdit.defaultPaidBy || 'user';
    } else {
      document.getElementById('tplModalTitle').textContent = 'New Recurring Expense';
      idInput.value = '';
      titleInput.value = '';
      amtInput.value = '';
      if (dayInput) dayInput.value = 1;
      catSelect.value = 'Society Dues';
      paidBySelect.value = 'user';
    }

    sheet.classList.add('active');
  }

  function closeTemplateModal() {
    const sheet = document.getElementById('templateModalBackdrop');
    if (sheet) sheet.classList.remove('active');
  }

  // --- Toast ---
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${getIconSvg('check', 16)} <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Attach Global Handlers ---
  window.hisaab = window.flatsplit = {
    toggleSplitwise: toggleSplitwiseStatus,
    toggleGroceryBatch: function (cycleNum) {
      toggleGroceryBatch(cycleNum);
    },
    copyGroceryBatch: function (cycleNum) {
      copyGroceryBatch(cycleNum);
    },
    toggleReceiptsView: function (cycleNum) {
      const list = document.getElementById(`receiptsListCycle${cycleNum}`);
      const text = document.getElementById(`receiptsToggleText${cycleNum}`);
      if (list) {
        const isOpen = list.classList.toggle('open');
        if (text) {
          text.textContent = isOpen ? 'Hide receipts ▴' : 'View receipts ▾';
        }
      }
    },
    addBillDetails: function (templateId, scheduledDate, event) {
      openAddBillDetailsModal(templateId, scheduledDate, event);
    },
    editExpense: function (id) {
      const exp = state.expenses.find(e => e.id === id);
      if (exp) openAddExpenseModal(exp);
    },
    editTemplate: function (id) {
      const tpl = state.recurringTemplates.find(t => t.id === id);
      if (tpl) openTemplateModal(tpl);
    },
    deleteTemplate: function (id) {
      if (confirm('Delete this recurring expense template?')) {
        state.recurringTemplates = state.recurringTemplates.filter(t => t.id !== id);
        saveData();
        render();
        showToast('Recurring template removed');
      }
    }
  };

  // --- Initialization & Event Listeners ---
  document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Service Worker registration skipped or failed:', err);
      });
    }

    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        state.activeTab = target;

        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.view-pane').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${target}`)?.classList.add('active');

        const fab = document.getElementById('mainFabBtn');
        if (fab) fab.style.display = target === 'expenses' ? 'flex' : 'none';
      });
    });

    // Month Stepper
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => changeMonth(1));

    // FAB Add Expense
    document.getElementById('mainFabBtn')?.addEventListener('click', () => openAddExpenseModal());
    document.getElementById('closeExpenseModalBtn')?.addEventListener('click', closeAddExpenseModal);
    document.getElementById('closeRecurringModalBtn')?.addEventListener('click', closeRecurringModal);

    // Expense Form Submit
    document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('formExpenseId').value;
      const tplId = document.getElementById('formExpenseTemplateId')?.value || null;
      const title = document.getElementById('formExpenseTitle').value.trim();
      const amount = parseFloat(document.getElementById('formExpenseAmount').value) || 0;
      const date = document.getElementById('formExpenseDate').value;
      const category = document.getElementById('formExpenseCategory').value;
      const paidBy = document.getElementById('formExpensePaidBy').value;
      const inSplitwise = document.getElementById('formExpenseInSplitwise').checked;
      const notes = document.getElementById('formExpenseNotes').value.trim();

      const month = date.substring(0, 7);

      if (!title || amount <= 0) {
        alert('Please enter a valid title and amount.');
        return;
      }

      if (id) {
        // Edit
        const exp = state.expenses.find(x => x.id === id);
        if (exp) {
          exp.title = title;
          exp.amount = amount;
          exp.date = date;
          exp.month = month;
          exp.category = category;
          exp.paidBy = paidBy;
          exp.inSplitwise = inSplitwise;
          exp.notes = notes;
        }
      } else {
        // New
        const newExp = {
          id: 'exp_' + Date.now(),
          title,
          amount,
          date,
          month,
          category,
          paidBy,
          split: 'equal',
          inSplitwise,
          isRecurring: Boolean(tplId),
          recurringTemplateId: tplId,
          notes
        };
        state.expenses.push(newExp);
      }

      // If added to another month, switch to it
      state.currentMonth = month;
      saveData();
      closeAddExpenseModal();
      render();
      showToast(id ? 'Expense updated' : 'Bill confirmed & added');
    });

    // Skip Bill for Current Month
    document.getElementById('formExpenseSkipBtn')?.addEventListener('click', () => {
      const tplId = document.getElementById('formExpenseTemplateId')?.value;
      if (tplId) {
        state.skippedRecurring = state.skippedRecurring || {};
        state.skippedRecurring[`${state.currentMonth}_${tplId}`] = true;
        saveData();
        closeAddExpenseModal();
        render();
        showToast('Bill skipped for this month');
      }
    });

    // Delete Expense
    document.getElementById('formExpenseDeleteBtn')?.addEventListener('click', () => {
      const id = document.getElementById('formExpenseId').value;
      if (id && confirm('Delete this expense?')) {
        state.expenses = state.expenses.filter(x => x.id !== id);
        saveData();
        closeAddExpenseModal();
        render();
        showToast('Expense deleted');
      }
    });

    // Recurring Submit
    document.getElementById('submitRecurringBatchBtn')?.addEventListener('click', submitRecurringModal);

    // Splitwise View Actions
    document.getElementById('copySplitwiseBtn')?.addEventListener('click', copySplitwiseSummary);
    document.getElementById('markAllSplitwiseBtn')?.addEventListener('click', markAllInSplitwise);

    // Splitwise View Filter Tabs
    document.querySelectorAll('.splitwise-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.splitwise-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.splitwiseFilter = chip.dataset.filter;
        renderSplitwiseView();
      });
    });

    // Expense List Filter Chips
    document.querySelectorAll('.expense-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.expense-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter = chip.dataset.filter;
        renderExpensesView();
      });
    });

    // Mini tracker in Hero card leads to Splitwise tab
    document.getElementById('heroSplitwiseTracker')?.addEventListener('click', () => {
      document.querySelector('.nav-tab[data-tab="splitwise"]')?.click();
    });

    // Settings Inputs
    document.getElementById('settingsUserName')?.addEventListener('change', (e) => {
      state.settings.userName = e.target.value.trim() || 'Shivam';
      saveData();
      render();
    });

    document.getElementById('settingsFlatmateName')?.addEventListener('change', (e) => {
      state.settings.flatmateName = e.target.value.trim() || 'Flatmate';
      saveData();
      render();
    });

    document.getElementById('settingsCurrency')?.addEventListener('change', (e) => {
      state.settings.currency = e.target.value.trim() || '₹';
      saveData();
      render();
    });

    // Add Template
    document.getElementById('addNewTemplateBtn')?.addEventListener('click', () => openTemplateModal());
    document.getElementById('closeTemplateModalBtn')?.addEventListener('click', closeTemplateModal);

    document.getElementById('templateForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('tplId').value;
      const title = document.getElementById('tplTitle').value.trim();
      const amount = parseFloat(document.getElementById('tplAmount').value) || 0;
      const dayOfMonth = Math.min(Math.max(parseInt(document.getElementById('tplDayOfMonth')?.value) || 1, 1), 31);
      const category = document.getElementById('tplCategory').value;
      const paidBy = document.getElementById('tplPaidBy').value;

      if (!title) return;

      if (id) {
        const tpl = state.recurringTemplates.find(t => t.id === id);
        if (tpl) {
          tpl.title = title;
          tpl.defaultAmount = amount;
          tpl.dayOfMonth = dayOfMonth;
          tpl.category = category;
          tpl.defaultPaidBy = paidBy;
        }
      } else {
        state.recurringTemplates.push({
          id: 't_' + Date.now(),
          title,
          category,
          defaultAmount: amount,
          dayOfMonth,
          defaultPaidBy: paidBy,
          active: true
        });
      }

      saveData();
      closeTemplateModal();
      render();
      showToast('Recurring template saved');
    });

    // Data Export & Import
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `hisaab_backup_${getTodayDateString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup downloaded');
    });

    document.getElementById('importDataInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported && Array.isArray(imported.expenses)) {
            state = { ...state, ...imported };
            saveData();
            render();
            showToast('Data imported successfully!');
          } else {
            alert('Invalid backup format.');
          }
        } catch (err) {
          alert('Could not parse backup JSON file.');
        }
      };
      reader.readAsText(file);
    });

    // Initial render
    render();
  });

})();
