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

export const DEFAULT_EXERCISES = {
  0: [ // Uke 24 (12. sep - 18. sep)
    {
      id: 'ex-1',
      name: 'Stående tåhev på ett ben',
      description: 'Styrker m. gastrocnemius og akillessenens tåleevne. 3 sek opp, 2 sek hold på toppen, 3 sek kontrollert ned.',
      target: '3-4 sett x 10-12 reps'
    },
    {
      id: 'ex-2',
      name: 'Sittende tåhev med vekt på knærne',
      description: 'Isolerer m. soleus (den dype leggmuskelen som tar størst kraft under løp og gange).',
      target: '3 sett x 12-15 reps'
    },
    {
      id: 'ex-3',
      name: 'Eksentrisk hælsenkning over trappetrinn',
      description: 'Opp med begge ben, rolig og kontrollert senkning på det skadede benet under trinnivå.',
      target: '3 sett x 10 reps'
    }
  ],
  1: [ // Uke 25 (19. sep - 25. sep)
    {
      id: 'ex-1',
      name: 'Stående tåhev på ett ben med ekstra vekt',
      description: 'Bruk en ryggsekk med bøker eller manual for progressiv overbelastning.',
      target: '3-4 sett x 8-10 reps (+2-5 kg)'
    },
    {
      id: 'ex-2',
      name: 'Sittende tåhev med økt belastning',
      description: 'Fokus på fullt bevegelsesutslag og 2 sekunders stopp på toppen for optimal seneadapsjon.',
      target: '3 sett x 12 reps'
    },
    {
      id: 'ex-3',
      name: 'Eksentrisk hælsenkning på ett ben over kant',
      description: 'Rolig senkning forbi horisontalt nivå. Stopp ved smerte > 3/10.',
      target: '3 sett x 10-12 reps'
    }
  ],
  2: [ // Uke 26 (26. sep - 2. okt)
    {
      id: 'ex-1',
      name: 'Tung stående tåhev på ett ben (HSR)',
      description: 'Heavy Slow Resistance: Høyere vekt, langsomt tempo (3 sek opp, 3 sek ned).',
      target: '4 sett x 8 reps (tyngre belastning)'
    },
    {
      id: 'ex-2',
      name: 'Sittende tåhev med progressiv motstand',
      description: 'Hold spenningen i bunnposisjon i 1 sekund før kraftfullt løft.',
      target: '3-4 sett x 10-12 reps'
    },
    {
      id: 'ex-3',
      name: 'Eksentrisk senkning + Balanse på balansepute / ettbens balanse',
      description: 'Eksentrisk senkning kombinert med leddsans og stabilitet på ustabilt underlag.',
      target: '3 sett x 10 reps + 3 x 45 sek balanse'
    }
  ],
  3: [ // Uke 27/28 (3. okt - 12. okt)
    {
      id: 'ex-1',
      name: 'Stående tåhev på ett ben (Styrketest & kvalitet)',
      description: 'Fokus på lik høyde og utholdenhet sammenlignet med frisk side før neste fysioterapikontroll.',
      target: '4 sett x 8-10 reps'
    },
    {
      id: 'ex-2',
      name: 'Sittende tåhev med toppbelastning',
      description: 'Bygg maksimal utholdende styrke i soleus.',
      target: '4 sett x 10 reps'
    },
    {
      id: 'ex-3',
      name: 'Eksentrisk senkning / Forberedende vristhopp (sprett)',
      description: 'Lette vristhopp eller hurtig eksentrisk oppbremsing, kun dersom godkjent av fysioterapeut.',
      target: '3 sett x 10-12 reps (eller 3 x 15 sek sprett)'
    }
  ]
};

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
 * @param {string} startDateStr - f.eks. "2026-09-12"
 * @param {string} endDateStr - f.eks. "2026-10-12"
 * @param {number} startRehabWeek - standard 24
 * @param {Object} customWeeklyExercises - overstyrte øvelser per ukeindeks
 */
export function generatePlan(
  startDateStr = '2026-09-12',
  endDateStr = '2026-10-12',
  startRehabWeek = 24,
  customWeeklyExercises = {}
) {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  
  const days = [];
  const curr = new Date(start);
  let dayIndex = 0;
  let workoutNumber = 1;

  while (curr <= end) {
    const dateKey = formatDateKey(curr);
    const dateObj = new Date(curr);
    const isWorkoutDay = dayIndex % 2 === 0; // Annenhver dag starter med treningsdag
    
    // Beregn uke-indeks i perioden (0, 1, 2, 3...)
    const weekIndex = Math.floor(dayIndex / 7);
    const rehabWeek = startRehabWeek + weekIndex;
    
    // Hent øvelsene for denne uken
    const weekExercises = customWeeklyExercises[weekIndex] || DEFAULT_EXERCISES[Math.min(weekIndex, 3)];

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
    totalRestDays: days.filter(d => !d.isWorkoutDay).length
  };
}

/**
 * Beregner fremdriftsstatistikk og streak
 * @param {Object} plan - resultatet fra generatePlan
 * @param {Object} state - { completedDays: { [dateKey]: boolean }, completedExercises: { [dateKey]: { [exId]: boolean } } }
 */
export function calculateStats(plan, state = {}) {
  const completedDays = state.completedDays || {};
  const completedExercises = state.completedExercises || {};

  const workoutDays = plan.days.filter(d => d.isWorkoutDay);
  const totalWorkouts = workoutDays.length;

  let completedWorkouts = 0;
  workoutDays.forEach(day => {
    // En dag regnes som fullført enten hvis completedDays[dateKey] er sann,
    // ELLER hvis alle 3 øvelsene for dagen er krysset av.
    const isMarked = !!completedDays[day.dateKey];
    const dayExs = completedExercises[day.dateKey] || {};
    const allExCompleted = day.exercises.length > 0 && day.exercises.every(ex => !!dayExs[ex.id]);

    if (isMarked || allExCompleted) {
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
 */
export function isDayFullyCompleted(day, state = {}) {
  if (!day.isWorkoutDay) return false;
  const completedDays = state.completedDays || {};
  if (completedDays[day.dateKey]) return true;

  const dayExs = (state.completedExercises && state.completedExercises[day.dateKey]) || {};
  if (!day.exercises || day.exercises.length === 0) return false;

  return day.exercises.every(ex => !!dayExs[ex.id]);
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
