# 🚀 HabitForge: AI-Powered Habit Tracking Ecosystem

HabitForge is a next-generation, cloud-native habit tracking platform. Moving beyond simple MERN-stack CRUD operations, HabitForge employs a dedicated Python Machine Learning microservice to provide predictive behavioral analytics, calculating the statistical probability of a user completing a habit on any given day.

![HabitForge AI Dashboard](https://img.shields.io/badge/Architecture-MERN_%2B_Python_ML-blue)
![Deployment](https://img.shields.io/badge/Deployment-Vercel_%2B_Render-success)
![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-green)

---

## 🧠 Premium Architecture

HabitForge utilizes a decoupled, three-tier cloud architecture synchronized across **Vercel** and **Render**, leveraging **MongoDB Atlas** as the centralized data lake.

1. **Frontend (Vercel)**
   - **Tech:** React, Vite, TailwindCSS, Framer Motion
   - **Role:** Delivers a dynamic, Dark Mode-compatible SPA. Communicates strictly with the centralized Node.js proxy via `VITE_API_URL` interceptors.

2. **Backend Proxy (Render)**
   - **Tech:** Node.js, Express, Mongoose, JWT
   - **Role:** Handles core CRUD, JWT issuance, password hashing (bcrypt), and acts as a secure proxy to relay user data to the ML Service without exposing the mathematical endpoints publically.

3. **Machine Learning Engine (Render)**
   - **Tech:** Python, FastAPI, Scikit-Learn, Pandas
   - **Role:** An isolated behavioral analytics microservice. Connects directly to MongoDB Atlas to vectorize historical `HabitLog` data, utilizing **Random Forest Classification** to predict daily completion probabilities ("Likely", "At Risk").

---

## 🛠️ Machine Learning Prediction Engine

The core differentiator of HabitForge is its predictive capability. 

When the user queries the AI Insights panel, the data flow triggers:
1. The **Node Application** authenticates the JWT and wraps the `habitId` into a payload to the Python Service.
2. **FastAPI** executes `data_loader.py` to extract all historical timestamps from the Atlas Cluster.
3. Features are engineered on the fly: `rolling_7d_mean`, `current_streak`, `is_weekend`, `completion_hour_avg`.
4. The **Random Forest Classifier** (`joblib` pickled) assesses the vectors and returns a highly calculated percentage and outcome (e.g., `will_complete` with 64.8% probability).

*(If insufficient data or extreme mathematical variance is detected, the engine gracefully proxies an `insufficient_data` flag to avoid misleading the user).*

---

## 🚀 Cloud Deployment Variables

To host your own version of the HabitForge ecosystem, deploy the Repositories and inject the following strict Environment Variables:

### 1. Vercel (Frontend)
- `VITE_API_URL`: The exact URL of the deployed Node.js backend.

### 2. Render Node.js (Backend)
- `MONGO_URI`: The MongoDB Atlas string containing the target database (`...mongodb.net/habitforge?...`)
- `ALLOWED_ORIGINS`: The deployed Vercel URL to restrict extreme CORS access.
- `JWT_SECRET`: Secure cryptographic key for token signing.
- `ML_API_URL`: The exact URL of the deployed Python FastAPI ML Service.

### 3. Render Python (ML Service)
- `MONGO_URI`: Identical Atlas string to allow the engine raw data access.
- `PYTHON_VERSION`: Set to `3.10.0` or higher to ensure `scikit-learn` dependency matching.

---

## 📂 Local Development

Clone the monorepo and navigate to the respective folders to spin up the local environment.

**Frontend:**
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

**Backend:**
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

**ML Service:**
\`\`\`bash
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python api.py
\`\`\`
