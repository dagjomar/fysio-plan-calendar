/**
 * app.js
 * Forenklet og kompakt treningsapplikasjon for Akilles Senerehabilitering
 */

import {
  generatePlan,
  calculateStats,
  isDayFullyCompleted,
  formatDateKey,
  formatNorwegianDate,
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
  selectedDateKey: null
};

// Start- og sluttdatoer for perioden (Starter tirsdag 15. september)
const START_DATE = '2026-09-15';
const END_DATE = '2026-10-15';
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
 * Initialiserer appen
 */
function init() {
  loadState();

  // Initialiser tema
  const savedTheme = state.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  // Bygg planen
  rebuildPlan();

  // Bestem innledende valgt dag
  const todayKey = formatDateKey(new Date());
  const foundToday = currentPlan.days.find(d => d.dateKey === todayKey);
  
  if (state.selectedDateKey && currentPlan.days.some(d => d.dateKey === state.selectedDateKey)) {
    // Behold lagret valgt dag
  } else if (foundToday) {
    state.selectedDateKey = foundToday.dateKey;
  } else {
    // Standard er første dag i perioden (15. sep)
    state.selectedDateKey = currentPlan.days[0].dateKey;
  }

  setupEventListeners();
  renderAll();
}

function rebuildPlan() {
  currentPlan = generatePlan(START_DATE, END_DATE, START_REHAB_WEEK, state.customWeeklyExercises);
}

/**
 * Påfør tema
 */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveState();
}

/**
 * Event listeners
 */
function setupEventListeners() {
  // Tema-veksler
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // Info toggle / åpne prinsipper
  const infoToggleBtn = document.getElementById('infoToggleBtn');
  const principlesAccordion = document.getElementById('principlesAccordion');
  if (infoToggleBtn && principlesAccordion) {
    infoToggleBtn.addEventListener('click', () => {
      principlesAccordion.open = !principlesAccordion.open;
      if (principlesAccordion.open) {
        principlesAccordion.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Nullstill avkrysninger
  const resetBtn = document.getElementById('resetCheckboxesBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Vil du nullstille alle avkrysninger i treningsplanen?')) {
        state.completedDays = {};
        state.completedExercises = {};
        state.notes = {};
        saveState();
        renderAll();
      }
    });
  }

  // Dag-velger knapper
  const prevDayBtn = document.getElementById('prevDayBtn');
  if (prevDayBtn) {
    prevDayBtn.addEventListener('click', () => {
      stepDay(-1);
    });
  }

  const nextDayBtn = document.getElementById('nextDayBtn');
  if (nextDayBtn) {
    nextDayBtn.addEventListener('click', () => {
      stepDay(1);
    });
  }

  const todayJumpBtn = document.getElementById('todayJumpBtn');
  if (todayJumpBtn) {
    todayJumpBtn.addEventListener('click', () => {
      const todayKey = formatDateKey(new Date());
      const hasToday = currentPlan.days.find(d => d.dateKey === todayKey);
      if (hasToday) {
        selectDate(todayKey);
      } else {
        // Hvis i dag er utenfor intervallet, velg dag 1
        selectDate(currentPlan.days[0].dateKey);
      }
    });
  }

  // Modal for tilpasning av øvelser
  setupModalListeners();
}

function stepDay(offset) {
  const currentIndex = currentPlan.days.findIndex(d => d.dateKey === state.selectedDateKey);
  if (currentIndex === -1) return;
  const newIndex = currentIndex + offset;
  if (newIndex >= 0 && newIndex < currentPlan.days.length) {
    selectDate(currentPlan.days[newIndex].dateKey);
  }
}

function selectDate(dateKey) {
  state.selectedDateKey = dateKey;
  saveState();
  renderHeatmap();
  renderSelectedDayView();
}

function setupModalListeners() {
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
        if (state.customWeeklyExercises) {
          delete state.customWeeklyExercises[weekIdx];
        }
        saveState();
        rebuildPlan();
        populateModalExercises(weekIdx);
        renderAll();
      }
    });
  }
}

