/* dw-marjan-data.js — single source of truth for the Marjan story.
   Both the scrollytelling page and the carousel page read this file.
   One entry in STORY.steps = one scrolly step = one carousel slide.
   ─────────────────────────────────────────────────────────────────────────
   ⚠ NOT PUBLISHABLE AS-IS. This file backs the design-system reference build
   only. `series[]` and `provinces[].v` are SYNTHESISED SHAPES, not measured
   data. Nothing derived from them may appear on a public DataWizart page.
   ─────────────────────────────────────────────────────────────────────────
   DATA STATUS
   • ramadan[]  — REAL. First day of Ramadan in Indonesia (Gregorian).
   • series[]   — PLACEHOLDER, generated from the real peak weeks below.
                  TODO: replace `series` with the actual Google Trends weekly
                  export for "marjan", geo=ID, 2014-01-01 → 2026-12-31.
   • provinces[]— PLACEHOLDER magnitudes; coordinates are real.
   ───────────────────────────────────────────────────────────────────────── */

const RAMADAN = [
  { year: 2014, start: '2014-06-29', label: '29 Jun' },
  { year: 2015, start: '2015-06-18', label: '18 Jun' },
  { year: 2016, start: '2016-06-06', label: '6 Jun'  },
  { year: 2017, start: '2017-05-27', label: '27 May' },
  { year: 2018, start: '2018-05-17', label: '17 May' },
  { year: 2019, start: '2019-05-06', label: '6 May'  },
  { year: 2020, start: '2020-04-24', label: '24 Apr' },
  { year: 2021, start: '2021-04-13', label: '13 Apr' },
  { year: 2022, start: '2022-04-03', label: '3 Apr'  },
  { year: 2023, start: '2023-03-23', label: '23 Mar' },
  { year: 2024, start: '2024-03-12', label: '12 Mar' },
  { year: 2025, start: '2025-03-01', label: '1 Mar'  },
  { year: 2026, start: '2026-02-18', label: '18 Feb' },
];

const weekOf = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  const doy = Math.floor((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 864e5) + 1;
  return Math.max(1, Math.ceil(doy / 7));
};

/* Deterministic stand-in series: quiet baseline + a sharp pre-Ramadan spike
   that decays through the fasting month. Shape is faithful to the published
   chart; the exact values are placeholders. */
function makeSeries(peakWeek, seed) {
  const out = [];
  for (let w = 1; w <= 52; w++) {
    const d = w - peakWeek;
    const spike = 100 * Math.exp(-(d * d) / (d < 0 ? 3.2 : 7.5));
    const noise = 2.4 + 1.9 * Math.sin(w * 0.83 + seed) + 1.3 * Math.cos(w * 0.31 + seed * 2);
    out.push(Math.round(Math.max(noise, spike) * 10) / 10);
  }
  return out;
}

const YEARS = RAMADAN.map((r, i) => {
  const rWeek = weekOf(r.start);
  const peak = Math.max(1, rWeek - 1);            // peak lands the week before
  return { ...r, ramadanWeek: rWeek, peakWeek: peak, series: makeSeries(peak, i * 1.7) };
});

