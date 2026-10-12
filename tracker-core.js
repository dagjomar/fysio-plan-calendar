/**
 * tracker-core.js
 * Kjernelogikk for opptrening av akillesseneruptur - Uke 24 til 28
 */

export const NORWEGIAN_DAYS = [
  'Søndag',
  'Mandag',
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag'
];

export const NORWEGIAN_DAYS_SHORT = [
  'Søn',
  'Man',
  'Tir',
  'Ons',
  'Tor',
  'Fre',
  'Lør'
];

export const NORWEGIAN_MONTHS = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'desember'
];

export const NORWEGIAN_MONTHS_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'mai', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'des'
];

/**
 * Standard øvelser avtalt med fysioterapeut 12. oktober:
 * - Ett-beins tåhev med drop-sett (tobeins opp, ett bein ned til failure etter siste sett for å ta igjen 1 cm muskelforskjell)
 * - Bulgarsk utfall for styrke i sete, lår og leddstabilitet
 */
export const STANDARD_EXERCISES = [
  {
    id: 'ex-1',
    name: 'Ett-beins tåhev (m/ drop-sett)',
    description: 'Umiddelbart etter siste sett: begynn på tobeins opp og ett bein ned til failure for å øke belastningen og hente inn 1 cm muskelforskjell.',
    target: '3-4 sett x 8-12 reps (+ drop-sett)'
  },
  {
    id: 'ex-2',
    name: 'Bulgarsk utfall',
    description: 'Kontrollert tempo og god dybde. Styrker lår, sete og stabilitet rundt ankel og kne.',
    target: '3 sett x 8-10 reps'
  }
];

export const DEFAULT_EXERCISES = {
  0: STANDARD_EXERCISES,
  1: STANDARD_EXERCISES,
  2: STANDARD_EXERCISES,
  3: STANDARD_EXERCISES,
  default: STANDARD_EXERCISES
};

/**
 * Legger til et antall uker til en gitt dato (YYYY-MM-DD)
 */
export function extendDateByWeeks(dateStr, weeksCount = 4) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + (weeksCount * 7));
  return formatDateKey(date);
}

/**
 * Henter øvelsene for en gitt dag, inkludert eventuelle egne linjer lagt inn av brukeren
 */
export function getDayExercises(day, state = {}) {
  if (state.dayExercises && Array.isArray(state.dayExercises[day.dateKey])) {
    return state.dayExercises[day.dateKey];
  }
  return day.exercises || [];
}

/**
 * Formaterer en dato til YYYY-MM-DD
 */
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returnerer pen norsk dato (f.eks. "Lørdag 12. september")
 */
export function formatNorwegianDate(date, short = false) {
  const dayName = short ? NORWEGIAN_DAYS_SHORT[date.getDay()] : NORWEGIAN_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = short ? NORWEGIAN_MONTHS_SHORT[date.getMonth()] : NORWEGIAN_MONTHS[date.getMonth()];
  return `${dayName} ${dayNum}. ${monthName}`;
}

/**
 * Genererer planen for perioden
 * @param {string} startDateStr - standard "2026-09-15"
 * @param {string} endDateStr - standard "2026-11-15" (utvidet til november)
 * @param {number} startRehabWeek - standard 24
 * @param {Object} customWeeklyExercises - overstyrte øvelser per ukeindeks
 */
export function generatePlan(
  startDateStr = '2026-09-15',
  endDateStr = '2026-11-15',
  startRehabWeek = 24,
  customWeeklyExercises = {},
  skippedDays = {}
) {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  
  const days = [];
  const curr = new Date(start);
  let dayIndex = 0;
  let workoutNumber = 1;
  let scheduleOffset = 0;

  while (curr <= end) {
    const dateKey = formatDateKey(curr);
    const dateObj = new Date(curr);
    const skipOption = skippedDays[dateKey];
    const isSkipped = !!skipOption;

    // Standard annenhver dag mønster justert for akkumulerte forskyvninger
    const rawPatternWorkout = (dayIndex + scheduleOffset) % 2 === 0;

    let isWorkoutDay = false;
    if (isSkipped) {
      isWorkoutDay = false;
      // Hvis dagen oprinnelig ville vært en treningsdag og man valgte 'shift',
      // forskyves resten av planen slik at neste dag (hvis hviledag) blir treningsdag.
      if (skipOption === 'shift' && rawPatternWorkout) {
        scheduleOffset = (scheduleOffset + 1) % 2;
      }
    } else {
      isWorkoutDay = rawPatternWorkout;
    }
    
    // Beregn uke-indeks i perioden (0, 1, 2, 3...)
    const weekIndex = Math.floor(dayIndex / 7);
    const rehabWeek = startRehabWeek + weekIndex;
    
    // Hent øvelsene for denne uken
    const weekExercises = customWeeklyExercises[weekIndex] || DEFAULT_EXERCISES[weekIndex] || DEFAULT_EXERCISES.default || STANDARD_EXERCISES;

    days.push({
      index: dayIndex,
      dateKey,
      date: dateObj,
      dayName: NORWEGIAN_DAYS[dateObj.getDay()],
      dayNameShort: NORWEGIAN_DAYS_SHORT[dateObj.getDay()],
      dayNumber: dateObj.getDate(),
      monthName: NORWEGIAN_MONTHS[dateObj.getMonth()],
      formattedDate: formatNorwegianDate(dateObj),
      formattedDateShort: formatNorwegianDate(dateObj, true),
      isWorkoutDay,
      isSkipped,
      skipOption: skipOption || null,
      workoutNumber: isWorkoutDay ? workoutNumber++ : null,
      weekIndex,
      rehabWeek,
      exercises: isWorkoutDay ? weekExercises : []
    });

    curr.setDate(curr.getDate() + 1);
    dayIndex++;
  }

  // Grupper i uker
  const weeks = [];
  days.forEach(day => {
    if (!weeks[day.weekIndex]) {
      weeks[day.weekIndex] = {
        weekIndex: day.weekIndex,
        rehabWeek: day.rehabWeek,
        title: `Uke ${day.rehabWeek} (Uke ${day.weekIndex + 1} i perioden)`,
        days: []
      };
    }
    weeks[day.weekIndex].days.push(day);
  });

  return {
    startDateStr,
    endDateStr,
    startRehabWeek,
    days,
    weeks,
    totalDays: days.length,
    totalWorkoutDays: days.filter(d => d.isWorkoutDay).length,
    totalRestDays: days.filter(d => !d.isWorkoutDay && !d.isSkipped).length,
    totalSkippedDays: days.filter(d => d.isSkipped).length
  };
}

