/* ── Header scroll state ─────────────────────── */
(function () {
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  if (!header) return;
  const update = () => {
    const isMobile = window.innerWidth <= 768;
    const threshold = isMobile ? (hero ? hero.offsetHeight * 0.75 : window.innerHeight * 0.75) : 40;
    header.classList.toggle("is-scrolled", window.scrollY > threshold);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
})();

const mobileBar = document.querySelector(".mobile-bar");
const toggleMobileBar = () => {
  if (!mobileBar) return;
  mobileBar.classList.toggle("is-visible", window.scrollY > 360);
};

toggleMobileBar();
window.addEventListener("scroll", toggleMobileBar, { passive: true });

document.querySelectorAll(".qr-consult-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.getElementById("consultation");
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", "#consultation");
  });
});

/* ── Quiz Router ─────────────────────────────── */
(function () {
  const answers = {};
  let current = 0;
  const progress = [0, 25, 50, 75, 100, 100, 100];

  const progressBar = document.getElementById("qrProgress");
  const progressFill = document.getElementById("qrFill");

  function show(n) {
    const prev = document.getElementById("qr-" + current);
    if (prev) prev.classList.remove("qr-active");
    current = n;
    const next = document.getElementById("qr-" + n);
    if (!next) return;
    requestAnimationFrame(() => next.classList.add("qr-active"));
    if (n >= 1 && progressBar) {
      progressBar.classList.add("qr-visible");
      if (progressFill) progressFill.style.width = progress[n] + "%";
    }
  }

  // Start button
  const startBtn = document.querySelector(".qr-btn-start");
  if (startBtn) startBtn.addEventListener("click", () => {
    if (typeof ym !== "undefined") ym(109386062, 'reachGoal', 'quiz_start');
    show(1);
  });

  // Option clicks (event delegation per options group)
  document.querySelectorAll(".qr-options").forEach((group) => {
    const step = parseInt(group.dataset.step);
    group.querySelectorAll(".qr-option").forEach((btn) => {
      btn.addEventListener("click", function () {
        answers["q" + step] = this.dataset.value;
        group.querySelectorAll(".qr-option").forEach((b) => b.classList.remove("qr-selected"));
        this.classList.add("qr-selected");
        setTimeout(() => {
          if (step < 4) {
            show(step + 1);
          } else {
            show(5);
            runLoader();
          }
        }, 360);
      });
    });
  });

  function runLoader() {
    const textEl = document.getElementById("qrLoadingText");
    const fill = document.getElementById("qrLoaderFill");
    const msgs = [
      "Анализируем ваш запрос…",
      "Подбираем пробное комбо к Екатерине…",
      "Спецпредложение сформировано! ✓",
    ];
    let i = 0;
    if (fill) fill.style.width = "0%";

    function tick() {
      if (i >= msgs.length) {
        buildResult();
        show(6);
        return;
      }
      if (textEl) textEl.style.opacity = "0";
      setTimeout(() => {
        if (textEl) { textEl.textContent = msgs[i]; textEl.style.opacity = "1"; }
        if (fill) fill.style.width = Math.round(((i + 1) / msgs.length) * 100) + "%";
        i++;
        setTimeout(tick, 950);
      }, 220);
    }
    tick();
  }

  function buildResult() {
    const zone = answers.q1;
    const hairType = answers.q2;
    const pain = answers.q3;
    const goal = answers.q4;
    let method, reason, offer;

    const laserAllowed = hairType === "dark" || hairType === "dark_soft";
    const recommendLaserWax = laserAllowed && (zone === "legs_full" || (zone === "unsure" && goal === "permanent" && pain !== "laser_failed"));
    const recommendShins = zone === "shins" || (!laserAllowed && zone === "legs_full");
    const recommendBikini = zone === "bikini" || (zone === "unsure" && (pain === "laser_failed" || pain === "fast" || (!laserAllowed && goal === "permanent")));

    if (recommendShins) {
      method = "Комбо «Голени»";
      reason = laserAllowed
        ? "Подойдёт, если хочется начать с ног и сразу сравнить два ощущения: 30 минут точечной электроэпиляции и быстрый воск по голеням для гладкости за один визит."
        : "Для светлых, рыжих, седых и пушковых волос лазер неэффективен, поэтому лучше начать с электроэпиляции и воска: электро работает с любым цветом волос, а воск даёт гладкость за один визит.";
      offer = "Электро 30 мин + голени воск (1 час · 2550 ₽)";
    } else if (recommendLaserWax) {
      method = "Комбо «Лазер + воск»";
      reason = "Подойдёт, если хочется совместить долгосрочную работу лазером с быстрым результатом воска. Екатерина подскажет, какие зоны лучше распределить между методами.";
      offer = "Лазер + воск (45 мин · 3500 ₽)";
    } else if (recommendBikini) {
      method = "Комбо «Бикини»";
      reason = "Подойдёт, если хотите начать с чувствительной зоны и сразу понять ощущения от электроэпиляции. Екатерина 30 минут работает электро, а воск помогает завершить визит гладко и без затягивания процедуры.";
      offer = "Электро 30 мин + воск 30 мин (1 час · 3200 ₽)";
    } else {
      method = "Комбо «Подмышки»";
      reason = "Подойдёт для мягкого первого знакомства с электроэпиляцией: зона небольшая, визит короче, а воск помогает сразу получить аккуратную гладкость.";
      offer = "Электро 30 мин + воск 15 мин (45 мин · 1850 ₽)";
    }

    const methodEl = document.getElementById("qrMethod");
    const reasonEl = document.getElementById("qrReason");
    const offerEl = document.getElementById("qrOffer");
    if (methodEl) methodEl.textContent = method;
    if (reasonEl) reasonEl.textContent = reason;
    if (offerEl) offerEl.textContent = offer;

    const zoneLabels = { bikini: "Бикини", underarms: "Подмышки", shins: "Голени", legs_full: "Ноги полностью", unsure: "Пока сомневаюсь" };
    const hairTypeLabels = { dark: "Тёмные / плотные", dark_soft: "Тёмные / тонкие", light: "Светлые / рыжие / седые", vellus: "Пушковые / очень тонкие" };
    const painLabels = { irritation: "Раздражение и зуд", ingrown: "Вросшие волосы и тёмные точки", fast: "Волосы растут слишком быстро", laser_failed: "Лазер уже пробовала — без результата", none: "Ищу долгосрочный результат" };
    const goalLabels = { permanent: "Убрать навсегда (системный курс)", quick: "Гладкость за один визит", trial: "Попробовать, оценить комфорт" };

    if (typeof ym !== "undefined") ym(109386062, 'reachGoal', 'quiz_finish');
    window.quizResult = {
      zone: zoneLabels[zone] || zone,
      hairType: hairTypeLabels[hairType] || hairType,
      hair: hairTypeLabels[hairType] || hairType,
      pain: painLabels[pain] || pain,
      goal: goalLabels[goal] || goal,
      method,
      offer,
    };
  }

})();

