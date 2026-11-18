// Hunt ladder funnel PAGES for edgeivaikin.com (/ladder/N/ and /ru/ladder/N/, N = 1..7).
// Same event ids as assets/ladder.js (ladder_1_landing ... ladder_7_conversion, ladder_aux_*), but every event of
// these pages carries entry = "funnel_page" and funnel_step = N, so funnel-page visitors are separable from
// existing-page traffic. Own sessionStorage key, so a visit to the home page does not hide funnel-page events.
// Yandex Metrika 108284737 (ym reachGoal) + dataLayer for GA4 through GTM. Safe when ym or storage is blocked.
// Page N reports its own stage: 2 problem, 3 solution, 4 proof, 5 offer (section seen for 0.5 s),
// 6 intent (page seen for 0.5 s, or a click to the contact step), 7 conversion (direct contact action).
// Rollback: delete /ladder/ and /ru/ladder/ (revert the funnel-pages merge). Nothing else depends on this file.
(function () {
  var COUNTER_ID = 108284737;
  var STORE_KEY = "edge_ladder_funnel_v1";
  var VISIT_MS = 30 * 60 * 1000;
  var DWELL_MS = 500;
  var ENTRY = "funnel_page";
  var STAGES = { 2: "ladder_2_problem", 3: "ladder_3_solution", 4: "ladder_4_proof", 5: "ladder_5_offer", 6: "ladder_6_intent" };

  var fired = {};
  var step = 0;

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

  // Coarse traffic source only. Never URLs, queries or visitor input.
  function sourceCategory() {
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
      params = { lang: lang(), ab_hero: "none", page: window.location.pathname, entry: ENTRY, funnel_step: step };
      if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) params[k] = extra[k];
    } catch (e) {}
    try {
      if (params && typeof window.ym === "function") window.ym(COUNTER_ID, "reachGoal", id, params);
    } catch (e) {}
    try {
      var item = { event: id };
      if (params) for (var p in params) if (Object.prototype.hasOwnProperty.call(params, p)) item[p] = params[p];
      (window.dataLayer = window.dataLayer || []).push(item);
    } catch (e) {}
    return true;
  }

  // Same link classes as assets/ladder.js (a test keeps them identical).
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

  function watch(el, onSeen) {
    if (!el || typeof window.IntersectionObserver !== "function") return;
    var timer = 0;
    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (timer) return;
          timer = window.setTimeout(function () {
            timer = 0;
            onSeen();
            try { observer.unobserve(el); } catch (e) {}
          }, DWELL_MS);
        } else if (timer) {
          window.clearTimeout(timer);
          timer = 0;
        }
      });
    }, { rootMargin: "0px 0px -30% 0px", threshold: 0 });
    observer.observe(el);
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

  function guarded(setup) {
    try { setup(); } catch (e) {}
  }

  function init() {
    var body = document.body;
    step = parseInt((body && body.getAttribute("data-funnel-step")) || "0", 10) || 0;

    // First funnel page of the visit, whichever step it is. funnel_step tells where the visitor came in.
    guarded(function () { send("ladder_1_landing", { source: sourceCategory(), landing: window.location.pathname }); });

    guarded(function () {
      var id = STAGES[step];
      var el = document.querySelector("[data-ladder-stage]");
      if (id && el) {
        watch(el, function () {
          if (id === "ladder_6_intent") intent("step_page");
          else send(id, { section: el.id || "section" });
        });
      }
      var contact = document.querySelector("#contact");
      if (step === 7 && contact) watch(contact, function () { send("ladder_aux_contact_view", { section: "contact" }); });
    });
    guarded(watchScroll);
    guarded(watchTime);

    guarded(function () {
      document.addEventListener("click", function (e) {
        try {
          var t = e.target;
          var a = t && t.closest ? t.closest("a[href]") : null;
          if (!a) return;
          var channel = channelForLink(a);
          if (channel) { conversion(channel); return; }
          if (a.hasAttribute("data-ladder-contact")) intent("contact_step");
        } catch (err) {}
      });
    });
  }

  init();
})();
