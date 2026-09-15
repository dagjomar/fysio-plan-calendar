/**
 * app.js
 * Hovedapplikasjon for Akilles Senerehabilitering Treningskalender
 */

import {
  generatePlan,
  calculateStats,
  isDayFullyCompleted,
  formatDateKey,
  getMotivationalMessage,
  DEFAULT_EXERCISES
} from './tracker-core.js';

// Nøkkel for localStorage
const STORAGE_KEY = 'fysio_plan_akilles_storage_v1';

// Standard app-tilstand
let state = {
  completedDays: {},
  completedExercises: {},
  notes: {},
  customWeeklyExercises: {},
  theme: 'light',
  activeFilter: 'all'
};

// Start- og sluttdatoer for perioden (som spesifisert av bruker)
const START_DATE = '2026-09-12';
const END_DATE = '2026-10-12';
const START_REHAB_WEEK = 24;

let currentPlan = null;

/**
 * Laster tilstand fra localStorage
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    }
  } catch (err) {
    console.warn('Kunne ikke laste tilstand fra localStorage:', err);
  }
}

/**
 * Lagrer tilstand til localStorage
 */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Kunne ikke lagre tilstand til localStorage:', err);
  }
}

/**
 * Initialiserer kalenderplan og render
 */
function init() {
  loadState();

  // Initialiser tema
  const savedTheme = state.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  // Bygg planen
  rebuildPlan();

  // Sett opp event listeners
  setupEventListeners();

  // Render alt
  renderAll();
}

function rebuildPlan() {
  currentPlan = generatePlan(START_DATE, END_DATE, START_REHAB_WEEK, state.customWeeklyExercises);
}

/**
 * Påfør valgt tema
 */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveState();
}

/**
 * Setter opp lyttere for knapper og kontroller
 */
function setupEventListeners() {
  // Tema-bryter
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // Utskriftsknapp
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Nullstill-knapp
  const resetBtn = document.getElementById('resetCheckboxesBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Er du sikker på at du vil nullstille alle avkrysninger i treningsplanen?')) {
        state.completedDays = {};
        state.completedExercises = {};
        state.notes = {};
        saveState();
        renderAll();
      }
    });
  }

  // Filter-knapper
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderCalendar();
    });
  });

  // Modal for tilpasning av øvelser
  const editExercisesBtn = document.getElementById('editExercisesBtn');
  const exerciseModal = document.getElementById('exerciseModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalWeekSelect = document.getElementById('modalWeekSelect');
  const saveExercisesBtn = document.getElementById('saveExercisesBtn');
  const restoreDefaultBtn = document.getElementById('restoreDefaultExercisesBtn');

  if (editExercisesBtn && exerciseModal) {
    editExercisesBtn.addEventListener('click', () => {
      populateModalExercises(modalWeekSelect.value);
      exerciseModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
      exerciseModal.classList.add('hidden');
    });

    modalWeekSelect.addEventListener('change', () => {
      populateModalExercises(modalWeekSelect.value);
    });

    saveExercisesBtn.addEventListener('click', () => {
      saveModalExercises(modalWeekSelect.value);
      exerciseModal.classList.add('hidden');
      rebuildPlan();
      saveState();
      renderAll();
    });

    restoreDefaultBtn.addEventListener('click', () => {
      const weekIdx = parseInt(modalWeekSelect.value, 10);
      if (confirm(`Vil du tilbakestille øvelsene for uke ${START_REHAB_WEEK + weekIdx} til standard?`)) {
        delete state.customWeeklyExercises[weekIdx];
        saveState();
        rebuildPlan();
        populateModalExercises(weekIdx);
        renderAll();
      }
    });
  }
}

/**
 * Fyller ut øvelsesskjemaet i modalen for en valgt uke
 */
