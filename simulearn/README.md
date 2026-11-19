# SimuLearn

AI yordamida ilmiy tajriba o'tkazish platformasi. Hisob-kitoblar `backend/app/simulation/registry.py`
dagi deterministik modellar orqali bajariladi; AI faqat savolni modelga moslashtiradi.

## Ishga tushirish

### 1) Backend (Python 3.11+)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
# .env ichida JWT_SECRET ni almashtiring
uvicorn app.main:app --reload --port 8000
```
API hujjatlari: http://localhost:8000/docs

### 2) Frontend (Node 18+)
```bash
cd frontend
npm install
npm run dev
```
Brauzer: http://localhost:5173 (so'rovlar `/api` orqali 8000-portga yo'naltiriladi).

## PostgreSQL
`.env` da: `DATABASE_URL=postgresql+psycopg://user:parol@localhost:5432/simulearn`
(standart: SQLite, o'rnatish talab qilinmaydi).

## AI (ixtiyoriy)
`.env` ga `ANTHROPIC_API_KEY` yozing. Kalit faqat backend'da turadi. Kalitsiz qoidalar ishlaydi.

## Yangi model qo'shish
`registry.py` da `run` va `analyze` funksiyalarini yozib, `MODELS` ro'yxatiga `SimModel(...)` qo'shing.
Frontend sliderlar, grafik va tahlil shu metadata'dan o'zi quriladi.

## Hali qilinmagan
Email tasdiqlash va parolni tiklash, Alembic migratsiyalari, UZ/EN/RU (i18next), Plotly grafiklari,
matematika/kimyo modellari, progress sahifasi, o'qituvchi paneli, testlar.
