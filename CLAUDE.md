# EasyCheck

> App para dividir la cuenta en restaurantes via QR
> Version actual: v0.1 (MVP)

## Stack
- **Frontend**: Vite 7 + React 19 + Tailwind v4 + Socket.io-client + React Router + Lucide
- **Backend**: Express 5 + Socket.io + better-sqlite3 + QRCode
- **Puertos**: Frontend 3080, API 3081

## Estructura
```
easycheck/
  client/          # Vite + React frontend
    src/
      pages/       # Home, Mesa, Session, JoinByCode, Admin
      components/  # MenuView, OrdersView, BillView, DinerBar
      lib/         # api.js, socket.js, avatars.js
  server/
    index.js       # Express + Socket.io server
    db.js          # SQLite schema
    seed.js        # Demo data seeder
```

## Flujo principal
1. Cliente escanea QR de mesa → `/mesa/:tableId`
2. Elige avatar + nombre → crea sesion
3. Ve menu del restaurante → agrega items al carrito → envia pedido
4. Tab "Cuenta" → elige modo de split (por items / partes iguales / porcentaje)
5. Selecciona propina → paga (simulado)
6. Notificacion en tiempo real al resto via WebSocket

## Comandos
```bash
cd server && npm run seed   # Cargar datos demo
cd server && npm run dev    # Levantar API (3081)
cd client && npm run dev    # Levantar frontend (3080)
```

## Datos demo
- Restaurante: "La Parrilla de Don Julio" (slug: don-julio)
- 7 categorias, 24 items de menu
- 10 mesas con QR generables

## Modelo de datos
restaurants → categories → menu_items
restaurants → tables → sessions → diners
sessions → orders (linked to diners + menu_items)
sessions → payments → payment_items (linked to orders)

## Deploy
- **URL**: https://easycheck-production-ff29.up.railway.app
- **Hosting**: Railway (auto-deploy desde `main`)
- **Build**: Nixpacks (ver `nixpacks.toml`)
- Cada merge a `main` redepliegue automaticamente

## Colaboracion

### Setup local
```bash
git clone https://github.com/bikio2026/easycheck.git
cd easycheck
cd client && npm install && cd ../server && npm install
cd server && npm run seed
```

### Flujo de trabajo (branches)
`main` esta protegido — no se puede pushear directo. Todo cambio va por PR:
```bash
git checkout main && git pull
git checkout -b feature/mi-cambio    # crear branch
# ... trabajar ...
git add <archivos> && git commit -m "descripcion"
git push -u origin feature/mi-cambio
# Crear Pull Request en GitHub → pedir review → merge
```

### Reglas
- **Nunca pushear directo a `main`** — siempre PR
- PRs requieren **1 approval** antes de merge
- Nombrar branches: `feature/xxx`, `fix/xxx`, `refactor/xxx`
- Commits en espanol, concisos
- Antes de crear PR, verificar que `npm run build` pasa en `client/`

### Puertos locales
- Frontend: 3080
- API: 3081
- No cambiar estos puertos (estan registrados en PORTS.md global)
