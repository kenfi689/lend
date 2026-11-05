// === 1. ПЕРЕМИКАННЯ ВКЛАДОК ВІТРИНИ (SHOWCASE) ===
let PRICE_SINGLE = 363;      // Акційна ціна за 1 шт з товари.xlsx
let PRICE_WHOLESALE = 340;   // Спецціна / Гурт від 2 шт (-6.5%) з товари.xlsx
let PRICE_OLD = 669;         // Стара/роздрібна ціна з товари.xlsx
function switchShowcaseTab(targetId) {
  document.querySelectorAll('.showcase-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === targetId);
  });
  document.querySelectorAll('.showcase-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === targetId);
  });
}

document.querySelectorAll('.showcase-tab').forEach(btn => {
  btn.addEventListener('click', () => switchShowcaseTab(btn.dataset.tab));
});

// === 2. ВЕРХНЯ ЖИВА ГІРЛЯНДА-БАХРОМА В ШАПЦІ (#headerGarlandCanvas) ===
(function initHeaderGarland() {
  const canvas = document.getElementById('headerGarlandCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 64;
  let drops = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = 64;
    buildDrops();
  }

  function buildDrops() {
    drops = [];
    const spacing = 42;
    const patternHeights = [52, 38, 24]; // пропорційно до 65см, 50см, 30см
    const count = Math.ceil(width / spacing) + 1;

    for (let i = 0; i < count; i++) {
      const x = i * spacing + 14;
      const h = patternHeights[i % 3];
      const bulbCount = i % 3 === 0 ? 4 : (i % 3 === 1 ? 3 : 2);
      const bulbs = [];
      for (let b = 0; b < bulbCount; b++) {
        const y = 8 + ((h - 10) / Math.max(1, bulbCount - 1)) * b;
        const isFlash = (i + b) % 5 === 0;
        bulbs.push({
          x,
          y,
          isFlash,
          phase: Math.random() * Math.PI * 2,
          flashTimer: Math.random() * 100
        });
      }
      drops.push({ x, h, bulbs });
    }
  }

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    // Чорний горизонтальний кабель
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(width, 4);
    ctx.stroke();

    for (const d of drops) {
      // Вертикальна чорна нитка
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(d.x, 4);
      ctx.lineTo(d.x, d.h);
      ctx.stroke();

      for (const b of d.bulbs) {
        let flashBoost = 0;
        if (b.isFlash) {
          const cycle = (time * 0.004 + b.phase * 3) % 6.28;
          if (cycle > 5.5) flashBoost = 1;
        }

        const radius = flashBoost ? 4.2 : 2.6;
        const glowRadius = flashBoost ? 14 : 8;

        const grad = ctx.createRadialGradient(b.x, b.y, 0.5, b.x, b.y, glowRadius);
        if (flashBoost) {
          grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
          grad.addColorStop(0.35, 'rgba(253, 224, 71, 0.85)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else {
          grad.addColorStop(0, 'rgba(254, 243, 199, 0.95)');
          grad.addColorStop(0.4, 'rgba(251, 191, 36, 0.55)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flashBoost ? '#ffffff' : '#fde68a';
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(render);
})();

// === 3. ІНТЕРАКТИВНИЙ СИМУЛЯТОР 21 ЛІНІЇ ТА РЕЖИМУ FLASH (#simCanvas) ===
(function initInteractiveSimulator() {
  const canvas = document.getElementById('simCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let simMode = 'flash'; // 'flash' | 'steady'
  let bgIndex = 0; // 0: Нічний фасад, 1: Дерев'яна тераса, 2: Сутінки

  const linesCount = 21; // Точно 21 лінія згідно з таблицею
  const dropLengthsCm = [65, 50, 30]; // Точний каскад 65 см, 50 см, 30 см
  const dropBulbsCount = [7, 5, 3]; // Разом: 7 наборів по (7+5+3 = 15 LED) = рівно 105 LED!

  const lines = [];
  for (let i = 0; i < linesCount; i++) {
    const typeIdx = i % 3;
    const lenCm = dropLengthsCm[typeIdx];
    const count = dropBulbsCount[typeIdx];
    const bulbs = [];
    for (let j = 0; j < count; j++) {
      bulbs.push({
        ratioY: (j + 1) / count,
        isFlashCapable: (i * 3 + j) % 4 === 0,
        seed: Math.random() * 100
      });
    }
    lines.push({ index: i, lenCm, count, bulbs });
  }

  function drawSimulator(time) {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }

    const w = canvas.width || 540;
    const h = canvas.height || 410;

    // Фон залежно від обраної атмосфери
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (bgIndex === 0) {
      bgGrad.addColorStop(0, '#050811');
      bgGrad.addColorStop(0.6, '#0b1222');
      bgGrad.addColorStop(1, '#111827');
    } else if (bgIndex === 1) {
      bgGrad.addColorStop(0, '#16110c');
      bgGrad.addColorStop(0.6, '#231911');
      bgGrad.addColorStop(1, '#120d09');
    } else {
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.6, '#1e1b4b');
      bgGrad.addColorStop(1, '#111827');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Контур даху / балки карнизу
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 46);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(w, 46);
    ctx.stroke();

    // Підпис зверху на балці
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText('Жива модель 6МBY: 21 лінія (65 / 50 / 30 см) • 105 LED • Чорний дріт', 16, 28);

    const padX = 32;
    const usableW = w - padX * 2;
    const topY = 58;
    const maxDropPx = h * 0.56;

    // Чорний магістральний кабель
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, topY);
    ctx.lineTo(w - 10, topY);
    ctx.stroke();

    // Малюємо всі 21 лінію та 105 LED
    lines.forEach((line, idx) => {
      const x = padX + (usableW / (linesCount - 1)) * idx;
      const dropPx = (line.lenCm / 65) * maxDropPx;

      // Чорна нитка вертикальна
      ctx.strokeStyle = '#262f3f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, topY + dropPx);
      ctx.stroke();

      line.bulbs.forEach(bulb => {
        const y = topY + bulb.ratioY * dropPx;
        let isFlashingNow = false;
        if (simMode === 'flash' && bulb.isFlashCapable) {
          const wave = Math.sin(time * 0.008 + bulb.seed);
          isFlashingNow = wave > 0.86;
        }

        const glowR = isFlashingNow ? 22 : 12;
        const grad = ctx.createRadialGradient(x, y, 0.5, x, y, glowR);
        if (isFlashingNow) {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#fef08a');
          grad.addColorStop(0.65, 'rgba(251, 191, 36, 0.45)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else {
          grad.addColorStop(0, '#fef3c7');
          grad.addColorStop(0.35, 'rgba(251, 191, 36, 0.65)');
          grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isFlashingNow ? '#ffffff' : '#fde047';
        ctx.beginPath();
        ctx.arc(x, y, isFlashingNow ? 3.8 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    requestAnimationFrame(drawSimulator);
  }

  document.querySelectorAll('[data-sim-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      simMode = btn.dataset.simMode;
      document.querySelectorAll('[data-sim-mode]').forEach(b => b.classList.toggle('active', b === btn));
      const lbl = document.getElementById('simModeLabel');
      if (lbl) {
        lbl.textContent = simMode === 'flash'
          ? 'Жовтий + Флеш (Мерехтіння)'
          : 'Статичне тепле жовте світіння';
      }
    });
  });

  const bgToggleBtn = document.querySelector('[data-sim-bg="toggle"]');
  if (bgToggleBtn) {
    bgToggleBtn.addEventListener('click', () => {
      bgIndex = (bgIndex + 1) % 3;
    });
  }

  requestAnimationFrame(drawSimulator);
})();

// === 4. КАЛЬКУЛЯТОР ДОВЖИНИ ФАСАДУ ТА ВАРТОСТІ ===
const PRICE_SINGLE = 363;      // Акційна ціна за 1 шт з товари.xlsx
const PRICE_WHOLESALE = 340;   // Спецціна / Гурт від 2 шт (-6.5%) з товари.xlsx
const PRICE_OLD = 669;         // Стара/роздрібна ціна з товари.xlsx
const GARLAND_LEN_M = 6;       // 6 метрів
const LEDS_PER_UNIT = 105;     // 105 LED
const LINES_PER_UNIT = 21;     // 21 лінія

const calcRange = document.getElementById('calcRange');
const calcLengthLabel = document.getElementById('calcLengthLabel');
const calcUnits = document.getElementById('calcUnits');
const calcLeds = document.getElementById('calcLeds');
const calcUnitPrice = document.getElementById('calcUnitPrice');
const calcTierNote = document.getElementById('calcTierNote');
const calcSavings = document.getElementById('calcSavings');
const calcOldTotal = document.getElementById('calcOldTotal');
const calcTotalPrice = document.getElementById('calcTotalPrice');
const applyCalcToOrderBtn = document.getElementById('applyCalcToOrderBtn');

let currentCalculatedUnits = 2;

function updateCalculator(lengthMeters) {
  const len = Number(lengthMeters) || 12;
  const units = Math.max(1, Math.ceil(len / GARLAND_LEN_M));
  currentCalculatedUnits = units;

  const unitPrice = units >= 2 ? PRICE_WHOLESALE : PRICE_SINGLE;
  const total = units * unitPrice;
  const oldTotal = units * PRICE_OLD;
  const saved = oldTotal - total;
  const totalLeds = units * LEDS_PER_UNIT;
  const totalLines = units * LINES_PER_UNIT;

  if (calcLengthLabel) calcLengthLabel.textContent = `${len} м`;
  if (calcUnits) calcUnits.textContent = `${units} шт (${units * GARLAND_LEN_M} м)`;
  if (calcLeds) calcLeds.textContent = `${totalLeds} LED (${totalLines} ліній)`;
  if (calcUnitPrice) calcUnitPrice.textContent = `${unitPrice} ₴/шт`;
  if (calcTierNote) {
    calcTierNote.textContent = units >= 2
      ? 'Діє спецціна від 2 шт (-6.5%)'
      : 'Додайте ще 1 шт для ціни 340 ₴/шт!';
  }
  if (calcSavings) calcSavings.textContent = `${saved.toLocaleString('uk-UA')} ₴`;
  if (calcOldTotal) calcOldTotal.textContent = `Замість ${oldTotal.toLocaleString('uk-UA')} ₴`;
  if (calcTotalPrice) calcTotalPrice.textContent = `${total.toLocaleString('uk-UA')} ₴`;

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.len) === len);
  });
}

if (calcRange) {
  calcRange.addEventListener('input', e => updateCalculator(e.target.value));
}

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const len = Number(btn.dataset.len);
    if (calcRange) calcRange.value = len;
    updateCalculator(len);
  });
});

