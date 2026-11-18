// S2: Hunt ladder funnel for edgeivaikin.com (Yandex Metrika 108284737).
// Non-blocking stage events, no markup, text or design change. Stage ids and triggers: docs/analytics-funnel-hunt.md.
//   ladder_1_landing   first page of the visit
//   ladder_2_problem   problem section seen      ladder_3_solution  approach section seen
//   ladder_4_proof     cases / proof seen        ladder_5_offer     pricing / format / questions seen
//   ladder_6_intent    click to the contact block or first field of the lead form
//   ladder_7_conversion direct contact action (calendar, Telegram, bot, email, WhatsApp, phone, valid form submit)
//   ladder_aux_*       contact block seen, scroll 50 / 90 percent, 30 seconds of visible time
// Each id fires once per visit (30 minute window in sessionStorage, memory only if storage is blocked).
// Safe when ym is blocked or missing. Rollback: remove the script tags (or revert the S2 commit).
(function () {
  var COUNTER_ID = 108284737;
  var STORE_KEY = "edge_ladder_v1";
  var VISIT_MS = 30 * 60 * 1000;
  var DWELL_MS = 500;

  // Section selectors per stage. Missing sections are skipped, so one script serves every page type.
  var HOME_MAP = {
    ladder_2_problem: ["#capabilities"],
    ladder_3_solution: ["#model"],
    ladder_4_proof: ["#proof", "#history", "#sovereign", "#enterprise"],
    ladder_5_offer: ["#pricing", "#questions", "#proposal-review"],
    ladder_aux_contact_view: ["#contact"]
  };
  // /ru/automation-ai/: no case block on that page, so ladder_4_proof does not fire there.
  var LEAD_MAP = {
    ladder_2_problem: [".signal-strip", "#examples"],
    ladder_3_solution: ["section.fit", "section.method"],
    ladder_5_offer: ["section.lead-section", "section.faq"],
    ladder_aux_contact_view: ["#lead-form"]
  };

  var fired = {};

  function now() { return new Date().getTime(); }

  function readStore() {
    try {
      var raw = window.sessionStorage.getItem(STORE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return null;
    }
  }

  // True when this id was already sent in the current visit.
  function seen(id) {
    var t = now();
    if (fired[id] && t - fired[id] < VISIT_MS) return true;
    var data = readStore();
    return !!(data && data[id] && t - data[id] < VISIT_MS);
  }

  function remember(id) {
    var t = now();
    fired[id] = t;
    try {
      var data = readStore() || {};
      data[id] = t;
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function lang() {
    return (document.documentElement.getAttribute("lang") || "").toLowerCase().slice(0, 2) || "und";
  }

  // Coarse entry category only. Never URLs, queries or visitor input.
  function entryCategory() {
    try {
      var search = window.location.search || "";
      if (/[?&]utm_(medium|source|campaign)=/.test(search)) {
        return /[?&]utm_medium=(cpc|ppc|paid|paidsocial|cpm)(&|$)/.test(search) ? "paid" : "campaign";
      }
      var ref = document.referrer || "";
      if (!ref) return "direct";
      var host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
      if (host === window.location.hostname.toLowerCase().replace(/^www\./, "")) return "internal";
      if (/(^|\.)(google|bing|yandex|duckduckgo|ya|baidu|yahoo)\./.test(host)) return "search";
      if (/(^|\.)(t\.me|telegram\.org|wa\.me|whatsapp\.com)$/.test(host)) return "messenger";
      if (/(^|\.)(linkedin\.com|facebook\.com|instagram\.com|vk\.com|x\.com|twitter\.com|youtube\.com|habr\.com|dzen\.ru)$/.test(host)) return "social";
      return "referral";
    } catch (e) {
      return "unknown";
    }
  }

  function send(id, extra) {
    if (seen(id)) return false;
    remember(id);
    var params = null;
    try {
      params = { lang: lang(), ab_hero: window.edgeAbHero || "none", page: window.location.pathname };
      if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) params[k] = extra[k];
    } catch (e) {}
    try {
      if (params && typeof window.ym === "function") window.ym(COUNTER_ID, "reachGoal", id, params);
    } catch (e) {}
    // GA4 bridge: GA4 is loaded through Google Tag Manager on these pages, so the event also goes to dataLayer.
    try {
      var item = { event: id };
      if (params) for (var p in params) if (Object.prototype.hasOwnProperty.call(params, p)) item[p] = params[p];
      (window.dataLayer = window.dataLayer || []).push(item);
    } catch (e) {}
    return true;
  }

  // Link classes. Same rules as goalForLink in assets/goals.js (a test keeps them identical).
  function channelForLink(a) {
    var raw = a.getAttribute("href") || "";
    if (!raw) return "";
    if (raw.charAt(0) === "#") return "";
    var url;
    try { url = new URL(raw, window.location.href); } catch (e) { return ""; }
    var proto = url.protocol;
    var host = url.hostname.toLowerCase().replace(/^www\./, "");
    var path = url.pathname.toLowerCase();
    if (proto === "mailto:") return "email";
    if (proto === "tel:") return "phone";
    if (proto !== "http:" && proto !== "https:") return "";
    if (host === "calendar.app.google") return "calendar";
    if (host === "wa.me" || host === "api.whatsapp.com" || host === "whatsapp.com") return "whatsapp";
    if (host === "t.me" || host === "telegram.me") {
      var first = path.split("/")[1] || "";
      if (first === "timothy_ivaikin_ru" || first === "joinchat" || first.charAt(0) === "+" || raw.indexOf("t.me/+") !== -1) return "";
      return /bot$/.test(first) ? "bot" : "telegram";
    }
    return "";
  }

  function intent(trigger) { send("ladder_6_intent", { trigger: trigger }); }

  function conversion(channel) {
    // A direct contact action always counts as intent first, so the funnel stays nested.
    intent(channel);
    send("ladder_7_conversion", { channel: channel });
  }

  function watchSections(map) {
    if (typeof window.IntersectionObserver !== "function") return;
    var targets = []; // { el, id, timer }
    function find(el) {
      for (var i = 0; i < targets.length; i++) if (targets[i].el === el) return targets[i];
      return null;
    }
    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var item = find(entry.target);
        if (!item) return;
        if (entry.isIntersecting) {
          if (item.timer) return;
          // A section counts only after it stays in view for a moment, so fast scrolling does not count.
          item.timer = window.setTimeout(function () {
            item.timer = 0;
            send(item.id, { section: item.el.id || "section" });
            try { observer.unobserve(item.el); } catch (e) {}
          }, DWELL_MS);
        } else if (item.timer) {
          window.clearTimeout(item.timer);
          item.timer = 0;
        }
      });
    }, { rootMargin: "0px 0px -30% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) {
      map[id].forEach(function (selector) {
        var el = document.querySelector(selector);
        if (!el || find(el)) return;
        targets.push({ el: el, id: id, timer: 0 });
        observer.observe(el);
      });
    });
  }

  function watchScroll() {
    var ticking = false;
    function check() {
      ticking = false;
      var total = document.documentElement.scrollHeight || 0;
      if (!total) return;
      var pct = ((window.scrollY || window.pageYOffset || 0) + (window.innerHeight || 0)) / total;
      if (pct >= 0.5) send("ladder_aux_scroll_50");
      if (pct >= 0.9) {
        send("ladder_aux_scroll_90");
        window.removeEventListener("scroll", onScroll);
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(check);
      else check();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Counts only seconds while the tab is visible.
  function watchTime() {
    var seconds = 0;
    var timer = window.setInterval(function () {
      if (document.visibilityState === "hidden") return;
      seconds += 1;
      if (seconds >= 30) {
        window.clearInterval(timer);
        send("ladder_aux_time_30s");
      }
    }, 1000);
  }

  // Each part is guarded on its own, so a missing browser feature never disables the others.
  function guarded(setup) {
    try { setup(); } catch (e) {}
  }

  function init() {
    var isLead = false;
    guarded(function () { isLead = !!document.querySelector("#lead-form"); });
    guarded(function () { send("ladder_1_landing", { entry: entryCategory() }); });
    guarded(function () { watchSections(isLead ? LEAD_MAP : HOME_MAP); });
    guarded(watchScroll);
    guarded(watchTime);

    guarded(function () {
      document.addEventListener("click", function (e) {
        try {
          var t = e.target;
          var a = t && t.closest ? t.closest("a[href]") : null;
          if (a) {
            var channel = channelForLink(a);
            if (channel) { conversion(channel); return; }
            var href = a.getAttribute("href") || "";
            if (href === "#contact" || href === "#lead-form") intent("anchor");
            return;
          }
          var btn = t && t.closest ? t.closest("#telegram-copy") : null;
          if (btn) {
            var form = document.querySelector("#lead-form");
            if (!form || typeof form.checkValidity !== "function" || form.checkValidity()) conversion("telegram");
          }
        } catch (err) {}
      });
    });

    // First touch of a lead form field is intent; a valid submit is a conversion.
    guarded(function () {
      document.addEventListener("focusin", function (e) {
        try {
          var el = e.target;
          if (el && el.closest && el.closest("#lead-form") && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) intent("form_start");
        } catch (err) {}
      });
    });
    guarded(function () {
      document.addEventListener("submit", function (e) {
        try {
          if (e.target && e.target.tagName === "FORM") conversion("form");
        } catch (err) {}
      }, true);
    });
  }

  init();
})();
