# HabitForge – AI-Driven Habit Transformation Platform

HabitForge is a premium, full-stack MERN (MongoDB, Express, React, Node.js) application designed to help users build and maintain life-changing habits through real-time tracking, advanced behavioral analytics, and ML-powered predictive insights.

## 🚀 Vision
Building habits is a data-driven journey. HabitForge combines the meticulous tracking of productivity apps with the intelligence of machine learning, creating a "FocusFlow" environment where consistency is measured, forecasted, and rewarded.

---

## ✨ Core Features

### 📊 Real-Time Dashboard
*   **Dynamic Stats**: Track your current streak, habit completion scores, and active habit counts.
*   **Consistency Trajectory**: Interactive charts visualizing your performance over the last 7 or 30 days.
*   **Predictive Insights**: Real-time AI assessments (via XGBoost/Random Forest) forecasting your completion probability for today.

### ✅ Smart Habit Tracker
*   **One-Tap Tracking**: Quickly log completions for your personalized habits (Health, Work, Learning, Mindset).
*   **Live streaks**: Robust, date-grouped streak calculations that account for your historical consistency.
*   **AI Forecasts**: View a 7-day consistency forecast based on your past behavioral patterns.

### 📈 Advanced Analytics
*   **Effort Distribution**: Visualize which areas of your life are getting the most attention via pie charts.
*   **Consistency Trends**: Long-term area charts showing your monthly performance and growth velocity.
*   **Growth Trend**: Real-time comparison of your performance vs. the previous week (+/- %).

### 👤 Detailed User Profile
*   **Dynamic Identity**: Customizable profile with bio, image, and high-level performance metrics.
*   **Join Date Tracking**: Historical tracking of your journey since day one.
*   **Real-Time Stat Refresh**: On-the-fly recalculation of longest streaks and total completions.

---

## 🛠 Tech Stack

### Frontend
*   **React (Vite)**: Modern, ultra-fast component-based UI.
*   **Tailwind CSS**: Custom "FocusFlow Minimal" design system with glassmorphism and premium aesthetics.
*   **Framer Motion**: Smooth micro-animations and page transitions.
*   **Recharts**: High-performance data visualization.
*   **Lucide React**: Clean, consistent iconography.
*   **Axios**: Secure API communication with JWT interceptors.

### Backend
*   **Node.js & Express**: Scalable RESTful API architecture.
*   **MongoDB & Mongoose**: Flexible document-based data storage.
*   **JWT (JSON Web Tokens)**: Secure, stateless authentication.
*   **ML (Python/FastAPI)**: Supervised Classification (Habit Prediction) & ARIMA Time-Series (Consistency Forecasting).

---

## 📁 Project Structure

```text
habitforge/
├── backend/
│   ├── models/        # Mongoose Schema Definitions (User, Habit, HabitLog, etc.)
│   ├── controllers/   # Logic for Profile, Stats, and Habits
│   ├── routes/        # API Endpoints (Auth, Dashboard, Analytics, User, etc.)
│   ├── middleware/    # Security & Auth Guards
│   └── server.js      # Main Entry Point
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI Components (AIInsightsPanel, etc.)
│   │   ├── context/    # Global State (Auth)
│   │   ├── pages/      # View Components (Dashboard, Analytics, Profile, etc.)
│   │   └── layouts/    # Page Wrappers (MainLayout, AuthLayout)
├── ml/
│   ├── api.py         # FastAPI Inference Server
│   ├── models/        # Serialized ML Models (joblib)
│   └── scripts/       # Model Training & Data Preprocessing
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v24+)
*   MongoDB Instance (Local or Atlas)
*   Python 3.10+ (for ML services)

### Setup
1.  **Clone the repository**
2.  **Environment Configuration**:
    *   Create `.env` in `backend/` with `MONGO_URI`, `JWT_SECRET`, and `PORT=5000`.
3.  **Install Dependencies**:
    ```bash
    # Root
    npm install
    # Frontend/Backend
    cd frontend && npm install
    cd ../backend && npm install
    # ML
    cd ../ml && pip install -r requirements.txt
    ```
4.  **Run the Project**:
    ```bash
    # Run Backend (Port 5000)
    cd backend && npm start
    # Run Frontend (Port 5173)
    cd frontend && npm run dev
    # Run ML Service (Port 8000)
    cd ml && python api.py
    ```

---

## 🎨 Design Philosophy
HabitForge follows the **FocusFlow Minimal** design system:
*   **Clean Geometry**: Using 2xl and 3xl border radii for a soft, premium feel.
*   **Intelligent Visuals**: Color-coded success states that provide instant psychological feedback on performance.
*   **Anti-Clutter**: Information is layered using card-based architecture to reduce cognitive load.
