# Petal & Stem – Flower Shop (React + Express)

## Run
Terminal 1:  cd server && npm install && npm start      (API on :4000)
Terminal 2:  cd client && npm install && npm run dev    (site on :5173)

Admin: open the site, click "Admin", key = admin123 (set ADMIN_KEY env var to change).
Data is stored in server/db.json (auto-created). Swap for MongoDB/Postgres later.

## API
GET  /api/flowers?category=Roses
POST /api/flowers            (admin)  DELETE /api/flowers/:id (admin)
POST /api/orders             {name,phone,address,note,items:[{id,qty}]}
GET  /api/orders             (admin)  PATCH /api/orders/:id {status} (admin)
