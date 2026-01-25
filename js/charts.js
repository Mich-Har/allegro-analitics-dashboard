/* ===========================================
   ALLEGRO ANALYTICS DASHBOARD - CHARTS
   Wykresy SVG (bar chart, donut chart)
   =========================================== */

/**
 * Renderuje horizontal bar chart (top produktow) - minimalistyczna wersja
 */
function renderBarChart(container, data, options = {}) {
  const {
    animated = true,
  } = options;

  const maxValue = Math.max(...data.map(d => d.value), 1);

  let html = '<div class="top-products-list">';

  data.forEach((item, index) => {
    const percentage = (item.value / maxValue) * 100;
    const animationClass = animated ? `bar-animated stagger-${index + 1}` : '';

    html += `
      <div class="top-product-item" data-index="${index}">
        <div class="top-product-rank">${index + 1}</div>
        <div class="top-product-info">
          <div class="top-product-name">${truncateText(item.label, 60)}</div>
          <div class="top-product-bar">
            <div class="top-product-bar-fill ${animationClass}" style="width: ${percentage}%;"></div>
          </div>
        </div>
        <div class="top-product-value">${formatNumber(item.value)} szt.</div>
      </div>
    `;
  });

  html += '</div>';

  // Dodaj style jesli nie istnieja
  if (!document.getElementById('bar-chart-styles')) {
    const style = document.createElement('style');
    style.id = 'bar-chart-styles';
    style.textContent = `
      .top-products-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .top-product-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
      }

      .top-product-item:last-child {
        border-bottom: none;
      }

      .top-product-rank {
        width: 24px;
        height: 24px;
        background: var(--bg-dark);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .top-product-item[data-index="0"] .top-product-rank {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
      }

      .top-product-info {
        flex: 1;
        min-width: 0;
      }

      .top-product-name {
        font-size: 13px;
        color: var(--text-primary);
        line-height: 1.3;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .top-product-bar {
        height: 3px;
        background: var(--bg-dark);
        border-radius: 2px;
        overflow: hidden;
      }

      .top-product-bar-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 2px;
        transition: width 0.6s ease-out;
      }

      .top-product-item[data-index="0"] .top-product-bar-fill {
        background: linear-gradient(90deg, var(--primary), var(--secondary));
      }

      .top-product-value {
        font-family: var(--font-mono);
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
      }

      .top-product-bar-fill.bar-animated {
        animation: barGrowWidth 0.6s ease-out forwards;
      }

      @keyframes barGrowWidth {
        from { width: 0 !important; }
      }
    `;
    document.head.appendChild(style);
  }

  container.innerHTML = html;
}

/**
 * Renderuje donut chart (rynki) - wersja CSS conic-gradient
 */
function renderDonutChart(container, data, options = {}) {
  const {
    size = 220,
  } = options;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Buduj conic-gradient
  let gradientParts = [];
  let currentPercent = 0;

  data.forEach((item, index) => {
    if (item.value <= 0) return;

    const percentage = (item.value / total) * 100;
    const color = item.color || CONFIG.MARKET_COLORS[item.id] || CONFIG.CHART_COLORS[index] || '#6366f1';

    gradientParts.push(`${color} ${currentPercent}% ${currentPercent + percentage}%`);
    currentPercent += percentage;
  });

  const gradient = gradientParts.join(', ');

  let html = `
    <div class="donut-chart-wrapper">
      <div class="donut-css" style="
        width: ${size}px;
        height: ${size}px;
        background: conic-gradient(from 0deg, ${gradient});
        border-radius: 50%;
        position: relative;
      ">
        <div class="donut-hole" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.6}px;
          height: ${size * 0.6}px;
          background: var(--bg-card);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          <span style="font-size: 28px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary);">${formatNumber(total)}</span>
          <span style="font-size: 11px; color: var(--text-muted);">sprzedanych</span>
        </div>
      </div>

      <div class="donut-legend">
  `;

  data.forEach((item, index) => {
    if (item.value <= 0) return;
    const percentage = (item.value / total) * 100;
    const color = item.color || CONFIG.MARKET_COLORS[item.id] || CONFIG.CHART_COLORS[index] || '#6366f1';

    html += `
        <div class="legend-item">
          <span class="legend-color" style="background: ${color};"></span>
          <span class="legend-label">${item.flag || ''} ${item.label}</span>
          <span class="legend-value">${percentage.toFixed(1)}%</span>
        </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Add legend styles if not exists
  if (!document.getElementById('chart-styles')) {
    const style = document.createElement('style');
    style.id = 'chart-styles';
    style.textContent = `
      .donut-chart-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .donut-css {
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }

      .donut-legend {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px 20px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .legend-color {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .legend-label {
        color: var(--text-secondary);
      }

      .legend-value {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--text-primary);
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Przygotowuje dane do bar chart (top produkty)
 */
function prepareBarChartData(products) {
  return products.map(product => ({
    label: product.product_name || product.sygnatura,
    value: product.podsumowanie_globalne?.suma_sprzedanych_total || 0,
    product: product,
  }));
}

/**
 * Przygotowuje dane do donut chart (rynki)
 */
function prepareDonutChartData(markets) {
  return Object.entries(markets)
    .map(([id, data]) => ({
      id: id,
      label: data.name,
      flag: data.flag,
      value: data.totalSales,
      color: CONFIG.MARKET_COLORS[id],
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

/**
 * Pomaga obcinac tekst
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Rozjasnia/przyciemnia kolor
 */
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Mini bar (dla tabeli)
 */
function renderMiniBar(value, max, color = 'var(--primary)') {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return `
    <div class="mini-bar" style="width: 60px; height: 6px; background: var(--bg-dark); border-radius: 3px; overflow: hidden;">
      <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
    </div>
  `;
}
