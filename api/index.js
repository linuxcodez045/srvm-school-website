const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const ROOT = process.cwd();

app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.use(express.static(require('path').join(ROOT, 'public')));

const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
let clientPromise;
async function db() {
  if (!mongoUri) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) {
    const client = new MongoClient(mongoUri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 });
    clientPromise = client.connect();
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'srvm');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}
function signToken(username) {
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ username, exp })).toString('base64url');
  const secret = process.env.SESSION_SECRET || 'CHANGE_THIS_SESSION_SECRET';
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  try {
    const [payload, sig] = String(token || '').split('.');
    const secret = process.env.SESSION_SECRET || 'CHANGE_THIS_SESSION_SECRET';
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!payload || !sig || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.username || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}
function setAuthCookie(res, username) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `srvm_admin=${signToken(username)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`);
}
function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'srvm_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').filter(Boolean).map(x => {
    const i = x.indexOf('='); return [x.slice(0,i).trim(), decodeURIComponent(x.slice(i+1).trim())];
  }));
}
function auth(req, res, next) {
  const session = verifyToken(cookies(req).srvm_admin);
  if (session) { req.admin = session; return next(); }
  return res.status(401).json({ error: 'Admin login required' });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
function cloudinaryUpload(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: 'srvm-school/gallery',
      resource_type: 'image',
      public_id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    }, (err, result) => err ? reject(err) : resolve(result));
    stream.end(buffer);
  });
}

async function ensureSeed() {
  const database = await db();
  const fs = require('fs'), path = require('path');
  const seedFiles = ['school','events','facilities','notices','gallery','classes'];
  for (const name of seedFiles) {
    const collection = database.collection(name);
    if (await collection.countDocuments() === 0) {
      const file = path.join(ROOT, 'data', `${name}.json`);
      if (fs.existsSync(file)) {
        const value = JSON.parse(fs.readFileSync(file, 'utf8'));
        const docs = Array.isArray(value) ? value : [value];
        if (name === 'classes' && value && Array.isArray(value.classes)) { await collection.insertMany(value.classes); } else if (docs.length) await collection.insertMany(docs);
      }
    }
  }
  const admins = database.collection('admins');
  if (await admins.countDocuments() === 0) {
    await admins.insertOne({
      username: process.env.ADMIN_USERNAME || 'admin',
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'ChangeMe123!'),
      createdAt: new Date().toISOString()
    });
  }
}

async function getAdmin() {
  const database = await db();
  let admin = await database.collection('admins').findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
  if (!admin) {
    await ensureSeed();
    admin = await database.collection('admins').findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
  }
  return admin;
}
function clean(doc) { if (!doc) return doc; const out = { ...doc }; delete out._id; return out; }
async function getOne(name) { const database = await db(); return clean(await database.collection(name).findOne({})); }
async function getList(name) { const database = await db(); return (await database.collection(name).find({}).sort({ id: -1, createdAt: -1 }).toArray()).map(clean); }
async function nextId(name) { const database = await db(); const last = await database.collection(name).find({ id: { $exists: true } }).sort({ id: -1 }).limit(1).next(); return (Number(last?.id) || 0) + 1; }

app.get('/api/site', async (req,res) => { try { await ensureSeed(); res.json({ school: await getOne('school'), events: await getList('events'), facilities: await getList('facilities'), notices: await getList('notices'), gallery: await getList('gallery'), classes: await getList('classes') }); } catch(e) { res.status(500).json({error:e.message}); } });
app.get('/api/classes', async (req,res) => { try { await ensureSeed(); res.json((await getList('classes')).filter(x => x.enabled)); } catch(e) { res.status(500).json({error:e.message}); } });
app.get('/api/admin/classes', auth, async (req,res) => { try { res.json({classes: await getList('classes')}); } catch(e){res.status(500).json({error:e.message});} });
app.put('/api/admin/classes', auth, async (req,res) => { try { const database=await db(); const allowed=new Set(['Class IX','Class X','Class XI','Class XII']); const enabled=new Set((req.body.classes||[]).filter(x=>allowed.has(String(x)))); const docs=await database.collection('classes').find({}).toArray(); for(const x of docs) if(allowed.has(x.name)) await database.collection('classes').updateOne({_id:x._id},{$set:{enabled:enabled.has(x.name)}}); res.json({classes:await getList('classes')}); } catch(e){res.status(500).json({error:e.message});} });

