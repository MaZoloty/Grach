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
  const progress = [0, 33, 66, 100, 100, 100];

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
          if (step < 3) {
            show(step + 1);
          } else {
            show(4);
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
      "Анализируем ваш фототип…",
      "Определяем, с какого метода лучше начать…",
      "Программа успешно сформирована! ✓",
    ];
    let i = 0;
    if (fill) fill.style.width = "0%";

    function tick() {
      if (i >= msgs.length) {
        buildResult();
        show(5);
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
    const hair = answers.q1;
    const pain = answers.q2;
    const goal = answers.q3;
    let method, reason, offer;

    if (pain === "laser_failed") {
      method = "Начать с электроэпиляции";
      reason = "Если лазер не помог, причина может быть в гормональном фоне или в типе волос. Электроэпиляция работает даже в таких случаях и подходит для точечной, устойчивой работы.";
      offer = "-10% на первый сеанс электроэпиляции у Екатерины.";
    } else if (goal === "quick") {
      method = "Начать с воска";
      reason = "Воск - быстрый и понятный метод. Один сеанс, гладкая кожа на 3-4 недели.";
      offer = "-15% на комплекс воском у Екатерины.";
    } else if (hair === "light") {
      method = "Начать с электроэпиляции";
      reason = "Светлые, рыжие и седые волосы лазер часто не захватывает, потому что в них мало пигмента. Электроэпиляция работает с любым цветом волос и подходит для постоянного результата.";
      offer = "-10% на первый сеанс электроэпиляции у Екатерины.";
    } else if (goal === "permanent") {
      method = "Начать с лазера";
      reason = "При тёмных и русых волосах лучше начать с лазера: он снижает плотность роста и делает следующие сеансы легче. Если потом останутся единичные устойчивые волоски, Екатерина отдельно подскажет, нужна ли электроэпиляция.";
      offer = "-1000 руб. на первый сеанс лазерной эпиляции у Екатерины.";
    } else if (pain === "ingrown") {
      method = "Начать с лазера";
      reason = "При вросших волосах и тёмных точках чаще всего лучше начинать с лазера: он снижает плотность роста, кожа меньше травмируется, а каждый следующий сеанс становится легче.";
      offer = "-1000 руб. на первый сеанс лазерной эпиляции у Екатерины.";
    } else if (goal === "trial") {
      method = "Начать с лазера";
      reason = "Для первого аккуратного шага при тёмных и русых волосах лучше начать с лазера: процедура проходит быстрее и с минимальным дискомфортом. Екатерина оценит зону и подберёт мягкий режим.";
      offer = "-1000 руб. на первый сеанс лазерной эпиляции у Екатерины.";
    } else {
      method = "Начать с лазера";
      reason = "Если хочется минимального дискомфорта на постоянной основе - твой вариант лазер. Тем временем волос становится всё меньше, и каждый следующий сеанс становится легче.";
      offer = "-1000 руб. на первый сеанс лазерной эпиляции у Екатерины.";
    }

    const methodEl = document.getElementById("qrMethod");
    const reasonEl = document.getElementById("qrReason");
    const offerEl = document.getElementById("qrOffer");
    if (methodEl) methodEl.textContent = method;
    if (reasonEl) reasonEl.textContent = reason;
    if (offerEl) offerEl.textContent = offer;

    const hairLabels = { dark: "Тёмные / жёсткие", medium: "Русые / шатен", light: "Светлые / рыжие / седые" };
    const painLabels = { irritation: "Раздражение и зуд", ingrown: "Вросшие волосы и тёмные точки", fast: "Волосы растут слишком быстро", laser_failed: "Лазер уже пробовала — без результата", none: "Ищу долгосрочный результат" };
    const goalLabels = { permanent: "Убрать навсегда (системный курс)", quick: "Гладкость за один визит", trial: "Попробовать, оценить комфорт" };

    if (typeof ym !== "undefined") ym(109386062, 'reachGoal', 'quiz_finish');
    window.quizResult = {
      hair: hairLabels[hair] || hair,
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
    const electroOn = !!(electroInclude && electroInclude.checked);
    const electro = electroOn ? calculateElectro() : { price: 0, time: 0 };

    const totalPrice = wax.price + laser.price + electro.price;
    const totalTime = wax.time + laser.time + electro.time;
    const hasZones = wax.count > 0 || laser.count > 0;
    const anything = hasZones || electroOn;

    if (totalEl) totalEl.textContent = anything ? (hasZones ? "от " : "") + rub(totalPrice) : "0 ₽";
    if (timeEl) timeEl.textContent = anything ? min(totalTime) : "Выберите зоны";
    if (electroBox) electroBox.classList.toggle("is-off", !electroOn);

    const parts = [];
    if (wax.count) parts.push(`<li><span>Воск / сахар${wax.comboName ? " · " + wax.comboName : ""}</span><b>от ${rub(wax.price)} · ${wax.time} мин</b></li>`);
    if (laser.count) parts.push(`<li><span>Лазер${laser.comboName ? " · " + laser.comboName : ""}</span><b>от ${rub(laser.price)} · ${laser.time} мин</b></li>`);
    if (electroOn) parts.push(`<li><span>Электроэпиляция</span><b>${rub(electro.price)} · ${electro.time} мин</b></li>`);
    if (breakdownEl) breakdownEl.innerHTML = parts.join("");

    if (detailsEl) {
      detailsEl.textContent = anything
        ? "Итог суммируется по всем методам. Цены «от» мастер уточнит по длине волос и зоне; для электро игла 250 ₽ уже учтена."
        : "Отмечайте зоны в любом методе - воск, лазер, электро. Расчёт суммируется по всем. Готовое комбо применяется автоматически.";
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
