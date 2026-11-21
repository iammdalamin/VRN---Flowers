import express from 'express'; import cors from 'cors'; import fs from 'fs';
const app = express(); app.use(cors(), express.json());
const DB = './db.json', ADMIN = process.env.ADMIN_KEY || 'admin123';
const seed = { orders: [], flowers: [
  { id: 1, name: 'Blush Peonies', category: 'Bouquets', price: 1800, emoji: '🌸', color: '#F7C6D9', desc: 'Twelve soft peonies wrapped in kraft paper.' },
  { id: 2, name: 'Red Rose Dozen', category: 'Roses', price: 1500, emoji: '🌹', color: '#E8546F', desc: 'Long-stem roses, cut the morning you order.' },
  { id: 3, name: 'Sunflower Armful', category: 'Bouquets', price: 1200, emoji: '🌻', color: '#F3D36B', desc: 'Eight bright sunflowers with greenery.' },
  { id: 4, name: 'White Tulips', category: 'Seasonal', price: 1000, emoji: '🌷', color: '#EDE3F5', desc: 'A clean bunch of ten tulips in a glass-ready bundle.' },
  { id: 5, name: 'Lavender Pot', category: 'Plants', price: 900, emoji: '🪻', color: '#C9B6E4', desc: 'Potted lavender that keeps blooming indoors.' },
  { id: 6, name: 'Orchid in Ceramic', category: 'Plants', price: 2600, emoji: '🪷', color: '#F2B8C6', desc: 'Phalaenopsis orchid in a hand-glazed pot.' }
]};
if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify(seed, null, 2));
const read = () => JSON.parse(fs.readFileSync(DB)), write = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const admin = (req, res, next) => req.get('x-admin-key') === ADMIN ? next() : res.status(401).json({ error: 'Wrong admin key' });

app.get('/api/flowers', (req, res) => {
  const { category } = req.query, all = read().flowers;
  res.json(category ? all.filter(f => f.category === category) : all);
});
app.post('/api/flowers', admin, (req, res) => {
  const { name, category, price, emoji, color, desc } = req.body;
  if (!name || !(price > 0)) return res.status(400).json({ error: 'Name and a positive price are required' });
  const d = read(), f = { id: Date.now(), name, category: category || 'Bouquets', price: +price, emoji: emoji || '💐', color: color || '#F7C6D9', desc: desc || '' };
  d.flowers.push(f); write(d); res.status(201).json(f);
});
app.delete('/api/flowers/:id', admin, (req, res) => {
  const d = read(); d.flowers = d.flowers.filter(f => f.id !== +req.params.id); write(d); res.json({ ok: true });
});
app.post('/api/orders', (req, res) => {
  const { name, phone, address, note, items } = req.body;
  if (!name || !phone || !address) return res.status(400).json({ error: 'Name, phone and address are required' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty' });
  const d = read(); let total = 0; const lines = [];
  for (const { id, qty } of items) {
    const f = d.flowers.find(x => x.id === id);
    if (!f || !(qty > 0)) return res.status(400).json({ error: 'Invalid item in cart' });
    total += f.price * qty; lines.push({ id, name: f.name, price: f.price, qty });
  }
  const order = { id: Date.now(), name, phone, address, note: note || '', items: lines, total, status: 'New', createdAt: new Date().toISOString() };
  d.orders.unshift(order); write(d); res.status(201).json(order);
});
app.get('/api/orders', admin, (req, res) => res.json(read().orders));
app.patch('/api/orders/:id', admin, (req, res) => {
  const d = read(), o = d.orders.find(x => x.id === +req.params.id);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  o.status = req.body.status; write(d); res.json(o);
});
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on port ${port}`));
