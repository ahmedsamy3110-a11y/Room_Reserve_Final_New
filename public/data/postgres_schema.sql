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
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in, check_out);
