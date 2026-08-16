async function load(){
  try{
    const r=await fetch("/api/site",{cache:"no-store"});
    if(!r.ok)throw new Error("Could not load school data");
    const d=await r.json(),s=d.school||{};
    document.getElementById("heroTitle").textContent=s.heroTitle||"";
    document.getElementById("heroText").textContent=s.heroText||"";
    document.getElementById("aboutTitle").textContent=s.aboutTitle||"";
    document.getElementById("aboutText").textContent=s