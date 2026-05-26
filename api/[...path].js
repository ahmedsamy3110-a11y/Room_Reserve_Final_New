const crypto = require('crypto');

const SERVICE_FEES = 250;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@roomreserve.com').trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'Admin@12345');
const ADMIN_NAME = String(process.env.ADMIN_NAME || 'Room Reserve Admin');
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_POSTGRES_URL_NON_POOLING || process.env.DATABASE_POSTGRES_PRISMA_URL || '';
const hasPostgres = Boolean(DATABASE_URL);
let pool = null;
let initPromise = null;

const initialRooms = [
  {
    id: 'nile_deluxe', name: 'Nile View Deluxe Room', location: 'Cairo, Egypt', category: 'Deluxe',
    capacity: 2, beds: '1 King Bed', size: '34 m²', price: 2800, discount: 15, inventory: 5, status: 'available',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Nile view', 'Smart lighting', 'Fast Wi-Fi', 'Breakfast included'],
    description: 'A calm deluxe room inspired by real Nile-side hotel rooms, with fixed room details and a smart control panel.'
  },
  {
    id: 'red_sea_suite', name: 'Red Sea Premium Suite', location: 'Hurghada, Egypt', category: 'Suite',
    capacity: 3, beds: '1 King Bed + Sofa Bed', size: '48 m²', price: 4200, discount: 20, inventory: 3, status: 'available',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Sea view', 'Private balcony', 'Mini bar', 'AI climate control'],
    description: 'A premium suite for a coastal stay with a balcony, warm interior design, and stable room specifications.'
  },
  {
    id: 'cairo_city', name: 'Cairo City Smart Room', location: 'Cairo, Egypt', category: 'Standard',
    capacity: 2, beds: '2 Twin Beds', size: '28 m²', price: 1900, discount: 0, inventory: 8, status: 'available',
    image: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=1200&q=80',
    amenities: ['City view', 'Smart TV', 'Work desk', 'Soundproof windows'],
    description: 'A practical city room for short stays, business trips, and students presenting a clean booking demo.'
  },
  {
    id: 'alex_sea_view', name: 'Alexandria Sea View Room', location: 'Alexandria, Egypt', category: 'Sea View',
    capacity: 2, beds: '1 Queen Bed', size: '32 m²', price: 2400, discount: 10, inventory: 4, status: 'available',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Sea view', 'Queen bed', 'Room service', 'Smart curtains'],
    description: 'A realistic seaside room option with a simple fixed price, discount label, and clear facilities.'
  },
  {
    id: 'family_apartment', name: 'Family Smart Apartment', location: 'New Cairo, Egypt', category: 'Family',
    capacity: 5, beds: '2 Bedrooms + Living Room', size: '72 m²', price: 5200, discount: 12, inventory: 2, status: 'available',
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Kitchenette', 'Kids area', '2 bathrooms', 'Laundry corner'],
    description: 'A family-friendly apartment layout with enough space and fixed details for a realistic reservation flow.'
  },
  {
    id: 'hurghada_beach_suite', name: 'Hurghada Beach Suite', location: 'Hurghada, Egypt', category: 'Sea View',
    capacity: 2, beds: '1 King Bed', size: '44 m²', price: 3600, discount: 18, inventory: 3, status: 'available',
    image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Sea view', 'Smart lock', 'Lounge area', 'Breakfast included'],
    description: 'A sea-view suite designed for a luxury coastal hotel concept, combining relaxing beach views with smart access.'
  },
  {
    id: 'luxor_heritage_suite', name: 'Luxor Heritage Suite', location: 'Luxor, Egypt', category: 'Heritage',
    capacity: 2, beds: '1 King Bed', size: '46 m²', price: 3600, discount: 18, inventory: 3, status: 'available',
    image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Heritage design', 'Smart lock', 'Lounge area', 'Breakfast included'],
    description: 'A heritage-style suite for a luxury Egypt hotel concept, combining classic design with smart access.'
  },
  {
    id: 'sharm_family_suite', name: 'Sharm Family Suite', location: 'Sharm El Sheikh, Egypt', category: 'Family',
    capacity: 4, beds: '1 King Bed + 2 Twin Beds', size: '64 m²', price: 4800, discount: 14, inventory: 3, status: 'available',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Family layout', 'Sea breeze', 'Kids corner', 'Breakfast included'],
    description: 'A comfortable family suite with enough space for parents and children, designed for longer beach stays.'
  },
  {
    id: 'giza_pyramid_view', name: 'Giza Pyramid View Room', location: 'Giza, Egypt', category: 'View',
    capacity: 2, beds: '1 Queen Bed', size: '36 m²', price: 3100, discount: 10, inventory: 4, status: 'available',
    image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Pyramid view', 'Smart TV', 'Work desk', 'Room service'],
    description: 'A city hotel room with a premium view concept, suitable for tourists and short business stays.'
  },
  {
    id: 'six_guest_grand_family', name: 'Grand Family Room for 6', location: 'North Coast, Egypt', category: 'Family',
    capacity: 6, beds: '2 Queen Beds + 2 Single Beds', size: '88 m²', price: 6500, discount: 16, inventory: 2, status: 'available',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Sleeps 6 guests', 'Large lounge', '2 bathrooms', 'Kitchenette'],
    description: 'A large family room built for groups up to six guests, with more space and practical sleeping arrangements.'
  },
  {
    id: 'business_king_room', name: 'Business King Room', location: 'New Administrative Capital, Egypt', category: 'Business',
    capacity: 2, beds: '1 King Bed', size: '30 m²', price: 2600, discount: 8, inventory: 6, status: 'available',
    image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
    amenities: ['Work desk', 'Fast Wi-Fi', 'Quiet floor', 'Coffee station'],
    description: 'A practical business room with a quiet layout, strong internet, and a simple professional stay experience.'
  }
];

