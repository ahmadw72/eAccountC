# Inventory Control System (MERN)

A starter inventory control system built with:
- **React JS** (frontend)
- **Express JS + Node JS** (backend)
- **MongoDB** (database)

## Project Structure

- `frontend` - React/Vite application
- `backend` - Express API with MongoDB models/routes

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs on `http://localhost:5000`.

### API Endpoints

- `GET /api/health`
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `POST /api/orders`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

Set custom API URL if needed:

```bash
VITE_API_BASE=http://localhost:5000/api
```

## Core Features

- Add inventory products
- View stock table
- Low-stock highlighting using reorder level
- Delete products
- Create orders with unique 12-character alphanumeric IDs
- Save and view past orders from the order pane
