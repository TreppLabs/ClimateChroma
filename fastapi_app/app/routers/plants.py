from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
import logging

router = APIRouter(
    prefix="/plants",
    tags=["plants"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.Plant])
def get_plants(southWestLat: float, southWestLng: float, northEastLat: float, northEastLng: float, db: Session = Depends(get_db)):
    logging.info(f"Querying plants within bounds: SW({southWestLat}, {southWestLng}), NE({northEastLat}, {northEastLng})")
    logging.info("Attempting to query the database")
    logging.info(f"Querying plants within bounds: SW({southWestLat}, {southWestLng}), NE({northEastLat}, {northEastLng})")
    try:
        # plants = db.query(models.Plant).filter(
        #     models.Plant.latitude >= southWestLat,
        #     models.Plant.latitude <= northEastLat,
        #     models.Plant.longitude >= southWestLng,
        #     models.Plant.longitude <= northEastLng
        # ).all()
        plants = [
            {"plant_name": "Plant A", "latitude": 37.7749, "longitude": -122.4194, "utility_name": "Utility A"},
            {"plant_name": "Plant B", "latitude": 37.8044, "longitude": -122.2711, "utility_name": "Utility B"}
        ]
        if not plants:
            logging.warning("No plants found within the specified bounds.")
            raise HTTPException(status_code=404, detail="No plants found")
        return plants
    except Exception as e:
        logging.error(f"Error querying plants: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
