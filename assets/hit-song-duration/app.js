(function () {
  const story = window.HIT_SONG_DATA;
  const panels = [...document.querySelectorAll('.panel')];
  const captureSlide = Number(new URLSearchParams(location.search).get('slide'));

  if (captureSlide >= 1 && captureSlide <= panels.length) {
    document.body.classList.add('capture-mode');
    panels[captureSlide - 1].classList.add('active-capture');
  }

  const modeButton = document.getElementById('mode-button');
  modeButton.addEventListener('click', () => {
    const active = document.body.classList.toggle('carousel-guide');
    modeButton.setAttribute('aria-pressed', String(active));
    modeButton.textContent = active ? '× Hide guide' : '▣ Carousel guide';
  });

  function renderDots() {
    document.querySelectorAll('.dot-strip').forEach((strip) => {
      const total = Number(strip.dataset.total);
      const hits = Number(strip.dataset.hit);
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < total; i += 1) {
        const dot = document.createElement('i');
        if (i < hits) dot.className = 'hit';
        fragment.appendChild(dot);
      }
      strip.appendChild(fragment);
    });
  }

  function movingAverage(values, radius = 2) {
    return values.map((value, index) => {
      const window = values.slice(Math.max(0, index - radius), Math.min(values.length, index + radius + 1));
      return window.reduce((sum, item) => sum + item.median_sec, 0) / window.length;
    });
  }

  function renderAnnualChart() {
    const svg = document.getElementById('annual-chart');
    if (!svg || !story) return;
    const data = story.annual;
    const width = 900, height = 550;
    const margin = { top: 56, right: 20, bottom: 55, left: 68 };
    const x = (year) => margin.left + ((year - 1960) / (2024 - 1960)) * (width - margin.left - margin.right);
    const y = (seconds) => margin.top + ((300 - seconds) / (300 - 120)) * (height - margin.top - margin.bottom);
    const ns = 'http://www.w3.org/2000/svg';
    const node = (tag, attrs = {}, text = '') => {
      const element = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
      if (text) element.textContent = text;
      svg.appendChild(element);
      return element;
    };

    [120, 180, 240, 300].forEach((seconds) => {
      node('line', { x1: margin.left, x2: width - margin.right, y1: y(seconds), y2: y(seconds), stroke: 'rgba(255,255,255,.14)', 'stroke-width': 1 });
      node('text', { x: margin.left - 14, y: y(seconds) + 4, fill: 'rgba(255,255,255,.55)', 'text-anchor': 'end', 'font-family': 'DM Mono', 'font-size': 13 }, `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    });
    [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2024].forEach((year) => {
      node('text', { x: x(year), y: height - 20, fill: 'rgba(255,255,255,.55)', 'text-anchor': year === 1960 ? 'start' : year === 2024 ? 'end' : 'middle', 'font-family': 'DM Mono', 'font-size': 12 }, year);
    });

    const streamX = x(2013);
    node('line', { x1: streamX, x2: streamX, y1: margin.top, y2: height - margin.bottom, stroke: '#f2c438', 'stroke-width': 1.5, 'stroke-dasharray': '5 7', opacity: .75 });
    node('text', { x: streamX + 8, y: margin.top + 12, fill: '#f2c438', 'font-family': 'DM Mono', 'font-size': 11 }, '2013 · YouTube masuk formula');

    data.forEach((item) => node('circle', { cx: x(item.year), cy: y(item.median_sec), r: 3.4, fill: '#fff', opacity: .42 }));
    const smooth = movingAverage(data);
    const path = data.map((item, index) => `${index ? 'L' : 'M'} ${x(item.year).toFixed(1)} ${y(smooth[index]).toFixed(1)}`).join(' ');
    node('path', { d: path, fill: 'none', stroke: '#3dc9c0', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

    const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
    const labels = [
      { year: 1960, color: '#fff' },
      { year: 1995, color: '#f2c438' },
      { year: 2024, color: '#fff' },
    ].map((label) => {
      const value = data.find((item) => item.year === label.year).median_sec;
      return { ...label, seconds: value, text: `${label.year} · ${formatDuration(value)}` };
    });
    labels.forEach((label) => {
      node('circle', { cx: x(label.year), cy: y(label.seconds), r: 8, fill: label.color, stroke: '#171717', 'stroke-width': 3 });
      node('text', { x: x(label.year), y: y(label.seconds) - 18, fill: label.color, 'text-anchor': 'middle', 'font-family': 'Oswald', 'font-size': 22, 'font-weight': 600 }, label.text);
    });
  }

  function updateProgress(activeIndex) {
    document.getElementById('progress-current').textContent = String(activeIndex + 1).padStart(2, '0');
    document.getElementById('progress-fill').style.height = `${((activeIndex + 1) / panels.length) * 100}%`;
  }

  if (!captureSlide && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) updateProgress(panels.indexOf(visible.target));
    }, { threshold: [0.35, 0.6, 0.85] });
    panels.forEach((panel) => observer.observe(panel));
  }

  renderDots();
  renderAnnualChart();
})();