// === 5. ФОРМА ЗАМОВЛЕННЯ ТА ПІДРАХУНОК СУМИ ===
const orderQtyInput = document.getElementById('orderQtyInput');
const orderFormTierText = document.getElementById('orderFormTierText');
const orderFormTotal = document.getElementById('orderFormTotal');

function updateOrderFormSummary(qtyVal) {
  const qty = Math.max(1, Math.min(448, Number(qtyVal) || 1));
  if (orderQtyInput && Number(orderQtyInput.value) !== qty) {
    orderQtyInput.value = qty;
  }

  const unitPrice = qty >= 2 ? PRICE_WHOLESALE : PRICE_SINGLE;
  const total = qty * unitPrice;

  document.querySelectorAll('.qty-option').forEach(opt => {
    opt.classList.toggle('active', Number(opt.dataset.qty) === qty);
  });

  if (orderFormTierText) {
    orderFormTierText.textContent = qty >= 2
      ? `${qty} шт (${qty * 6} м) × ${unitPrice} ₴ (Спецціна -6.5%)`
      : `1 шт (6 м) × ${unitPrice} ₴ (Акційна ціна)`;
  }
  if (orderFormTotal) {
    orderFormTotal.textContent = `${total.toLocaleString('uk-UA')} ₴`;
  }
}

