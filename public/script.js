const API_BASE = '';
const SERVICE_FEES = 250;
const state = { rooms: [], selectedRoomId: localStorage.getItem('selectedRoomId') || '' };
function qs(s, root=document){ return root.querySelector(s); }
function qsa(s, root=document){ return [...root.querySelectorAll(s)]; }
function page(){ return document.body.dataset.currentPage || ''; }
function formatCurrency(v){ return `EGP ${Number(v||0).toLocaleString()}`; }
function paymentLabel(v){ return tr({cash_on_arrival:'Cash on arrival',online_card:'Pay online by card',card_on_arrival:'Card on arrival',bank_transfer:'Bank transfer'}[v] || v); }
function statusBadge(status){ const danger=['cancelled','rejected','failed']; const success=['confirmed','checked_in','checked_out','paid']; const cls=danger.includes(status)?'danger':success.includes(status)?'success':'warning'; const label=String(status||'pending').replaceAll('_',' '); return `<span class="badge ${cls}">${tr(label.charAt(0).toUpperCase()+label.slice(1))}</span>`; }

function getCookie(name){
  return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=').slice(1).join('=') || '';
}
function setCookie(name, value, days=30){
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value || '')}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
}
function deleteCookie(name){ document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`; }
function getUser(){
  try { return JSON.parse(localStorage.getItem('rrUser') || sessionStorage.getItem('rrUser') || 'null'); }
  catch { return null; }
}
function getLastUser(){
  try { return JSON.parse(localStorage.getItem('rrLastUser') || 'null'); }
  catch { return null; }
}

function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
function getToken(){ return localStorage.getItem('rrToken') || sessionStorage.getItem('rrToken') || decodeURIComponent(getCookie('rrToken') || ''); }
function isLoggedIn(){ return Boolean(getToken() && getUser()); }
function setSession(token,user){
  if(token){
    localStorage.setItem('rrToken', token);
    sessionStorage.setItem('rrToken', token);
    setCookie('rrToken', token, 30);
  }
  if(user){
    localStorage.setItem('rrUser', JSON.stringify(user));
    sessionStorage.setItem('rrUser', JSON.stringify(user));
    localStorage.setItem('rrLastUser', JSON.stringify(user));
  }
}
function clearSession(){
  const user = getUser();
  if(user) localStorage.setItem('rrLastUser', JSON.stringify(user));
  localStorage.removeItem('rrToken'); localStorage.removeItem('rrUser');
  sessionStorage.removeItem('rrToken'); sessionStorage.removeItem('rrUser');
  deleteCookie('rrToken');
}
async function api(path, options={}){
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken(); if(token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json().catch(()=>({})) : await res.text();
  if(!res.ok) throw new Error(typeof data === 'object' ? (data.message || 'Request failed.') : data);
  return data;
}
function showMessage(el, msg, type='info'){ if(!el) return; el.textContent = msg; el.className = `message ${type}`; }
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.classList.add('show'),20); setTimeout(()=>{t.classList.remove('show'); setTimeout(()=>t.remove(),250)},2800); }

const I18N = {
  ar: {
    'Home':'الرئيسية','Explore Rooms':'استكشف الغرف','Booking':'الحجز','My Bookings':'حجوزاتي','Profile':'الملف الشخصي','Admin Dashboard':'لوحة الأدمن','Sign In':'تسجيل الدخول','Logout':'تسجيل الخروج',
    'Welcome back':'مرحبًا بعودتك','Create an account first, then login to book rooms.':'أنشئ حسابًا أولًا، ثم سجّل الدخول للحجز.','Login':'تسجيل الدخول','Register':'إنشاء حساب','Email':'البريد الإلكتروني','Password':'كلمة المرور','Full Name':'الاسم بالكامل','Create Account':'إنشاء حساب','Reset Password':'إعادة تعيين كلمة المرور','Back to Home':'العودة للرئيسية',
    'Choose a room and confirm your stay.':'اختر غرفة وأكد إقامتك.','Booking validation and availability control are handled by the backend.':'يتم التحقق من الحجز والتوافر من خلال النظام الخلفي.','Search rooms...':'ابحث عن غرفة...','All categories':'كل التصنيفات','Guests':'الضيوف','Filter':'فلترة','Booking Details':'تفاصيل الحجز','Guest Name':'اسم الضيف','Phone Number':'رقم التليفون','Selected Room':'الغرفة المختارة','Select a room':'اختر غرفة','Check In':'تاريخ الوصول','Check Out':'تاريخ المغادرة','Payment':'طريقة الدفع','Cash on arrival':'الدفع عند الوصول','Card on arrival':'كارت عند الوصول','Bank transfer':'تحويل بنكي','Nights':'الليالي','Available units':'الغرف المتاحة','Price / night':'السعر / ليلة','Service fees':'رسوم الخدمة','Total':'الإجمالي','Confirm Booking':'تأكيد الحجز','Booking Confirmed':'تم تأكيد الحجز','View My Bookings':'عرض حجوزاتي',
    'No rooms found.':'لا توجد غرف مطابقة.','Book Now':'احجز الآن','Maintenance':'صيانة','Fully booked':'مكتمل الحجز','Admin management only':'إدارة الأدمن فقط','Admin cannot create customer bookings. Use the Admin Dashboard to manage reservations.':'الأدمن لا يمكنه إنشاء حجز كعميل. استخدم لوحة الأدمن لإدارة الحجوزات.',
    'Please login first.':'برجاء تسجيل الدخول أولًا.','Please enter a valid Egyptian mobile number. Example: 01012345678.':'برجاء إدخال رقم موبايل مصري صحيح مثل 01012345678.','Booking is being saved...':'جاري حفظ الحجز...','Booking saved successfully.':'تم حفظ الحجز بنجاح.','Booking confirmed. Reference:':'تم تأكيد الحجز. رقم الحجز:','Admin accounts cannot create customer bookings. Use the Admin Dashboard to manage reservations.':'حساب الأدمن لا يمكنه الحجز كعميل. استخدم لوحة الأدمن لإدارة الحجوزات.'
  }
};
Object.assign(I18N.ar, {
  'Pay online by card':'الدفع أونلاين بالفيزا', 'Card Holder':'اسم صاحب الكارت', 'Card Number':'رقم الكارت', 'Expiry':'تاريخ الانتهاء', 'CVV':'CVV', 'Name on card':'الاسم على الكارت', 'Demo online payment: the system validates the card and stores only the card brand and last 4 digits.':'دفع أونلاين تجريبي: النظام يتحقق من الكارت ويحفظ نوع الكارت وآخر 4 أرقام فقط.', 'Delete User':'حذف المستخدم', 'Delete this user and related bookings?':'حذف هذا المستخدم وكل حجوزاته؟', 'User deleted successfully.':'تم حذف المستخدم بنجاح.', 'Online card ending':'كارت أونلاين آخره', 'Please enter a valid card number.':'برجاء إدخال رقم كارت صحيح.', 'Please enter a valid expiry date, e.g. 12/28.':'برجاء إدخال تاريخ انتهاء صحيح مثل 12/28.', 'Please enter a valid CVV.':'برجاء إدخال CVV صحيح.', 'Please enter the card holder name.':'برجاء إدخال اسم صاحب الكارت.',
  'Product Edition':'نسخة احترافية',
  'Book smart hotel rooms in Egypt.':'احجز غرف فندقية ذكية في مصر.',
  'Room Reserve is a complete hotel booking system with user accounts, live room availability, customer bookings, an admin dashboard, payment status, profile management, and export tools.':'Room Reserve هو نظام حجز فندقي كامل يحتوي على حسابات مستخدمين، توافر مباشر للغرف، حجوزات العملاء، لوحة أدمن، حالة الدفع، إدارة الملف الشخصي، وأدوات تصدير.',
  'Start Booking':'ابدأ الحجز','Room types':'أنواع الغرف','Safe':'آمن','Booking records':'سجلات الحجز','Real-time':'مباشر','Availability':'التوافر','Control panel':'لوحة التحكم','Built like a real booking product.':'مصمم كنظام حجز حقيقي.',
  'Availability Control':'التحكم في التوافر','The system prevents duplicate bookings when a room is fully booked for the selected dates.':'النظام يمنع تكرار الحجز عندما تكون الغرفة محجوزة بالكامل في التواريخ المختارة.','Explore available rooms':'استكشف الغرف المتاحة',
  'Customer Profile':'ملف العميل','Customers can manage their profile and change password securely.':'يمكن للعملاء إدارة بياناتهم وتغيير كلمة المرور بأمان.','Open profile':'افتح الملف الشخصي',
  'Admin Management':'إدارة الأدمن','Admin can search, filter, confirm, cancel, check in, check out, and export bookings.':'يمكن للأدمن البحث والفلترة وتأكيد وإلغاء الحجوزات وتصديرها.','Open dashboard':'افتح لوحة التحكم',
  'Find the right room for your stay.':'اختر الغرفة المناسبة لإقامتك.','Search by city, category, guests, price, and dates to check availability before booking.':'ابحث حسب المدينة أو النوع أو عدد الضيوف أو السعر أو التاريخ قبل الحجز.','Search Cairo, sea view, suite...':'ابحث عن القاهرة، إطلالة بحر، جناح...',
  'Max price':'أقصى سعر','Sort':'الترتيب','Recommended':'المقترح','Price: Low to High':'السعر: من الأقل للأعلى','Price: High to Low':'السعر: من الأعلى للأقل','Discounts first':'الخصومات أولًا','Search':'بحث',
  'Quick room search':'بحث سريع عن الغرف','Choose dates and guests to see available rooms.':'اختر التاريخ وعدد الضيوف لعرض الغرف المتاحة.','Show Available':'عرض المتاح','Clear':'مسح',
  'Product-ready hotel booking system.':'نظام حجز فندقي جاهز للعرض.', 'OFF':'خصم', '/ night':'/ ليلة', 'available':'متاحة', 'guests':'ضيوف', 'guests_label':'ضيوف',
  'Nile View Deluxe Room':'غرفة ديلوكس بإطلالة على النيل','Red Sea Premium Suite':'جناح فاخر على البحر الأحمر','Cairo City Smart Room':'غرفة ذكية في القاهرة','Alexandria Sea View Room':'غرفة بإطلالة بحرية في الإسكندرية','Family Smart Apartment':'شقة عائلية ذكية','Hurghada Beach Suite':'جناح شاطئي في الغردقة',
  'Cairo, Egypt':'القاهرة، مصر','Hurghada, Egypt':'الغردقة، مصر','Alexandria, Egypt':'الإسكندرية، مصر','New Cairo, Egypt':'القاهرة الجديدة، مصر',
  'Deluxe':'ديلوكس','Suite':'جناح','Standard':'ستاندرد','Sea View':'إطلالة بحرية','Family':'عائلي','Heritage':'تراثي',
  '1 King Bed':'سرير كينج','1 King Bed + Sofa Bed':'سرير كينج + كنبة سرير','2 Twin Beds':'سريران منفصلان','1 Queen Bed':'سرير كوين','2 Bedrooms + Living Room':'غرفتان + غرفة معيشة',
  'Nile view':'إطلالة على النيل','Smart lighting':'إضاءة ذكية','Fast Wi-Fi':'واي فاي سريع','Breakfast included':'الإفطار شامل','Sea view':'إطلالة بحرية','Private balcony':'بلكونة خاصة','Mini bar':'ميني بار','AI climate control':'تحكم ذكي في التكييف','City view':'إطلالة على المدينة','Smart TV':'تلفزيون ذكي','Work desk':'مكتب عمل','Soundproof windows':'نوافذ عازلة للصوت','Queen bed':'سرير كوين','Room service':'خدمة غرف','Smart curtains':'ستائر ذكية','Kitchenette':'مطبخ صغير','Kids area':'منطقة أطفال','2 bathrooms':'حمامان','Laundry corner':'ركن غسيل','Beach view':'إطلالة على الشاطئ','Pool access':'دخول للمسبح','Lounge area':'منطقة جلوس','Smart lock':'قفل ذكي',
  'A calm deluxe room inspired by real Nile-side hotel rooms, with fixed room details and a smart control panel.':'غرفة ديلوكس هادئة مستوحاة من فنادق النيل، بتفاصيل ثابتة ولوحة تحكم ذكية.',
  'A premium suite for a coastal stay with a balcony, warm interior design, and stable room specifications.':'جناح فاخر للإقامة الساحلية مع بلكونة وتصميم مريح وتفاصيل واضحة.',
  'A practical city room for short stays, business trips, and students presenting a clean booking demo.':'غرفة عملية داخل المدينة مناسبة للإقامات القصيرة ورحلات العمل وعرض فكرة الحجز.',
  'A realistic seaside room option with a simple fixed price, discount label, and clear facilities.':'غرفة بحرية واقعية بسعر واضح وخصم ظاهر ومرافق مفهومة.',
  'A family-friendly apartment layout with enough space and fixed details for a realistic reservation flow.':'شقة عائلية بمساحة مناسبة وتفاصيل واضحة لتجربة حجز واقعية.',
  'A beach-side suite with modern hotel facilities, clear availability status, and a simple booking flow.':'جناح بجانب الشاطئ بمرافق فندقية حديثة وحالة توافر واضحة وخطوات حجز بسيطة.',
  'Reference':'رقم الحجز','Customer':'العميل','Guest':'الضيف','Phone':'التليفون','Room':'الغرفة','Stay':'الإقامة','Created':'تاريخ الإنشاء','Pending':'قيد الانتظار','Confirmed':'مؤكد','Checked in':'تم تسجيل الوصول','Checked out':'تم تسجيل المغادرة','Cancelled':'ملغي','Rejected':'مرفوض','Paid':'مدفوع','Payment pending':'الدفع قيد الانتظار','Refunded':'تم رد المبلغ','Payment failed':'فشل الدفع','Cancel Booking':'إلغاء الحجز','No bookings yet.':'لا توجد حجوزات بعد.','No bookings found.':'لا توجد حجوزات.',
  'Customers':'العملاء','Bookings':'الحجوزات','Active':'النشطة','Revenue':'الإيرادات','Rooms':'الغرف','Role':'الدور','Name':'الاسم','Total':'الإجمالي','Status updated':'تم تحديث الحالة','Payment updated':'تم تحديث الدفع'
});

Object.assign(I18N.ar, {
  'Profile':'الملف الشخصي','Account tools':'أدوات الحساب',
  'Room Reserve is a complete hotel booking system with user accounts, live room availability, customer bookings, admin dashboard, payment status, profile management, and export tools.':'Room Reserve نظام حجز فندقي كامل فيه حسابات مستخدمين، توافر مباشر للغرف، حجوزات العملاء، لوحة أدمن، حالة الدفع، إدارة الملف الشخصي، وأدوات تصدير.'
});

function tr(text){
  const lang=localStorage.getItem('rrLang') || 'en';
  const raw=String(text ?? '');
  if(lang !== 'ar') return raw;
  if(I18N.ar[raw]) return I18N.ar[raw];
  const clean=raw.replace(/\s+/g,' ').trim();
  if(I18N.ar[clean]) return I18N.ar[clean];
  return raw;
}
function insertLangToggle(){
  if(qs('#langToggle')) return;
  const area = qs('.auth-area') || qs('.navbar');
  if(!area) return;
  const btn=document.createElement('button');
  btn.id='langToggle'; btn.className='lang-toggle'; btn.type='button';
  btn.addEventListener('click', async()=>{ const next=(localStorage.getItem('rrLang')||'en')==='ar'?'en':'ar'; localStorage.setItem('rrLang',next); applyLanguage(); if(page()==='rooms') await renderRoomsPage(); if(page()==='booking') await renderBookingRooms(); if(page()==='bookings') await renderBookings(); if(page()==='admin') await renderAdmin(); applyLanguage(); });
  area.insertBefore(btn, area.firstChild);
}
function applyLanguage(){
  const lang=localStorage.getItem('rrLang') || 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', lang === 'ar');
  const btn=qs('#langToggle'); if(btn) btn.textContent = lang === 'ar' ? 'English' : 'العربية';
  const pairs = {
    'a[data-page="home"]':'Home','a[data-page="rooms"]':'Explore Rooms','a[data-page="booking"]':'Booking','a[data-page="bookings"]':'My Bookings','a[data-page="profile"]':'Profile','a[data-page="admin"]':'Admin Dashboard','#signinLink':'Sign In','#logoutBtn':'Logout',
    '#authSubmit': qs('#authSubmit')?.textContent?.includes('Create') ? 'Create Account' : 'Login','#resetPasswordBtn':'Reset Password',
    '.booking-panel h2':'Booking Details','button[type="submit"].btn-primary.full-width':'Confirm Booking'
  };
  Object.entries(pairs).forEach(([sel,en])=>qsa(sel).forEach(el=>{ if(el && !el.dataset.lockedText) el.textContent=tr(en); }));
  // Exact text replacements for headings, labels, options and small UI text.
  qsa('h1,h2,h3,p,label,button,a,option,span,strong,small').forEach(el=>{
    if(el.children.length) return;
    const en = el.dataset.enText || el.textContent.trim();
    if(!el.dataset.enText) el.dataset.enText = en;
    const translated = tr(en);
    if(translated !== en || lang === 'en') el.textContent = lang === 'ar' ? translated : en;
  });
  qsa('input,textarea').forEach(input=>{
    const ph = input.dataset.enPlaceholder || input.getAttribute('placeholder') || '';
    if(!input.dataset.enPlaceholder) input.dataset.enPlaceholder = ph;
    const translated = tr(ph);
    input.setAttribute('placeholder', lang === 'ar' ? translated : ph);
  });
}
function showLocalizedMessage(el, enMsg, type='info'){ showMessage(el, tr(enMsg), type); }


Object.assign(I18N.ar, {
  'Luxor Heritage Suite':'جناح الأقصر التراثي', 'Sharm Family Suite':'جناح عائلي شرم الشيخ', 'Giza Pyramid View Room':'غرفة بإطلالة الأهرامات', 'Grand Family Room for 6':'غرفة عائلية كبيرة لـ 6 أفراد', 'Business King Room':'غرفة بيزنس كينج',
  'Luxor, Egypt':'الأقصر، مصر', 'Sharm El Sheikh, Egypt':'شرم الشيخ، مصر', 'Giza, Egypt':'الجيزة، مصر', 'North Coast, Egypt':'الساحل الشمالي، مصر', 'New Administrative Capital, Egypt':'العاصمة الإدارية الجديدة، مصر',
  'Heritage':'تراثية', 'Business':'بيزنس', 'View':'إطلالة', 'Heritage design':'تصميم تراثي', 'Sleeps 6 guests':'تسع 6 أفراد', 'Large lounge':'مساحة جلوس كبيرة', '2 bathrooms':'حمامين', 'Business layout':'تجهيز بيزنس', 'Coffee station':'ركن قهوة', 'Quiet floor':'دور هادئ', 'Family layout':'تصميم عائلي', 'Sea breeze':'نسيم البحر', 'Kids corner':'ركن أطفال',
  'A heritage-style suite for a luxury Egypt hotel concept, combining classic design with smart access.':'جناح بطابع تراثي لفندق فاخر في مصر، يجمع بين التصميم الكلاسيكي والدخول الذكي.',
  'A comfortable family suite with enough space for parents and children, designed for longer beach stays.':'جناح عائلي مريح بمساحة مناسبة للأهل والأطفال، ومصمم للإقامات الشاطئية الطويلة.',
  'A city hotel room with a premium view concept, suitable for tourists and short business stays.':'غرفة فندقية داخل المدينة بإطلالة مميزة، مناسبة للسياحة والإقامات العملية القصيرة.',
  'A large family room built for groups up to six guests, with more space and practical sleeping arrangements.':'غرفة عائلية كبيرة للمجموعات حتى 6 أفراد، بمساحة أكبر وتوزيع نوم عملي.',
  'A practical business room with a quiet layout, strong internet, and a simple professional stay experience.':'غرفة عملية للبيزنس بتصميم هادئ وإنترنت قوي وتجربة إقامة احترافية بسيطة.'
});

function updateAuthUI(){
  const user=getUser();
  const isAdmin = user?.role === 'admin';
  document.body.classList.toggle('logged-in', !!user);
  document.body.classList.toggle('admin-user', isAdmin);
  qsa('#userChip').forEach(c=> c.textContent = user ? `${isAdmin ? 'Admin' : 'Hi'}, ${user.name}` : '');
  qsa('.customer-only').forEach(el => { el.hidden = isAdmin; });
  qsa('.admin-only').forEach(el => { el.hidden = !isAdmin; });
  qsa('.nav-links a').forEach(a=>a.classList.toggle('active', a.dataset.page === page()));
}
function enforceProtected(){
  const user = getUser();
  if(document.body.dataset.protectedPage === 'true' && !getToken()) {
    location.href = `login.html?return=${encodeURIComponent(location.pathname.split('/').pop() || 'index.html')}`;
    return;
  }
  if(page()==='admin' && getToken() && user?.role !== 'admin') { location.href='index.html'; return; }
  if(user?.role === 'admin' && ['booking','bookings','profile'].includes(page())) { location.href='admin.html'; }
}
function setupProtectedLinks(){ qsa('[data-protected-link]').forEach(a=>a.addEventListener('click', e=>{
  const user = getUser();
  if(user?.role === 'admin' && a.classList.contains('customer-only')) { e.preventDefault(); location.href='admin.html'; return; }
  if(isLoggedIn()) return;
  e.preventDefault();
  location.href=`login.html?return=${encodeURIComponent(a.getAttribute('href')||'booking.html')}`;
})); }
function setupLogout(){ qsa('#logoutBtn').forEach(btn=>btn.addEventListener('click', async()=>{ try{ await api('/api/logout',{method:'POST'}); }catch{} clearSession(); updateAuthUI(); location.href='index.html'; })); }
function setupDates(){ const today=new Date().toISOString().split('T')[0]; qsa('input[type="date"]').forEach(i=>i.min=today); }
async function refreshSession(retries=4){
  const token = getToken();
  if(!token) return false;
  for(let i=0;i<retries;i++){
    try{
      const data = await api('/api/me');
      if(data?.user){ setSession(token, data.user); return true; }
    }catch(err){
      console.warn('Session refresh retry:', i + 1, err.message);
      if(i < retries - 1) await delay(450);
    }
  }
  // Do not clear the browser token here. Vercel/Neon can be slow on first load.
  return Boolean(getUser());
}

function tRoom(value){ return tr(String(value || '')); }
function roomCategoryLabel(category){ return tRoom(category); }
function roomAvailabilityLabel(room){
  if(room.status !== 'available') return '<span class="badge danger">'+tr('Maintenance')+'</span>';
  if(room.availableUnits === 0) return '<span class="badge danger">'+tr('Fully booked')+'</span>';
  return `<span class="badge success">${room.availableUnits} ${tr('available')}</span>`;
}
function roomTemplate(room, list=false){
  const old=room.discount ? `<span class="old-price">${formatCurrency(room.price)}</span>` : '';
  const discount=room.discount ? `<span class="badge discount">${room.discount}% ${tr('OFF')}</span>` : '';
  const isAdmin = getUser()?.role === 'admin';
  const availability = roomAvailabilityLabel(room);
  const bookButton = isAdmin ? `<span class="badge warning">${tr('Admin management only')}</span>` : `<button class="btn-primary select-room-btn" type="button" data-room-id="${room.id}" ${room.availableUnits===0 || room.status!=='available'?'disabled style="opacity:.55;cursor:not-allowed"':''}>${tr('Book Now')}</button>`;
  return `<article class="room-card ${state.selectedRoomId===room.id?'selected':''}" data-room-id="${room.id}">
    <div class="room-image"><img src="${room.image}" alt="${tRoom(room.name)}" loading="lazy">${discount}<span class="badge category">${roomCategoryLabel(room.category)}</span></div>
    <div class="room-body"><h3>${tRoom(room.name)}</h3><p class="room-meta">${tRoom(room.location)}</p><p>${tRoom(room.description)}</p>
      <div class="room-facts"><span>${room.capacity} ${tr('guests')}</span><span>${room.size}</span><span>${tRoom(room.beds)}</span></div>
      <div class="amenities">${room.amenities.map(a=>`<span>${tRoom(a)}</span>`).join('')}</div>
      <div class="price-line"><strong>${formatCurrency(room.finalPrice)}</strong>${old}<small>${tr('/ night')}</small></div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">${availability}${bookButton}</div>
    </div>
  </article>`;
}
function queryParams(prefix='room'){
  const q = qs(`#${prefix}Q`)?.value || qs('#bookingRoomQ')?.value || '';
  const category = qs(`#${prefix}Category`)?.value || qs('#bookingCategory')?.value || 'all';
  const checkIn = qs(`#${prefix}CheckIn`)?.value || qs('#bookingFilterCheckIn')?.value || qs('#checkin')?.value || '';
  const checkOut = qs(`#${prefix}CheckOut`)?.value || qs('#bookingFilterCheckOut')?.value || qs('#checkout')?.value || '';
  const guests = qs(`#${prefix}Guests`)?.value || qs('#bookingFilterGuests')?.value || qs('#guestsCount')?.value || '';
  const params = new URLSearchParams(); if(q) params.set('q',q); if(category) params.set('category',category); if(checkIn) params.set('checkIn',checkIn); if(checkOut) params.set('checkOut',checkOut); if(guests) params.set('guests',guests); return params.toString();
}
async function loadRooms(params=''){
  const data = await api(`/api/rooms${params ? '?' + params : ''}`); state.rooms = data.rooms || []; return state.rooms;
}
function setupRoomClicks(){ qsa('.select-room-btn').forEach(btn=>btn.addEventListener('click',()=>{
  if(getUser()?.role === 'admin') { toast('Admin cannot create customer bookings. Use the Admin Dashboard to manage reservations.'); location.href='admin.html'; return; }
  const id=btn.dataset.roomId;
  state.selectedRoomId=id; localStorage.setItem('selectedRoomId',id);
  if(page()==='booking'){ const sel=qs('#roomType'); if(sel) sel.value=id; qsa('.room-card').forEach(c=>c.classList.toggle('selected',c.dataset.roomId===id)); updateSummary(); qs('.booking-panel')?.scrollIntoView({behavior:'smooth',block:'center'}); } else { location.href=`booking.html?room=${encodeURIComponent(id)}`; }
})); }
async function renderRoomsPage(){ const grid=qs('#roomsGrid'); if(!grid) return; const params=queryParams('room'); await loadRooms(params); grid.innerHTML = state.rooms.map(r=>roomTemplate(r)).join('') || '<div class="card feature-card">No rooms found.</div>'; setupRoomClicks(); }
async function renderBookingRooms(){ const list=qs('#bookingRooms'); if(!list) return; const params=queryParams('booking'); await loadRooms(params); list.innerHTML = state.rooms.map(r=>roomTemplate(r,true)).join('') || '<div class="card feature-card">No rooms found.</div>'; fillRoomSelect(); setupRoomClicks(); updateSummary(); }
function fillRoomSelect(){ const sel=qs('#roomType'); if(!sel) return; const old=sel.value || state.selectedRoomId; sel.innerHTML=`<option value="">${tr('Select a room')}</option>` + state.rooms.map(r=>`<option value="${r.id}">${tRoom(r.name)} - ${formatCurrency(r.finalPrice)}</option>`).join(''); if(old) sel.value=old; }
function calculateNights(a,b){ const s=new Date(a), e=new Date(b); if(isNaN(s)||isNaN(e)||e<=s) return 1; return Math.ceil((e-s)/(1000*60*60*24)); }
function updateSummary(){ const sel=qs('#roomType'); const checkin=qs('#checkin'); const checkout=qs('#checkout'); if(!sel) return; const room=state.rooms.find(r=>r.id===sel.value); const nights=calculateNights(checkin?.value, checkout?.value); const price=room?room.finalPrice:0; const total=room ? price*nights + SERVICE_FEES : 0; qs('#nightsValue').textContent=nights; qs('#priceNightValue').textContent=formatCurrency(price); qs('#displayPrice').textContent=formatCurrency(total); qs('#availableUnitsValue').textContent = room ? room.availableUnits : '-'; if(sel.value){ state.selectedRoomId=sel.value; localStorage.setItem('selectedRoomId',sel.value); qsa('.room-card').forEach(c=>c.classList.toggle('selected',c.dataset.roomId===sel.value)); } }
function applyBookingParams(){ if(page()!=='booking') return; const p=new URLSearchParams(location.search); if(p.get('room')) state.selectedRoomId=p.get('room'); }
function normalizeEgyptPhoneClient(value){
  let p = String(value || '').trim().replace(/[\s().-]/g,'');
  if(p.startsWith('0020')) p = '+20' + p.slice(4);
  if(p.startsWith('20') && !p.startsWith('+')) p = '+' + p;
  if(/^01[0125]\d{8}$/.test(p)) return '+2' + p;
  return p;
}
function isValidEgyptPhone(value){ return /^\+201[0125]\d{8}$/.test(normalizeEgyptPhoneClient(value)); }
function setupPhoneValidation(){
  const input=qs('#guestPhone');
  if(!input) return;
  input.setAttribute('maxlength','14');
  input.setAttribute('pattern','(01[0125][0-9]{8}|\\+201[0125][0-9]{8}|201[0125][0-9]{8})');
  input.setAttribute('title','Enter a valid Egyptian mobile number, e.g. 01012345678');
  input.addEventListener('input',()=>{
    input.value = input.value.replace(/[^0-9+]/g,'').slice(0,14);
    input.classList.toggle('invalid', Boolean(input.value) && !isValidEgyptPhone(input.value));
  });
}