/* Real coordinates, placeholder magnitudes (0–100 relative search interest). */
const PROVINCES = [
  { n: 'Aceh', lat: 5.55, lon: 95.32, v: 74 },
  { n: 'North Sumatra', lat: 3.59, lon: 98.67, v: 66 },
  { n: 'West Sumatra', lat: -0.95, lon: 100.35, v: 71 },
  { n: 'Riau', lat: 0.51, lon: 101.45, v: 63 },
  { n: 'Riau Islands', lat: 0.92, lon: 104.45, v: 52 },
  { n: 'Jambi', lat: -1.61, lon: 103.61, v: 61 },
  { n: 'Bengkulu', lat: -3.80, lon: 102.26, v: 58 },
  { n: 'South Sumatra', lat: -2.98, lon: 104.76, v: 69 },
  { n: 'Bangka Belitung', lat: -2.13, lon: 106.11, v: 55 },
  { n: 'Lampung', lat: -5.43, lon: 105.26, v: 72 },
  { n: 'Banten', lat: -6.12, lon: 106.15, v: 88 },
  { n: 'Jakarta', lat: -6.21, lon: 106.85, v: 100 },
  { n: 'West Java', lat: -6.91, lon: 107.61, v: 96 },
  { n: 'Central Java', lat: -6.97, lon: 110.42, v: 90 },
  { n: 'Yogyakarta', lat: -7.80, lon: 110.36, v: 84 },
  { n: 'East Java', lat: -7.25, lon: 112.75, v: 87 },
  { n: 'Bali', lat: -8.65, lon: 115.22, v: 34 },
  { n: 'West Nusa Tenggara', lat: -8.58, lon: 116.11, v: 62 },
  { n: 'East Nusa Tenggara', lat: -10.18, lon: 123.61, v: 21 },
  { n: 'West Kalimantan', lat: -0.02, lon: 109.34, v: 57 },
  { n: 'Central Kalimantan', lat: -2.21, lon: 113.92, v: 54 },
  { n: 'South Kalimantan', lat: -3.32, lon: 114.59, v: 66 },
  { n: 'East Kalimantan', lat: -0.50, lon: 117.15, v: 59 },
  { n: 'North Kalimantan', lat: 2.84, lon: 117.37, v: 44 },
  { n: 'North Sulawesi', lat: 1.47, lon: 124.84, v: 29 },
  { n: 'Gorontalo', lat: 0.54, lon: 123.06, v: 47 },
  { n: 'Central Sulawesi', lat: -0.90, lon: 119.87, v: 45 },
  { n: 'West Sulawesi', lat: -2.68, lon: 118.89, v: 43 },
  { n: 'South Sulawesi', lat: -5.15, lon: 119.43, v: 64 },
  { n: 'Southeast Sulawesi', lat: -3.97, lon: 122.51, v: 46 },
  { n: 'Maluku', lat: -3.65, lon: 128.19, v: 31 },
  { n: 'North Maluku', lat: 0.73, lon: 127.56, v: 33 },
  { n: 'West Papua', lat: -0.86, lon: 134.06, v: 24 },
  { n: 'Papua', lat: -2.53, lon: 140.72, v: 22 },
];