/**
 * Beregner fremdriftsstatistikk og streak
 * @param {Object} plan - resultatet fra generatePlan
 * @param {Object} state - { completedDays: { [dateKey]: boolean }, completedExercises: { [dateKey]: { [exId]: boolean } }, dayExercises: {} }
 */
export function calculateStats(plan, state = {}) {
  const workoutDays = plan.days.filter(d => d.isWorkoutDay);
  const totalWorkouts = workoutDays.length;

  let completedWorkouts = 0;
  workoutDays.forEach(day => {
    if (isDayFullyCompleted(day, state)) {
      completedWorkouts++;
    }
  });

  const percentage = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  // Beregn streak (antall fullførte økter på rad fra starten av eller historisk)
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  workoutDays.forEach(day => {
    const isDone = isDayFullyCompleted(day, state);
    if (isDone) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  });

  // Gjeldende streak bakover fra dagens dato / siste fullførte
  for (let i = 0; i < workoutDays.length; i++) {
    const day = workoutDays[i];
    if (isDayFullyCompleted(day, state)) {
      currentStreak++;
    } else {
      // Hvis vi har en ufullført økt, stopper den nåværende streaken hvis den er i fortiden
      const todayKey = formatDateKey(new Date());
      if (day.dateKey <= todayKey) {
        currentStreak = 0;
      }
    }
  }

  // Ukesvis fremdrift
  const weekStats = plan.weeks.map(week => {
    const weekWorkoutDays = week.days.filter(d => d.isWorkoutDay);
    const weekCompleted = weekWorkoutDays.filter(d => isDayFullyCompleted(d, state)).length;
    return {
      weekIndex: week.weekIndex,
      rehabWeek: week.rehabWeek,
      total: weekWorkoutDays.length,
      completed: weekCompleted,
      isFullyCompleted: weekWorkoutDays.length > 0 && weekCompleted === weekWorkoutDays.length
    };
  });

  return {
    totalWorkouts,
    completedWorkouts,
    remainingWorkouts: totalWorkouts - completedWorkouts,
    percentage,
    maxStreak,
    weekStats
  };
}

/**
 * Sjekker om en konkret treningsdag er fullført
 * En dag regnes som fullført hvis den eksplisitt er markert i completedDays (uavhengig av sjekkliste),
 * eller hvis alle øvelser for dagen (inkl. egne linjer) er krysset av.
 */
export function isDayFullyCompleted(day, state = {}) {
  if (!day.isWorkoutDay || day.isSkipped) return false;
  const completedDays = state.completedDays || {};
  if (completedDays[day.dateKey]) return true;

  const exercises = getDayExercises(day, state);
  const dayExs = (state.completedExercises && state.completedExercises[day.dateKey]) || {};
  if (!exercises || exercises.length === 0) return false;

  return exercises.every(ex => !!dayExs[ex.id]);
}

/**
 * Sjekker om en dag har notat / alternativ trening (ikke-tom tekst)
 */
export function hasDayNote(dateKey, state = {}) {
  const note = state.notes && state.notes[dateKey];
  return typeof note === 'string' && note.trim().length > 0;
}

/**
 * Hjelper for å hente motiverende sitat eller tips basert på fremdrift
 */
export function getMotivationalMessage(percentage) {
  if (percentage === 0) {
    return 'Klar for start! Hver eneste tåhev legger grunnlaget for en sterk og elastisk akillessene.';
  } else if (percentage < 25) {
    return 'Flott start! Husk 24-timers-regelen: Lett ømhet er normalt, men skal roe seg før neste økt.';
  } else if (percentage < 50) {
    return 'Strålende driv! Du bygger senestyrke dag for dag. Superkompensasjon skjer på hviledagene!';
  } else if (percentage < 75) {
    return 'Over halvveis i 4-ukers perioden! Senen tåler mer og mer belastning. Hold rytmen oppe!';
  } else if (percentage < 100) {
    return 'Sluttspurten i denne fasen! Du er straks klar for neste rehabiliteringssteg sammen med fysio!';
  } else {
    return 'Mål oppnådd! 100% fullført for perioden! Fantastisk dedikasjon for akillesopptreningen!';
  }
}
