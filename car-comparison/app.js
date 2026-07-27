(() => {
  "use strict";

  const payload = window.CAR_COMPARISON_DATA;
  if (!payload || !Array.isArray(payload.rows)) {
    document.body.innerHTML =
      "<p style='padding:24px'>Could not load cars.js. Keep it beside index.html.</p>";
    return;
  }

  const { meta, rows } = payload;
  const state = {
    search: "",
    vehicleType: "",
    maxPrice: null,
    minRange: 0,
    sortField: "price_idr",
    sortDirection: "asc",
    xField: "price_idr",
    yField: "range_km",
    colourBy: "vehicle_type",
    selected: new Set(),
  };
  const priceValues = [
    ...new Set(rows.map((row) => row.price_idr).filter(isNumeric)),
  ].sort((a, b) => a - b);
  const maximumRange = Math.ceil(
    Math.max(...rows.map((row) => row.range_km).filter(isNumeric)) / 50,
  ) * 50;

  const metrics = {
    price_idr: { label: "Price", unit: "IDR", axis: formatAxisPrice },
    range_km: { label: "Range", unit: "km", axis: compactNumber },
    battery_kwh: { label: "Battery", unit: "kWh", axis: compactNumber },
    power_hp: { label: "Power", unit: "HP", axis: compactNumber },
    torque_nm: { label: "Torque", unit: "Nm", axis: compactNumber },
    efficiency_km_per_kwh: {
      label: "Efficiency",
      unit: "km/kWh",
      axis: compactNumber,
    },
    curb_weight_kg: {
      label: "Curb weight",
      unit: "kg",
      axis: compactNumber,
    },
    acceleration_0_100_sec: {
      label: "0–100",
      unit: "sec",
      axis: compactNumber,
    },
    length_mm: { label: "Length", unit: "mm", axis: compactNumber },
    width_mm: { label: "Width", unit: "mm", axis: compactNumber },
    height_mm: { label: "Height", unit: "mm", axis: compactNumber },
    wheelbase_mm: { label: "Wheelbase", unit: "mm", axis: compactNumber },
    ground_clearance_mm: {
      label: "Ground clearance",
      unit: "mm",
      axis: compactNumber,
    },
    seats: { label: "Seats", unit: "seats", axis: compactNumber },
  };

  const tableColumns = [
    { field: "no", label: "No", numeric: true },
    { field: "country_flag", label: "Flag" },
    { field: "model", label: "Item / model" },
    { field: "brand", label: "Brand" },
    { field: "announcement_date", label: "Announcement date" },
    { field: "price_idr", label: "OTR Jakarta price · Rp", numeric: true },
    { field: "variant", label: "Variant" },
    { field: "vehicle_type", label: "Vehicle type" },
    { field: "assembly", label: "Assembly" },
    { field: "atpm", label: "ATPM" },
    { field: "length_mm", label: "Length · mm", numeric: true },
    { field: "width_mm", label: "Width · mm", numeric: true },
    { field: "height_mm", label: "Height · mm", numeric: true },
    { field: "wheelbase_mm", label: "Wheelbase · mm", numeric: true },
    {
      field: "ground_clearance_mm",
      label: "Ground clearance · mm",
      numeric: true,
    },
    { field: "tire_size", label: "Tire size" },
    { field: "boot_size", label: "Boot size", numeric: true },
    { field: "seats", label: "Seats", numeric: true },
    { field: "motor", label: "Motor" },
    { field: "battery_type", label: "Battery type" },
    { field: "battery_kwh", label: "Battery · kWh", numeric: true },
    { field: "drivetrain", label: "Drivetrain" },
    { field: "range_km", label: "Range · km", numeric: true },
    { field: "power_hp", label: "Power · HP", numeric: true },
    { field: "torque_nm", label: "Torque · Nm", numeric: true },
    { field: "curb_weight_kg", label: "Curb weight · kg", numeric: true },
    {
      field: "acceleration_0_100_sec",
      label: "0–100 · sec",
      numeric: true,
    },
    {
      field: "efficiency_km_per_kwh",
      label: "Efficiency · km/kWh",
      numeric: true,
    },
    { field: "other_powertrain", label: "Different powertrain" },
  ];

  const palette = [
    "#ff5f39",
    "#286fe8",
    "#00a98f",
    "#8a58c8",
    "#d48a00",
    "#e13f71",
    "#54702d",
    "#5f6c78",
    "#a35221",
    "#008ab5",
    "#6f58dd",
    "#a2687e",
  ];

  const el = {
    sourceVariantCount: byId("sourceVariantCount"),
    filteredVariantCount: byId("filteredVariantCount"),
    plottedVariantCount: byId("plottedVariantCount"),
    searchInput: byId("searchInput"),
    vehicleTypeFilter: byId("vehicleTypeFilter"),
    maxPriceSlider: byId("maxPriceSlider"),
    maxPriceOutput: byId("maxPriceOutput"),
    minRangeSlider: byId("minRangeSlider"),
    minRangeOutput: byId("minRangeOutput"),
    resetFilters: byId("resetFilters"),
    tableView: byId("tableView"),
    scatterView: byId("scatterView"),
    tableStatus: byId("tableStatus"),
    scatterStatus: byId("scatterStatus"),
    tableHeadRow: byId("tableHeadRow"),
    tableBody: byId("tableBody"),
    compareCards: byId("compareCards"),
    compareShelf: byId("compareShelf"),
    clearSelection: byId("clearSelection"),
    selectSeres: byId("selectSeres"),
    seresSpecs: byId("seresSpecs"),
    xAxis: byId("xAxis"),
    yAxis: byId("yAxis"),
    colourBy: byId("colourBy"),
    swapAxes: byId("swapAxes"),
    scatterPlot: byId("scatterPlot"),
    plotLegend: byId("plotLegend"),
    plotTooltip: byId("plotTooltip"),
    sourceLink: byId("sourceLink"),
    toast: byId("toast"),
  };

  initialise();

  function initialise() {
    el.sourceVariantCount.textContent = meta.variant_rows.toLocaleString("id-ID");
    el.sourceLink.href = meta.source_url;

    populateFilters();
    configureSliders();
    populateMetricSelectors();
    populateTableHeader();
    renderSeresSpotlight();
    selectSeresVariants(false);
    bindEvents();
    render();
  }

  function populateFilters() {
    const types = [...new Set(rows.map((row) => row.vehicle_type).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      el.vehicleTypeFilter.append(option);
    });
  }

  function configureSliders() {
    el.maxPriceSlider.min = "0";
    el.maxPriceSlider.max = String(priceValues.length);
    el.maxPriceSlider.value = String(priceValues.length);
    el.minRangeSlider.max = String(maximumRange);
    el.minRangeSlider.value = "0";
    updateSliderLabels();
  }

  function populateMetricSelectors() {
    Object.entries(metrics).forEach(([field, metric]) => {
      [el.xAxis, el.yAxis].forEach((select) => {
        const option = document.createElement("option");
        option.value = field;
        option.textContent = `${metric.label} · ${metric.unit}`;
        select.append(option);
      });
    });
    el.xAxis.value = state.xField;
    el.yAxis.value = state.yField;
  }

  function populateTableHeader() {
    el.tableHeadRow.innerHTML = [
      '<th class="check-cell"><span class="sr-only">Select</span></th>',
      ...tableColumns.map(
        (column) => `
          <th
            class="${column.numeric ? "num" : ""} field-${column.field.replaceAll("_", "-")}"
            data-sort="${column.field}"
            scope="col"
          >${escapeHtml(column.label)}</th>
        `,
      ),
    ].join("");
  }

  function renderSeresSpotlight() {
    const seres = rows.filter((row) => row.model === "Seres E1");
    const lowestPrice = Math.min(...seres.map((row) => row.price_idr).filter(isNumeric));
    const maxRange = Math.max(...seres.map((row) => row.range_km).filter(isNumeric));
    const variants = seres.length;
    el.seresSpecs.innerHTML = [
      spotlightSpec(formatPrice(lowestPrice, true), "from · OTR"),
      spotlightSpec(`${maxRange} km`, "max source range"),
      spotlightSpec(String(variants), "variants"),
    ].join("");
  }

  function spotlightSpec(value, label) {
    return `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function bindEvents() {
    el.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      render();
    });

    el.vehicleTypeFilter.addEventListener("change", (event) => {
      state.vehicleType = event.target.value;
      render();
    });

    el.maxPriceSlider.addEventListener("input", (event) => {
      const index = Number(event.target.value);
      state.maxPrice =
        index >= priceValues.length ? null : priceValues[Math.max(0, index)];
      updateSliderLabels();
      render();
    });

    el.minRangeSlider.addEventListener("input", (event) => {
      state.minRange = Number(event.target.value);
      updateSliderLabels();
      render();
    });

    el.resetFilters.addEventListener("click", resetFilters);
    el.clearSelection.addEventListener("click", () => {
      state.selected.clear();
      render();
    });
    el.selectSeres.addEventListener("click", () => {
      selectSeresVariants(true);
      render();
      el.compareShelf.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    el.xAxis.addEventListener("change", (event) => {
      state.xField = event.target.value;
      render();
    });
    el.yAxis.addEventListener("change", (event) => {
      state.yField = event.target.value;
      render();
    });
    el.colourBy.addEventListener("change", (event) => {
      state.colourBy = event.target.value;
      render();
    });
    el.swapAxes.addEventListener("click", () => {
      [state.xField, state.yField] = [state.yField, state.xField];
      el.xAxis.value = state.xField;
      el.yAxis.value = state.yField;
      render();
    });

    document.querySelectorAll("th[data-sort]").forEach((header) => {
      header.addEventListener("click", () => {
        const field = header.dataset.sort;
        if (state.sortField === field) {
          state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
        } else {
          state.sortField = field;
          state.sortDirection = field === "model" ? "asc" : "desc";
        }
        renderTable(filteredRows());
      });
    });
  }

  function resetFilters() {
    state.search = "";
    state.vehicleType = "";
    state.maxPrice = null;
    state.minRange = 0;
    el.searchInput.value = "";
    el.vehicleTypeFilter.value = "";
    el.maxPriceSlider.value = String(priceValues.length);
    el.minRangeSlider.value = "0";
    updateSliderLabels();
    render();
  }

  function updateSliderLabels() {
    el.maxPriceOutput.textContent =
      state.maxPrice === null ? "Any price" : `≤ ${formatPrice(state.maxPrice, true)}`;
    el.minRangeOutput.textContent =
      state.minRange === 0 ? "Any range" : `≥ ${state.minRange} km`;
  }

  function selectSeresVariants(replace) {
    if (replace) state.selected.clear();
    rows
      .filter((row) => row.model === "Seres E1")
      .slice(0, 4)
      .forEach((row) => state.selected.add(row.id));
  }

  function filteredRows() {
    return rows.filter((row) => {
      const haystack = [
        row.model,
        row.brand,
        row.variant,
        row.vehicle_type,
        row.assembly,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const searchMatch = !state.search || haystack.includes(state.search);
      const typeMatch = !state.vehicleType || row.vehicle_type === state.vehicleType;
      const priceMatch =
        !state.maxPrice || (isNumeric(row.price_idr) && row.price_idr <= state.maxPrice);
      const rangeMatch =
        !state.minRange || (isNumeric(row.range_km) && row.range_km >= state.minRange);
      return searchMatch && typeMatch && priceMatch && rangeMatch;
    });
  }

  function render() {
    const filtered = filteredRows();
    const plotted = plottableRows(filtered);
    el.filteredVariantCount.textContent = filtered.length.toLocaleString("id-ID");
    el.plottedVariantCount.textContent = plotted.length.toLocaleString("id-ID");
    el.tableStatus.textContent =
      `${filtered.length} of ${rows.length} variants · ${tableColumns.length} source fields · click headers to sort`;
    el.scatterStatus.textContent =
      `${plotted.length} of ${filtered.length} filtered variants have both axis values`;
    renderCompareShelf();
    renderTable(filtered);
    renderScatter(filtered);
  }

  function sortedRows(filtered) {
    const factor = state.sortDirection === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[state.sortField];
      const bv = b[state.sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (isNumeric(av) && isNumeric(bv)) return (av - bv) * factor;
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * factor;
    });
  }

  function renderTable(filtered) {
    document.querySelectorAll("th[data-sort]").forEach((header) => {
      header.classList.remove("sort-asc", "sort-desc");
      if (header.dataset.sort === state.sortField) {
        header.classList.add(`sort-${state.sortDirection}`);
      }
    });

    const sorted = sortedRows(filtered);
    if (!sorted.length) {
      el.tableBody.innerHTML =
        `<tr><td colspan="${tableColumns.length + 1}" style="padding:50px;text-align:center">No variants match these filters.</td></tr>`;
      return;
    }

    el.tableBody.innerHTML = sorted
      .map((row) => {
        const selected = state.selected.has(row.id);
        return `
          <tr class="${selected ? "selected" : ""}" data-row-id="${row.id}">
            <td class="check-cell">
              <button
                class="row-check ${selected ? "selected" : ""}"
                type="button"
                data-select-id="${row.id}"
                aria-label="${selected ? "Remove" : "Add"} ${escapeAttr(row.model)} ${escapeAttr(row.variant || "")}"
                aria-pressed="${selected}"
              >✓</button>
            </td>
            ${tableColumns.map((column) => renderTableCell(row, column)).join("")}
          </tr>
        `;
      })
      .join("");

    el.tableBody.querySelectorAll("[data-select-id]").forEach((button) => {
      button.addEventListener("click", () => toggleSelection(button.dataset.selectId));
    });
  }

  function renderTableCell(row, column) {
    const classes = [
      column.numeric ? "num" : "",
      column.field === "price_idr" ? "price" : "",
      `field-${column.field.replaceAll("_", "-")}`,
    ]
      .filter(Boolean)
      .join(" ");

    if (column.field === "model") {
      const image = row.image
        ? `<img class="model-thumb" src="${escapeAttr(row.image)}" alt="${escapeAttr(row.image_alt || `${row.model} vehicle`)}" />`
        : `<span class="model-monogram">${escapeHtml(monogram(row.brand))}</span>`;
      const visual = row.image_source_url
        ? `<a class="model-visual" href="${escapeAttr(row.image_source_url)}" target="_blank" rel="noreferrer" title="Open image source">${image}</a>`
        : `<span class="model-visual">${image}</span>`;
      return `
        <td class="${classes}">
          <div class="model-cell">
            ${visual}
            <div class="model-info">
              <strong>${escapeHtml(row.model || "—")}</strong>
            </div>
          </div>
        </td>
      `;
    }

    return `<td class="${classes}">${formatSheetField(row[column.field], column.field)}</td>`;
  }

  function formatSheetField(value, field) {
    if (value === null || value === undefined || value === "") {
      return '<span class="missing">—</span>';
    }
    if (field === "price_idr") return escapeHtml(formatPrice(value));
    if (field === "announcement_date") return escapeHtml(formatSheetDate(value));
    if (!isNumeric(value)) return escapeHtml(value);

    const decimals = {
      battery_kwh: 1,
      curb_weight_kg: 1,
      acceleration_0_100_sec: 1,
      efficiency_km_per_kwh: 2,
    };
    const maximumFractionDigits = decimals[field] ?? 2;
    const minimumFractionDigits =
      Object.prototype.hasOwnProperty.call(decimals, field)
        ? decimals[field]
        : 0;
    return escapeHtml(
      value.toLocaleString("id-ID", {
        minimumFractionDigits,
        maximumFractionDigits,
      }),
    );
  }

  function formatSheetDate(value) {
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return String(value);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${Number(match[3])}-${months[Number(match[2]) - 1]}-${match[1].slice(2)}`;
  }

  function renderCompareShelf() {
    const selectedRows = rows.filter((row) => state.selected.has(row.id));
    const cards = selectedRows.map(
      (row) => `
        <article class="compare-card">
          <button
            class="remove-selection"
            type="button"
            data-remove-id="${row.id}"
            aria-label="Remove ${escapeAttr(row.model)} ${escapeAttr(row.variant || "")}"
          >×</button>
          ${
            row.image
              ? `<div class="compare-card-media"><img src="${escapeAttr(row.image)}" alt="${escapeAttr(row.image_alt || `${row.model} vehicle`)}" /></div>`
              : ""
          }
          <p class="mini-brand">${escapeHtml(`${row.country_flag || ""} ${row.brand || "EV"}`.trim())}</p>
          <h3>${escapeHtml(row.model)}</h3>
          <p class="mini-variant">${escapeHtml(row.variant || "—")}</p>
          <div class="mini-stats">
            ${miniStat(formatMaybe(row.price_idr, (v) => formatPrice(v, true)), "price")}
            ${miniStat(formatMaybe(row.range_km, (v) => `${v} km`), "range")}
            ${miniStat(formatMaybe(row.battery_kwh, (v) => `${v} kWh`), "battery")}
          </div>
        </article>
      `,
    );

    while (cards.length < 4) {
      cards.push(`<div class="empty-card">Select a row<br />or scatter point</div>`);
    }
    el.compareCards.innerHTML = cards.join("");
    el.clearSelection.hidden = selectedRows.length === 0;

    el.compareCards.querySelectorAll("[data-remove-id]").forEach((button) => {
      button.addEventListener("click", () => toggleSelection(button.dataset.removeId));
    });
  }

  function miniStat(value, label) {
    return `<div><strong>${value}</strong><span>${label}</span></div>`;
  }

  function toggleSelection(id) {
    if (state.selected.has(id)) {
      state.selected.delete(id);
    } else if (state.selected.size >= 4) {
      showToast("Four variants are already pinned. Remove one before adding another.");
      return;
    } else {
      state.selected.add(id);
    }
    render();
  }

  function plottableRows(filtered) {
    return filtered.filter(
      (row) => isNumeric(row[state.xField]) && isNumeric(row[state.yField]),
    );
  }

  function renderScatter(filtered) {
    const data = plottableRows(filtered);
    const svg = el.scatterPlot;
    svg.replaceChildren();

    const width = 1000;
    const height = 600;
    const margin = { top: 32, right: 32, bottom: 82, left: 92 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xMetric = metrics[state.xField];
    const yMetric = metrics[state.yField];

    const title = svgNode("title");
    title.id = "plotTitle";
    title.textContent = `${xMetric.label} versus ${yMetric.label}`;
    svg.append(title);

    const desc = svgNode("desc");
    desc.id = "plotDescription";
    desc.textContent = `${data.length} EV variants plotted. Click a circle to select it.`;
    svg.append(desc);

    if (!data.length) {
      const message = svgNode("text", {
        x: width / 2,
        y: height / 2,
        "text-anchor": "middle",
        class: "axis-label",
      });
      message.textContent = "No rows have both selected axis values.";
      svg.append(message);
      el.plotLegend.innerHTML = "";
      return;
    }

    const xValues = data.map((row) => row[state.xField]);
    const yValues = data.map((row) => row[state.yField]);
    const [xMin, xMax] = paddedExtent(xValues);
    const [yMin, yMax] = paddedExtent(yValues);
    const xScale = (value) =>
      margin.left + ((value - xMin) / (xMax - xMin)) * innerWidth;
    const yScale = (value) =>
      margin.top + innerHeight - ((value - yMin) / (yMax - yMin)) * innerHeight;

    const xTicks = tickValues(xMin, xMax, 6);
    const yTicks = tickValues(yMin, yMax, 6);
    const plotGroup = svgNode("g");
    svg.append(plotGroup);

    xTicks.forEach((value) => {
      const x = xScale(value);
      plotGroup.append(
        svgNode("line", {
          x1: x,
          x2: x,
          y1: margin.top,
          y2: margin.top + innerHeight,
          class: "grid-line",
        }),
      );
      const label = svgNode("text", {
        x,
        y: margin.top + innerHeight + 25,
        "text-anchor": "middle",
        class: "tick-label",
      });
      label.textContent = xMetric.axis(value);
      plotGroup.append(label);
    });

    yTicks.forEach((value) => {
      const y = yScale(value);
      plotGroup.append(
        svgNode("line", {
          x1: margin.left,
          x2: margin.left + innerWidth,
          y1: y,
          y2: y,
          class: "grid-line",
        }),
      );
      const label = svgNode("text", {
        x: margin.left - 14,
        y: y + 4,
        "text-anchor": "end",
        class: "tick-label",
      });
      label.textContent = yMetric.axis(value);
      plotGroup.append(label);
    });

    plotGroup.append(
      svgNode("line", {
        x1: margin.left,
        x2: margin.left + innerWidth,
        y1: margin.top + innerHeight,
        y2: margin.top + innerHeight,
        class: "axis-line",
      }),
      svgNode("line", {
        x1: margin.left,
        x2: margin.left,
        y1: margin.top,
        y2: margin.top + innerHeight,
        class: "axis-line",
      }),
    );

    const xLabel = svgNode("text", {
      x: margin.left + innerWidth / 2,
      y: height - 24,
      "text-anchor": "middle",
      class: "axis-label",
    });
    xLabel.textContent = `${xMetric.label} · ${xMetric.unit}`;
    svg.append(xLabel);

    const yLabel = svgNode("text", {
      x: 22,
      y: margin.top + innerHeight / 2,
      "text-anchor": "middle",
      class: "axis-label",
      transform: `rotate(-90 22 ${margin.top + innerHeight / 2})`,
    });
    yLabel.textContent = `${yMetric.label} · ${yMetric.unit}`;
    svg.append(yLabel);

    const groups = [...new Set(data.map((row) => row[state.colourBy] || "Unknown"))].sort();
    const colourMap = new Map(groups.map((group) => [group, palette[hashString(group) % palette.length]]));

    data.forEach((row) => {
      const selected = state.selected.has(row.id);
      const circle = svgNode("circle", {
        cx: xScale(row[state.xField]),
        cy: yScale(row[state.yField]),
        r: selected ? 10 : 6,
        fill: colourMap.get(row[state.colourBy] || "Unknown"),
        class: `plot-point${selected ? " selected" : ""}`,
        tabindex: "0",
        role: "button",
        "aria-label": `${row.model}, ${row.variant || "variant"}, ${xMetric.label} ${formatMetric(row[state.xField], state.xField)}, ${yMetric.label} ${formatMetric(row[state.yField], state.yField)}`,
      });
      circle.addEventListener("pointerenter", (event) => showTooltip(event, row));
      circle.addEventListener("pointermove", moveTooltip);
      circle.addEventListener("pointerleave", hideTooltip);
      circle.addEventListener("focus", (event) => showTooltip(event, row));
      circle.addEventListener("blur", hideTooltip);
      circle.addEventListener("click", () => toggleSelection(row.id));
      circle.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleSelection(row.id);
        }
      });
      plotGroup.append(circle);

      if (selected) {
        const label = svgNode("text", {
          x: xScale(row[state.xField]) + 13,
          y: yScale(row[state.yField]) - 11,
          class: "point-label",
        });
        label.textContent = row.model;
        plotGroup.append(label);
      }
    });

    renderLegend(groups, colourMap, data);
  }

  function renderLegend(groups, colourMap, data) {
    const counts = new Map();
    data.forEach((row) => {
      const group = row[state.colourBy] || "Unknown";
      counts.set(group, (counts.get(group) || 0) + 1);
    });
    const sortedGroups = [...groups].sort((a, b) => counts.get(b) - counts.get(a));
    const visible = sortedGroups.slice(0, 12);
    el.plotLegend.innerHTML = visible
      .map(
        (group) => `
          <span class="legend-item">
            <span class="legend-swatch" style="--swatch:${colourMap.get(group)}"></span>
            ${escapeHtml(group)} · ${counts.get(group)}
          </span>
        `,
      )
      .join("");
    if (sortedGroups.length > visible.length) {
      el.plotLegend.insertAdjacentHTML(
        "beforeend",
        `<span class="legend-item">+ ${sortedGroups.length - visible.length} more groups</span>`,
      );
    }
  }

  function showTooltip(event, row) {
    const xMetric = metrics[state.xField];
    const yMetric = metrics[state.yField];
    el.plotTooltip.innerHTML = `
      <strong>${escapeHtml(row.model)}</strong>
      <span>${escapeHtml(row.variant || "—")}</span>
      <dl>
        <dt>${escapeHtml(xMetric.label)}</dt>
        <dd>${escapeHtml(formatMetric(row[state.xField], state.xField))}</dd>
        <dt>${escapeHtml(yMetric.label)}</dt>
        <dd>${escapeHtml(formatMetric(row[state.yField], state.yField))}</dd>
        <dt>Price</dt>
        <dd>${escapeHtml(formatMaybe(row.price_idr, formatPrice))}</dd>
      </dl>
    `;
    el.plotTooltip.hidden = false;
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (el.plotTooltip.hidden) return;
    const left = Math.min(event.clientX + 16, window.innerWidth - 255);
    const top = Math.min(event.clientY + 16, window.innerHeight - 180);
    el.plotTooltip.style.left = `${Math.max(8, left)}px`;
    el.plotTooltip.style.top = `${Math.max(8, top)}px`;
  }

  function hideTooltip() {
    el.plotTooltip.hidden = true;
  }

  function paddedExtent(values) {
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      const pad = Math.abs(min || 1) * 0.1;
      return [min - pad, max + pad];
    }
    const pad = (max - min) * 0.07;
    min -= pad;
    max += pad;
    if (Math.min(...values) >= 0) min = Math.max(0, min);
    return [min, max];
  }

  function tickValues(min, max, count) {
    const span = max - min;
    const rough = span / Math.max(1, count - 1);
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const normalized = rough / magnitude;
    const stepBase = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10;
    const step = stepBase * magnitude;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let value = start; value <= max + step * 0.01; value += step) {
      ticks.push(Number(value.toFixed(10)));
    }
    return ticks.length >= 2 ? ticks : [min, max];
  }

  function svgNode(tag, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function isNumeric(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function formatMaybe(value, formatter) {
    if (value === null || value === undefined || value === "") {
      return '<span class="missing">—</span>';
    }
    return escapeHtml(formatter(value));
  }

  function formatUnit(value, unit) {
    if (value === null || value === undefined || value === "") {
      return '<span class="missing">—</span>';
    }
    const display = isNumeric(value)
      ? value.toLocaleString("id-ID", { maximumFractionDigits: 1 })
      : String(value);
    return `${escapeHtml(display)} <small>${escapeHtml(unit)}</small>`;
  }

  function formatPrice(value, compact = false) {
    if (!isNumeric(value)) return String(value ?? "—");
    if (compact) {
      if (value >= 1_000_000_000) {
        return `Rp${(value / 1_000_000_000).toLocaleString("id-ID", {
          maximumFractionDigits: 2,
        })}B`;
      }
      return `Rp${(value / 1_000_000).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}M`;
    }
    return `Rp${value.toLocaleString("id-ID")}`;
  }

  function formatAxisPrice(value) {
    if (Math.abs(value) >= 1_000_000_000) {
      return `Rp${(value / 1_000_000_000).toFixed(1)}B`;
    }
    return `Rp${Math.round(value / 1_000_000)}M`;
  }

  function compactNumber(value) {
    return new Intl.NumberFormat("id-ID", {
      notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  }

  function formatMetric(value, field) {
    if (!isNumeric(value)) return String(value ?? "—");
    if (field === "price_idr") return formatPrice(value);
    const metric = metrics[field];
    return `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${metric.unit}`;
  }

  function monogram(brand) {
    return String(brand || "EV")
      .replace(/\([^)]*\)/g, "")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => el.toast.classList.remove("show"), 2600);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
