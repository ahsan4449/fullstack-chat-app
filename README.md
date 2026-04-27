<div align="center">

# 💬 SyncTalk

### A full-featured, real-time MERN chat application with AI, group chats, memory, and high-security features.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://synctalk-qas1.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)

</div>

---

## ✨ Features

### 💬 Messaging
- Real-time one-on-one messaging via **Socket.io** WebSockets
- Persistent chat history stored in MongoDB
- Image & media sharing (uploaded via **Cloudinary**)
- Message translation powered by **Google Cloud Translate**
- Self-destructing messages with configurable TTL (time-to-live)

### 👥 Group Chats
- Create and manage group conversations
- Real-time group messaging with per-room Socket.io rooms
- Group member management

### 🤖 AI Features
- **AI Chat Assistant** powered by Google Gemini
  - `summary` — 3-bullet summary of any conversation
  - `reply` — 3 smart reply suggestions
  - `sentiment` — single emoji mood detector
- **AI Memory Chat** — persistent user memory store with pronoun resolution and contextual recall

### 🔒 Security
- JWT authentication with **HttpOnly cookies**
- **High-Security Mode** with screenshot detection (notifies the other party)
- Self-destruct message timer (`SelfDestructTimer` component)
- Bcrypt password hashing

### 🎨 UI / UX
- 32+ DaisyUI themes (switchable at runtime)
- Responsive, mobile-friendly layout
- Skeleton loading states
- Toast notifications via `react-hot-toast`
- Online/offline user indicators

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, DaisyUI |
| **State Management** | Zustand |
| **Backend** | Node.js, Express.js v5 |
| **Database** | MongoDB + Mongoose |
| **Real-Time** | Socket.io (WebSocket) |
| **Authentication** | JWT, Bcrypt, HttpOnly Cookies |
| **File Uploads** | Cloudinary |
| **AI** | Google Gemini (`@google/genai`) |
| **Translation** | Google Cloud Translate |
| **Deployment** | Render (single web service) |

---

## 🌐 Live Demo

**[https://synctalk-qas1.onrender.com](https://synctalk-qas1.onrender.com)**

> ⚠️ Hosted on Render's free tier — the app may take ~30 seconds to wake up after inactivity.

---

## 📁 Folder Structure

```
fullstack-chat-app/
├── backend/
│   └── src/
│       ├── controllers/       # Auth, message, AI, group, memory
│       ├── lib/               # DB, Cloudinary, Socket.io, translate utils
│       ├── middleware/        # JWT auth middleware
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express route definitions
│       └── index.js           # App entry point
│
├── frontend/
│   └── src/
│       ├── components/        # ChatContainer, Sidebar, AiMemoryChat, etc.
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Axios instance, utils
│       ├── pages/             # Home, Login, SignUp, Profile, Settings
│       ├── store/             # Zustand stores (auth, chat, group, memory, theme)
│       └── App.jsx
│
├── render.yaml                # Render deployment blueprint
├── package.json               # Root scripts (build & start for Render)
└── .env.example               # Environment variable template
```

---

## 📦 Local Setup

### Prerequisites
- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- MongoDB Atlas account
- Cloudinary account
- Google Gemini API key

### 1. Clone the repo
```bash
git clone https://github.com/ahsan4449/fullstack-chat-app
cd fullstack-chat-app
```

### 2. Install dependencies
```bash
# Install root + backend + frontend deps
pnpm install
pnpm --dir backend install
pnpm --dir frontend install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>
JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

### 4. Run the development servers

```bash
# Terminal 1 — Backend (port 5001)
pnpm --dir backend run dev

# Terminal 2 — Frontend (port 5173)
pnpm --dir frontend run dev
```

---

## 🚀 Deploying to Render

1. Push the repo to GitHub
2. On [render.com](https://render.com) → **New Web Service** → connect your GitHub repo
3. Set the following:
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm run start`
4. Add all environment variables from `.env.example` in the Render dashboard
5. Set `FRONTEND_URL` to your Render app URL (e.g. `https://synctalk-qas1.onrender.com`)
6. Allow all IPs (`0.0.0.0/0`) in MongoDB Atlas → Network Access

---

## 🔐 Authentication Flow

1. User signs up / logs in → backend issues a signed **JWT**
2. JWT stored in **HttpOnly cookie** (XSS-safe)
3. Protected routes verified via auth middleware
4. Socket.io connection established post-authentication using `userId` from the query string

---

## 🧑‍💼 Author

**Ahsan Mohd**  
🎓 Computer Science & Engineering  
🔗 [LinkedIn](https://www.linkedin.com/in/ahsan-mohd-964002261/)  
📧 ahsanmohd4449@gmail.com

---

## 📝 License

This project is licensed under the **MIT License**.
