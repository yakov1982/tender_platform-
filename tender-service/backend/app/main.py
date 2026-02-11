from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routes import auth, tenders, bids, users, license


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Tender Procurement System",
    description="Система тендерных закупок предприятия",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tenders.router, prefix="/api")
app.include_router(bids.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(license.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Tender Procurement API", "docs": "/docs"}