const STORY = {
  slug: 'marjan',
  kicker: 'Google Trends · Indonesia',
  title: 'Indonesia Has a Syrup Alarm Clock',
  standfirst: 'Once a year, millions of Indonesians type the same four letters into Google. The spike is so reliable you could set a calendar by it — and for thirteen years running, it has been sliding earlier.',
  source: 'Google Trends, "marjan", geo=ID, 2014–2026',
  method: 'Weekly relative search interest for the query "marjan" in Indonesia, indexed 0–100 against the highest week in the window. Peak week is the ISO week with the highest value in each calendar year. Ramadan start dates are the first day of fasting observed in Indonesia.',
  credit: 'DATAWIZART · DIO ARIADI',
  years: YEARS,
  provinces: PROVINCES,

  /* ── STEPS ─────────────────────────────────────────────────────────────
     chart: which graphic state the sticky panel shows
     slide: carousel variant — 'cover' | 'default' | 'dark' | 'gold' | 'figure' | 'end'
     ──────────────────────────────────────────────────────────────────── */
  steps: [
    {
      id: 'hook', no: '01', chart: 'single-flat', slide: 'cover',
      title: 'Indonesia Has a Syrup Alarm Clock',
      body: 'This is one year of Google searches for <strong>“marjan”</strong> — a rose-syrup brand most Indonesians only buy for one month of the year. Fifty-one quiet weeks, and then this.',
      slideText: 'One year of Google searches for a rose-syrup brand. Fifty-one quiet weeks — and then this.',
    },
    {
      id: 'quiz', no: '02', chart: 'single-flat', slide: 'gold',
      title: 'Before the Reveal: When Does It Spike?',
      body: 'Marjan is the drink of <em>buka puasa</em> — the meal that breaks the daily Ramadan fast. So the searches should cluster around Ramadan. The question is whether they land <strong>during</strong> it, or somewhere else.',
      quiz: {
        prompt: 'In 2022, Ramadan began on 3 April. Which week did searches peak?',
        options: ['Two weeks before', 'The week before', 'Week one of Ramadan', 'The last week of Ramadan'],
        answer: 1,
        explain: 'The peak arrives the week <strong>before</strong> the fast begins. Indonesia does not search for syrup while fasting — it searches while shopping.',
      },
      slideText: 'Ramadan 2022 began on 3 April. Did searches peak before, during, or after? Most people guess wrong.',
    },
    {
      id: 'reveal', no: '03', chart: 'single-hl', slide: 'default',
      title: 'It Peaks the Week Before',
      body: 'The green band marks the three weeks around the peak. It sits <strong>ahead</strong> of Ramadan, not inside it. The spike is not consumption — it is preparation.',
      slideText: 'The peak lands the week <em>before</em> the fast begins. The spike is not consumption. It is preparation.',
    },
    {
      id: 'figure', no: '04', chart: 'figure', slide: 'figure',
      title: 'The Peak Is 40× a Normal Week',
      figure: { to: 40, unit: '× a normal week', prefix: '', suffix: '×' },
      body: 'In an average week of 2022, search interest for “marjan” sat close to the floor. In the peak week it hit the ceiling — the single highest point in the entire thirteen-year window.',
      slideText: 'Search interest in the peak week, against the median week of the same year.',
    },
    {
      id: 'stack', no: '05', chart: 'stack', slide: 'dark',
      title: 'Now Stack Thirteen Years',
      body: 'One ridge per year, 2014 at the top and 2026 at the bottom. Every year has exactly one spike. Not one year breaks the pattern.',
      slideText: 'One ridge per year, 2014 to 2026. Every year has exactly one spike. None breaks the pattern.',
    },
    {
      id: 'drift', no: '06', chart: 'stack-drift', slide: 'default',
      title: 'The Peaks Form a Diagonal',
      body: 'Join the peaks and they draw a straight line across the chart, marching left. In 2014 the spike landed in <strong>late June</strong>. By 2026 it arrives in <strong>February</strong> — four months earlier.',
      slideText: 'Join the peaks and they draw a straight diagonal, marching left: late June in 2014, February by 2026.',
    },
    {
      id: 'why', no: '07', chart: 'timeline', slide: 'default',
      title: 'Because the Calendar Itself Moves',
      body: 'The Islamic year is lunar: twelve moons, roughly 354 days. It runs about <strong>eleven days short</strong> of the Gregorian year, so Ramadan — and the syrup — arrives eleven days earlier every time.',
      slideText: 'The lunar year is ~11 days shorter than the Gregorian one. Ramadan arrives 11 days earlier every year — and the syrup with it.',
    },
    {
      id: 'where', no: '08', chart: 'map', slide: 'default',
      title: 'And It Is a Java-and-Sumatra Habit',
      body: 'Search interest is heaviest across Java and the Sumatran coast, and thins out east of Bali. Marjan is a national brand with a distinctly regional grip.',
      slideText: 'Heaviest across Java and Sumatra, thinning east of Bali. A national brand with a regional grip.',
    },
    {
      id: 'takeaway', no: '09', chart: 'end', slide: 'end',
      title: 'A Brand That Tells the Time',
      body: 'Thirteen years of search data, and the story is one sentence long: <strong>Indonesia starts shopping for Ramadan one week before it begins</strong> — and that week keeps moving. Any brand selling into the season can read its own deadline straight off this chart.',
      slideText: 'Indonesia starts shopping for Ramadan one week before it begins — and that week keeps moving.',
    },
  ],
};

window.STORY = STORY;