const memory = globalThis.__ROOM_RESERVE_MEMORY__ || (globalThis.__ROOM_RESERVE_MEMORY__ = {
  ready: false,
  users: [],
  rooms: [],
  bookings: []
});

function nowIso() { return new Date().toISOString(); }
function normalizeText(value) { return String(value || '').trim().replace(/\s+/g, ' '); }
function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email)); }
function isReasonableName(name) { const value = normalizeText(name); return value.length >= 3 && /^[A-Za-z\u0600-\u06FF ]+$/.test(value) && value.split(' ').length >= 2; }
function normalizePhone(value) {
  let phone = String(value || '').trim().replace(/[\s().-]/g, '');
  if (phone.startsWith('0020')) phone = '+20' + phone.slice(4);
  if (phone.startsWith('20') && !phone.startsWith('+')) phone = '+' + phone;
  if (/^01[0125]\d{8}$/.test(phone)) phone = '+2' + phone;
  return phone;
}
function isValidPhone(phone) { return /^\+201[0125]\d{8}$/.test(normalizePhone(phone)); }
function isStrongPassword(password) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(password || '')); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex'); return { salt, hash }; }
function verifyPassword(password, salt, storedHash) { try { const { hash } = hashPassword(password, salt); return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash)); } catch { return false; } }
const TOKEN_SECRET = String(process.env.ROOM_RESERVE_TOKEN_SECRET || process.env.JWT_SECRET || 'room-reserve-stable-demo-secret-v2');
function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function unb64url(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}
function signPayload(payload) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function createTokenForUser(user) {
  const payload = b64url(JSON.stringify({ id: user.id, email: user.email, role: user.role, iat: Date.now() }));
  return `rr.${payload}.${signPayload(payload)}`;
}
function parseToken(token) {
  const value = String(token || '');
  if (!value.startsWith('rr.')) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const payload = parts[1];
  const sig = parts[2];
  if (sig !== signPayload(payload)) return null;
  try { return JSON.parse(unb64url(payload)); } catch { return null; }
}
function createToken() { return crypto.randomBytes(32).toString('hex'); }
function createId(prefix) { return `${prefix}_${crypto.randomBytes(8).toString('hex')}`; }
function dateOnly(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? value : ''; }
function calculateNights(checkIn, checkOut) { const start = new Date(`${checkIn}T00:00:00Z`); const end = new Date(`${checkOut}T00:00:00Z`); if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0; return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); }
function roomFinalPrice(room) { return Math.round(Number(room.price) * (1 - Number(room.discount) / 100)); }
function parseJsonList(value) { try { return Array.isArray(value) ? value : JSON.parse(value || '[]'); } catch { return []; } }
function serializeRoom(room) { return { ...room, amenities: parseJsonList(room.amenities), finalPrice: roomFinalPrice(room) }; }
function publicUser(user) { return user ? { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at } : null; }
function bookingPublic(row) {
  return { id: row.id, reference: row.id.slice(-8).toUpperCase(), userId: row.user_id, customerName: row.customer_name, customerEmail: row.customer_email, guestName: row.guest_name, phone: row.phone, roomId: row.room_id, roomName: row.room_name, checkIn: row.check_in, checkOut: row.check_out, guests: row.guests, nights: row.nights, pricePerNight: row.price_per_night, serviceFees: row.service_fees, total: row.total, paymentMethod: row.payment_method, paymentStatus: row.payment_status, paymentCardLast4: row.payment_card_last4 || '', paymentCardBrand: row.payment_card_brand || '', status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
function csvEscape(value) { const s = String(value ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
function jsonResponse(res, status, payload) { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.end(JSON.stringify(payload)); }
function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', `rrToken=${encodeURIComponent(token || '')}; Path=/; Max-Age=2592000; Secure; SameSite=Lax`);
}
function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'rrToken=; Path=/; Max-Age=0; Secure; SameSite=Lax');
}
function readCookie(req, name) {
  const cookie = req.headers.cookie || '';
  const item = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return item ? decodeURIComponent(item.split('=').slice(1).join('=')) : '';
}

async function readBody(req) { if (req.body && typeof req.body === 'object') return req.body; return new Promise((resolve, reject) => { let body = ''; req.on('data', chunk => { body += chunk.toString(); if (body.length > 1_000_000) { req.destroy(); reject(new Error('Request body is too large.')); } }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON.')); } }); }); }

function initMemory() {
  if (memory.ready) return;
  const t = nowIso();
  memory.rooms = initialRooms.map(r => ({ ...r, amenities: JSON.stringify(r.amenities), created_at: t, updated_at: t }));
  const { salt, hash } = hashPassword(ADMIN_PASSWORD);
  memory.users = [{ id: createId('admin'), name: ADMIN_NAME, email: ADMIN_EMAIL, salt, password_hash: hash, role: 'admin', token: '', created_at: t, updated_at: t }];
  memory.bookings = [];
  memory.ready = true;
}

async function getPool() {
  if (!hasPostgres) return null;
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
async function query(sql, params = []) { const p = await getPool(); if (!p) throw new Error('PostgreSQL is not configured. Add DATABASE_URL or connect Neon DATABASE_POSTGRES_URL in Vercel environment variables.'); const { rows } = await p.query(sql, params); return rows; }
async function ensureDatabase() {
  if (!hasPostgres) { initMemory(); return; }
  if (!initPromise) initPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        token TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        beds TEXT NOT NULL,
        size TEXT NOT NULL,
        price INTEGER NOT NULL,
        discount INTEGER NOT NULL DEFAULT 0,
        inventory INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'available',
        image TEXT NOT NULL,
        amenities TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        guest_name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
        room_name TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        guests INTEGER NOT NULL,
        nights INTEGER NOT NULL,
        price_per_night INTEGER NOT NULL,
        service_fees INTEGER NOT NULL,
        total INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_card_last4 TEXT DEFAULT '',
        payment_card_brand TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_card_last4 TEXT DEFAULT '';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_card_brand TEXT DEFAULT '';
    `);
    // Always add any newly shipped room templates without deleting existing database data.
    for (const r of initialRooms) {
      await query(`INSERT INTO rooms (id,name,location,category,capacity,beds,size,price,discount,inventory,status,image,amenities,description,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO NOTHING`, [r.id,r.name,r.location,r.category,r.capacity,r.beds,r.size,r.price,r.discount,r.inventory,r.status,r.image,JSON.stringify(r.amenities),r.description,nowIso(),nowIso()]);
    }
    await query(`UPDATE rooms SET status='available', updated_at=$1 WHERE status='maintenance'`, [nowIso()]);
    const admin = (await query('SELECT * FROM users WHERE email=$1', [ADMIN_EMAIL]))[0];
    if (!admin) {
      const { salt, hash } = hashPassword(ADMIN_PASSWORD);
      await query('INSERT INTO users (id,name,email,salt,password_hash,role,token,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [createId('admin'), ADMIN_NAME, ADMIN_EMAIL, salt, hash, 'admin', '', nowIso(), nowIso()]);
    }
  })();
  await initPromise;
}

async function getUserByToken(token) {
  if (!token) return null;
  const signed = parseToken(token);
  if (signed?.id || signed?.email) {
    if (!hasPostgres) return memory.users.find(u => u.id === signed.id || u.email === signed.email) || null;
    return (await query('SELECT * FROM users WHERE id=$1 OR email=$2 LIMIT 1', [signed.id || '', normalizeEmail(signed.email || '')]))[0] || null;
  }
  // Legacy fallback for old deployments that stored one token in the users table.
  if (!hasPostgres) return memory.users.find(u => u.token === token) || null;
  return (await query('SELECT * FROM users WHERE token=$1', [token]))[0] || null;
}
async function getAuthUser(req) {
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) token = readCookie(req, 'rrToken');
  if (!token) { try { token = new URL(req.url, 'http://localhost').searchParams.get('token') || ''; } catch {} }
  return getUserByToken(token);
}
async function requireUser(req, res) { const user = await getAuthUser(req); if (!user) jsonResponse(res, 401, { message: 'Please login first.' }); return user; }
async function requireAdmin(req, res) { const user = await requireUser(req, res); if (!user) return null; if (user.role !== 'admin') { jsonResponse(res, 403, { message: 'Admin access only.' }); return null; } return user; }
async function getRoom(roomId) { if (!hasPostgres) { const r = memory.rooms.find(x => x.id === roomId); return r ? serializeRoom(r) : null; } const r = (await query('SELECT * FROM rooms WHERE id=$1', [roomId]))[0]; return r ? serializeRoom(r) : null; }
async function getRooms() { if (!hasPostgres) return memory.rooms.map(serializeRoom); return (await query('SELECT * FROM rooms ORDER BY price ASC')).map(serializeRoom); }
async function overlapCount(roomId, checkIn, checkOut, excludeBookingId = '') {
  if (!hasPostgres) return memory.bookings.filter(b => b.room_id === roomId && !['cancelled','rejected','checked_out'].includes(b.status) && b.check_in < checkOut && b.check_out > checkIn && b.id !== excludeBookingId).length;
  return Number((await query(`SELECT COUNT(*)::int AS count FROM bookings WHERE room_id=$1 AND status NOT IN ('cancelled','rejected','checked_out') AND check_in < $2 AND check_out > $3 AND id != $4`, [roomId, checkOut, checkIn, excludeBookingId]))[0].count);
}
async function availableUnits(room, checkIn, checkOut) { if (!room || room.status !== 'available') return 0; const nights = calculateNights(checkIn, checkOut); if (!nights) return Number(room.inventory); return Math.max(0, Number(room.inventory) - Number(await overlapCount(room.id, checkIn, checkOut))); }
async function getRoomsWithAvailability(url) {
  const q = normalizeText(url.searchParams.get('q') || '').toLowerCase();
  const category = normalizeText(url.searchParams.get('category') || '').toLowerCase();
  const guests = Number(url.searchParams.get('guests') || 0);
  const maxPrice = Number(url.searchParams.get('maxPrice') || 0);
  const checkIn = dateOnly(url.searchParams.get('checkIn'));
  const checkOut = dateOnly(url.searchParams.get('checkOut'));
  let rooms = await getRooms();
  if (q) rooms = rooms.filter(r => `${r.name} ${r.location} ${r.category} ${r.description}`.toLowerCase().includes(q));
  if (category && category !== 'all') rooms = rooms.filter(r => r.category.toLowerCase().includes(category));
  if (guests) rooms = rooms.filter(r => Number(r.capacity) >= guests);
  if (maxPrice) rooms = rooms.filter(r => Number(r.finalPrice) <= maxPrice);
  return Promise.all(rooms.map(async room => ({ ...room, availableUnits: checkIn && checkOut ? await availableUnits(room, checkIn, checkOut) : (room.status === 'available' ? room.inventory : 0) })));
}
async function findExistingActiveBooking(userId, roomId, checkIn, checkOut) {
  const activeStatuses = ['pending','confirmed','checked_in'];
  if (!hasPostgres) {
    return memory.bookings.find(b => b.user_id === userId && b.room_id === roomId && b.check_in === checkIn && b.check_out === checkOut && activeStatuses.includes(b.status));
  }
  return (await query(`SELECT * FROM bookings WHERE user_id=$1 AND room_id=$2 AND check_in=$3 AND check_out=$4 AND status IN ('pending','confirmed','checked_in') ORDER BY created_at DESC LIMIT 1`, [userId, roomId, checkIn, checkOut]))[0];
}


function cleanCardNumber(value) { return String(value || '').replace(/\D/g, ''); }
function detectCardBrand(number) {
  const n = cleanCardNumber(number);
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  return 'Card';
}
function luhnCheck(number) {
  const n = cleanCardNumber(number);
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0, shouldDouble = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let digit = Number(n[i]);
    if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit; shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}
function isValidExpiry(value) {
  const m = String(value || '').trim().match(/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = Number(m[2].length === 2 ? '20' + m[2] : m[2]);
  const expiryEnd = new Date(year, month, 0, 23, 59, 59);
  return expiryEnd >= new Date();
}
function validateCardPayload(card = {}) {
  const number = cleanCardNumber(card.number);
  const holder = normalizeText(card.holder || '');
  const expiry = normalizeText(card.expiry || '');
  const cvv = String(card.cvv || '').trim();
  if (holder.length < 3) return { error: 'Please enter the card holder name.' };
  if (!luhnCheck(number)) return { error: 'Please enter a valid card number.' };
  if (!isValidExpiry(expiry)) return { error: 'Please enter a valid expiry date, e.g. 12/28.' };
  if (!/^\d{3,4}$/.test(cvv)) return { error: 'Please enter a valid CVV.' };
  return { last4: number.slice(-4), brand: detectCardBrand(number) };
}

async function validateBookingInput(body, user) {
  const guestName = normalizeText(body.guestName || user?.name);
  const phone = normalizePhone(body.phone);
  const roomId = normalizeText(body.roomId);
  const checkIn = dateOnly(body.checkIn);
  const checkOut = dateOnly(body.checkOut);
  const guests = Number(body.guests || 1);
  const paymentMethod = normalizeText(body.paymentMethod || 'cash_on_arrival');
  if (!isReasonableName(guestName)) return { error: 'Please enter a valid full guest name.' };
  if (!isValidPhone(phone)) return { error: 'Please enter a valid Egyptian mobile number. Example: 01012345678.' };
  const room = await getRoom(roomId); if (!room) return { error: 'Please select a valid room.' };
  if (room.status !== 'available') return { error: 'This room is currently not available for booking.' };
  if (!checkIn || !checkOut) return { error: 'Please choose valid check-in and check-out dates.' };
  const today = new Date(); today.setHours(0,0,0,0); const start = new Date(`${checkIn}T00:00:00`); if (start < today) return { error: 'Check-in date cannot be in the past.' };
  const nights = calculateNights(checkIn, checkOut); if (!nights) return { error: 'Check-out date must be after check-in date.' };
  if (!Number.isInteger(guests) || guests < 1 || guests > Number(room.capacity)) return { error: `This room supports from 1 to ${room.capacity} guests.` };
  const allowedPayments = ['cash_on_arrival','card_on_arrival','bank_transfer','online_card']; if (!allowedPayments.includes(paymentMethod)) return { error: 'Please select a valid payment method.' };
  let cardInfo = { last4: '', brand: '' };
  if (paymentMethod === 'online_card') {
    const cardCheck = validateCardPayload(body.card || {});
    if (cardCheck.error) return { error: cardCheck.error };
    cardInfo = { last4: cardCheck.last4, brand: cardCheck.brand };
  }
  const existingBooking = await findExistingActiveBooking(user.id, room.id, checkIn, checkOut);
  if (existingBooking) return { error: `You already confirmed this booking once. Reference: ${existingBooking.id.slice(-8).toUpperCase()}` };
  if (await availableUnits(room, checkIn, checkOut) < 1) return { error: 'This room is fully booked for the selected dates. Please choose another room or date.' };
  return { guestName, phone, room, checkIn, checkOut, guests, nights, paymentMethod, cardInfo };
}
async function createBooking(user, data) {
  const price = roomFinalPrice(data.room); const total = price * data.nights + SERVICE_FEES; const id = createId('BK'); const t = nowIso();
  const row = { id, user_id: user.id, guest_name: data.guestName, phone: data.phone, room_id: data.room.id, room_name: data.room.name, check_in: data.checkIn, check_out: data.checkOut, guests: data.guests, nights: data.nights, price_per_night: price, service_fees: SERVICE_FEES, total, payment_method: data.paymentMethod, payment_status: data.paymentMethod === 'online_card' ? 'paid' : 'pending', payment_card_last4: data.cardInfo?.last4 || '', payment_card_brand: data.cardInfo?.brand || '', status: 'pending', created_at: t, updated_at: t };
  if (!hasPostgres) { memory.bookings.unshift(row); return { ...row, customer_name: user.name, customer_email: user.email }; }
  await query(`INSERT INTO bookings (id,user_id,guest_name,phone,room_id,room_name,check_in,check_out,guests,nights,price_per_night,service_fees,total,payment_method,payment_status,payment_card_last4,payment_card_brand,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [id,user.id,data.guestName,data.phone,data.room.id,data.room.name,data.checkIn,data.checkOut,data.guests,data.nights,price,SERVICE_FEES,total,data.paymentMethod,data.paymentMethod === 'online_card' ? 'paid' : 'pending',data.cardInfo?.last4 || '',data.cardInfo?.brand || '','pending',t,t]);
  return (await query('SELECT b.*, u.name AS customer_name, u.email AS customer_email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.id=$1', [id]))[0];
}
async function getBookingsWithUsers() {
  if (!hasPostgres) return memory.bookings.map(b => { const u = memory.users.find(x => x.id === b.user_id) || {}; return { ...b, customer_name: u.name, customer_email: u.email }; });
  return await query('SELECT b.*, u.name AS customer_name, u.email AS customer_email FROM bookings b JOIN users u ON u.id=b.user_id ORDER BY b.created_at DESC');
}

async function handleApi(req, res) {
  await ensureDatabase();
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') return jsonResponse(res, 200, { ok: true });
  try {
    if (url.pathname === '/api/config' && req.method === 'GET') return jsonResponse(res, 200, { storage: hasPostgres ? 'PostgreSQL Database' : 'Vercel Demo Memory Storage', productMode: true });
    if (url.pathname === '/api/rooms' && req.method === 'GET') return jsonResponse(res, 200, { rooms: await getRoomsWithAvailability(url) });
    if (url.pathname.startsWith('/api/rooms/') && url.pathname.endsWith('/availability') && req.method === 'GET') { const roomId = decodeURIComponent(url.pathname.split('/')[3]); const room = await getRoom(roomId); if (!room) return jsonResponse(res, 404, { message: 'Room not found.' }); const checkIn = dateOnly(url.searchParams.get('checkIn')); const checkOut = dateOnly(url.searchParams.get('checkOut')); return jsonResponse(res, 200, { roomId, availableUnits: checkIn && checkOut ? await availableUnits(room, checkIn, checkOut) : room.inventory }); }
    if (url.pathname === '/api/register' && req.method === 'POST') { const body = await readBody(req); const name = normalizeText(body.name); const email = normalizeEmail(body.email); const password = String(body.password || ''); if (!isReasonableName(name)) return jsonResponse(res, 400, { message: 'Please enter your real full name.' }); if (!isValidEmail(email)) return jsonResponse(res, 400, { message: 'Please enter a valid email address.' }); if (!isStrongPassword(password)) return jsonResponse(res, 400, { message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' }); let existing; if (hasPostgres) existing = (await query('SELECT * FROM users WHERE email=$1', [email]))[0]; else existing = memory.users.find(u=>u.email===email); if (existing) { if (verifyPassword(password, existing.salt, existing.password_hash)) { const token = createTokenForUser(existing); existing.token = token; existing.updated_at = nowIso(); if (hasPostgres) await query('UPDATE users SET token=$1, updated_at=$2 WHERE id=$3', [token, existing.updated_at, existing.id]); setAuthCookie(res, token); return jsonResponse(res, 200, { token, user: publicUser(existing), message: 'This email already exists, so we logged you in.' }); } return jsonResponse(res, 409, { message: 'This email is already registered. Use Login with the correct password, or press Reset Password.' }); } const { salt, hash } = hashPassword(password); const t = nowIso(); const id = createId('USR'); const user = { id, name, email, salt, password_hash: hash, role: 'customer', token: '', created_at: t, updated_at: t }; const token = createTokenForUser(user); user.token = token; if (hasPostgres) await query('INSERT INTO users (id,name,email,salt,password_hash,role,token,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id,name,email,salt,hash,'customer',token,t,t]); else memory.users.push(user); setAuthCookie(res, token); return jsonResponse(res, 201, { token, user: publicUser(user) }); }
    if (url.pathname === '/api/login' && req.method === 'POST') { const body = await readBody(req); const email = normalizeEmail(body.email); const password = String(body.password || ''); if (!isValidEmail(email)) return jsonResponse(res, 400, { message: 'Please enter a valid email address.' }); const user = hasPostgres ? (await query('SELECT * FROM users WHERE email=$1', [email]))[0] : memory.users.find(u=>u.email===email); if (!user) { const sessionUser = await getAuthUser(req); if (sessionUser) { const existingToken = sessionUser.token || readCookie(req, 'rrToken') || ''; setAuthCookie(res, existingToken); return jsonResponse(res, 200, { token: existingToken, user: publicUser(sessionUser), message: 'Existing login restored.' }); } return jsonResponse(res, 401, { message: 'This email is not registered. Create an account first.' }); } if (!verifyPassword(password, user.salt, user.password_hash)) return jsonResponse(res, 401, { message: 'Password is incorrect. Try again or press Reset Password.' }); const token = createTokenForUser(user); user.token = token; user.updated_at = nowIso(); if (hasPostgres) await query('UPDATE users SET token=$1, updated_at=$2 WHERE id=$3', [token, user.updated_at, user.id]); setAuthCookie(res, token); return jsonResponse(res, 200, { token, user: publicUser(user) }); }
    if (url.pathname === '/api/reset-password' && req.method === 'POST') { const body = await readBody(req); const email = normalizeEmail(body.email); const password = String(body.password || ''); if (!isValidEmail(email)) return jsonResponse(res, 400, { message: 'Please enter a valid email address.' }); if (!isStrongPassword(password)) return jsonResponse(res, 400, { message: 'New password must include uppercase, lowercase, number, and symbol.' }); let user = hasPostgres ? (await query('SELECT * FROM users WHERE email=$1', [email]))[0] : memory.users.find(u=>u.email===email); if (!user) return jsonResponse(res, 404, { message: 'This email is not registered. Create an account first.' }); if (user.role === 'admin') return jsonResponse(res, 403, { message: 'Admin password cannot be reset from this page.' }); const { salt, hash } = hashPassword(password); const token = createTokenForUser(user); user.salt=salt; user.password_hash=hash; user.token=token; user.updated_at=nowIso(); if (hasPostgres) await query('UPDATE users SET salt=$1, password_hash=$2, token=$3, updated_at=$4 WHERE id=$5', [salt, hash, token, user.updated_at, user.id]); setAuthCookie(res, token); return jsonResponse(res, 200, { message: 'Password reset successfully.', token, user: publicUser(user) }); }
    if (url.pathname === '/api/logout' && req.method === 'POST') { clearAuthCookie(res); return jsonResponse(res, 200, { ok: true }); }
    if (url.pathname === '/api/me' && req.method === 'GET') { const user = await requireUser(req, res); if (!user) return; return jsonResponse(res, 200, { user: publicUser(user) }); }
    if (url.pathname === '/api/profile' && req.method === 'PUT') { const user = await requireUser(req, res); if (!user) return; const body = await readBody(req); const name = normalizeText(body.name); if (!isReasonableName(name)) return jsonResponse(res, 400, { message: 'Please enter a valid full name.' }); user.name = name; user.updated_at = nowIso(); if (hasPostgres) await query('UPDATE users SET name=$1, updated_at=$2 WHERE id=$3', [name, user.updated_at, user.id]); return jsonResponse(res, 200, { user: publicUser(user) }); }
    if (url.pathname === '/api/profile/password' && req.method === 'PUT') { const user = await requireUser(req, res); if (!user) return; const body = await readBody(req); const currentPassword = String(body.currentPassword || ''); const newPassword = String(body.newPassword || ''); if (!verifyPassword(currentPassword, user.salt, user.password_hash)) return jsonResponse(res, 401, { message: 'Current password is incorrect.' }); if (!isStrongPassword(newPassword)) return jsonResponse(res, 400, { message: 'New password must include uppercase, lowercase, number, and symbol.' }); const { salt, hash } = hashPassword(newPassword); user.salt=salt; user.password_hash=hash; user.updated_at=nowIso(); if (hasPostgres) await query('UPDATE users SET salt=$1, password_hash=$2, updated_at=$3 WHERE id=$4', [salt, hash, user.updated_at, user.id]); return jsonResponse(res, 200, { message: 'Password updated successfully.' }); }
    if (url.pathname === '/api/bookings' && req.method === 'POST') { const user = await requireUser(req, res); if (!user) return; if (user.role === 'admin') return jsonResponse(res, 403, { message: 'Admin accounts cannot create customer bookings. Use the Admin Dashboard to manage reservations.' }); const body = await readBody(req); const data = await validateBookingInput(body, user); if (data.error) return jsonResponse(res, 400, { message: data.error }); const booking = await createBooking(user, data); return jsonResponse(res, 201, { message: 'Booking created successfully.', booking: bookingPublic(booking) }); }
    if (url.pathname === '/api/bookings' && req.method === 'GET') { const user = await requireUser(req, res); if (!user) return; if (user.role === 'admin') return jsonResponse(res, 403, { message: 'Admin accounts do not have My Bookings. Use the Admin Dashboard.' }); let rows = await getBookingsWithUsers(); rows = rows.filter(r => r.user_id === user.id); return jsonResponse(res, 200, { bookings: rows.map(bookingPublic) }); }
    const cancelMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)\/cancel$/); if (cancelMatch && req.method === 'PATCH') { const user = await requireUser(req, res); if (!user) return; if (user.role === 'admin') return jsonResponse(res, 403, { message: 'Admin accounts manage bookings from the Admin Dashboard.' }); const id = decodeURIComponent(cancelMatch[1]); let booking = hasPostgres ? (await query('SELECT * FROM bookings WHERE id=$1 AND user_id=$2', [id, user.id]))[0] : memory.bookings.find(b=>b.id===id && b.user_id===user.id); if (!booking) return jsonResponse(res, 404, { message: 'Booking not found.' }); if (!['pending','confirmed'].includes(booking.status)) return jsonResponse(res, 400, { message: 'This booking cannot be cancelled.' }); booking.status='cancelled'; booking.updated_at=nowIso(); if (hasPostgres) await query('UPDATE bookings SET status=$1, updated_at=$2 WHERE id=$3', [booking.status, booking.updated_at, id]); return jsonResponse(res, 200, { message: 'Booking cancelled successfully.' }); }
    if (url.pathname === '/api/admin/overview' && req.method === 'GET') { const admin = await requireAdmin(req, res); if (!admin) return; const users = hasPostgres ? Number((await query("SELECT COUNT(*)::int AS count FROM users WHERE role='customer'"))[0].count) : memory.users.filter(u=>u.role==='customer').length; const bookings = hasPostgres ? Number((await query('SELECT COUNT(*)::int AS count FROM bookings'))[0].count) : memory.bookings.length; const activeBookings = hasPostgres ? Number((await query("SELECT COUNT(*)::int AS count FROM bookings WHERE status IN ('pending','confirmed','checked_in')"))[0].count) : memory.bookings.filter(b=>['pending','confirmed','checked_in'].includes(b.status)).length; const revenue = hasPostgres ? Number((await query("SELECT COALESCE(SUM(total),0)::int AS total FROM bookings WHERE status NOT IN ('cancelled','rejected')"))[0].total) : memory.bookings.filter(b=>!['cancelled','rejected'].includes(b.status)).reduce((s,b)=>s+Number(b.total),0); const rooms = hasPostgres ? Number((await query('SELECT COUNT(*)::int AS count FROM rooms'))[0].count) : memory.rooms.length; return jsonResponse(res, 200, { stats: { users, bookings, activeBookings, revenue, rooms } }); }
    if (url.pathname === '/api/admin/users' && req.method === 'GET') { const admin = await requireAdmin(req, res); if (!admin) return; let users; if (hasPostgres) users = await query(`SELECT u.id,u.name,u.email,u.role,u.created_at, COUNT(b.id)::int AS bookings_count, COALESCE(SUM(CASE WHEN b.status NOT IN ('cancelled','rejected') THEN b.total ELSE 0 END),0)::int AS total_spent FROM users u LEFT JOIN bookings b ON b.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC`); else users = memory.users.map(u=>{ const bs=memory.bookings.filter(b=>b.user_id===u.id); return { id:u.id,name:u.name,email:u.email,role:u.role,created_at:u.created_at, bookings_count:bs.length, total_spent:bs.filter(b=>!['cancelled','rejected'].includes(b.status)).reduce((s,b)=>s+Number(b.total),0) }; }).sort((a,b)=>b.created_at.localeCompare(a.created_at)); return jsonResponse(res, 200, { users }); }
    const adminUserDeleteMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/); if (adminUserDeleteMatch && req.method === 'DELETE') { const admin = await requireAdmin(req, res); if (!admin) return; const id = decodeURIComponent(adminUserDeleteMatch[1]); const target = hasPostgres ? (await query('SELECT * FROM users WHERE id=$1', [id]))[0] : memory.users.find(u=>u.id===id); if (!target) return jsonResponse(res, 404, { message: 'User not found.' }); if (target.role === 'admin') return jsonResponse(res, 403, { message: 'Admin users cannot be deleted from this panel.' }); if (target.id === admin.id) return jsonResponse(res, 403, { message: 'You cannot delete your own account.' }); if (hasPostgres) await query('DELETE FROM users WHERE id=$1 AND role <> $2', [id, 'admin']); else { memory.bookings = memory.bookings.filter(b=>b.user_id !== id); memory.users = memory.users.filter(u=>u.id !== id); } return jsonResponse(res, 200, { message: 'User and related bookings deleted successfully.' }); }
    if (url.pathname === '/api/admin/bookings' && req.method === 'GET') { const admin = await requireAdmin(req, res); if (!admin) return; const q = normalizeText(url.searchParams.get('q') || '').toLowerCase(); const status = normalizeText(url.searchParams.get('status') || 'all'); const dateFrom = dateOnly(url.searchParams.get('dateFrom')); const dateTo = dateOnly(url.searchParams.get('dateTo')); let rows = await getBookingsWithUsers(); if (status !== 'all') rows = rows.filter(r => r.status === status); if (dateFrom) rows = rows.filter(r => r.check_in >= dateFrom); if (dateTo) rows = rows.filter(r => r.check_in <= dateTo); if (q) rows = rows.filter(r => `${r.id} ${r.customer_name} ${r.customer_email} ${r.guest_name} ${r.phone} ${r.room_name}`.toLowerCase().includes(q)); return jsonResponse(res, 200, { bookings: rows.map(bookingPublic) }); }
    const adminBookingStatusMatch = url.pathname.match(/^\/api\/admin\/bookings\/([^/]+)\/status$/); if (adminBookingStatusMatch && req.method === 'PATCH') { const admin = await requireAdmin(req, res); if (!admin) return; const id = decodeURIComponent(adminBookingStatusMatch[1]); const body = await readBody(req); const status = normalizeText(body.status); const allowed = ['pending','confirmed','checked_in','checked_out','cancelled','rejected']; if (!allowed.includes(status)) return jsonResponse(res, 400, { message: 'Invalid booking status.' }); const booking = hasPostgres ? (await query('SELECT * FROM bookings WHERE id=$1', [id]))[0] : memory.bookings.find(b=>b.id===id); if (!booking) return jsonResponse(res, 404, { message: 'Booking not found.' }); booking.status=status; booking.updated_at=nowIso(); if (hasPostgres) await query('UPDATE bookings SET status=$1, updated_at=$2 WHERE id=$3', [status, booking.updated_at, id]); return jsonResponse(res, 200, { message: 'Booking status updated.' }); }
    const adminPaymentMatch = url.pathname.match(/^\/api\/admin\/bookings\/([^/]+)\/payment$/); if (adminPaymentMatch && req.method === 'PATCH') { const admin = await requireAdmin(req, res); if (!admin) return; const id = decodeURIComponent(adminPaymentMatch[1]); const body = await readBody(req); const paymentStatus = normalizeText(body.paymentStatus); const allowed = ['pending','paid','refunded','failed']; if (!allowed.includes(paymentStatus)) return jsonResponse(res, 400, { message: 'Invalid payment status.' }); const booking = hasPostgres ? (await query('SELECT * FROM bookings WHERE id=$1', [id]))[0] : memory.bookings.find(b=>b.id===id); if (!booking) return jsonResponse(res, 404, { message: 'Booking not found.' }); booking.payment_status=paymentStatus; booking.updated_at=nowIso(); if (hasPostgres) await query('UPDATE bookings SET payment_status=$1, updated_at=$2 WHERE id=$3', [paymentStatus, booking.updated_at, id]); return jsonResponse(res, 200, { message: 'Payment status updated.' }); }
    if (url.pathname === '/api/admin/export/bookings.csv' && req.method === 'GET') { const admin = await requireAdmin(req, res); if (!admin) return; const rows = (await getBookingsWithUsers()).map(bookingPublic); const headers = ['reference','customerName','customerEmail','guestName','phone','roomName','checkIn','checkOut','guests','nights','total','paymentMethod','paymentStatus','paymentCardBrand','paymentCardLast4','status','createdAt']; const csv = [headers.join(','), ...rows.map(r => headers.map(h => csvEscape(r[h])).join(','))].join('\n'); res.statusCode = 200; res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="room-reserve-bookings.csv"'); return res.end(csv); }
    return jsonResponse(res, 404, { message: 'API endpoint not found.' });
  } catch (error) { console.error(error); return jsonResponse(res, 500, { message: error.message || 'Internal server error.' }); }
}

module.exports = async function handler(req, res) { return handleApi(req, res); };
module.exports.handleApi = handleApi;
