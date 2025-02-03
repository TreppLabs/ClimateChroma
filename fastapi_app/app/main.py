from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from .routers import plants
from .database import engine, Base, SessionLocal
import logging

logging.basicConfig(level=logging.INFO, format='[FastAPI] %(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5000"],  # Allow requests from the Flask server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Perform a simple query to check the connection
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connection successful"}
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        return {"status": "error", "message": f"Database connection failed: {e}"}

@app.get("/plants")
def get_plants(southWestLat: float, southWestLng: float, northEastLat: float, northEastLng: float, db: Session = Depends(get_db)):
    logging.info(f"Handlling GET /plants with params: southWestLat={southWestLat}, southWestLng={southWestLng}, northEastLat={northEastLat}, northEastLng={northEastLng}")
    # ...existing code...
    plants = [
        {"plant_name": "Plant A", "latitude": 37.7749, "longitude": -122.4194, "utility_name": "Utility A"},
        {"plant_name": "Plant B", "latitude": 37.8044, "longitude": -122.2711, "utility_name": "Utility B"}
    ]
    return plants

app.include_router(plants.router)