function cleanCardClient(value){ return String(value || '').replace(/\D/g,''); }
function luhnClient(number){
  const n=cleanCardClient(number); if(n.length<13 || n.length>19) return false;
  let sum=0, dbl=false; for(let i=n.length-1;i>=0;i--){ let d=Number(n[i]); if(dbl){ d*=2; if(d>9)d-=9; } sum+=d; dbl=!dbl; }
  return sum % 10 === 0;
}
function validExpiryClient(value){
  const m=String(value||'').trim().match(/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/); if(!m) return false;
  const y=Number(m[2].length===2 ? '20'+m[2] : m[2]); const month=Number(m[1]);
  return new Date(y, month, 0, 23, 59, 59) >= new Date();
}
function setupPaymentFields(){
  const payment=qs('#paymentMethod'); const fields=qs('#cardPaymentFields'); if(!payment || !fields) return;
  const update=()=>{ const show=payment.value==='online_card'; fields.hidden=!show; qsa('input', fields).forEach(i=>{ if(show) i.setAttribute('required','required'); else i.removeAttribute('required'); }); };
  payment.addEventListener('change', update); update();
  const num=qs('#cardNumber'); const exp=qs('#cardExpiry'); const cvv=qs('#cardCvv');
  num?.addEventListener('input',()=>{ const digits=cleanCardClient(num.value).slice(0,19); num.value=digits.replace(/(.{4})/g,'$1 ').trim(); });
  exp?.addEventListener('input',()=>{ let d=cleanCardClient(exp.value).slice(0,4); if(d.length>2)d=d.slice(0,2)+'/'+d.slice(2); exp.value=d; });
  cvv?.addEventListener('input',()=>{ cvv.value=cleanCardClient(cvv.value).slice(0,4); });
}
function validateOnlineCardIfNeeded(){
  const method=qs('#paymentMethod')?.value;
  if(method!=='online_card') return { ok:true, card:null };
  const holder=qs('#cardHolder')?.value.trim() || '';
  const number=cleanCardClient(qs('#cardNumber')?.value || '');
  const expiry=qs('#cardExpiry')?.value.trim() || '';
  const cvv=cleanCardClient(qs('#cardCvv')?.value || '');
  if(holder.length<3) return { ok:false, message:'Please enter the card holder name.' };
  if(!luhnClient(number)) return { ok:false, message:'Please enter a valid card number.' };
  if(!validExpiryClient(expiry)) return { ok:false, message:'Please enter a valid expiry date, e.g. 12/28.' };
  if(!/^\d{3,4}$/.test(cvv)) return { ok:false, message:'Please enter a valid CVV.' };
  return { ok:true, card:{ holder, number, expiry, cvv } };
}

