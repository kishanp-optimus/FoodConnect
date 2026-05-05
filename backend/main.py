from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import database and models
from database.database import init_db, Base, engine
from routers import auth, food, orders, chat, notifications

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FoodConnect API...")
    init_db()
    logger.info("Database initialized successfully!")
    yield
    # Shutdown (if needed)
    logger.info("Shutting down FoodConnect API...")

# Create FastAPI app
app = FastAPI(
    title="FoodConnect API",
    description="API for FoodConnect - Share Food, Connect Hearts",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for LAN access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files for images
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

# Include routers
app.include_router(auth.router)
app.include_router(food.router)
app.include_router(orders.router)
app.include_router(chat.router)
app.include_router(notifications.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to FoodConnect API",
        "tagline": "Share Food. Connect Hearts.",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
