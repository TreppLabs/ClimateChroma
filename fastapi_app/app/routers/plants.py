from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging
from .. import models, schemas, database

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

# NOTE: this function does not get called, but if we delete it we get errors.
# the functoin get_plants() in ../main.py is called instead.
# someday figure this out and this up
@router.get("/", response_model=List[schemas.Plant])
def get_plants(southWestLat: float, southWestLng: float, northEastLat: float, northEastLng: float, db: Session = Depends(get_db)):
    logging.info(f"Querying plants within bounds: SW({southWestLat}, {southWestLng}), NE({northEastLat}, {northEastLng})")
    try:
        plants = [
            {"plant_name": "Plant C", "latitude": 37.7649, "longitude": -122.4194, "utility_name": "Utility A"},
            {"plant_name": "Plant D", "latitude": 37.7944, "longitude": -122.2711, "utility_name": "Utility B"}
        ]
        # plants = db.query(models.Plant).filter(
        #     models.Plant.latitude >= southWestLat,
        #     models.Plant.latitude <= northEastLat,
        #     models.Plant.longitude >= southWestLng,
        #     models.Plant.longitude <= northEastLng
        # ).all()
        if not plants:
            logging.warning("No plants found within the specified bounds.")
            raise HTTPException(status_code=404, detail="No plants found")
        return plants
    except Exception as e:
        logging.error(f"Error querying plants: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
