// E2: hero button A/B test (edgeivaikin.com / and /ru/ only).
//   A = current button, anchor to #contact.
//   B = "book a 20-minute call", straight to the existing calendar link.
// Split 50/50 per visitor, kept in localStorage. Variant goes to Yandex Metrika as visit parameter ab_hero.
//
// ROLLBACK / FORCE: set FORCE to "A" (everyone sees the current button) or "B", or null for the 50/50 split.
// One-line change, one commit.
(function () {
  var FORCE = null; // "A" | "B" | null
  var COUNTER_ID = 108284737;
  var STORAGE_KEY = "edge_ab_hero";
  // Same link as the "choose a time" button in #contact (the script runs before that section is parsed).
  var CALENDAR_URL = "https://calendar.app.google/4aFN841D87V6or7q9";
  var TEXT_B = { ru: "Выбрать время для 20-минутного разговора", en: "Book a 20-minute call" };

  var hero = document.querySelector(".hero a.btn.primary[href='#contact']");
  if (!hero) return;
  var lang = (document.documentElement.getAttribute("lang") || "").toLowerCase().slice(0, 2);
  var textB = TEXT_B[lang];
  if (!textB) return;

  function ym() {
    try {
      if (typeof window.ym === "function") window.ym.apply(window, [COUNTER_ID].concat([].slice.call(arguments)));
    } catch (e) {}
  }

  var variant = null;
  var stored = null;
  var storageOk = true;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    storageOk = false;
  }
  var forced = FORCE === "A" || FORCE === "B";
  if (forced) {
    variant = FORCE;
  } else if (stored === "A" || stored === "B") {
    variant = stored;
  } else if (storageOk) {
    variant = Math.random() < 0.5 ? "A" : "B";
    try {
      window.localStorage.setItem(STORAGE_KEY, variant);
    } catch (e) {
      storageOk = false;
    }
  }
  // Without working storage a visitor could flip between variants: keep the current button and do not report.
  if (!variant) return;

  if (variant === "B") {
    hero.textContent = textB;
    hero.setAttribute("href", CALENDAR_URL);
    hero.setAttribute("target", "_blank");
    hero.setAttribute("rel", "noopener");
  }

  ym("params", { ab_hero: forced ? "forced_" + variant : variant });
  hero.addEventListener("click", function () {
    ym("reachGoal", "hero_cta", { ab_hero: forced ? "forced_" + variant : variant });
  });
})();