/* ── Cost calculator ─────────────────────────── */
(function () {
  const root = document.querySelector("[data-cost-calculator]");
  if (!root) return;

  const tabs = root.querySelectorAll("[data-calc-method]");
  const panels = root.querySelectorAll("[data-calc-panel]");
  const totalEl = document.getElementById("calcTotal");
  const timeEl = document.getElementById("calcTime");
  const detailsEl = document.getElementById("calcDetails");
  const bookLink = document.getElementById("calcBookLink");
  const minutesInput = document.getElementById("electroMinutes");
  const electroInclude = document.getElementById("electroInclude");
  const electroBox = root.querySelector(".electro-box");
  const breakdownEl = document.getElementById("calcBreakdown");
  const resetBtn = document.getElementById("calcReset");

  const combos = {
    wax: [
      { zones: ["deep-bikini", "underarms"], price: 2300, time: 30, name: "комбо: глубокое бикини + подмышки" },
      { zones: ["deep-bikini", "underarms", "shins"], price: 3000, time: 40, name: "комбо: глубокое бикини + подмышки + голени" },
      { zones: ["deep-bikini", "underarms", "legs-full"], price: 3200, time: 55, name: "комбо: глубокое бикини + подмышки + ноги полностью" },
    ],
    laser: [
      { zones: ["deep-bikini", "underarms"], price: 3200, time: 30, name: "комбо 1: глубокое бикини + подмышки" },
      { zones: ["deep-bikini", "underarms", "shins"], price: 5300, time: 60, name: "комбо 4: глубокое бикини + подмышки + голени" },
      { zones: ["deep-bikini", "underarms", "legs-full"], price: 6400, time: 90, name: "комбо 5: глубокое бикини + подмышки + ноги полностью" },
      { zones: ["underarms", "bikini-classic", "deep-bikini", "shins", "legs-full", "arms-full"], price: 9900, time: 120, name: "комбо 6: все включено" },
    ],
  };

  let method = "wax";

  const rub = (value) => value.toLocaleString("ru-RU") + " ₽";
  const min = (value) => value ? value + " мин" : "Выберите зоны";

  function selectedZones(panel) {
    return Array.from(panel.querySelectorAll("input[type='checkbox']:checked")).map((input) => ({
      id: input.dataset.zone,
      price: Number(input.dataset.price),
      time: Number(input.dataset.time),
    }));
  }

  function applyBestCombo(items, methodName) {
    const base = {
      price: items.reduce((sum, item) => sum + item.price, 0),
      time: items.reduce((sum, item) => sum + item.time, 0),
      comboName: "",
    };
    const methodCombos = combos[methodName] || [];
    const selectedIds = new Set(items.map((item) => item.id));
    let best = base;

    methodCombos.forEach((combo) => {
      const fits = combo.zones.every((zone) => selectedIds.has(zone));
      if (!fits) return;
      const comboSet = new Set(combo.zones);
      const rest = items.filter((item) => !comboSet.has(item.id));
      const candidate = {
        price: combo.price + rest.reduce((sum, item) => sum + item.price, 0),
        time: combo.time + rest.reduce((sum, item) => sum + item.time, 0),
        comboName: combo.name,
      };
      if (candidate.price < best.price || (candidate.price === best.price && candidate.time < best.time)) {
        best = candidate;
      }
    });

    return best;
  }

  function calculateElectro() {
    const selectedRate = root.querySelector("input[name='electroType']:checked");
    const rate = selectedRate ? Number(selectedRate.dataset.rate) : 40;
    const minutes = Math.min(180, Math.max(10, Number(minutesInput?.value || 40)));
    const needle = 250;
    return {
      price: minutes * rate + needle,
      time: minutes,
      detail: `${rub(minutes * rate)} за работу + ${rub(needle)} одноразовая игла`,
    };
  }

  function trialResult() {
    const trialNames = {
      bikini: "Комбо «Бикини»",
      underarms: "Комбо «Подмышки»",
      shins: "Комбо «Голени»",
      laser_wax: "Комбо «Лазер + воск»",
    };
    const items = Array.from(root.querySelectorAll("input[data-trial-combo]:checked")).map((input) => ({
      id: input.dataset.trialCombo,
      price: Number(input.dataset.price),
      time: Number(input.dataset.time),
      name: trialNames[input.dataset.trialCombo] || "Пробное комбо",
    }));
    return {
      price: items.reduce((sum, item) => sum + item.price, 0),
      time: items.reduce((sum, item) => sum + item.time, 0),
      count: items.length,
      names: items.map((item) => item.name).join(", "),
    };
  }

  function methodResult(methodName) {
    const panel = root.querySelector(`[data-calc-panel="${methodName}"]`);
    const items = panel ? selectedZones(panel) : [];
    if (!items.length) return { price: 0, time: 0, count: 0, comboName: "" };
    const best = applyBestCombo(items, methodName);
    return { price: best.price, time: best.time, count: items.length, comboName: best.comboName };
  }

  function update() {
    const wax = methodResult("wax");
    const laser = methodResult("laser");
    const trial = trialResult();
    const electroOn = !!(electroInclude && electroInclude.checked);
    const electro = electroOn ? calculateElectro() : { price: 0, time: 0 };

    const totalPrice = wax.price + laser.price + trial.price + electro.price;
    const totalTime = wax.time + laser.time + trial.time + electro.time;
    const hasZones = wax.count > 0 || laser.count > 0 || trial.count > 0;
    const hasApproxPrice = wax.count > 0 || laser.count > 0;
    const anything = hasZones || electroOn;

    if (totalEl) totalEl.textContent = anything ? (hasApproxPrice ? "от " : "") + rub(totalPrice) : "0 ₽";
    if (timeEl) timeEl.textContent = anything ? min(totalTime) : "Выберите зоны";
    if (electroBox) electroBox.classList.toggle("is-off", !electroOn);

    const parts = [];
    if (wax.count) parts.push(`<li><span>Воск / сахар${wax.comboName ? " · " + wax.comboName : ""}</span><b>от ${rub(wax.price)} · ${wax.time} мин</b></li>`);
    if (laser.count) parts.push(`<li><span>Лазер${laser.comboName ? " · " + laser.comboName : ""}</span><b>от ${rub(laser.price)} · ${laser.time} мин</b></li>`);
    if (trial.count) parts.push(`<li><span>Пробные комбо · ${trial.names}</span><b>${rub(trial.price)} · ${trial.time} мин</b></li>`);
    if (electroOn) {
      const selectedRate = root.querySelector("input[name='electroType']:checked");
      const masterLabel = selectedRate && selectedRate.value === "maria" ? "Мария" : "Екатерина";
      parts.push(`<li><span>Электроэпиляция (${masterLabel})</span><b>${rub(electro.price)} · ${electro.time} мин</b></li>`);
    }
    if (breakdownEl) breakdownEl.innerHTML = parts.join("");

    if (detailsEl) {
      detailsEl.textContent = anything
        ? (trial.count
          ? "Спеццена пробных комбо действует для новых клиентов по результату цифровой консультации при записи к Екатерине. Если в расчёте есть электроэпиляция, одноразовая игла 250 ₽ уже включена."
          : "Это предварительный ориентир перед записью. Если в расчёте есть электроэпиляция, одноразовая игла 250 ₽ уже включена; точную схему мастер уточнит на визите.")
        : "Отметьте нужные зоны и процедуры - мы покажем примерную стоимость и длительность одного визита.";
    }
    if (resetBtn) resetBtn.hidden = !anything;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      method = tab.dataset.calcMethod;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.calcPanel === method));
      update();
    });
  });

  function resetAll() {
    root.querySelectorAll("input[type='checkbox']").forEach((c) => { c.checked = false; });
    if (minutesInput) minutesInput.value = 40;
    update();
  }

  root.addEventListener("change", update);
  if (minutesInput) minutesInput.addEventListener("input", update);
  if (resetBtn) resetBtn.addEventListener("click", resetAll);
  if (bookLink) {
    bookLink.addEventListener("click", () => {
      if (typeof ym !== "undefined") ym(109386062, "reachGoal", "calculator_booking_click");
    });
  }
  update();
})();

