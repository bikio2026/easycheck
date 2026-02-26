import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';
import db from './db.js';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3081;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3080';

// ============ RESTAURANT API ============

app.get('/api/restaurants', (req, res) => {
  const rows = db.prepare('SELECT * FROM restaurants').all();
  res.json(rows);
});

app.get('/api/restaurants/:slug', (req, res) => {
  const r = db.prepare('SELECT * FROM restaurants WHERE slug = ?').get(req.params.slug);
  if (!r) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(r);
});

// ============ MENU API ============

app.get('/api/restaurants/:id/menu', (req, res) => {
  const categories = db.prepare(
    'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order'
  ).all(req.params.id);

  const items = db.prepare(
    'SELECT * FROM menu_items WHERE restaurant_id = ? AND available = 1 ORDER BY name'
  ).all(req.params.id);

  const menu = categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));

  res.json(menu);
});

// Admin: CRUD menu items
app.post('/api/admin/menu-items', (req, res) => {
  const { restaurant_id, category_id, name, description, price, emoji } = req.body;
  const id = uuid();
  db.prepare(
    'INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, emoji) VALUES (?,?,?,?,?,?,?)'
  ).run(id, restaurant_id, category_id, name, description || '', price, emoji || '🍴');
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  res.status(201).json(item);
});

app.put('/api/admin/menu-items/:id', (req, res) => {
  const { name, description, price, emoji, category_id, available } = req.body;
  db.prepare(
    'UPDATE menu_items SET name=?, description=?, price=?, emoji=?, category_id=?, available=? WHERE id=?'
  ).run(name, description, price, emoji, category_id, available ?? 1, req.params.id);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  res.json(item);
});

app.delete('/api/admin/menu-items/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Admin: categories
app.get('/api/admin/categories/:restaurantId', (req, res) => {
  const cats = db.prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order').all(req.params.restaurantId);
  res.json(cats);
});

app.post('/api/admin/categories', (req, res) => {
  const { restaurant_id, name } = req.body;
  const id = uuid();
  const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM categories WHERE restaurant_id = ?').get(restaurant_id);
  db.prepare('INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES (?,?,?,?)').run(id, restaurant_id, name, (maxSort?.m ?? -1) + 1);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

// ============ TABLES & QR ============

app.get('/api/restaurants/:id/tables', (req, res) => {
  const tables = db.prepare('SELECT * FROM tables WHERE restaurant_id = ?').all(req.params.id);
  res.json(tables);
});

app.get('/api/tables/:id/qr', async (req, res) => {
  const table = db.prepare('SELECT t.*, r.slug FROM tables t JOIN restaurants r ON t.restaurant_id = r.id WHERE t.id = ?').get(req.params.id);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const url = `${CLIENT_URL}/mesa/${table.id}`;
  const qr = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: '#111827' } });
  res.json({ url, qr, table });
});

// ============ SESSIONS ============

app.post('/api/sessions', (req, res) => {
  const { table_id, diner_name, avatar } = req.body;
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(table_id);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  // Check for existing open session
  let session = db.prepare('SELECT * FROM sessions WHERE table_id = ? AND status = ?').get(table_id, 'open');

  if (!session) {
    const sessionId = uuid();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.prepare(
      'INSERT INTO sessions (id, table_id, restaurant_id, invite_code) VALUES (?,?,?,?)'
    ).run(sessionId, table_id, table.restaurant_id, inviteCode);
    session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  }

  // Add diner
  const dinerId = uuid();
  const isHost = db.prepare('SELECT COUNT(*) as c FROM diners WHERE session_id = ?').get(session.id).c === 0 ? 1 : 0;
  db.prepare(
    'INSERT INTO diners (id, session_id, name, avatar, is_host) VALUES (?,?,?,?,?)'
  ).run(dinerId, session.id, diner_name, avatar || '😀', isHost);

  const diner = db.prepare('SELECT * FROM diners WHERE id = ?').get(dinerId);
  const diners = db.prepare('SELECT * FROM diners WHERE session_id = ?').all(session.id);

  io.to(session.id).emit('diner:joined', { diner, diners });

  res.status(201).json({ session, diner, diners });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const diners = db.prepare('SELECT * FROM diners WHERE session_id = ?').all(session.id);
  const orders = db.prepare(`
    SELECT o.*, mi.name as item_name, mi.price, mi.emoji as item_emoji, d.name as diner_name
    FROM orders o
    JOIN menu_items mi ON o.menu_item_id = mi.id
    JOIN diners d ON o.diner_id = d.id
    WHERE o.session_id = ?
    ORDER BY o.created_at
  `).all(session.id);

  const payments = db.prepare(`
    SELECT p.*, d.name as diner_name FROM payments p
    JOIN diners d ON p.diner_id = d.id
    WHERE p.session_id = ?
    ORDER BY p.created_at
  `).all(session.id);

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(session.table_id);

  res.json({ session, table, diners, orders, payments });
});