function populateModalExercises(weekIndexStr) {
  const weekIdx = parseInt(weekIndexStr, 10);
  const container = document.getElementById('modalExercisesForm');
  if (!container) return;

  const currentExs = state.customWeeklyExercises[weekIdx] || DEFAULT_EXERCISES[Math.min(weekIdx, 3)];

  container.innerHTML = '';
  currentExs.forEach((ex, idx) => {
    const card = document.createElement('div');
    card.className = 'exercise-form-card';
    card.innerHTML = `
      <h4>Øvelse ${idx + 1}</h4>
      <div class="form-group">
        <label>Navn på øvelse:</label>
        <input type="text" class="modal-ex-name" data-idx="${idx}" value="${escapeHtml(ex.name)}" />
      </div>
      <div class="form-group">
        <label>Mål / Sett x Repetisjoner / Belastning:</label>
        <input type="text" class="modal-ex-target" data-idx="${idx}" value="${escapeHtml(ex.target)}" />
      </div>
      <div class="form-group">
        <label>Instruksjon / Tips / Fokusområde:</label>
        <textarea class="modal-ex-desc" data-idx="${idx}" rows="2">${escapeHtml(ex.description)}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Lagrer endringer fra modalen inn i state
 */
function saveModalExercises(weekIndexStr) {
  const weekIdx = parseInt(weekIndexStr, 10);
  const names = document.querySelectorAll('.modal-ex-name');
  const targets = document.querySelectorAll('.modal-ex-target');
  const descs = document.querySelectorAll('.modal-ex-desc');

  const updated = [];
  names.forEach((nameInput, i) => {
    updated.push({
      id: `ex-${i + 1}`,
      name: nameInput.value.trim() || `Øvelse ${i + 1}`,
      target: targets[i].value.trim() || '3 sett',
      description: descs[i].value.trim()
    });
  });

  if (!state.customWeeklyExercises) {
    state.customWeeklyExercises = {};
  }
  state.customWeeklyExercises[weekIdx] = updated;
}

/**
 * Hovedrender-funksjon
 */
function renderAll() {
  renderStats();
  renderCalendar();
}

/**
 * Oppdaterer statistikk- og fremdriftsseksjonen
 */
function renderStats() {
  const stats = calculateStats(currentPlan, state);

  // Antall fullførte
  const completedCountEl = document.getElementById('completedCount');
  if (completedCountEl) {
    completedCountEl.textContent = `${stats.completedWorkouts} / ${stats.totalWorkouts}`;
  }

  // Prosent
  const completedPercentageEl = document.getElementById('completedPercentage');
  if (completedPercentageEl) {
    completedPercentageEl.textContent = `${stats.percentage}% av perioden`;
  }

  // Gjenstående
  const remainingCountEl = document.getElementById('remainingCount');
  if (remainingCountEl) {
    remainingCountEl.textContent = `${stats.remainingWorkouts}`;
  }

  // Streak
  const currentStreakEl = document.getElementById('currentStreak');
  if (currentStreakEl) {
    currentStreakEl.textContent = `${stats.maxStreak} ${stats.maxStreak === 1 ? 'økt' : 'økter'}`;
  }

  // Fremdriftslinje
  const progressFillEl = document.getElementById('progressFill');
  const progressTextEl = document.getElementById('progressText');
  if (progressFillEl && progressTextEl) {
    progressFillEl.style.width = `${stats.percentage}%`;
    progressTextEl.textContent = `${stats.percentage}% fullført (${stats.completedWorkouts} av ${stats.totalWorkouts} økter)`;
  }

  // Motivasjonstekst
  const motivationTextEl = document.getElementById('motivationText');
  if (motivationTextEl) {
    motivationTextEl.textContent = getMotivationalMessage(stats.percentage);
  }

  // Neste treningsdag
  renderNextWorkoutInfo();
}

/**
 * Viser informasjon om neste ufullførte treningsdag
 */
function renderNextWorkoutInfo() {
  const nextWorkoutDayEl = document.getElementById('nextWorkoutDay');
  const daysUntilNextEl = document.getElementById('daysUntilNext');
  if (!nextWorkoutDayEl || !daysUntilNextEl) return;

  const workoutDays = currentPlan.days.filter(d => d.isWorkoutDay);
  const nextDay = workoutDays.find(d => !isDayFullyCompleted(d, state));

  if (!nextDay) {
    nextWorkoutDayEl.textContent = 'Fullført! 🎉';
    daysUntilNextEl.textContent = 'Alle 16 økter er i boks!';
    return;
  }

  nextWorkoutDayEl.textContent = nextDay.formattedDateShort;

  const todayKey = formatDateKey(new Date());
  if (nextDay.dateKey === todayKey) {
    daysUntilNextEl.textContent = 'Dagens økt! 💪';
  } else if (nextDay.dateKey < todayKey) {
    daysUntilNextEl.textContent = 'Planlagt økt (klar for avkrysning)';
  } else {
    daysUntilNextEl.textContent = `Økt #${nextDay.workoutNumber}`;
  }
}

/**
 * Bygger opp kalenderen og ukene
 */
function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  if (!container) return;

  container.innerHTML = '';

  const filter = state.activeFilter;

  currentPlan.weeks.forEach((week, weekIdx) => {
    // Sjekk filter
    if (filter === 'week-0' && weekIdx !== 0) return;
    if (filter === 'week-1' && weekIdx !== 1) return;
    if (filter === 'week-2' && weekIdx !== 2) return;
    if (filter === 'week-3' && weekIdx < 3) return;

    // Filtrer dager innenfor uken
    let daysToShow = week.days;
    if (filter === 'workout-only') {
      daysToShow = week.days.filter(d => d.isWorkoutDay);
      if (daysToShow.length === 0) return;
    }

    // Uke-wrapper
    const weekEl = document.createElement('div');
    weekEl.className = 'week-group';

    // Beregn ukesfullføring
    const weekWorkoutDays = week.days.filter(d => d.isWorkoutDay);
    const weekCompletedDays = weekWorkoutDays.filter(d => isDayFullyCompleted(d, state));
    const isWeekDone = weekWorkoutDays.length > 0 && weekCompletedDays.length === weekWorkoutDays.length;

    // Uke-header
    weekEl.innerHTML = `
      <div class="week-header">
        <div class="week-title-area">
          <h2 class="week-title">${week.title}</h2>
          <span class="week-badge ${isWeekDone ? 'completed' : ''}">
            ${isWeekDone ? '✅ Uke fullført!' : `${weekCompletedDays.length} av ${weekWorkoutDays.length} økter`}
          </span>
        </div>
      </div>
      <div class="week-days-grid" id="weekGrid-${weekIdx}"></div>
    `;

    container.appendChild(weekEl);

    // Legg til dager
    const gridEl = weekEl.querySelector(`#weekGrid-${weekIdx}`);
    daysToShow.forEach(day => {
      const card = createDayCard(day);
      gridEl.appendChild(card);
    });
  });
}

