// E3: single constant for the Telegram channel link used by the "channel" note on the homepages.
// The links in the HTML already carry this URL (works without JS); this keeps them in sync.
// To use an invite link per site later, change only this constant (and the href fallback in the two HTML notes).
(function () {
  var CHANNEL_URL = "https://t.me/timothy_ivaikin_ru";
  var links = document.querySelectorAll("a[data-channel-link]");
  for (var i = 0; i < links.length; i++) links[i].setAttribute("href", CHANNEL_URL);
})();
