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
        await fetch("/api/send-telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone: phoneValue,
            quiz: window.quizResult || null,
          }),
        });
      } catch (_) {}

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
