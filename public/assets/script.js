async function load(){
  try{
    const siteResponse=await fetch("/api/site",{cache:"no-store"});
    if(!siteResponse.ok)throw new Error("Could not load school data");
    const d=await siteResponse.json(),s=d.school||{};
    document.getElementById("heroTitle").textContent=s.heroTitle||"";
    document.getElementById("heroText").textContent=s.heroText||"";
    document.getElementById("aboutTitle").textContent=s.aboutTitle||"";
    document.getElementById("aboutText").textContent=s.aboutText||"";
    document.getElementById("aboutImage").src=s.aboutImage||"/assets/srvm-logo.png";
    document.getElementById("students").textContent=s.students??0;
    document.getElementById("teachers").textContent=s.teachers??0;
    document.getElementById("participation").textContent=(s.participation??0)+"%";
    document.getElementById("years").textContent=s.years??0;
    document.getElementById("years2").textContent=s.years??0;
    document.getElementById("footerAddress").textContent=s.address||"";
    document.getElementById("footerContact").textContent=(s.phone||"")+" • "+(s.email||"");
    renderSocialLinks(s);
    document.getElementById("facilityGrid").innerHTML=(d.facilities||[]).map(x=>`<article class="facility"><div class="num">${safe(x.icon)}</div><h3>${safe(x.title)}</h3><p>${safe(x.text)}</p></article>`).join("");
    document.getElementById("eventList").innerHTML=(d.events||[]).map(x=>`<article class="event"><strong>${safe(x.date)}</strong><h3>${safe(x.title)}</h3><p>${safe(x.description)}</p></article>`).join("");

    // The admission form and the public Academics section now use the same
    // enabled-class endpoint. This makes Class Management the single source of truth.
    let enabledClasses=[];
    try{
      const classResponse=await fetch("/api/classes",{cache:"no-store"});
      if(classResponse.ok){
        const classData=await classResponse.json();
        enabledClasses=Array.isArray(classData)?classData:[];
      }
    }catch(e){console.warn("Could not load enabled classes",e)}
    renderFutureAcademics(enabledClasses);

    document.getElementById("photoGrid").innerHTML=(d.gallery||[]).map(x=>`<figure class="photo-card"><img src="${safe(x.url)}" alt="${safe(x.title)}"><figcaption><b>${safe(x.title)}</b><span>${safe(x.caption||"")}</span></figcaption></figure>`).join("") || `<div class="photo-empty">Event photos will appear here after the admin uploads them.</div>`;
  }catch(err){console.error("SRVM load error:",err)}
}

function renderFutureAcademics(config){
  const el=document.getElementById("futureAcademicRows");
  if(!el)return;
  const enabled=Array.isArray(config)?config.filter(x=>x&&["Class IX","Class X","Class XI","Class XII"].includes(String(x.name))):[];
  if(!enabled.length){el.innerHTML="";return;}
  const enabledNames=new Set(enabled.map(x=>String(x.name)));
  const groups=[
    {label:"Secondary",names:["Class IX","Class X"],text:"Secondary-level learning with stronger subject depth, practical work and preparation for board-level studies."},
    {label:"Senior Secondary",names:["Class XI","Class XII"],text:"Advanced subject learning, career preparation and focused academic guidance."}
  ];
  el.innerHTML=groups.filter(g=>g.names.some(n=>enabledNames.has(n))).map(g=>{
    const names=g.names.filter(n=>enabledNames.has(n));
    return `<div><strong>${safe(g.label)}</strong><span>${safe(names.join(" – "))}</span><p>${safe(g.text)}</p></div>`;
  }).join("");
}

function safe(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

load();
setInterval(load,5000);

const bellAudio=new Audio("/assets/school-bell.mp3");
const schoolBell=document.getElementById("schoolBell");
if(schoolBell){
  schoolBell.addEventListener("click",()=>{
    bellAudio.currentTime=0;
    bellAudio.play().catch(()=>{});
    schoolBell.classList.remove("ringing");
    void schoolBell.offsetWidth;
    schoolBell.classList.add("ringing");
  });
}

function renderSocialLinks(s){
  const links=[
    ["instagram","Instagram","◎"],
    ["facebook","Facebook","f"],
    ["youtube","YouTube","▶"],
    ["whatsapp","WhatsApp","◉"],
    ["twitter","X / Twitter","𝕏"]
  ];
  const el=document.getElementById("socialLinks");
  if(!el)return;
  el.innerHTML=links.filter(([key])=>String(s[key]||"").trim()).map(([key,label,icon])=>{
    const url=String(s[key]).trim();
    const safeUrl=/^https?:\/\//i.test(url)?url:"#";
    return `<a href="${safe(safeUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon}</a>`;
  }).join("");
}
