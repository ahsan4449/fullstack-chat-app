
# 💬 REAL-Time-Chat-App Chat App

A real-time chat application built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) and **WebSocket** for live communication. The app supports **authentication**, **authorization**, and **individual user chats** — all bundled in a clean, responsive UI.

---

## 🚀 Features

- ✅ User Registration & Login (with JWT authentication)
- 🔐 Authorization for protected routes
- 💬 Real-time one-on-one messaging using WebSockets (via `socket.io`)
- 📃 Chat history persistence with MongoDB
- 🌐 RESTful API backend
- 💡 React-based frontend with state management (via Context API or Redux)
- 🔄 Auto-refresh and live status updates
- ⚙️ Backend error handling and input validation

---


## 🧑‍💻 Tech Stack

| Layer       | Technology                             |
|-------------|-----------------------------------------|
| Frontend    | React.js, Axios, Context API/Redux      |
| Backend     | Node.js, Express.js                     |
| Database    | MongoDB + Mongoose                      |
| Real-Time   | Socket.io (WebSocket)                   |
| Auth        | JSON Web Tokens (JWT), Bcrypt           |
| Styling     | Tailwind                                |
| Deployment  | Render                                  |

---

##live link 
https://synctalk-qas1.onrender.com

## 📦 Installation & Setup

1. **Clone the repo**

```bash
git clone https://github.com/ahsan4449/fullstack-chat-app
cd fullstack-chat-app
```

2. **Install dependencies**

```bash
# For backend
cd backend
npm install

# For frontend
cd frontend
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `server` directory and add the following:

```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. **Run the app**

```bash
# Run backend
cd server
npm run dev

# Run frontend
cd ../client
npm start
```

---

## 📁 Folder Structure

```
Real-Time-Chat-App/
│
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── utils/
│       └── ...
│
├── server/          # Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── ...
│
└── screenshots/     # App screenshots
```

---

## 🔐 Authentication Flow (Brief)

1. User signs up or logs in — backend issues JWT.
2. JWT stored in localStorage or HttpOnly cookies.
3. Protected routes validated using middleware in backend.
4. WebSocket connection established post-authentication.

---

## 📈 Future Improvements

- Group chats and media sharing 📷
- Online/offline user indicators 🟢
- Push notifications 🔔
- Dockerization & CI/CD pipeline 🐳

---

## 🧑‍💼 Author

**Ahsan Mohd**  
🎓 Computer Science & Engineering  
🔗 [LinkedIn](https://www.linkedin.com/in/ahsan-mohd-964002261/)  
📧 ahsanmohd4449@gmail.com

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