/* ── Standalone consultation form ───────────── */
(function () {
  function formatPhone(input) {
    let v = input.value.replace(/\D/g, "");
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (!v.startsWith("7")) v = "7" + v;
    v = v.slice(0, 11);
    let out = "+7";
    if (v.length > 1) out += " (" + v.slice(1, 4);
    if (v.length >= 4) out += ") " + v.slice(4, 7);
    if (v.length >= 7) out += "-" + v.slice(7, 9);
    if (v.length >= 9) out += "-" + v.slice(9, 11);
    input.value = out;
  }

  const phone = document.getElementById("consultationPhone");
  if (phone) {
    phone.addEventListener("input", function () {
      formatPhone(this);
    });
  }

  const form = document.getElementById("consultationForm");
  if (form) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const name = this.name.value.trim();
      const phoneValue = this.phone.value.trim();
      const btn = this.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Отправляем…"; }

      try {
        if (typeof ym !== "undefined") ym(109386062, 'reachGoal', 'consultation_submit');
        const response = await fetch("/api/send-telegram.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone: phoneValue,
            quiz: window.quizResult || null,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || "Не удалось отправить заявку");
        }
      } catch (_) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Получить консультацию";
        }
        alert("Не удалось отправить заявку. Пожалуйста, напишите нам в сообщения сообщества или попробуйте позже.");
        return;
      }

      this.innerHTML = `
        <div class="qr-success">
          <div class="qr-success-check">✓</div>
          <h3>Спасибо, ${name}!</h3>
          <p>Мы свяжемся с вами по номеру ${phoneValue} и поможем выбрать первый комфортный шаг.</p>
        </div>`;
    });
  }
})();