function setupForms(){
  qs('#roomSearchForm')?.addEventListener('submit', e=>{e.preventDefault(); renderRoomsPage();});
  qs('#bookingSearchForm')?.addEventListener('submit', e=>{e.preventDefault(); renderBookingRooms();});
  qs('#clearBookingFilters')?.addEventListener('click',()=>{ ['bookingRoomQ','bookingFilterCheckIn','bookingFilterCheckOut'].forEach(id=>{ const el=qs('#'+id); if(el) el.value=''; }); const c=qs('#bookingCategory'); if(c) c.value='all'; const g=qs('#bookingFilterGuests'); if(g) g.value='2'; renderBookingRooms(); });
  ['roomType','checkin','checkout','guestsCount'].forEach(id=>qs(`#${id}`)?.addEventListener('change', updateSummary));
  qs('#bookingForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const form = e.currentTarget;
    const result = qs('#bookingResult');
    const submitBtn = form.querySelector('button[type="submit"]');
    if(form.dataset.locked === 'true' || window.__bookingSubmitting) return;
    if(getUser()?.role === 'admin') { showLocalizedMessage(result,'Admin accounts cannot create customer bookings. Use the Admin Dashboard to manage reservations.','error'); return; }
    const rawPhone = qs('#guestPhone').value;
    if(!isValidEgyptPhone(rawPhone)) { showLocalizedMessage(result,'Please enter a valid Egyptian mobile number. Example: 01012345678.','error'); qs('#guestPhone')?.focus(); return; }
    const cardCheck = validateOnlineCardIfNeeded();
    if(!cardCheck.ok){ showLocalizedMessage(result, cardCheck.message, 'error'); return; }
    const body={ guestName:qs('#guestName').value, phone:normalizeEgyptPhoneClient(rawPhone), roomId:qs('#roomType').value, checkIn:qs('#checkin').value, checkOut:qs('#checkout').value, guests:Number(qs('#guestsCount').value), paymentMethod:qs('#paymentMethod').value };
    if(cardCheck.card) body.card = cardCheck.card;
    try{
      window.__bookingSubmitting = true;
      if(submitBtn){ submitBtn.disabled=true; submitBtn.textContent=tr('Booking is being saved...'); }
      const data=await api('/api/bookings',{method:'POST',body:JSON.stringify(body)});
      form.dataset.locked='true';
      if(submitBtn){ submitBtn.textContent=tr('Booking Confirmed'); submitBtn.dataset.lockedText='true'; }
      if(result){ result.className='message success booking-success-card'; result.innerHTML=`<strong>${tr('Booking Confirmed')}</strong><span>${tr('Booking confirmed. Reference:')} ${data.booking.reference}</span><span>${tr('Total')}: ${formatCurrency(data.booking.total)}</span><a href="bookings.html">${tr('View My Bookings')}</a>`; }
      toast(tr('Booking saved successfully.'));
      await renderBookingRooms();
    }catch(err){
      if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent=tr('Confirm Booking'); }
      showMessage(result,err.message,'error');
    }finally{
      window.__bookingSubmitting = false;
    }
  });
}
function setupPasswordToggles(){
  qsa('[data-toggle-password]').forEach(btn=>btn.addEventListener('click',()=>{
    const input = qs(`#${btn.dataset.togglePassword}`);
    if(!input) return;
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    btn.textContent = visible ? '👁' : '🙈';
    btn.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  }));
}
function setupAuth(){
  const form=qs('#authForm');
  if(!form) return;
  const existingUser = getUser();
  if(getToken() && existingUser){
    location.replace(existingUser?.role === 'admin' ? 'admin.html' : 'booking.html');
    return;
  }
  let mode='login';
  const nameGroup=qs('#nameGroup');
  const submit=qs('#authSubmit');
  const msg=qs('#authMessage');
  const resetBtn=qs('#resetPasswordBtn');
  const emailInput=qs('#email');
  const passwordInput=qs('#password');
  function targetAfterLogin(user){
    const ret = new URLSearchParams(location.search).get('return');
    if(ret && !ret.includes('login') && !ret.includes('admin')) return ret;
    return user?.role==='admin' ? 'admin.html' : 'booking.html';
  }
  function setMode(m){
    mode=m;
    qsa('.auth-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode===m));
    nameGroup.style.display=m==='register'?'block':'none';
    submit.textContent=m==='login'?'Login':'Create Account';
    if(resetBtn) resetBtn.style.display = m==='login' ? 'block' : 'none';
    msg.textContent='';
    msg.className='message';
    passwordInput.autocomplete = m==='login' ? 'current-password' : 'new-password';
  }
  qsa('.auth-tab').forEach(t=>t.addEventListener('click',()=>setMode(t.dataset.mode)));
  resetBtn?.addEventListener('click', async ()=>{
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if(!email || !password){ showMessage(msg,'Enter your email and the new password first.','error'); return; }
    try{
      resetBtn.disabled=true;
      const data=await api('/api/reset-password',{method:'POST',body:JSON.stringify({email,password})});
      setSession(data.token,data.user);
      showMessage(msg,'Password updated. You are logged in now.','success');
      setTimeout(()=>location.replace(targetAfterLogin(data.user)),350);
    }catch(err){
      showMessage(msg,err.message,'error');
    }finally{
      resetBtn.disabled=false;
    }
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const body={ email:emailInput.value.trim(), password:passwordInput.value };
    if(mode==='register') body.name=qs('#name').value.trim();
    try{
      submit.disabled=true;
      let data;
      try{
        data=await api(mode==='login'?'/api/login':'/api/register',{method:'POST',body:JSON.stringify(body)});
      }catch(loginErr){
        // If the old browser session existed but the new Neon database does not have this user yet,
        // recreate the account using the same email/password instead of showing a false error.
        const remembered = getLastUser() || getUser();
        const canReconnect = mode==='login'
          && /not registered/i.test(loginErr.message || '')
          && remembered?.email?.toLowerCase() === body.email.toLowerCase()
          && body.password;
        if(!canReconnect) throw loginErr;
        data = await api('/api/register',{method:'POST',body:JSON.stringify({
          name: remembered.name || 'Room Reserve User',
          email: body.email,
          password: body.password
        })});
      }
      setSession(data.token,data.user);
      showMessage(msg,mode==='login'?'Login successful.':'Account created successfully.','success');
      await delay(150);
      location.href = targetAfterLogin(data.user);
    }catch(err){
      if(mode==='login' && getToken()){
        const ok = await refreshSession(4);
        const existing = getUser();
        if(ok && existing){
          showMessage(msg,'Login restored. Redirecting...','success');
          await delay(150);
          location.href = targetAfterLogin(existing);
          return;
        }
      }
      showMessage(msg,err.message,'error');
    }finally{
      submit.disabled=false;
    }
  });
  setMode('login');
}
async function renderBookings(){ const root=qs('#myBookings'); if(!root) return; try{ const data=await api('/api/bookings'); const bookings=data.bookings||[]; root.innerHTML = bookings.map(b=>bookingCard(b,false)).join('') || '<div class="booking-card">No bookings yet.</div>'; qsa('.cancel-booking-btn').forEach(btn=>btn.addEventListener('click',async()=>{ if(!confirm('Cancel this booking?')) return; try{ await api(`/api/bookings/${encodeURIComponent(btn.dataset.id)}/cancel`,{method:'PATCH'}); toast('Booking cancelled.'); renderBookings(); }catch(err){ toast(err.message); } })); }catch(err){ root.innerHTML=`<div class="message error" style="display:block">${err.message}</div>`; } }
function bookingCard(b, admin=false){ return `<article class="booking-card"><div class="booking-card-head"><div><span class="badge category">${tr('Reference')}</span><h2>${b.reference}</h2></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${statusBadge(b.status)}${statusBadge(b.paymentStatus)}</div></div><div class="info-grid">${admin?`<div class="info-item"><span>${tr('Customer')}</span><strong>${b.customerName}</strong></div><div class="info-item"><span>${tr('Email')}</span><strong>${b.customerEmail}</strong></div>`:''}<div class="info-item"><span>${tr('Guest')}</span><strong>${b.guestName}</strong></div><div class="info-item"><span>${tr('Phone')}</span><strong>${b.phone || '-'}</strong></div><div class="info-item"><span>${tr('Room')}</span><strong>${tRoom(b.roomName)}</strong></div><div class="info-item"><span>${tr('Stay')}</span><strong>${b.checkIn} → ${b.checkOut}</strong></div><div class="info-item"><span>${tr('Guests')}</span><strong>${b.guests}</strong></div><div class="info-item"><span>${tr('Nights')}</span><strong>${b.nights}</strong></div><div class="info-item"><span>${tr('Total')}</span><strong>${formatCurrency(b.total)}</strong></div><div class="info-item"><span>${tr('Payment')}</span><strong>${paymentLabel(b.paymentMethod)}${b.paymentCardLast4 ? ` · ${tr('Online card ending')} ${b.paymentCardLast4}` : ''}</strong></div><div class="info-item"><span>${tr('Created')}</span><strong>${new Date(b.createdAt).toLocaleString()}</strong></div></div>${admin?adminActions(b):userActions(b)}</article>`; }
function userActions(b){ if(!['pending','confirmed'].includes(b.status)) return ''; return `<div class="admin-actions"><button class="btn-danger cancel-booking-btn" data-id="${b.id}" type="button">${tr('Cancel Booking')}</button></div>`; }
function adminActions(b){ return `<div class="admin-actions"><select class="admin-status-select" data-id="${b.id}" data-current="${b.status}"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="checked_in">Checked in</option><option value="checked_out">Checked out</option><option value="cancelled">Cancelled</option><option value="rejected">Rejected</option></select><select class="admin-payment-select" data-id="${b.id}" data-current="${b.paymentStatus}"><option value="pending">Payment pending</option><option value="paid">Paid</option><option value="refunded">Refunded</option><option value="failed">Payment failed</option></select></div>`; }
async function renderAdmin(){ if(page()!=='admin') return; try{ const overview=await api('/api/admin/overview'); const s=overview.stats; qs('#adminStats').innerHTML = `<div class="admin-card"><span>${tr('Customers')}</span><strong>${s.users}</strong></div><div class="admin-card"><span>${tr('Bookings')}</span><strong>${s.bookings}</strong></div><div class="admin-card"><span>${tr('Active')}</span><strong>${s.activeBookings}</strong></div><div class="admin-card"><span>${tr('Revenue')}</span><strong>${formatCurrency(s.revenue)}</strong></div><div class="admin-card"><span>${tr('Rooms')}</span><strong>${s.rooms}</strong></div>`; await renderAdminBookings(); const users=await api('/api/admin/users'); qs('#adminUsers').innerHTML = users.users.map(u=>`<article class="booking-card user-card"><div class="info-grid"><div class="info-item"><span>Name</span><strong>${u.name}</strong></div><div class="info-item"><span>Email</span><strong>${u.email}</strong></div><div class="info-item"><span>Role</span><strong>${u.role}</strong></div><div class="info-item"><span>Bookings</span><strong>${u.bookings_count}</strong></div><div class="info-item"><span>Total</span><strong>${formatCurrency(u.total_spent)}</strong></div><div class="info-item"><span>Created</span><strong>${new Date(u.created_at).toLocaleString()}</strong></div></div>${u.role==='admin'?'':`<div class="admin-actions"><button class="btn-danger delete-user-btn" type="button" data-id="${u.id}" data-name="${u.name}">${tr('Delete User')}</button></div>`}</article>`).join('');
      qsa('.delete-user-btn').forEach(btn=>btn.addEventListener('click',async()=>{ if(!confirm(tr('Delete this user and related bookings?'))) return; try{ await api(`/api/admin/users/${encodeURIComponent(btn.dataset.id)}`,{method:'DELETE'}); toast(tr('User deleted successfully.')); renderAdmin(); }catch(err){ toast(err.message); } })); qs('#exportCsvBtn').onclick=(e)=>{ e.preventDefault(); const token=getToken(); location.href=`/api/admin/export/bookings.csv?token=${encodeURIComponent(token)}`; alert('If export does not start, use API export after login from the same browser.'); }; }catch(err){ qs('#adminBookings').innerHTML=`<div class="message error" style="display:block">${err.message}</div>`; } }
async function renderAdminBookings(){ const params=new URLSearchParams(); const q=qs('#adminQ')?.value||''; const status=qs('#adminStatus')?.value||'all'; const dateFrom=qs('#adminDateFrom')?.value||''; const dateTo=qs('#adminDateTo')?.value||''; if(q)params.set('q',q); if(status)params.set('status',status); if(dateFrom)params.set('dateFrom',dateFrom); if(dateTo)params.set('dateTo',dateTo); const data=await api(`/api/admin/bookings?${params}`); qs('#adminBookings').innerHTML = data.bookings.map(b=>bookingCard(b,true)).join('') || '<div class="booking-card">No bookings found.</div>'; qsa('.admin-status-select').forEach(sel=>{ const card=sel.closest('.booking-card'); sel.value = sel.dataset.current || 'pending'; sel.addEventListener('change',async()=>{ try{ await api(`/api/admin/bookings/${encodeURIComponent(sel.dataset.id)}/status`,{method:'PATCH',body:JSON.stringify({status:sel.value})}); toast('Status updated'); renderAdmin(); }catch(err){ toast(err.message); } }); }); qsa('.admin-payment-select').forEach(sel=>{ sel.value = sel.dataset.current || 'pending'; sel.addEventListener('change',async()=>{ try{ await api(`/api/admin/bookings/${encodeURIComponent(sel.dataset.id)}/payment`,{method:'PATCH',body:JSON.stringify({paymentStatus:sel.value})}); toast('Payment updated'); renderAdmin(); }catch(err){ toast(err.message); } }); }); }
function setupAdminFilters(){ qs('#adminFilters')?.addEventListener('submit',e=>{e.preventDefault(); renderAdminBookings();}); }
async function setupProfile(){ if(page()!=='profile') return; const user=getUser(); if(user){ qs('#profileName').value=user.name; qs('#profileEmail').value=user.email; } qs('#profileForm')?.addEventListener('submit',async e=>{e.preventDefault(); try{ const data=await api('/api/profile',{method:'PUT',body:JSON.stringify({name:qs('#profileName').value})}); setSession(getToken(),data.user); updateAuthUI(); showMessage(qs('#profileMessage'),'Profile updated successfully.','success'); }catch(err){ showMessage(qs('#profileMessage'),err.message,'error'); }}); qs('#passwordForm')?.addEventListener('submit',async e=>{e.preventDefault(); try{ await api('/api/profile/password',{method:'PUT',body:JSON.stringify({currentPassword:qs('#currentPassword').value,newPassword:qs('#newPassword').value})}); showMessage(qs('#passwordMessage'),'Password updated successfully.','success'); e.target.reset(); }catch(err){ showMessage(qs('#passwordMessage'),err.message,'error'); }}); }
async function init(){ await refreshSession(4); insertLangToggle(); setupPasswordToggles(); updateAuthUI(); enforceProtected(); setupProtectedLinks(); setupLogout(); setupDates(); setupPhoneValidation(); setupPaymentFields(); setupAuth(); setupForms(); setupAdminFilters(); applyBookingParams(); if(getUser() && qs('#guestName')) qs('#guestName').value=getUser().name; if(page()==='rooms') { await renderRoomsPage(); } if(page()==='booking') { await renderBookingRooms(); } if(page()==='bookings') await renderBookings(); if(page()==='admin') await renderAdmin(); if(page()==='profile') setupProfile(); applyLanguage(); }
document.addEventListener('DOMContentLoaded', init);
