# 🎤 Poll Khoool - Real-Time Polling & Gamified Quizzes

Poll Khoool is a premium, full-stack interactive platform designed for live engagement. Whether you're hosting a corporate event, a classroom session, or a friendly competition, Poll Khoool provides a high-energy, "Kahoot-style" experience with real-time analytics and dynamic leaderboards.

![Hero Image](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000)

## 🚀 Key Features

- **⚡️ Real-Time Polling:** Create interactive polls and watch results roll in instantly with animated charts.
- **🎮 Gamified Quizzes:** Host competitive live quizzes with per-question timers, correct answers, and speed-based scoring.
- **🏆 Live Leaderboard:** Dynamic top-10 rankings that shuffle in real-time as participants answer.
- **📊 Interactive Analytics:** High-performance visualization engine using Recharts and WebSockets.
- **📱 QR Code Sharing:** Participants can join instantly by scanning a QR code or entering a 6-digit short code.
- **✨ Premium UI:** A stunning dark-themed interface built with Tailwind CSS, featuring glassmorphism and smooth animations.

## 🛠 Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons, Recharts, Socket.io-client.
- **Backend:** Node.js, Express, Socket.io.
- **Database:** MongoDB (Mongoose).
- **Security:** JWT Authentication, Bcryptjs.

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/poll-khoool.git
cd poll-khoool
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```
Run the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
```
Run the frontend:
```bash
npm run dev
```

## 🌍 Deployment

### Backend (Railway)
1. Link your GitHub repo to Railway.
2. Set the environment variables in the Railway dashboard.
3. Railway will automatically detect the `start` script and deploy.

### Frontend (Vercel)
1. Link your GitHub repo to Vercel.
2. Set the `VITE_API_URL` to your Railway backend URL.
3. Vercel will build the Vite app and deploy it as a Single Page Application (SPA).

## 📄 License
This project is licensed under the MIT License.

---
Built with ❤️ by Sameer.
