/**
 * tests/tracker-core.test.js
 * Enhetstester for opptreningstrackeren
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePlan,
  calculateStats,
  isDayFullyCompleted,
  hasDayNote,
  formatNorwegianDate,
  formatDateKey,
  getMotivationalMessage,
  DEFAULT_EXERCISES
} from '../tracker-core.js';

test('generatePlan genererer riktig antall dager og uker fra 15. sep til 15. okt som standard', () => {
  const plan = generatePlan('2026-09-15', '2026-10-15', 24);

  // 15. sep til 15. okt er 31 dager (16 dager i sep: 15-30 + 15 dager i okt: 1-15)
  assert.equal(plan.days.length, 31);
  assert.equal(plan.totalDays, 31);

  // Annenhver dag: dag 0, 2, 4, 6... 30 -> 16 treningsdager
  assert.equal(plan.totalWorkoutDays, 16);
  assert.equal(plan.totalRestDays, 15);

  // Første dag er 15. sep (tirsdag) og skal være treningsdag
  assert.equal(plan.days[0].dateKey, '2026-09-15');
  assert.equal(plan.days[0].dayName, 'Tirsdag');
  assert.equal(plan.days[0].isWorkoutDay, true);
  assert.equal(plan.days[0].workoutNumber, 1);
  assert.equal(plan.days[0].exercises.length, 3);

  // Andre dag er 16. sep (onsdag) og skal være hviledag
  assert.equal(plan.days[1].dateKey, '2026-09-16');
  assert.equal(plan.days[1].dayName, 'Onsdag');
  assert.equal(plan.days[1].isWorkoutDay, false);
  assert.equal(plan.days[1].workoutNumber, null);
  assert.equal(plan.days[1].exercises.length, 0);

  // Siste dag er 15. okt og skal være treningsdag (dag 30)
  assert.equal(plan.days[30].dateKey, '2026-10-15');
  assert.equal(plan.days[30].isWorkoutDay, true);
  assert.equal(plan.days[30].workoutNumber, 16);

  // Skal ha 5 ukesbolker (Uke 24, 25, 26, 27, 28)
  assert.ok(plan.weeks.length >= 4);
  assert.equal(plan.weeks[0].rehabWeek, 24);
});

test('calculateStats beregner fullførte økter og prosentandel korrekt', () => {
  const plan = generatePlan('2026-09-15', '2026-10-15', 24);
  
  // Tom tilstand
  const emptyStats = calculateStats(plan, {});
  assert.equal(emptyStats.completedWorkouts, 0);
  assert.equal(emptyStats.percentage, 0);
  assert.equal(emptyStats.totalWorkouts, 16);

  // Marker første dag (15. sep) fullført via completedDays
  const state1 = {
    completedDays: {
      '2026-09-15': true
    }
  };
  const stats1 = calculateStats(plan, state1);
  assert.equal(stats1.completedWorkouts, 1);
  assert.equal(stats1.percentage, 6); // 1 / 16 = 6.25% -> 6%

  // Marker andre treningsdag (17. sep) ved å krysse av alle 3 øvelser
  const state2 = {
    completedDays: {
      '2026-09-15': true
    },
    completedExercises: {
      '2026-09-17': {
        'ex-1': true,
        'ex-2': true,
        'ex-3': true
      }
    }
  };
  const stats2 = calculateStats(plan, state2);
  assert.equal(stats2.completedWorkouts, 2);
  assert.equal(stats2.percentage, 13); // 2 / 16 = 12.5% -> 13%

  // Delvis fullført økt (kun 2 av 3 øvelser) skal ikke telle som fullført dag hvis ikke eksplisitt markert
  const state3 = {
    completedExercises: {
      '2026-09-19': {
        'ex-1': true,
        'ex-2': true
      }
    }
  };
  const stats3 = calculateStats(plan, state3);
  assert.equal(stats3.completedWorkouts, 0);
});

test('Flere skift og tilbakestilling av skipped dager', () => {
  // To skift:
  // Dag 0 (15. sep): Trening #1
  // Dag 1 (16. sep): Hvile
  // Dag 2 (17. sep): Skift 1 -> blir skip. Dag 3 (18. sep) blir Trening #2. Dag 4 (19. sep) blir Hvile.
  // Dag 5 (20. sep): Trening #3.
  // Hvis Dag 3 (18. sep) også skiftes:
  // Dag 3 blir skip. Dag 4 (19. sep) blir Trening #2. Dag 5 (20. sep) blir Hvile. Dag 6 (21. sep) blir Trening #3.
  const skippedDays = {
    '2026-09-17': 'shift',
    '2026-09-18': 'shift'
  };

  const plan = generatePlan('2026-09-15', '2026-10-15', 24, {}, skippedDays);

  assert.equal(plan.days[0].isWorkoutDay, true); // 15. sep
  assert.equal(plan.days[1].isWorkoutDay, false); // 16. sep
  assert.equal(plan.days[2].isSkipped, true); // 17. sep skipped
  assert.equal(plan.days[3].isSkipped, true); // 18. sep skipped
  assert.equal(plan.days[4].isWorkoutDay, true); // 19. sep Trening #2
  assert.equal(plan.days[4].workoutNumber, 2);
  assert.equal(plan.days[5].isWorkoutDay, false); // 20. sep Hvile
  assert.equal(plan.days[6].isWorkoutDay, true); // 21. sep Trening #3
  assert.equal(plan.days[6].workoutNumber, 3);
});

test('isDayFullyCompleted fungerer for både hele dager og individuelle øvelser', () => {
  const plan = generatePlan('2026-09-15', '2026-10-15', 24);
  const day0 = plan.days[0]; // 15. sep
  const day1 = plan.days[1]; // 16. sep (hviledag)

  assert.equal(isDayFullyCompleted(day1, {}), false);

  const state = {
    completedExercises: {
      '2026-09-15': {
        'ex-1': true,
        'ex-2': true,
        'ex-3': true
      }
    }
  };
  assert.equal(isDayFullyCompleted(day0, state), true);
});

test('Overstyring av ukesøvelser fungerer som forventet', () => {
  const customExercises = {
    1: [
      { id: 'c1', name: 'Spesialøvelse A', description: 'Test', target: '3x10' },
      { id: 'c2', name: 'Spesialøvelse B', description: 'Test', target: '3x10' },
      { id: 'c3', name: 'Spesialøvelse C', description: 'Test', target: '3x10' }
    ]
  };

  const plan = generatePlan('2026-09-12', '2026-10-12', 24, customExercises);
  const week2WorkoutDay = plan.weeks[1].days.find(d => d.isWorkoutDay);

  assert.equal(week2WorkoutDay.exercises[0].name, 'Spesialøvelse A');
  assert.equal(week2WorkoutDay.exercises[1].name, 'Spesialøvelse B');
  assert.equal(week2WorkoutDay.exercises[2].name, 'Spesialøvelse C');
});

test('formatNorwegianDate formaterer datoer korrekt', () => {
  const d = new Date(2026, 8, 12); // 12. september 2026
  assert.equal(formatNorwegianDate(d), 'Lørdag 12. september');
  assert.equal(formatNorwegianDate(d, true), 'Lør 12. sep');
});

test('getMotivationalMessage gir oppmuntrende meldinger', () => {
  assert.ok(getMotivationalMessage(0).length > 10);
  assert.ok(getMotivationalMessage(50).includes('halvveis') || getMotivationalMessage(50).length > 10);
  assert.ok(getMotivationalMessage(100).includes('100%'));
});

test('generatePlan med hoppet over dag (skip and don\'t move)', () => {
  // Standard plan:
  // 15. sep (dag 0): treningsdag #1
  // 16. sep (dag 1): hviledag
  // 17. sep (dag 2): treningsdag #2
  // 18. sep (dag 3): hviledag
  // 19. sep (dag 4): treningsdag #3
  const skippedDays = {
    '2026-09-17': 'no-shift' // Hopp over 17. sep uten å flytte resten
  };

  const plan = generatePlan('2026-09-15', '2026-10-15', 24, {}, skippedDays);
  
  // Dag 0 (15. sep): treningsdag #1
  assert.equal(plan.days[0].dateKey, '2026-09-15');
  assert.equal(plan.days[0].isWorkoutDay, true);
  assert.equal(plan.days[0].workoutNumber, 1);

  // Dag 1 (16. sep): hviledag
  assert.equal(plan.days[1].dateKey, '2026-09-16');
  assert.equal(plan.days[1].isWorkoutDay, false);
  assert.equal(plan.days[1].isSkipped, false);

  // Dag 2 (17. sep): hoppet over (ikke treningsdag)
  assert.equal(plan.days[2].dateKey, '2026-09-17');
  assert.equal(plan.days[2].isWorkoutDay, false);
  assert.equal(plan.days[2].isSkipped, true);
  assert.equal(plan.days[2].skipOption, 'no-shift');
  assert.equal(plan.days[2].workoutNumber, null);

  // Dag 3 (18. sep): forblir hviledag fordi vi valgte no-shift
  assert.equal(plan.days[3].dateKey, '2026-09-18');
  assert.equal(plan.days[3].isWorkoutDay, false);
  assert.equal(plan.days[3].isSkipped, false);

  // Dag 4 (19. sep): forblir treningsdag, men nå treningsdag #2
  assert.equal(plan.days[4].dateKey, '2026-09-19');
  assert.equal(plan.days[4].isWorkoutDay, true);
  assert.equal(plan.days[4].workoutNumber, 2);

  assert.equal(plan.totalSkippedDays, 1);
  assert.equal(plan.totalWorkoutDays, 15);
});

test('generatePlan med hoppet over dag og forskyvning (skip and move all from here)', () => {
  // Standard plan:
  // 15. sep (dag 0): treningsdag #1
  // 16. sep (dag 1): hviledag
  // 17. sep (dag 2): treningsdag
  // 18. sep (dag 3): hviledag -> skal nå bli treningsdag #2!
  // 19. sep (dag 4): treningsdag -> skal nå bli hviledag!
  // 20. sep (dag 5): hviledag -> skal nå bli treningsdag #3!
  const skippedDays = {
    '2026-09-17': 'shift' // Hopp over og forskyv alt fra her
  };

  const plan = generatePlan('2026-09-15', '2026-10-15', 24, {}, skippedDays);

  // Dag 0 (15. sep): treningsdag #1
  assert.equal(plan.days[0].isWorkoutDay, true);
  assert.equal(plan.days[0].workoutNumber, 1);

  // Dag 1 (16. sep): hviledag
  assert.equal(plan.days[1].isWorkoutDay, false);

  // Dag 2 (17. sep): hoppet over dag
  assert.equal(plan.days[2].dateKey, '2026-09-17');
  assert.equal(plan.days[2].isWorkoutDay, false);
  assert.equal(plan.days[2].isSkipped, true);
  assert.equal(plan.days[2].skipOption, 'shift');
  assert.equal(plan.days[2].workoutNumber, null);

  // Dag 3 (18. sep): neste hviledag ble nå treningsdag #2!
  assert.equal(plan.days[3].dateKey, '2026-09-18');
  assert.equal(plan.days[3].isWorkoutDay, true);
  assert.equal(plan.days[3].workoutNumber, 2);

  // Dag 4 (19. sep): tidligere treningsdag ble nå hviledag!
  assert.equal(plan.days[4].dateKey, '2026-09-19');
  assert.equal(plan.days[4].isWorkoutDay, false);
  assert.equal(plan.days[4].workoutNumber, null);

  // Dag 5 (20. sep): tidligere hviledag ble nå treningsdag #3!
  assert.equal(plan.days[5].dateKey, '2026-09-20');
  assert.equal(plan.days[5].isWorkoutDay, true);
  assert.equal(plan.days[5].workoutNumber, 3);
});

test('calculateStats håndterer skippede dager korrekt', () => {
  const skippedDays = {
    '2026-09-17': 'shift'
  };
  const plan = generatePlan('2026-09-15', '2026-10-15', 24, {}, skippedDays);

  const state = {
    skippedDays,
    completedDays: {
      '2026-09-15': true,
      '2026-09-17': true // Skal ignoreres for skipped dag
    }
  };

  const stats = calculateStats(plan, state);
  assert.equal(stats.completedWorkouts, 1);
  assert.equal(isDayFullyCompleted(plan.days[2], state), false);
});

test('hasDayNote gjenkjenner ikke-tomme notater for alternativ trening', () => {
  assert.equal(hasDayNote('2026-09-16', {}), false);
  assert.equal(hasDayNote('2026-09-16', { notes: {} }), false);
  assert.equal(hasDayNote('2026-09-16', { notes: { '2026-09-16': '' } }), false);
  assert.equal(hasDayNote('2026-09-16', { notes: { '2026-09-16': '   ' } }), false);
  assert.equal(hasDayNote('2026-09-16', { notes: { '2026-09-16': 'Syklet 30 min' } }), true);
  assert.equal(hasDayNote('2026-09-15', { notes: { '2026-09-16': 'Syklet 30 min' } }), false);
});
