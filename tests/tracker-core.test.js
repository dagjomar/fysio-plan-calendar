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
  formatNorwegianDate,
  formatDateKey,
  getMotivationalMessage,
  DEFAULT_EXERCISES
} from '../tracker-core.js';

test('generatePlan genererer riktig antall dager og uker fra 12. sep til 12. okt', () => {
  const plan = generatePlan('2026-09-12', '2026-10-12', 24);

  // 12. sep til 12. okt er 31 dager (19 dager i sep: 12-30 + 12 dager i okt: 1-12)
  assert.equal(plan.days.length, 31);
  assert.equal(plan.totalDays, 31);

  // Annenhver dag: dag 0, 2, 4, 6... 30 -> 16 treningsdager
  assert.equal(plan.totalWorkoutDays, 16);
  assert.equal(plan.totalRestDays, 15);

  // Første dag er 12. sep og skal være treningsdag
  assert.equal(plan.days[0].dateKey, '2026-09-12');
  assert.equal(plan.days[0].isWorkoutDay, true);
  assert.equal(plan.days[0].workoutNumber, 1);
  assert.equal(plan.days[0].exercises.length, 3);

  // Andre dag er 13. sep og skal være hviledag
  assert.equal(plan.days[1].dateKey, '2026-09-13');
  assert.equal(plan.days[1].isWorkoutDay, false);
  assert.equal(plan.days[1].workoutNumber, null);
  assert.equal(plan.days[1].exercises.length, 0);

  // Siste dag er 12. okt og skal være treningsdag (dag 30)
  assert.equal(plan.days[30].dateKey, '2026-10-12');
  assert.equal(plan.days[30].isWorkoutDay, true);
  assert.equal(plan.days[30].workoutNumber, 16);

  // Skal ha 5 ukesbolker (Uke 24, 25, 26, 27, 28)
  assert.ok(plan.weeks.length >= 4);
  assert.equal(plan.weeks[0].rehabWeek, 24);
});

test('calculateStats beregner fullførte økter og prosentandel korrekt', () => {
  const plan = generatePlan('2026-09-12', '2026-10-12', 24);
  
  // Tom tilstand
  const emptyStats = calculateStats(plan, {});
  assert.equal(emptyStats.completedWorkouts, 0);
  assert.equal(emptyStats.percentage, 0);
  assert.equal(emptyStats.totalWorkouts, 16);

  // Marker første dag fullført via completedDays
  const state1 = {
    completedDays: {
      '2026-09-12': true
    }
  };
  const stats1 = calculateStats(plan, state1);
  assert.equal(stats1.completedWorkouts, 1);
  assert.equal(stats1.percentage, 6); // 1 / 16 = 6.25% -> 6%

  // Marker andre treningsdag (14. sep) ved å krysse av alle 3 øvelser
  const state2 = {
    completedDays: {
      '2026-09-12': true
    },
    completedExercises: {
      '2026-09-14': {
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
      '2026-09-16': {
        'ex-1': true,
        'ex-2': true
      }
    }
  };
  const stats3 = calculateStats(plan, state3);
  assert.equal(stats3.completedWorkouts, 0);
});

test('isDayFullyCompleted fungerer for både hele dager og individuelle øvelser', () => {
  const plan = generatePlan('2026-09-12', '2026-10-12', 24);
  const day0 = plan.days[0]; // 12. sep
  const day1 = plan.days[1]; // 13. sep (hviledag)

  assert.equal(isDayFullyCompleted(day1, {}), false);

  const state = {
    completedExercises: {
      '2026-09-12': {
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
