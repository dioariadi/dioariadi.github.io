/* dw-charts.js — DataWizart chart primitives (vanilla, no dependencies).
   Every chart is hand-drawn SVG using the classes in assets/dw-system.css.
   Never hard-code colours here — use the CSS custom properties.
   ───────────────────────────────────────────────────────────────────────── */

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── RIDGE PLOT ─────────────────────────────────────────────────────────────
   DWRidge(svg, years) → { setState('single-flat'|'single-hl'|'stack'|'stack-drift') }
   `years` = STORY.years (each with .year .series[52] .peakWeek .ramadanWeek)
   ───────────────────────────────────────────────────────────────────────── */
function DWRidge(svg, years, opts = {}) {
  const W = 920, H = 620, padL = 74, padR = 34, padT = 48, padB = 66;
  const innerW = W - padL - padR;
  const rowH = (H - padT - padB) / years.length;
  const U = 36;                                  // px per 100 index points (baked)
  const focusIdx = opts.focusIdx ?? years.findIndex(y => y.year === 2022);
  const x = (w) => padL + ((w - 1) / 51) * innerW;
  const baseY = (i) => padT + (i + 1) * rowH;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  svg.innerHTML = '';

  const gGrid = el('g'), gRows = el('g'), gDrift = el('g'), gAxis = el('g');
  svg.append(gGrid, gRows, gDrift, gAxis);

  // monthly gridlines + labels
  for (let m = 0; m < 12; m++) {
    const w = 1 + m * (52 / 12);
    gGrid.append(el('line', { class: 'dw-grid', x1: x(w), y1: padT - 8, x2: x(w), y2: H - padB }));
    const t = el('text', { class: 'dw-tick', x: x(w), y: H - padB + 26, 'text-anchor': 'middle' });
    t.textContent = MONTHS[m];
    gAxis.append(t);
  }
  gAxis.append(el('line', { class: 'dw-axis', x1: padL, y1: H - padB, x2: W - padR, y2: H - padB }));

  const ridgePath = (series, from = 1, to = 52) => {
    let d = `M ${x(from)},0`;
    for (let w = from; w <= to; w++) d += ` L ${x(w)},${-(series[w - 1] / 100) * U}`;
    return d + ` L ${x(to)},0 Z`;
  };

  const rows = years.map((y, i) => {
    const g = el('g', { class: 'dw-ridge-row', 'data-year': y.year });
    const area = el('path', { class: 'dw-series', d: ridgePath(y.series), 'vector-effect': 'non-scaling-stroke' });
    const band = el('path', {
      class: 'dw-series--hl dw-ridge-band',
      d: ridgePath(y.series, Math.max(1, y.peakWeek - 2), Math.min(52, y.peakWeek + 2)),
      'vector-effect': 'non-scaling-stroke',
    });
    const rTick = el('line', { class: 'dw-ann-dashed dw-ridge-ramadan', x1: x(y.ramadanWeek), y1: 4, x2: x(y.ramadanWeek), y2: -U * 1.05, 'vector-effect': 'non-scaling-stroke' });
    g.append(area, band, rTick);
    gRows.append(g);
    const label = el('text', { class: 'dw-tick dw-ridge-label', x: padL - 14, y: 0, 'text-anchor': 'end', 'data-year': y.year });
    label.textContent = y.year;
    gAxis.append(label);
    return { g, area, band, rTick, label, y, i };
  });

  // drift line through the peaks
  const driftPts = rows.map(r => [x(r.y.peakWeek), baseY(r.i) - U]);
  const drift = el('path', {
    class: 'dw-ridge-drift',
    d: 'M ' + driftPts.map(p => p.join(',')).join(' L '),
    fill: 'none', stroke: 'var(--dw-red)', 'stroke-width': 2, 'stroke-dasharray': '6 5',
  });
  const driftDots = driftPts.map(([px, py]) => el('circle', { class: 'dw-ridge-drift', cx: px, cy: py, r: 3.5, fill: 'var(--dw-red)' }));
  gDrift.append(drift, ...driftDots);

  const annA = el('text', { class: 'dw-ann dw-ridge-ann', x: driftPts[0][0] + 14, y: driftPts[0][1] - 6 });
  annA.textContent = 'late June 2014';
  const annB = el('text', { class: 'dw-ann dw-ridge-ann', x: driftPts[driftPts.length - 1][0] + 14, y: driftPts[driftPts.length - 1][1] + 4 });
  annB.textContent = 'February 2026';
  const annPeak = el('text', { class: 'dw-ann dw-ridge-peakann', x: 0, y: 0 });
  annPeak.textContent = 'peak: the week before Ramadan';
  const annRam = el('text', { class: 'dw-ann dw-ridge-peakann', x: 0, y: 0, fill: 'var(--dw-red)' });
  annRam.textContent = 'Ramadan begins';
  gDrift.append(annA, annB, annPeak, annRam);

  let state = null;
  function setState(next) {
    if (next === state) return;
    state = next;
    const single = next.startsWith('single') || next === 'figure';
    const showBand = next === 'single-hl' || next === 'figure' || next === 'stack' || next === 'stack-drift';
    const showDrift = next === 'stack-drift';
    const f = rows[focusIdx];

    rows.forEach((r, i) => {
      if (single) {
        const k = 9.4;
        const y = i === focusIdx ? H - padB : baseY(i);
        r.g.setAttribute('transform', `translate(0,${y}) scale(1,${i === focusIdx ? k : 1})`);
        r.g.style.opacity = i === focusIdx ? 1 : 0;
        r.label.setAttribute('y', (i === focusIdx ? H - padB : baseY(i)) - 6);
        r.label.style.opacity = i === focusIdx ? 1 : 0;
      } else {
        r.g.setAttribute('transform', `translate(0,${baseY(i)}) scale(1,1)`);
        r.g.style.opacity = 1;
        r.label.setAttribute('y', baseY(i) - 5);
        r.label.style.opacity = 1;
      }
      r.band.style.opacity = showBand ? 1 : 0;
      r.rTick.style.opacity = single && next !== 'single-flat' ? 1 : (single ? 0 : 0.55);
    });

    gDrift.querySelectorAll('.dw-ridge-drift').forEach(n => { n.style.opacity = showDrift ? 1 : 0; });
    annA.style.opacity = annB.style.opacity = showDrift ? 1 : 0;
    const peakVisible = single && next !== 'single-flat';
    annPeak.style.opacity = peakVisible ? 1 : 0;
    annRam.style.opacity = peakVisible ? 1 : 0;
    if (peakVisible) {
      annPeak.setAttribute('x', x(f.y.peakWeek) - 12);
      annPeak.setAttribute('y', H - padB - 9.4 * U - 22);
      annPeak.setAttribute('text-anchor', 'end');
      annRam.setAttribute('x', x(f.y.ramadanWeek) + 10);
      annRam.setAttribute('y', H - padB - 9.4 * U * 1.05 - 4);
    }
  }
  setState(opts.state || 'stack');
  return { setState, get state() { return state; } };
}