function populateModalExercises(weekIndexStr) {
  const weekIdx = parseInt(weekIndexStr, 10);
  const container = document.getElementById('modalExercisesForm');
  if (!container) return;

  const currentExs = (state.customWeeklyExercises && state.customWeeklyExercises[weekIdx]) || DEFAULT_EXERCISES[Math.min(weekIdx, 3)];

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
        <label>Mål / Sett x Repetisjoner:</label>
        <input type="text" class="modal-ex-target" data-idx="${idx}" value="${escapeHtml(ex.target)}" />
      </div>
      <div class="form-group">
        <label>Instruksjon / Tips:</label>
        <input type="text" class="modal-ex-desc" data-idx="${idx}" value="${escapeHtml(ex.description)}" />
      </div>
    `;
    container.appendChild(card);
  });
}

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
 * Hovedrender
 */
function renderAll() {
  renderHeaderStats();
  renderHeatmap();
  renderSelectedDayView();
}

/**
 * Oppdaterer topplinjestatistikk
 */
function renderHeaderStats() {
  const stats = calculateStats(currentPlan, state);
  const label = document.getElementById('compactProgressLabel');
  if (label) {
    label.textContent = `${stats.completedWorkouts} av ${stats.totalWorkouts} fullført (${stats.percentage}%)`;
  }
}

/**
 * Git commit-style heatmap rutenett
 */
function renderHeatmap() {
  const grid = document.getElementById('heatmapGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const todayKey = formatDateKey(new Date());

  currentPlan.days.forEach(day => {
    const isCompleted = isDayFullyCompleted(day, state);
    const isSelected = day.dateKey === state.selectedDateKey;
    const isToday = day.dateKey === todayKey;

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'heat-box';
    cell.dataset.dateKey = day.dateKey;

    // Bestem statusklasse
    if (day.isWorkoutDay) {
      if (isCompleted) {
        cell.classList.add('status-completed');
      } else {
        cell.classList.add('status-workout');
      }
    } else {
      cell.classList.add('status-rest');
    }

    if (isSelected) {
      cell.classList.add('is-selected');
    }
    if (isToday) {
      cell.classList.add('is-today');
    }

    // Innhold i firkanten: kort ukedag og dagnummer (f.eks. Ti 15)
    const dayShortNor = day.dayNameShort.slice(0, 2);
    cell.innerHTML = `
      <span class="heat-day">${dayShortNor}</span>
      <span class="heat-num">${day.dayNumber}</span>
      ${isCompleted ? '<span class="heat-check">✓</span>' : ''}
    `;

    // Tooltip / tittel for firkanten
    let tooltip = `${day.formattedDate}: `;
    if (day.isWorkoutDay) {
      tooltip += isCompleted ? `Økt #${day.workoutNumber} (Fullført ✓)` : `Økt #${day.workoutNumber} (Planlagt)`;
    } else {
      tooltip += 'Hviledag / restitusjon';
    }
    cell.title = tooltip;
    cell.setAttribute('aria-label', tooltip);

    cell.addEventListener('click', () => {
      selectDate(day.dateKey);
    });

    grid.appendChild(cell);
  });
}

/**
 * Viser detaljer og sjekkbokser for aktivt valgt dag
 */
