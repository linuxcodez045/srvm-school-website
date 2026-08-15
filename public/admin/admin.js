const username=document.getElementById("username"), password=document.getElementById("password"), loginMsg=document.getElementById("loginMsg"), pageTitle=document.getElementById("pageTitle"), admCount=document.getElementById("admCount"), conCount=document.getElementById("conCount"), dashAdm=document.getElementById("dashAdm"), dashCon=document.getElementById("dashCon"), dashStudents=document.getElementById("dashStudents"), schoolForm=document.getElementById("schoolForm"), saveStatus=document.getElementById("saveStatus"), admissionTable=document.getElementById("admissionTable"), contactTable=document.getElementById("contactTable"), eventsTable=document.getElementById("eventsTable"), facilitiesTable=document.getElementById("facilitiesTable"), galleryTable=document.getElementById("galleryTable"), photoFile=document.getElementById("photoFile"), photoTitle=document.getElementById("photoTitle"), photoCaption=document.getElementById("photoCaption"), photoMsg=document.getElementById("photoMsg"), photoForm=document.getElementById("photoForm"), currentPassword=document.getElementById("currentPassword"), newPassword=document.getElementById("newPassword"), confirmPassword=document.getElementById("confirmPassword"), passwordForm=document.getElementById("passwordForm"), passwordMsg=document.getElementById("passwordMsg");
let cache={},current="dashboard";
async function api(url,opt={}){const r=await fetch(url,{...opt,credentials:"same-origin",headers:{...(opt.body instanceof FormData?{}:{"Content-Type":"application/json"}),...(opt.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw Error(j.error||"Request failed");return j}
async function login(){try{await api("/api/login",{method:"POST",body:JSON.stringify({username:username.value,password:password.value})});loginMsg.textContent="";document.getElementById("login").classList.add("hidden");document.getElementById("app").classList.remove("hidden");await refresh()}catch(e){loginMsg.textContent=e.message}}
function showForgotPassword(){document.getElementById("loginPanel").classList.add("hidden");document.getElementById("forgotPanel").classList.remove("hidden");document.getElementById("forgotMsg").textContent=""}
function showLoginPanel(){document.getElementById("forgotPanel").classList.add("hidden");document.getElementById("loginPanel").classList.remove("hidden");document.getElementById("loginMsg").textContent=""}
async function resetForgotPassword(){
  const user=document.getElementById("recoveryUsername").value.trim();
  const code=document.getElementById("recoveryCode").value;
  const next=document.getElementById("resetPassword").value;
  const confirm=document.getElementById("resetPasswordConfirm").value;
  const msg=document.getElementById("forgotMsg");
  msg.style.color="";
  if(!user||!code){msg.textContent="Please enter your username and recovery code.";msg.style.color="#991b1b";return}
  if(next.length<8){msg.textContent="New password must be at least 8 characters.";msg.style.color="#991b1b";return}
  if(next!==confirm){msg.textContent="New passwords do not match.";msg.style.color="#991b1b";return}
  try{
    await api("/api/admin/forgot-password",{method:"POST",body:JSON.stringify({username:user,recoveryCode:code,newPassword:next})});
    msg.textContent="✓ Password reset successfully. You can now log in with your new password.";
    msg.style.color="#177245";
    document.getElementById("recoveryCode").value="";
    document.getElementById("resetPassword").value="";
    document.getElementById("resetPasswordConfirm").value="";
    setTimeout(()=>{document.getElementById("username").value=user;showLoginPanel()},1200);
  }catch(e){msg.textContent=e.message;msg.style.color="#991b1b"}
}
async function logout(){await api("/api/logout",{method:"POST"});location.reload()}
async function refresh(){cache.site=await api("/api/site");cache.admissions=await api("/api/admin/admissions");cache.contacts=await api("/api/admin/contacts");cache.events=await api("/api/admin/events");cache.facilities=await api("/api/admin/facilities");cache.gallery=await api("/api/admin/gallery");cache.classes=await api("/api/admin/classes");render()}
function show(x){current=x;pageTitle.textContent=x==="dashboard"?"Dashboard":x==="school"?"School Data":x==="security"?"Admin Password":x[0].toUpperCase()+x.slice(1);document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));document.getElementById(x).classList.remove("hidden");render()}
function render(){if(!cache.site)return;admCount.textContent=cache.admissions.length;conCount.textContent=cache.contacts.length;dashAdm.textContent=cache.admissions.length;dashCon.textContent=cache.contacts.length;dashStudents.textContent=cache.site.school.students;renderSchool();renderAdmissions();renderContacts();renderEvents();renderFacilities();renderGallery();renderClasses()}
function renderSchool(){const s=cache.site.school;const fields=[["name","School Name"],["shortName","Short Name"],["tagline","Tagline"],["heroTitle","Hero Title"],["heroText","Hero Text"],["aboutTitle","About Title"],["aboutText","About Text"],["aboutImage","About Image URL"],["phone","Phone"],["email","Email"],["address","Address"],["instagram","Instagram URL"],["facebook","Facebook URL"],["youtube","YouTube URL"],["whatsapp","WhatsApp URL"],["twitter","X / Twitter URL"],["years","Years"],["students","Students"],["teachers","Teachers"],["participation","Participation %"]];schoolForm.innerHTML=fields.map(x=>`<label class="${x[0].includes("Text")||x[0]=="address"?"full":""}">${x[1]}<input name="${x[0]}" value="${esc(s[x[0]])}"></label>`).join("")}
async function saveSchool(){const b=Object.fromEntries(new FormData(schoolForm));["years","students","teachers","participation"].forEach(k=>b[k]=Number(b[k]));await api("/api/school",{method:"PUT",body:JSON.stringify(b)});saveStatus.textContent="✓ Saved";await refresh();setTimeout(()=>saveStatus.textContent="",2000)}
function renderAdmissions(){admissionTable.innerHTML=cache.admissions.length?cache.admissions.map(x=>`<div class="data-card"><div class="top"><b>${esc(x.studentName)}</b><span class="badge">${esc(x.status)}</span></div><p><b>Class:</b> ${esc(x.classApplying)} · <b>Parent:</b> ${esc(x.parentName)}</p><p><b>Phone:</b> ${esc(x.phone)} · <b>Email:</b> ${esc(x.email||"-")}</p><p><b>Previous School:</b> ${esc(x.previousSchool||"-")}</p><p><b>Address:</b> ${esc(x.address||"-")}</p><p><b>Message:</b> ${esc(x.message||"-")}</p><small>${esc(x.createdAt)}</small><br><button class="edit" onclick="statusItem('admissions',${x.id})">Change Status</button> <button class="danger" onclick="deleteItem('admissions',${x.id})">Delete</button></div>`).join(""):"<div class='welcome'>No admission enquiries yet.</div>"}
function renderContacts(){contactTable.innerHTML=cache.contacts.length?cache.contacts.map(x=>`<div class="data-card"><div class="top"><b>${esc(x.name)}</b><span class="badge">${esc(x.status)}</span></div><p><b>Phone:</b> ${esc(x.phone)} · <b>Email:</b> ${esc(x.email||"-")}</p><p><b>Student:</b> ${esc(x.studentName||"-")}</p><p><b>Address:</b> ${esc(x.address||"-")}</p><p><b>Message:</b> ${esc(x.message)}</p><small>${esc(x.createdAt)}</small><br><button class="edit" onclick="statusItem('contacts',${x.id})">Change Status</button> <button class="danger" onclick="deleteItem('contacts',${x.id})">Delete</button></div>`).join(""):"<div class='welcome'>No contact messages yet.</div>"}
function renderEvents(){eventsTable.innerHTML=cache.events.length?cache.events.map(x=>`<div class="data-card"><div class="top"><b>${esc(x.title)}</b><span class="badge">${esc(x.tag||"School")}</span></div><p><b>Date:</b> ${esc(x.date)} · ${esc(x.description||"")}</p><button class="edit" onclick="editEvent(${x.id})">✎ Edit</button> <button class="danger" onclick="deleteItem('events',${x.id})">Delete</button></div>`).join(""):"<div class='welcome'>No events added yet.</div>"}
function renderFacilities(){facilitiesTable.innerHTML=cache.facilities.length?cache.facilities.map(x=>`<div class="data-card"><div class="top"><b>${esc(x.icon)} ${esc(x.title)}</b></div><p>${esc(x.text||"")}</p><button class="edit" onclick="editFacility(${x.id})">✎ Edit</button> <button class="danger" onclick="deleteItem('facilities',${x.id})">Delete</button></div>`).join(""):"<div class='welcome'>No facilities added yet.</div>"}
function openModal(opts){
  const modal=document.getElementById("appModal");
  const title=document.getElementById("modalTitle");
  const body=document.getElementById("modalBody");
  const actions=document.getElementById("modalActions");
  title.textContent=opts.title||"";
  body.innerHTML=opts.body||"";
  actions.innerHTML="";
  (opts.actions||[
    {label:"Cancel",className:"modal-cancel",action:closeModal},
    {label:"Save",className:"modal-save",action:()=>{}}
  ]).forEach(a=>{
    const b=document.createElement("button");
    b.type="button"; b.textContent=a.label; b.className=a.className||"";
    b.onclick=async()=>{try{await a.action()}catch(e){console.error(e)}};
    actions.appendChild(b);
  });
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  const first=body.querySelector("input,textarea,select");
  if(first)setTimeout(()=>first.focus(),50);
}
function closeModal(){
  const modal=document.getElementById("appModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}
function askModal(message,title="Please confirm"){
  return new Promise(resolve=>{
    openModal({
      title,
      body:`<p class="modal-message">${esc(message)}</p>`,
      actions:[
        {label:"Cancel",className:"modal-cancel",action:()=>{closeModal();resolve(false)}},
        {label:"Continue",className:"modal-danger",action:()=>{closeModal();resolve(true)}}
      ]
    });
  });
}
function statusModal(type,id){
  const item=cache[type].find(x=>x.id===id);
  return new Promise(resolve=>{
    openModal({
      title:"Change status",
      body:`<label class="modal-field">Status
        <select id="modalStatus">
          ${["New","Contacted","In Progress","Completed"].map(s=>`<option ${s===item.status?"selected":""}>${s}</option>`).join("")}
        </select>
      </label>`,
      actions:[
        {label:"Cancel",className:"modal-cancel",action:()=>{closeModal();resolve(false)}},
        {label:"Save Status",className:"modal-save",action:async()=>{
          const next=document.getElementById("modalStatus").value;
          await api(`/api/admin/${type}/${id}`,{method:"PUT",body:JSON.stringify({status:next})});
          closeModal(); await refresh(); resolve(true);
        }}
      ]
    });
  });
}
async function statusItem(type,id){await statusModal(type,id)}
async function deleteItem(type,id){
  const ok=await askModal("This item will be permanently deleted. This action cannot be undone.","Delete item?");
  if(!ok)return;
  try{
    await api(`/api/${type}/${id}`,{method:"DELETE"});
    await refresh();
  }catch(e){openModal({title:"Delete failed",body:`<p class="modal-message">${esc(e.message)}</p>`,actions:[{label:"Close",className:"modal-cancel",action:closeModal}]})}
}
function editEvent(id){
  const item=cache.events.find(x=>x.id===id); if(!item)return;
  openModal({
    title:"Edit Event",
    body:`<div class="modal-grid">
      <label class="modal-field">Event title *<input id="modalEventTitle" value="${esc(item.title)}"></label>
      <label class="modal-field">Date *<input id="modalEventDate" type="date" value="${esc(item.date)}"></label>
      <label class="modal-field">Category<input id="modalEventTag" value="${esc(item.tag||"School")}"></label>
      <label class="modal-field full">Description<textarea id="modalEventDescription">${esc(item.description||"")}</textarea></label>
    </div>`,
    actions:[
      {label:"Cancel",className:"modal-cancel",action:closeModal},
      {label:"Save Changes",className:"modal-save",action:async()=>{
        const title=document.getElementById("modalEventTitle").value.trim();
        const date=document.getElementById("modalEventDate").value;
        const tag=document.getElementById("modalEventTag").value.trim()||"School";
        const description=document.getElementById("modalEventDescription").value.trim();
        if(!title||!date)return;
        await api(`/api/events/${id}`,{method:"PUT",body:JSON.stringify({title,date,tag,description})});
        closeModal(); await refresh();
      }}
    ]
  });
}
function addEvent(){
  openModal({
    title:"Add Event",
    body:`<div class="modal-grid">
      <label class="modal-field">Event title *<input id="modalEventTitle" placeholder="Annual Sports Day"></label>
      <label class="modal-field">Date *<input id="modalEventDate" type="date" value="2026-09-01"></label>
      <label class="modal-field">Category<input id="modalEventTag" value="School"></label>
      <label class="modal-field full">Description<textarea id="modalEventDescription" placeholder="School Ground • 8:30 AM"></textarea></label>
    </div>`,
    actions:[
      {label:"Cancel",className:"modal-cancel",action:closeModal},
      {label:"Add Event",className:"modal-save",action:async()=>{
        const title=document.getElementById("modalEventTitle").value.trim();
        const date=document.getElementById("modalEventDate").value;
        const tag=document.getElementById("modalEventTag").value.trim()||"School";
        const description=document.getElementById("modalEventDescription").value.trim();
        if(!title||!date)return;
        await api("/api/events",{method:"POST",body:JSON.stringify({title,date,tag,description})});
        closeModal(); await refresh();
      }}
    ]
  });
}
function editFacility(id){
  const item=cache.facilities.find(x=>x.id===id); if(!item)return;
  openModal({
    title:"Edit Facility",
    body:`<div class="modal-grid">
      <label class="modal-field">Facility title *<input id="modalFacilityTitle" value="${esc(item.title)}"></label>
      <label class="modal-field">Number / icon<input id="modalFacilityIcon" value="${esc(item.icon||"01")}" maxlength="4"></label>
      <label class="modal-field full">Description<textarea id="modalFacilityText">${esc(item.text||"")}</textarea></label>
    </div>`,
    actions:[
      {label:"Cancel",className:"modal-cancel",action:closeModal},
      {label:"Save Changes",className:"modal-save",action:async()=>{
        const title=document.getElementById("modalFacilityTitle").value.trim();
        const icon=document.getElementById("modalFacilityIcon").value.trim()||"01";
        const text=document.getElementById("modalFacilityText").value.trim();
        if(!title)return;
        await api(`/api/facilities/${id}`,{method:"PUT",body:JSON.stringify({title,icon,text})});
        closeModal(); await refresh();
      }}
    ]
  });
}
function addFacility(){
  openModal({
    title:"Add Facility",
    body:`<div class="modal-grid">
      <label class="modal-field">Facility title *<input id="modalFacilityTitle" placeholder="Library"></label>
      <label class="modal-field">Number / icon<input id="modalFacilityIcon" value="07" maxlength="4"></label>
      <label class="modal-field full">Description<textarea id="modalFacilityText" placeholder="A quiet reading space with books for every age."></textarea></label>
    </div>`,
    actions:[
      {label:"Cancel",className:"modal-cancel",action:closeModal},
      {label:"Add Facility",className:"modal-save",action:async()=>{
        const title=document.getElementById("modalFacilityTitle").value.trim();
        const icon=document.getElementById("modalFacilityIcon").value.trim()||"07";
        const text=document.getElementById("modalFacilityText").value.trim();
        if(!title)return;
        await api("/api/facilities",{method:"POST",body:JSON.stringify({title,text,icon})});
        closeModal(); await refresh();
      }}
    ]
  });
}
function renderClasses(){
  const list=(cache.classes&&cache.classes.classes)||[];
  const future=["Class IX","Class X","Class XI","Class XII"];
  const el=document.getElementById("classManager");
  if(!el)return;
  el.innerHTML=future.map(name=>{
    const item=list.find(x=>x.name===name)||{name,enabled:false};
    return `<label class="class-toggle">
      <span><b>${esc(name)}</b><small>${item.enabled?"Visible on public admission form":"Hidden from public website"}</small></span>
      <input type="checkbox" class="future-class" value="${esc(name)}" ${item.enabled?"checked":""}>
      <i></i>
    </label>`;
  }).join("");
}
async function saveClasses(){
  const selected=[...document.querySelectorAll(".future-class:checked")].map(x=>x.value);
  const msg=document.getElementById("classMsg");
  try{
    await api("/api/admin/classes",{method:"PUT",body:JSON.stringify({classes:selected})});
    cache.classes=await api("/api/admin/classes");
    renderClasses();
    msg.textContent="✓ Class settings saved. Enabled classes now appear on the admission form.";
    msg.style.color="#177245";
    setTimeout(()=>msg.textContent="",3000);
  }catch(e){
    msg.textContent=e.message;
    msg.style.color="#991b1b";
  }
}
async function changePassword(){
  const current=currentPassword.value, next=newPassword.value, confirmNew=confirmPassword.value;
  passwordMsg.style.color="";
  if(next.length<8){passwordMsg.textContent="New password must be at least 8 characters.";passwordMsg.style.color="#991b1b";return}
  if(next!==confirmNew){passwordMsg.textContent="New passwords do not match.";passwordMsg.style.color="#991b1b";return}
  try{
    await api("/api/admin/password",{method:"POST",body:JSON.stringify({currentPassword:current,newPassword:next})});
    passwordForm.reset();
    passwordMsg.textContent="✓ Password changed successfully.";
    passwordMsg.style.color="#177245";
  }catch(e){passwordMsg.textContent=e.message;passwordMsg.style.color="#991b1b"}
}
function exportCSV(type){const rows=cache[type];if(!rows.length){openModal({title:"Nothing to export",body:`<p class="modal-message">There is no ${esc(type)} data available yet.</p>`,actions:[{label:"Close",className:"modal-cancel",action:closeModal}]});return;}const keys=[...new Set(rows.flatMap(x=>Object.keys(x)))];const csv=[keys.join(","),...rows.map(x=>keys.map(k=>`"${String(x[k]??"").replaceAll('"','""')}"`).join(","))].join("\\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=type+"-data.csv";a.click()}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
api("/api/me").then(x=>{if(x.authenticated){document.getElementById("login").classList.add("hidden");document.getElementById("app").classList.remove("hidden");refresh()}}).catch(()=>{})
function renderGallery(){
  galleryTable.innerHTML=cache.gallery.length?cache.gallery.map(x=>`<div class="data-card photo-admin"><img src="${esc(x.url)}" alt=""><div><b>${esc(x.title)}</b><p>${esc(x.caption||"")}</p><small>${esc(x.createdAt||"")}</small><br><button class="edit" onclick="setAboutPhoto(${x.id})">Use for About Section</button> <button class="danger" onclick="deletePhoto(${x.id})">Delete Photo</button></div></div>`).join(""):"<div class='welcome'>No photos uploaded yet.</div>";
}
async function uploadPhoto(e){
  e.preventDefault();
  const file=photoFile.files[0]; if(!file)return;
  const fd=new FormData(); fd.append("image",file); fd.append("title",photoTitle.value||"School Event"); fd.append("caption",photoCaption.value||"");
  photoMsg.textContent="Uploading...";
  try{await api("/api/gallery",{method:"POST",body:fd});photoForm.reset();photoMsg.textContent="✓ Uploaded";await refresh();setTimeout(()=>photoMsg.textContent="",2000)}catch(err){photoMsg.textContent=err.message}
}
async function setAboutPhoto(id){
  const x=cache.gallery.find(p=>p.id===id); if(!x)return;
  await api("/api/school",{method:"PUT",body:JSON.stringify({aboutImage:x.url})});
  await refresh();
  openModal({title:"About Photo Updated",body:`<p class="modal-message">✓ <b>${esc(x.title)}</b> is now the photo shown in the About section.</p>`,actions:[{label:"Done",className:"modal-save",action:closeModal}]});
}
async function deletePhoto(id){
  const ok=await askModal("This photo will be permanently deleted.","Delete photo?");
  if(!ok)return;
  await api("/api/gallery/"+id,{method:"DELETE"}); await refresh();
}
