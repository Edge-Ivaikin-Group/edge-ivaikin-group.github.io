// Minimal enhancements: smooth scrolling + deck keyboard (if present)
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[data-scroll]');
  if(!a) return;
  const id = a.getAttribute("href");
  if(id && id.startsWith("#")){
    e.preventDefault();
    document.querySelector(id)?.scrollIntoView({behavior:"smooth", block:"start"});
  }
});

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
