from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ranking import router as ranking_router
from app.api.record import router as record_router
from app.api.participant import router as participant_router

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://owners-party-race-ranking.web.app",
        "https://owners-party-race-ranking.firebaseapp.com",
        "https://owners-party-race-ranking-frontend-346931705081.asia-northeast3.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ルートエンドポイント
@app.get("/")
def read_root():
    return {"message": "Race Ranking API is running."}


# APIルーターの組み込み
app.include_router(ranking_router)
app.include_router(record_router)
app.include_router(participant_router)
