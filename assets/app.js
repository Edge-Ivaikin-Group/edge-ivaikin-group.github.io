// Minimal enhancements: goals, mobile contact bar, smooth scrolling, deck keys.
document.addEventListener("click", (e) => {
  const goalLink = e.target.closest("a[data-goal]");
  if (goalLink) {
    const goal = goalLink.getAttribute("data-goal");
    if (goal && typeof window.ym === "function") {
      window.ym(108284737, "reachGoal", goal);
    }
    if (goal && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: goal });
    }
  }
  const a = e.target.closest("a[data-scroll]");
  if (!a) return;
  const id = a.getAttribute("href");
  if (id && id.startsWith("#")) {
    e.preventDefault();
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

(function () {
  const bar = document.querySelector(".sticky-cta");
  const hero = document.querySelector(".hero");
  const contact = document.querySelector("#contact");
  if (!bar || !hero || !contact || !("IntersectionObserver" in window)) return;
  const mq = window.matchMedia("(max-width: 540px)");
  let heroVisible = true;
  let contactVisible = false;

  function place(show) {
    const header = document.querySelector("header");
    bar.hidden = true;
    document.body.classList.remove("has-sticky-cta");
    document.body.style.removeProperty("--sticky-cta-height");
    if (!show || !mq.matches) return;
    bar.hidden = false;
    const height = bar.offsetHeight;
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    if (window.innerHeight - height < headerBottom + 8) {
      bar.hidden = true;
      return;
    }
    document.body.style.setProperty("--sticky-cta-height", height + "px");
    document.body.classList.add("has-sticky-cta");
  }

  function update() {
    place(mq.matches && !heroVisible && !contactVisible);
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === hero) heroVisible = entry.isIntersecting;
      if (entry.target === contact) contactVisible = entry.isIntersecting;
    }
    update();
  }, { threshold: 0 });
  observer.observe(hero);
  observer.observe(contact);
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", update);
  else if (typeof mq.addListener === "function") mq.addListener(update);
  window.addEventListener("resize", update);
  update();
})();

(function () {
  const deck = document.querySelector("[data-deck]");
  if (!deck) return;
  const slides = Array.from(deck.querySelectorAll(".slide"));
  const links = Array.from(deck.querySelectorAll(".deck-contents a"));
  const controls = deck.querySelector(".deck-controls");
  const previous = controls.querySelector("[data-previous]");
  const next = controls.querySelector("[data-next]");
  const count = controls.querySelector("[data-slide-count]");
  let current = 0;

  function show(focus = false) {
    const index = slides.findIndex(slide => "#" + slide.id === location.hash);
    current = Math.max(0, index);
    slides.forEach((slide, position) => {
      slide.hidden = position !== current;
    });
    links.forEach(link => {
      if (link.hash === "#" + slides[current].id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.textContent = (current + 1) + " / " + slides.length;
    if (focus) {
      slides[current].querySelector("h1, h2").focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }

  function go(index) {
    if (index < 0 || index >= slides.length || index === current) return;
    history.pushState(null, "", "#" + slides[index].id);
    show(true);
  }

  previous.addEventListener("click", () => go(current - 1));
  next.addEventListener("click", () => go(current + 1));
  deck.addEventListener("click", event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const index = slides.findIndex(slide => "#" + slide.id === link.getAttribute("href"));
    if (index === -1) return;
    event.preventDefault();
    go(index);
  });
  window.addEventListener("hashchange", () => show(true));
  window.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest("input, select, textarea, [contenteditable]")) return;
    let index;
    switch (event.key) {
      case "ArrowRight":
      case "PageDown": index = current + 1; break;
      case "ArrowLeft":
      case "PageUp": index = current - 1; break;
      case "Home": index = 0; break;
      case "End": index = slides.length - 1; break;
      case " ":
        if (event.target.closest("button, a")) return;
        index = current + 1;
        break;
      default: return;
    }
    event.preventDefault();
    go(index);
  });
  controls.hidden = false;
  show();
})();
