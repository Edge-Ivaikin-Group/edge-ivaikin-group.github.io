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

(function(){
  const deck = document.querySelector("[data-deck]");
  if(!deck) return;
  const slides = Array.from(document.querySelectorAll(".slide"));
  let i = 0;
  function show(n){
    i = Math.max(0, Math.min(slides.length-1, n));
    slides.forEach((s, idx)=> s.classList.toggle("active", idx===i));
    history.replaceState(null, "", `#${i+1}`);
  }
  const h = location.hash.match(/^#(\d+)$/);
  if(h) show(parseInt(h[1],10)-1); else show(0);
  window.addEventListener("keydown", (e)=>{
    if(["ArrowRight","PageDown"," "].includes(e.key)) show(i+1);
    if(["ArrowLeft","PageUp"].includes(e.key)) show(i-1);
    if(e.key==="Home") show(0);
    if(e.key==="End") show(slides.length-1);
  });
})();
