# 🚀 HabitForge — Production Deployment Guide

This guide ensures a seamless, high-stakes migration of the HabitForge platform to a production-grade cloud environment using **Vercel** (Frontend), **Render** (Node.js Backend), and **Render** (Python ML Service).

---

## 🏗️ 1. Architecture Overview

| Service | Technology | Platform | Public URL (Example) |
| :--- | :--- | :--- | :--- |
| **Frontend** | React (Vite) | **Vercel** | `habitforge-app.vercel.app` |
| **Backend** | Node.js / Express | **Render** | `habitforge-api.onrender.com` |
| **ML Engine** | Python (FastAPI) | **Render** | `habitforge-ml.onrender.com` |
| **Database** | MongoDB Atlas | **Cloud** | (Existing Connection) |

---

## 🛠️ 2. Environment Variables Matrix

You **must** configure these variables in the respective platform dashboards.

### 🌐 Frontend (Vercel Dashboard)
*Set these in Settings > Environment Variables.*

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://habitforge-api.onrender.com` | Points to your Render Backend |

### ⚙️ Backend (Render Dashboard)
*Set these in the 'Environment' tab.*

| Variable | Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | Your Atlas Connection String |
| `JWT_SECRET` | `your_secret_key` | Secure key for authentication |
| `ML_API_URL` | `https://habitforge-ml.onrender.com` | Points to your Render ML Service |
| `ALLOWED_ORIGINS` | `https://habitforge-app.vercel.app` | Restricts access to your frontend |
| `PORT` | `5000` | Render will detect this automatically |

### 🤖 ML Service (Render Dashboard)
*Set these in the 'Environment' tab.*

| Variable | Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | Required for data-loader queries |
| `PYTHON_VERSION` | `3.13.0` | Ensures compatibility |

---

## 🚀 3. Step-by-Step Deployment

### Phase A: ML Service (Python Microservice)
1. **New > Web Service** on Render.
2. Select your repository.
3. **Name**: `habitforge-ml-service`.
4. **Root Directory**: `ml-service`.
5. **Build Command**: `pip install -r requirements.txt`.
6. **Start Command**: `python -m uvicorn api:app --host 0.0.0.0 --port $PORT`.
7. Once live, copy the URL for the next phase.

### Phase B: Backend Service (Node.js API)
1. **New > Web Service** on Render.
2. Select your repository.
3. **Name**: `habitforge-backend`.
4. **Root Directory**: `backend`.
5. **Build Command**: `npm install`.
6. **Start Command**: `npm start`.
7. Configure `ML_API_URL` using the URL from Phase A.
8. Once live, copy the URL for the next phase.

### Phase C: Frontend (React App)
1. **Import Project** on Vercel.
2. Select your repository.
3. **Root Directory**: `frontend`.
4. **Framework Preset**: Vite.
5. Configure `VITE_API_URL` using the URL from Phase B.
6. **Deploy**.

---

## 🛡️ 4. Post-Deployment Checklist
- [ ] **CORS**: Ensure the Vercel URL is added to the Backend's `ALLOWED_ORIGINS`.
- [ ] **IP Whitelisting**: Ensure Render's outbound IPs (or `0.0.0.0/0`) are added to MongoDB Atlas Network Access.
- [ ] **Auth Check**: Verify login/signup works across the cloud-hosted services.
- [ ] **AI Check**: Verify the 'AI Insights' page loads data from the ML microservice.

---
*Created by Antigravity — HabitForge Senior DevOps Support.*