/**
 * Lager et visuelt kort for en enkelt dag (trening eller hvile)
 */
function createDayCard(day) {
  const card = document.createElement('div');
  const isDone = isDayFullyCompleted(day, state);

  if (day.isWorkoutDay) {
    card.className = `day-card workout-day ${isDone ? 'completed' : ''}`;
    card.dataset.dateKey = day.dateKey;

    const dayNotes = state.notes[day.dateKey] || '';
    const dayExs = state.completedExercises[day.dateKey] || {};

    let exercisesHtml = '';
    day.exercises.forEach((ex, idx) => {
      const isExChecked = !!dayExs[ex.id];
      exercisesHtml += `
        <label class="exercise-item ${isExChecked ? 'checked' : ''}" data-ex-id="${ex.id}">
          <input 
            type="checkbox" 
            class="exercise-checkbox" 
            data-date-key="${day.dateKey}" 
            data-ex-id="${ex.id}" 
            ${isExChecked ? 'checked' : ''}
          />
          <div class="exercise-details">
            <div class="exercise-name">${escapeHtml(ex.name)}</div>
            <span class="exercise-target">${escapeHtml(ex.target)}</span>
            <div class="exercise-desc">${escapeHtml(ex.description)}</div>
          </div>
        </label>
      `;
    });

    card.innerHTML = `
      <div class="day-card-header">
        <div class="day-date-info">
          <span class="day-number-label">${day.formattedDate}</span>
          <span class="day-date-sub">Uke ${day.rehabWeek} · Dag ${day.index + 1}</span>
        </div>
        <span class="day-tag workout-tag">
          ${isDone ? 'Fullført ✓' : `Økt #${day.workoutNumber}`}
        </span>
      </div>

      <div class="day-master-toggle" data-date-key="${day.dateKey}" title="Trykk for å fullføre alle 3 øvelser">
        <span>${isDone ? '✓ Alle 3 øvelser fullført' : 'Marker hele dagen som fullført'}</span>
        <span>${isDone ? '🎉' : '👉'}</span>
      </div>

      <div class="exercises-list">
        ${exercisesHtml}
      </div>

      <div class="workout-note-area no-print">
        <input 
          type="text" 
          class="workout-note-input" 
          data-date-key="${day.dateKey}" 
          placeholder="Notat / kg belastning / smerte (0-10)..." 
          value="${escapeHtml(dayNotes)}"
        />
      </div>
    `;

    // Event listeners for treningskort
    const checkboxes = card.querySelectorAll('.exercise-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const dateKey = e.target.dataset.dateKey;
        const exId = e.target.dataset.exId;
        const checked = e.target.checked;

        if (!state.completedExercises[dateKey]) {
          state.completedExercises[dateKey] = {};
        }
        state.completedExercises[dateKey][exId] = checked;

        // Sjekk om alle øvelser er fullført
        const allCompleted = day.exercises.every(ex => !!state.completedExercises[dateKey][ex.id]);
        if (allCompleted) {
          state.completedDays[dateKey] = true;
          triggerConfetti();
          triggerVibration();
        } else {
          delete state.completedDays[dateKey];
        }

        saveState();
        renderAll();
      });
    });

    // Master toggle for hele dagen
    const masterToggle = card.querySelector('.day-master-toggle');
    if (masterToggle) {
      masterToggle.addEventListener('click', () => {
        const currentDone = isDayFullyCompleted(day, state);
        const newDone = !currentDone;

        state.completedDays[day.dateKey] = newDone;
        if (!state.completedExercises[day.dateKey]) {
          state.completedExercises[day.dateKey] = {};
        }

        day.exercises.forEach(ex => {
          state.completedExercises[day.dateKey][ex.id] = newDone;
        });

        if (newDone) {
          triggerConfetti();
          triggerVibration();
        }

        saveState();
        renderAll();
      });
    }

    // Notat-felt
    const noteInput = card.querySelector('.workout-note-input');
    if (noteInput) {
      noteInput.addEventListener('input', (e) => {
        state.notes[day.dateKey] = e.target.value;
        saveState();
      });
    }

  } else {
    // Hviledagskort
    card.className = 'day-card rest-day';
    card.innerHTML = `
      <div class="day-card-header">
        <div class="day-date-info">
          <span class="day-number-label">${day.formattedDate}</span>
          <span class="day-date-sub">Uke ${day.rehabWeek} · Dag ${day.index + 1}</span>
        </div>
        <span class="day-tag rest-tag">Hviledag</span>
      </div>

      <div class="rest-day-content">
        <div class="rest-icon">🧘‍♂️</div>
        <div class="rest-title">Restitusjon & Senetilheling</div>
        <p class="rest-desc">
          Superkompensasjon pågår. Kollagenfibrene i akillessenen styrkes i hvilefasen. 
          Gå rolige turer og unngå eksplosiv belastning.
        </p>
      </div>
    `;
  }

  return card;
}

/**
 * XSS-sikring av strenger
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Enkel og morsom konfetti-animasjon på canvas
 */
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
      y: window.innerHeight / 3 + (Math.random() - 0.5) * 150,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -10 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.35,
      alpha: 1
    });
  }

  let animationFrame;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        active = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

/**
 * Enkel haptisk feedback for mobilbruk
 */
function triggerVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch (e) {}
  }
}

// Start appen når DOM er klar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    registerServiceWorker();
  });
} else {
  init();
  registerServiceWorker();
}

/**
 * Registrer Service Worker for PWA og offline-bruk på mobil
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('ServiceWorker registrering feilet (normalt i ubeskyttet dev-miljø):', err);
      });
    });
  }
}