function renderSelectedDayView() {
  const day = currentPlan.days.find(d => d.dateKey === state.selectedDateKey) || currentPlan.days[0];
  const isCompleted = isDayFullyCompleted(day, state);
  const todayKey = formatDateKey(new Date());
  const isToday = day.dateKey === todayKey;

  // Oppdater tittel og undertittel i navbaren
  const titleEl = document.getElementById('selectedDayTitle');
  const subEl = document.getElementById('selectedDaySub');
  const todayChip = document.getElementById('todayJumpBtn');

  if (titleEl) {
    titleEl.textContent = day.formattedDate;
  }

  if (subEl) {
    if (day.isWorkoutDay) {
      subEl.innerHTML = `Uke ${day.rehabWeek} · <strong>Økt ${day.workoutNumber} av 16</strong>${isCompleted ? ' · <span class="tag-done">Fullført ✓</span>' : ''}`;
    } else {
      subEl.innerHTML = `Uke ${day.rehabWeek} · <strong>Hviledag / restitusjon</strong>`;
    }
  }

  if (todayChip) {
    if (isToday) {
      todayChip.classList.add('active-today');
      todayChip.textContent = 'I dag 📍';
    } else {
      todayChip.classList.remove('active-today');
      todayChip.textContent = 'Gå til i dag';
    }
  }

  // Deaktiver forrige/neste-knapp dersom vi er i ytterkant
  const dayIndex = currentPlan.days.findIndex(d => d.dateKey === day.dateKey);
  const prevBtn = document.getElementById('prevDayBtn');
  const nextBtn = document.getElementById('nextDayBtn');
  if (prevBtn) prevBtn.disabled = dayIndex === 0;
  if (nextBtn) nextBtn.disabled = dayIndex === currentPlan.days.length - 1;

  // Render kortets innhold
  const card = document.getElementById('dayActionCard');
  if (!card) return;

  if (day.isWorkoutDay) {
    const dayExs = (state.completedExercises && state.completedExercises[day.dateKey]) || {};
    const note = (state.notes && state.notes[day.dateKey]) || '';

    let rowsHtml = '';
    day.exercises.forEach((ex, idx) => {
      const isChecked = !!dayExs[ex.id];
      rowsHtml += `
        <label class="compact-ex-row ${isChecked ? 'row-checked' : ''}" data-ex-id="${ex.id}">
          <input 
            type="checkbox" 
            class="compact-ex-check" 
            data-date-key="${day.dateKey}" 
            data-ex-id="${ex.id}" 
            ${isChecked ? 'checked' : ''}
          />
          <span class="ex-idx">${idx + 1}</span>
          <span class="ex-main-text" title="${escapeHtml(ex.description)}">
            <strong class="ex-name">${escapeHtml(ex.name)}</strong>
            <span class="ex-target">${escapeHtml(ex.target)}</span>
          </span>
        </label>
      `;
    });

    card.className = `day-action-card workout ${isCompleted ? 'is-completed' : ''}`;
    card.innerHTML = `
      <div class="card-action-bar">
        <button 
          id="toggleWorkoutDoneBtn" 
          class="btn-master-toggle ${isCompleted ? 'btn-completed' : 'btn-pending'}"
          data-date-key="${day.dateKey}"
        >
          ${isCompleted ? '✓ Trening fullført!' : '⚡ Marker trening som fullført'}
        </button>
      </div>

      <div class="compact-exercises-list">
        ${rowsHtml}
      </div>

      <div class="compact-note-line">
        <input 
          type="text" 
          id="compactDayNote" 
          class="compact-note-input" 
          data-date-key="${day.dateKey}" 
          placeholder="Notat for økten (f.eks. +5 kg i sekk, smerte 2/10)..." 
          value="${escapeHtml(note)}" 
        />
      </div>
    `;

    // Sjekkboks event handlers
    const checks = card.querySelectorAll('.compact-ex-check');
    checks.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const dateKey = e.target.dataset.dateKey;
        const exId = e.target.dataset.exId;
        const checked = e.target.checked;

        if (!state.completedExercises[dateKey]) {
          state.completedExercises[dateKey] = {};
        }
        state.completedExercises[dateKey][exId] = checked;

        // Hvis alle øvelsene er krysset av, sett dagen som fullført
        const allDone = day.exercises.every(ex => !!state.completedExercises[dateKey][ex.id]);
        if (allDone) {
          state.completedDays[dateKey] = true;
          triggerConfetti();
          triggerVibration();
        } else {
          delete state.completedDays[dateKey];
        }

        saveState();
        renderHeaderStats();
        renderHeatmap();
        renderSelectedDayView();
      });
    });

    // Marker hele treningen som fullført knapp
    const masterBtn = card.querySelector('#toggleWorkoutDoneBtn');
    if (masterBtn) {
      masterBtn.addEventListener('click', () => {
        const currentlyDone = isDayFullyCompleted(day, state);
        const nextDone = !currentlyDone;

        state.completedDays[day.dateKey] = nextDone;
        if (!state.completedExercises[day.dateKey]) {
          state.completedExercises[day.dateKey] = {};
        }

        day.exercises.forEach(ex => {
          state.completedExercises[day.dateKey][ex.id] = nextDone;
        });

        if (nextDone) {
          triggerConfetti();
          triggerVibration();
        }

        saveState();
        renderHeaderStats();
        renderHeatmap();
        renderSelectedDayView();
      });
    }

    // Notat-input
    const noteInput = card.querySelector('#compactDayNote');
    if (noteInput) {
      noteInput.addEventListener('input', (e) => {
        if (!state.notes) state.notes = {};
        state.notes[day.dateKey] = e.target.value;
        saveState();
      });
    }

  } else {
    // Hviledagskort
    card.className = 'day-action-card rest';
    card.innerHTML = `
      <div class="rest-row">
        <span class="rest-badge-icon">🌿</span>
        <div class="rest-row-body">
          <div class="rest-row-title">Hviledag & Superkompensasjon</div>
          <div class="rest-row-text">
            Senen restituerer og danner nytt kollagen i 36–48 timer etter forrige økt. Ingen tung belastning i dag.
          </div>
        </div>
      </div>
    `;
  }
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
 * Konfetti ved fullføring
 */
let confettiAnimId = null;
let confettiSafetyTimeout = null;

function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Stopp eventuell pågående animasjon og sikkerhetstimer
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
  }
  if (confettiSafetyTimeout) {
    clearTimeout(confettiSafetyTimeout);
    confettiSafetyTimeout = null;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const particles = [];
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

  for (let i = 0; i < 45; i++) {
    particles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight / 3,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * -8 - 3,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.35,
      alpha: 1
    });
  }

  function cleanUp() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    if (confettiSafetyTimeout) {
      clearTimeout(confettiSafetyTimeout);
      confettiSafetyTimeout = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Sikkerhetsutløp slik at konfetti forsvinner selv ved bakgrunnsfane
  confettiSafetyTimeout = setTimeout(cleanUp, 3000);

  function animate() {
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          active = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (active) {
        confettiAnimId = requestAnimationFrame(animate);
      } else {
        cleanUp();
      }
    } catch (err) {
      console.error('Konfetti animasjonsfeil:', err);
      cleanUp();
    }
  }

  confettiAnimId = requestAnimationFrame(animate);
}

/**
 * Haptisk tilbakemelding
 */
function triggerVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([30, 40, 30]);
    } catch (e) {}
  }
}

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    registerServiceWorker();
  });
} else {
  init();
  registerServiceWorker();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.log('ServiceWorker registrering feilet:', err);
      });
    });
  }
}