app.get('/api/me', (req,res)=>res.json({authenticated:!!verifyToken(cookies(req).srvm_admin)}));
app.post('/api/login', async (req,res) => { try { const admin=await getAdmin(); if(String(req.body.username||'')===admin.username && hashPassword(req.body.password||'')===admin.passwordHash){setAuthCookie(res,admin.username); return res.json({success:true});} res.status(401).json({error:'Invalid username or password'}); } catch(e){res.status(500).json({error:e.message});} });
app.post('/api/admin/forgot-password', async (req,res) => { try { const admin=await getAdmin(); const username=String(req.body.username||''); const recoveryCode=String(req.body.recoveryCode||''); const next=String(req.body.newPassword||''); const expected=process.env.ADMIN_RECOVERY_CODE||'SRVM-RESET-2026'; if(username!==admin.username || recoveryCode!==expected) return res.status(400).json({error:'Invalid username or recovery code'}); if(next.length<8) return res.status(400).json({error:'New password must be at least 8 characters'}); const database=await db(); await database.collection('admins').updateOne({_id:admin._id},{$set:{passwordHash:hashPassword(next),updatedAt:new Date().toISOString()}}); res.json({success:true}); } catch(e){res.status(500).json({error:e.message});} });
app.post('/api/admin/password',auth,async(req,res)=>{try{const admin=await getAdmin();const current=String(req.body.currentPassword||''),next=String(req.body.newPassword||'');if(hashPassword(current)!==admin.passwordHash)return res.status(400).json({error:'Current password is incorrect'});if(next.length<8)return res.status(400).json({error:'New password must be at least 8 characters'});if(next===current)return res.status(400).json({error:'New password must be different from the current password'});const database=await db();await database.collection('admins').updateOne({_id:admin._id},{$set:{passwordHash:hashPassword(next)}});res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/logout',(req,res)=>{clearAuthCookie(res);res.json({success:true});});

app.put('/api/school',auth,async(req,res)=>{try{const database=await db();const current=await database.collection('school').findOne({});const out={...current};for(const k of Object.keys(current||{}))if(req.body[k]!==undefined)out[k]=req.body[k];await database.collection('school').updateOne({_id:current._id},{$set:out});res.json(clean(out));}catch(e){res.status(500).json({error:e.message});}});

for(const type of ['events','facilities','notices']){
  app.get('/api/admin/'+type,auth,async(req,res)=>{try{res.json(await getList(type));}catch(e){res.status(500).json({error:e.message});}});
  app.post('/api/'+type,auth,async(req,res)=>{try{const database=await db();const item={...req.body,id:await nextId(type),createdAt:new Date().toISOString()};await database.collection(type).insertOne(item);res.json(item);}catch(e){res.status(500).json({error:e.message});}});
  app.put('/api/'+type+'/:id',auth,async(req,res)=>{try{const database=await db();const old=await database.collection(type).findOne({id:Number(req.params.id)});if(!old)return res.status(404).json({error:'Not found'});const updated={...old,...req.body,id:old.id};delete updated._id;await database.collection(type).replaceOne({_id:old._id},updated);res.json(updated);}catch(e){res.status(500).json({error:e.message});}});
  app.delete('/api/'+type+'/:id',auth,async(req,res)=>{try{const database=await db();const r=await database.collection(type).deleteOne({id:Number(req.params.id)});if(!r.deletedCount)return res.status(404).json({error:'Item not found or already deleted'});res.json({success:true,deletedId:req.params.id});}catch(e){res.status(500).json({error:e.message});}});
}

async function submitRecord(type,body){const database=await db();const record={...body,id:await nextId(type),createdAt:new Date().toISOString(),status:'New'};await database.collection(type).insertOne(record);return record;}
app.post('/api/admissions',async(req,res)=>{try{const required=['studentName','classApplying','parentName','phone'];if(required.some(k=>!String(req.body[k]||'').trim()))return res.status(400).json({error:'Please fill all required fields'});const record=await submitRecord('admissions',req.body);res.json({success:true,id:record.id});}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/contacts',async(req,res)=>{try{if(!String(req.body.name||'').trim()||!String(req.body.phone||'').trim()||!String(req.body.message||'').trim())return res.status(400).json({error:'Please fill name, phone and message'});const record=await submitRecord('contacts',req.body);res.json({success:true,id:record.id});}catch(e){res.status(500).json({error:e.message});}});
for(const type of ['admissions','contacts']){
 app.get('/api/admin/'+type,auth,async(req,res)=>{try{res.json(await getList(type));}catch(e){res.status(500).json({error:e.message});}});
 app.put('/api/admin/'+type+'/:id',auth,async(req,res)=>{try{const database=await db();const old=await database.collection(type).findOne({id:Number(req.params.id)});if(!old)return res.status(404).json({error:'Not found'});const updated={...old,...req.body,id:old.id};delete updated._id;await database.collection(type).replaceOne({_id:old._id},updated);res.json(updated);}catch(e){res.status(500).json({error:e.message});}});
 app.delete('/api/admin/'+type+'/:id',auth,async(req,res)=>{try{const database=await db();await database.collection(type).deleteOne({id:Number(req.params.id)});res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
 app.delete('/api/'+type+'/:id',auth,async(req,res)=>{try{const database=await db();await database.collection(type).deleteOne({id:Number(req.params.id)});res.json({success:true,deletedId:req.params.id});}catch(e){res.status(500).json({error:e.message});}});
}

app.get('/api/admin/gallery',auth,async(req,res)=>{try{res.json(await getList('gallery'));}catch(e){res.status(500).json({error:e.message});}});
app.post('/api/gallery',auth,upload.single('image'),async(req,res)=>{try{if(!req.file)return res.status(400).json({error:'No image selected'});if(!['image/jpeg','image/png','image/webp'].includes(req.file.mimetype))return res.status(400).json({error:'Only JPG, PNG and WEBP images are allowed'});const result=await cloudinaryUpload(req.file.buffer,req.file.originalname);const database=await db();const list='gallery';const item={id:await nextId(list),url:result.secure_url,publicId:result.public_id,title:req.body.title||'School Event',caption:req.body.caption||'',createdAt:new Date().toISOString()};await database.collection(list).insertOne(item);res.json(item);}catch(e){res.status(500).json({error:e.message});}});
app.delete('/api/gallery/:id',auth,async(req,res)=>{try{const database=await db();const item=await database.collection('gallery').findOne({id:Number(req.params.id)});if(!item)return res.status(404).json({error:'Photo not found'});if(item.publicId)await cloudinary.uploader.destroy(item.publicId,{resource_type:'image'});await database.collection('gallery').deleteOne({_id:item._id});const school=await database.collection('school').findOne({});if(school?.aboutImage===item.url)await database.collection('school').updateOne({_id:school._id},{$set:{aboutImage:'/assets/srvm-logo.png'}});res.json({success:true});}catch(e){res.status(500).json({error:e.message});}});
app.put('/api/gallery/:id',auth,async(req,res)=>{try{const database=await db();const item=await database.collection('gallery').findOne({id:Number(req.params.id)});if(!item)return res.status(404).json({error:'Photo not found'});const updated={...item,...req.body,id:item.id};delete updated._id;await database.collection('gallery').replaceOne({_id:item._id},updated);res.json(updated);}catch(e){res.status(500).json({error:e.message});}});

app.get('/admissions',(req,res)=>res.sendFile(require('path').join(ROOT,'public','admissions.html')));
app.get('/contact',(req,res)=>res.sendFile(require('path').join(ROOT,'public','contact.html')));
app.get('/admin',(req,res)=>res.sendFile(require('path').join(ROOT,'public','admin','index.html')));
app.get('/admin/',(req,res)=>res.sendFile(require('path').join(ROOT,'public','admin','index.html')));

module.exports = app;