// Join by invite code
app.post('/api/sessions/join', (req, res) => {
  const { invite_code, diner_name, avatar } = req.body;
  const session = db.prepare('SELECT * FROM sessions WHERE invite_code = ? AND status = ?').get(invite_code, 'open');
  if (!session) return res.status(404).json({ error: 'Session not found or closed' });

  const dinerId = uuid();
  db.prepare(
    'INSERT INTO diners (id, session_id, name, avatar) VALUES (?,?,?,?)'
  ).run(dinerId, session.id, diner_name, avatar || '😀');

  const diner = db.prepare('SELECT * FROM diners WHERE id = ?').get(dinerId);
  const diners = db.prepare('SELECT * FROM diners WHERE session_id = ?').all(session.id);

  io.to(session.id).emit('diner:joined', { diner, diners });

  res.status(201).json({ session, diner, diners });
});

// ============ ORDERS ============

app.post('/api/orders', (req, res) => {
  const { session_id, diner_id, items } = req.body;
  // items: [{ menu_item_id, quantity, notes }]
  const insertOrder = db.prepare(
    'INSERT INTO orders (id, session_id, diner_id, menu_item_id, quantity, notes) VALUES (?,?,?,?,?,?)'
  );

  const newOrders = [];
  const insertMany = db.transaction(() => {
    for (const item of items) {
      const id = uuid();
      insertOrder.run(id, session_id, diner_id, item.menu_item_id, item.quantity || 1, item.notes || '');
      const order = db.prepare(`
        SELECT o.*, mi.name as item_name, mi.price, mi.emoji as item_emoji, d.name as diner_name
        FROM orders o JOIN menu_items mi ON o.menu_item_id = mi.id JOIN diners d ON o.diner_id = d.id
        WHERE o.id = ?
      `).get(id);
      newOrders.push(order);
    }
  });
  insertMany();

  io.to(session_id).emit('orders:updated', { orders: newOrders });
  res.status(201).json(newOrders);
});

// ============ PAYMENTS ============

app.post('/api/payments', (req, res) => {
  const { session_id, diner_id, order_ids, tip, method } = req.body;

  // Calculate total from selected orders
  const placeholders = order_ids.map(() => '?').join(',');
  const orders = db.prepare(`
    SELECT o.id, o.quantity, mi.price FROM orders o
    JOIN menu_items mi ON o.menu_item_id = mi.id
    WHERE o.id IN (${placeholders})
  `).all(...order_ids);

  const amount = orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);

  const paymentId = uuid();
  db.prepare(
    'INSERT INTO payments (id, session_id, diner_id, amount, tip, method) VALUES (?,?,?,?,?,?)'
  ).run(paymentId, session_id, diner_id, amount, tip || 0, method || 'mercadopago');

  // Link payment to orders
  const insertPI = db.prepare('INSERT INTO payment_items (payment_id, order_id, amount) VALUES (?,?,?)');
  for (const o of orders) {
    insertPI.run(paymentId, o.id, o.price * o.quantity);
  }

  const payment = db.prepare(`
    SELECT p.*, d.name as diner_name FROM payments p
    JOIN diners d ON p.diner_id = d.id WHERE p.id = ?
  `).get(paymentId);

  io.to(session_id).emit('payment:made', { payment });

  res.status(201).json(payment);
});

// Get paid order IDs for a session
app.get('/api/sessions/:id/paid-orders', (req, res) => {
  const rows = db.prepare('SELECT pi.order_id FROM payment_items pi JOIN payments p ON pi.payment_id = p.id WHERE p.session_id = ?').all(req.params.id);
  res.json(rows.map(r => r.order_id));
});

// Close session
app.post('/api/sessions/:id/close', (req, res) => {
  db.prepare("UPDATE sessions SET status = 'closed', closed_at = datetime('now') WHERE id = ?").run(req.params.id);
  io.to(req.params.id).emit('session:closed');
  res.json({ ok: true });
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  socket.on('join:session', (sessionId) => {
    socket.join(sessionId);
  });
});

// ============ STATIC FILES (production) ============

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname2, '..', 'client', 'dist');

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('{*path}', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(clientDist, 'index.html'));
    }
  });
}

// ============ START ============

server.listen(PORT, '0.0.0.0', () => {
  console.log(`EasyCheck API running on http://0.0.0.0:${PORT}`);
});
