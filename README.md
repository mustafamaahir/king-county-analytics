# King County Housing Analytics

AI-powered real estate analytics dashboard for King County, WA.
Built with Python/FastAPI (Render) + React/Recharts (Vercel) + Groq AI.

## Local Setup

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env
# Drop kc_house_data.csv into backend/data/
uvicorn main:app --reload
# API runs at http://localhost:8000
# Docs at  http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

## Deployment

### Backend → Render
1. Push repo to GitHub
2. New Web Service → connect repo → Root Dir: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env var: `GROQ_API_KEY`

### Frontend → Vercel
1. New Project → connect same repo → Root Dir: `frontend`
2. Add env var: `VITE_API_URL=https://your-render-url.onrender.com`
3. Deploy

## Tab Structure
| Tab | Route | ML Used |
|---|---|---|
| Problem Statement | static | none |
| Market Overview | /api/overview | descriptive stats |
| Price Trends | /api/trends | STL decomposition |
| Market Segments | /api/segments | K-Means clustering |
| Price Drivers | /api/drivers | Random Forest |
| Actions | /api/actions | Linear regression + forecast |
