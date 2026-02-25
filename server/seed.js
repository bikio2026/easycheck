import db from './db.js';
import { v4 as uuid } from 'uuid';

const RESTAURANT_ID = 'rest-demo-001';

// Check if already seeded
const existing = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(RESTAURANT_ID);
if (existing) {
  console.log('Database already seeded. Skipping.');
  process.exit(0);
}

// Restaurant
db.prepare(`INSERT INTO restaurants (id, name, slug, logo_emoji, color) VALUES (?, ?, ?, ?, ?)`)
  .run(RESTAURANT_ID, 'La Parrilla de Don Julio', 'don-julio', '🥩', '#dc2626');

// Categories
const cats = [
  { id: 'cat-entradas', name: 'Entradas', sort: 0 },
  { id: 'cat-carnes', name: 'Carnes', sort: 1 },
  { id: 'cat-pastas', name: 'Pastas', sort: 2 },
  { id: 'cat-ensaladas', name: 'Ensaladas', sort: 3 },
  { id: 'cat-postres', name: 'Postres', sort: 4 },
  { id: 'cat-bebidas', name: 'Bebidas', sort: 5 },
  { id: 'cat-vinos', name: 'Vinos', sort: 6 },
];

const insertCat = db.prepare(`INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES (?, ?, ?, ?)`);
for (const c of cats) insertCat.run(c.id, RESTAURANT_ID, c.name, c.sort);

// Menu items
const items = [
  // Entradas
  { cat: 'cat-entradas', name: 'Empanadas (x3)', desc: 'Carne cortada a cuchillo', price: 4500, emoji: '🥟' },
  { cat: 'cat-entradas', name: 'Provoleta', desc: 'Con oregano y tomate', price: 5200, emoji: '🧀' },
  { cat: 'cat-entradas', name: 'Tabla de fiambres', desc: 'Jamon crudo, salame, quesos', price: 8900, emoji: '🍖' },
  { cat: 'cat-entradas', name: 'Humita en chala', desc: 'Receta del norte', price: 3800, emoji: '🌽' },
  // Carnes
  { cat: 'cat-carnes', name: 'Bife de chorizo', desc: '400g, punto a eleccion', price: 14500, emoji: '🥩' },
  { cat: 'cat-carnes', name: 'Ojo de bife', desc: '350g con chimichurri', price: 15200, emoji: '🥩' },
  { cat: 'cat-carnes', name: 'Entraña', desc: '300g a la parrilla', price: 13800, emoji: '🔥' },
  { cat: 'cat-carnes', name: 'Vacio', desc: '400g coccion lenta', price: 12900, emoji: '🥩' },
  { cat: 'cat-carnes', name: 'Pollo a la parrilla', desc: 'Medio pollo con limon', price: 9500, emoji: '🍗' },
  // Pastas
  { cat: 'cat-pastas', name: 'Sorrentinos de jamon y queso', desc: 'Con salsa rosa', price: 9800, emoji: '🥟' },
  { cat: 'cat-pastas', name: 'Ñoquis de papa', desc: 'Con bolognesa casera', price: 8500, emoji: '🍝' },
  { cat: 'cat-pastas', name: 'Ravioles de verdura', desc: 'Con fileto', price: 8900, emoji: '🍝' },
  // Ensaladas
  { cat: 'cat-ensaladas', name: 'Mixta', desc: 'Lechuga, tomate, cebolla', price: 4200, emoji: '🥗' },
  { cat: 'cat-ensaladas', name: 'Caesar', desc: 'Con pollo grillado y parmesano', price: 7500, emoji: '🥗' },
  // Postres
  { cat: 'cat-postres', name: 'Flan casero', desc: 'Con dulce de leche y crema', price: 4500, emoji: '🍮' },
  { cat: 'cat-postres', name: 'Panqueques con dulce de leche', desc: 'x2 unidades', price: 4800, emoji: '🥞' },
  { cat: 'cat-postres', name: 'Helado artesanal', desc: '3 bochas a eleccion', price: 5200, emoji: '🍨' },
  // Bebidas
  { cat: 'cat-bebidas', name: 'Agua mineral', desc: '500ml con o sin gas', price: 1800, emoji: '💧' },
  { cat: 'cat-bebidas', name: 'Coca-Cola', desc: 'Linea Coca 500ml', price: 2500, emoji: '🥤' },
  { cat: 'cat-bebidas', name: 'Cerveza artesanal', desc: 'Pinta 500ml', price: 4200, emoji: '🍺' },
  { cat: 'cat-bebidas', name: 'Limonada casera', desc: 'Jarra 1L', price: 3500, emoji: '🍋' },
  // Vinos
  { cat: 'cat-vinos', name: 'Malbec Reserva', desc: 'Catena Zapata 750ml', price: 12500, emoji: '🍷' },
  { cat: 'cat-vinos', name: 'Torrontes', desc: 'Colomé 750ml', price: 9800, emoji: '🥂' },
  { cat: 'cat-vinos', name: 'Cabernet Sauvignon', desc: 'Luigi Bosca 750ml', price: 11200, emoji: '🍷' },
];

const insertItem = db.prepare(
  `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)`
);

for (const item of items) {
  insertItem.run(uuid(), RESTAURANT_ID, item.cat, item.name, item.desc, item.price, item.emoji);
}

// Tables (10 mesas)
const insertTable = db.prepare(`INSERT INTO tables (id, restaurant_id, label) VALUES (?, ?, ?)`);
for (let i = 1; i <= 10; i++) {
  insertTable.run(`table-${String(i).padStart(2, '0')}`, RESTAURANT_ID, `Mesa ${i}`);
}

console.log('Seed complete: 1 restaurant, 7 categories, ' + items.length + ' items, 10 tables');