document.querySelectorAll('.qty-option').forEach(opt => {
  opt.addEventListener('click', () => {
    updateOrderFormSummary(Number(opt.dataset.qty));
  });
});

if (orderQtyInput) {
  orderQtyInput.addEventListener('input', e => {
    updateOrderFormSummary(e.target.value);
  });
}

if (applyCalcToOrderBtn) {
  applyCalcToOrderBtn.addEventListener('click', () => {
    updateOrderFormSummary(currentCalculatedUnits);
    const orderSection = document.getElementById('order');
    if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth' });
  });
}

// Копіювання характеристик у буфер обміну
const copySpecsBtn = document.getElementById('copySpecsBtn');
if (copySpecsBtn) {
  copySpecsBtn.addEventListener('click', () => {
    const specsText = [
      'Гірлянда Бахрома вулична 105 LED 6 м від мережі чорна нитка, жовтий 6МBY',
      'Артикул: 6МBY',
      'Джерело живлення: від мережі',
      'Кількість LED: 105 шт',
      'Загальна довжина: 6 м',
      'Відстань від вилки до першої лампочки: 96 см',
      'Відстань між лініями: 29 см',
      'Відстань між лампочками: 8 см',
      'Кількість ліній: 21',
      'Довжина ліній: 65 см, 50 см, 30 см',
      'Колір дроту: чорний',
      'Режим роботи: флеш'
    ].join('\n');

    navigator.clipboard.writeText(specsText).then(() => {
      const original = copySpecsBtn.textContent;
      copySpecsBtn.textContent = '✅ Скопійовано!';
      setTimeout(() => { copySpecsBtn.textContent = original; }, 2000);
    });
  });
}

// FAQ Акордеон
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    if (item) item.classList.toggle('open');
  });
});

// Відправка форми замовлення
const orderForm = document.getElementById('orderForm');
const orderSuccessModal = document.getElementById('orderSuccessModal');
const modalOrderDetails = document.getElementById('modalOrderDetails');
const closeModalBtn = document.getElementById('closeModalBtn');

if (orderForm) {
  orderForm.addEventListener('submit', e => {
    e.preventDefault();
    const qty = Math.max(1, Number(orderQtyInput.value) || 1);
    const unitPrice = qty >= 2 ? PRICE_WHOLESALE : PRICE_SINGLE;
    const total = qty * unitPrice;
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const orderNum = Math.floor(10000 + Math.random() * 90000);

    if (modalOrderDetails) {
      modalOrderDetails.innerHTML = `
        Замовлення <strong>№${orderNum}</strong> для <strong>${name}</strong> (${phone}) прийнято!<br><br>
        Товар: <strong>Гірлянда Бахрома 6МBY (${qty} шт × ${unitPrice} ₴)</strong><br>
        Сума до сплати: <strong style="color:var(--green-400);">${total.toLocaleString('uk-UA')} ₴</strong>
      `;
    }
    if (orderSuccessModal) {
      orderSuccessModal.classList.add('open');
    }
    orderForm.reset();
    updateOrderFormSummary(2);
  });
}

if (closeModalBtn && orderSuccessModal) {
  closeModalBtn.addEventListener('click', () => {
    orderSuccessModal.classList.remove('open');
  });
}

// Початкова ініціалізація
updateCalculator(12);
updateOrderFormSummary(2);
