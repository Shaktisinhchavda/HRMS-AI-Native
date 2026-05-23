# HRMS AI-Native

Enterprise Human Resource Management System powered by local AI (Ollama).

## Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Unix:
# source venv/bin/activate

pip install -r requirements.txt
python seed.py
python run.py
```

Backend runs on `http://localhost:8000`. API docs available at `http://localhost:8000/docs`.

## Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Test Accounts

- Admin: `admin@hrms.local` / `admin123`
- HR Manager: `hr@hrms.local` / `hr123`
- Employee: `employee@hrms.local` / `emp123`
