// E1: Yandex Metrika goals for contact clicks and form submits (counter 108284737).
// Safe when Metrika is blocked or not loaded: every call is guarded and wrapped in try/catch.
// Goal ids are listed in docs/analytics-goals.md. No visual or markup changes.
(function () {
  var COUNTER_ID = 108284737;

  // Funnel pages (/ladder/, /ru/ladder/) set window.edgeFunnelEntry = "funnel_page" before this script,
  // so their goals can be told apart from existing-page traffic. Other pages send exactly what they sent before.
  function send(goal) {
    var params = null;
    try {
      if (window.edgeFunnelEntry) {
        params = { entry: String(window.edgeFunnelEntry) };
        // Campaign context (utm_* and the CRO variant) comes from assets/ladder-funnel.js on funnel pages only.
        var c = typeof window.edgeFunnelCtx === "function" ? window.edgeFunnelCtx() : null;
        if (c) for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) params[k] = c[k];
      }
    } catch (e) {}
    try {
      if (typeof window.ym === "function") {
        if (params) window.ym(COUNTER_ID, "reachGoal", goal, params);
        else window.ym(COUNTER_ID, "reachGoal", goal);
      }
    } catch (e) {}
    // GA4 bridge: the pages load GA4 through Google Tag Manager, so the event goes to dataLayer
    // and GTM forwards it (Custom Event trigger on ^(cta_|form_submit|pdf_download)). No gtag on these pages.
    try {
      var item = { event: goal };
      if (params) for (var p in params) if (Object.prototype.hasOwnProperty.call(params, p)) item[p] = params[p];
      (window.dataLayer = window.dataLayer || []).push(item);
    } catch (e) {}
  }

  // Returns a goal id for a link, or "" when the link is not a tracked contact action.
  function goalForLink(a) {
    var raw = a.getAttribute("href") || "";
    if (!raw || raw.charAt(0) === "#") return "";
    var url;
    try {
      url = new URL(raw, window.location.href);
    } catch (e) {
      return "";
    }
    var proto = url.protocol;
    var host = url.hostname.toLowerCase().replace(/^www\./, "");
    var path = url.pathname.toLowerCase();
    if (proto === "mailto:") return "cta_email";
    if (proto !== "http:" && proto !== "https:") return "";
    if (host === "calendar.app.google") return "cta_calendar";
    if (host === "wa.me" || host === "api.whatsapp.com" || host === "whatsapp.com") return "cta_whatsapp";
    if (host === "linkedin.com" || host.slice(-13) === ".linkedin.com") return "cta_linkedin";
    if (host === "t.me" || host === "telegram.me") {
      var first = path.split("/")[1] || "";
      if (first === "share") return "cta_share";
      if (first === "timothy_ivaikin_ru" || first === "joinchat" || first.charAt(0) === "+" || raw.indexOf("t.me/+") !== -1) return "cta_channel";
      if (/bot$/.test(first)) return "cta_bot";
      return "cta_telegram";
    }
    if (/\.pdf$/.test(path)) return "pdf_download";
    return "";
  }

  document.addEventListener("click", function (e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (a) {
        var goal = goalForLink(a);
        if (goal) send(goal);
        return;
      }
      // Telegram hand-off button of the lead form: counts only when the form is filled in.
      var btn = e.target && e.target.closest ? e.target.closest("#telegram-copy") : null;
      if (btn) {
        var form = document.querySelector("#lead-form");
        if (!form || typeof form.checkValidity !== "function" || form.checkValidity()) send("cta_telegram");
      }
    } catch (err) {}
  });

  // The browser fires "submit" only after native validation passes.
  document.addEventListener("submit", function (e) {
    try {
      if (e.target && e.target.tagName === "FORM") send("form_submit");
    } catch (err) {}
  }, true);
})();