/* ── PROPORTIONAL-SYMBOL MAP (real lat/lon, equirectangular) ────────────── */
function DWProvinceMap(svg, provinces) {
  const W = 920, H = 400, mL = 30, mR = 30, mT = 24, mB = 44;
  const lonMin = 94, lonMax = 142, latMax = 7.2, latMin = -11.4;
  const px = (lon) => mL + ((lon - lonMin) / (lonMax - lonMin)) * (W - mL - mR);
  const py = (lat) => mT + ((latMax - lat) / (latMax - latMin)) * (H - mT - mB);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('role', 'img');
  svg.innerHTML = '';
  // equator + graticule at every 5°
  for (let lat = 5; lat >= -10; lat -= 5) {
    svg.append(el('line', { class: 'dw-grid', x1: mL, y1: py(lat), x2: W - mR, y2: py(lat) }));
    const t = el('text', { class: 'dw-tick', x: mL - 6, y: py(lat) + 4, 'text-anchor': 'end' });
    t.textContent = lat === 0 ? '0°' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`;
    svg.append(t);
  }
  for (let lon = 95; lon <= 140; lon += 5) {
    svg.append(el('line', { class: 'dw-grid', x1: px(lon), y1: mT, x2: px(lon), y2: H - mB }));
    const t = el('text', { class: 'dw-tick', x: px(lon), y: H - mB + 20, 'text-anchor': 'middle' });
    t.textContent = `${lon}°E`;
    svg.append(t);
  }
  const sorted = [...provinces].sort((a, b) => b.v - a.v);
  sorted.forEach((p, i) => {
    const r = 4 + (p.v / 100) * 20;
    const hot = p.v >= 84;
    svg.append(el('circle', {
      cx: px(p.lon), cy: py(p.lat), r,
      fill: hot ? 'var(--chart-3)' : 'var(--chart-1)',
      'fill-opacity': hot ? 0.85 : 0.42,
      stroke: 'var(--chart-ink)', 'stroke-width': 0.8,
    }));
    if (i < 4) {
      const t = el('text', { class: 'dw-ann', x: px(p.lon) + r + 6, y: py(p.lat) + 4 });
      t.textContent = p.n;
      svg.append(t);
    }
  });
  return svg;
}

/* ── COUNT-UP ───────────────────────────────────────────────────────────── */
function dwCountUp(node, to, { dur = 1100, suffix = '' } = {}) {
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = Math.round(to * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── PEAK-WEEK SPARK (used on carousel slides) ──────────────────────────── */
function DWSpark(svg, series, peakWeek, { w = 420, h = 120, highlight = true } = {}) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = '';
  const x = (i) => (i / 51) * w;
  let d = `M 0,${h}`;
  series.forEach((v, i) => { d += ` L ${x(i)},${h - (v / 100) * (h - 6)}`; });
  d += ` L ${w},${h} Z`;
  svg.append(el('path', { d, fill: 'var(--chart-flat)', stroke: 'var(--chart-ink)', 'stroke-width': 1.2 }));
  if (!highlight) return svg;
  let b = `M ${x(peakWeek - 3)},${h}`;
  for (let i = peakWeek - 3; i <= peakWeek + 1; i++) b += ` L ${x(i)},${h - (series[i] / 100) * (h - 6)}`;
  b += ` L ${x(peakWeek + 1)},${h} Z`;
  svg.append(el('path', { d: b, fill: 'var(--chart-3)' }));
  return svg;
}

Object.assign(window, { DWRidge, DWProvinceMap, dwCountUp, DWSpark, MONTHS });