/* ── Nav drawer ───────────────────────────────── */
(function () {
  const burger = document.getElementById("burgerBtn");
  const drawer = document.getElementById("navDrawer");
  const overlay = document.getElementById("navOverlay");
  const closeBtn = document.getElementById("drawerClose");
  if (!burger || !drawer || !overlay) return;

  const open = () => {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  burger.addEventListener("click", open);
  closeBtn && closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", close);
  document.querySelectorAll("[data-drawer-link]").forEach((a) =>
    a.addEventListener("click", close)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

/* ── Cookie banner ───────────────────────────── */
(function () {
  const banner = document.getElementById("cookieBanner");
  const btn = document.getElementById("cookieAccept");
  if (!banner || !btn) return;
  if (localStorage.getItem("cookie_ok")) {
    banner.classList.add("is-hidden");
    return;
  }
  btn.addEventListener("click", () => {
    localStorage.setItem("cookie_ok", "1");
    banner.classList.add("is-hidden");
  });
})();

/* ── Yandex Metrika goals ─────────────────────── */
(function () {
  const ymGoal = (name) => { if (typeof ym !== "undefined") ym(109386062, 'reachGoal', name); };

  // Кнопки записи на Dikidi
  document.querySelectorAll('a[href*="dikidi.net"]').forEach((el) => {
    el.addEventListener("click", () => ymGoal("book_online"));
  });

  // Нижняя кнопка "Онлайн запись"
  const mobileBarLink = document.querySelector(".mobile-bar a");
  if (mobileBarLink) mobileBarLink.addEventListener("click", () => ymGoal("mobile_bar_click"));
})();
