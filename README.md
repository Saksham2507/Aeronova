# 🚀 AERONOVA — Supply Chain Optimization Platform


> A full-stack MERN application for real-time inventory management and demand sensing across multiple Regional Distribution Centers (RDCs).

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [Author](#author)

---

## 🌐 Overview

**AERONOVA** is a supply chain optimization platform designed to provide real-time visibility into inventory levels, SKU tracking, and demand forecasting across multiple Regional Distribution Centers (RDCs). It enables supply chain managers to make data-driven decisions by centralizing inventory data and providing live dashboards.

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based login system with bcrypt password hashing and protected API routes
- 📦 **Real-Time Inventory Dashboard** — Live stock levels and SKU information across all RDCs
- 📊 **Demand Forecasting** — Endpoints for sensing and predicting inventory demand
- 🗺️ **Multi-RDC Support** — Manage and monitor multiple Regional Distribution Centers from a single interface
- ⚡ **Redux State Management** — Efficient client-side state with Redux for seamless UI updates
- 🔄 **Axios Interceptors** — Automated token injection and error handling across all API calls
- 🛡️ **Protected Routes** — Client-side route guarding for authenticated users only

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Redux, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (JSON Web Tokens), bcrypt |
| API Testing | Postman |
| Version Control | Git, GitHub |

---

## 📁 Project Structure

```
Aeronova/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page-level components
│       ├── redux/           # Redux store, slices, actions
│       ├── utils/           # Axios instance, helpers
│       └── App.js
│
├── server/                  # Express backend
│   ├── config/              # DB connection
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   └── server.js
│
├── .env                     # Environment variables
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saksham2507/Aeronova.git
   cd Aeronova
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables** (see [Environment Variables](#environment-variables))

5. **Run the development servers**

   In the `server` directory:
   ```bash
   npm run dev
   ```

   In the `client` directory:
   ```bash
   npm start
   ```

6. Open your browser and go to `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `.env` file in the `server/` directory with the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

---

## 📡 API Endpoints

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |

### Inventory Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all inventory items |
| GET | `/api/inventory/:id` | Get inventory by RDC ID |
| POST | `/api/inventory` | Add new inventory item |
| PUT | `/api/inventory/:id` | Update inventory item |
| DELETE | `/api/inventory/:id` | Delete inventory item |

### Demand Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/demand` | Get demand forecast data |
| POST | `/api/demand/analyze` | Trigger demand analysis |

> All inventory and demand routes are **protected** — include `Authorization: Bearer <token>` in the request header.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 👤 Author

**Saksham Raj**  
📧 sakshamraj2507@gmail.com  
🔗 [GitHub](https://github.com/Saksham2507)

---

> ⭐ If you found this project useful, please consider giving it a star!
