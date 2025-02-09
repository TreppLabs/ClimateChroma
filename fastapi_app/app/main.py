from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship

from fastapi_app.app import schemas
from fastapi_app.app.routers import clicks
from . import models, database
import logging
from typing import List

# logging.basicConfig(level=logging.INFO, format='[FastAPI] %(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5000"],  # Allow requests from the Flask server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the database tables
models.Base.metadata.create_all(bind=database.engine)

app.include_router(clicks.router)

# Dependency to get a database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health_check(db: Session = Depends(get_db)):  # changed from plants.get_db
    try:
        db.execute(text("SELECT 1"))
        return {"status": "success", "message": "Database connection successful"}
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        return {"status": "error", "message": f"Database connection failed: {e}"}
    
@app.get("/plants", response_model=List[schemas.PlantDetail])
def get_plants(southWestLat: float, southWestLng: float, northEastLat: float, northEastLng: float, db: Session = Depends(get_db)):
    try:
        # Join Plant, Utility, and left outer join Generator so that we can include generator data
        q = db.query(
            models.Plant,
            models.Utility.utility_name,
            models.Generator.generator_id, 
            models.Generator.technology,
            models.Generator.nameplate_capacity_mw
        ).join(
            models.Utility, models.Plant.utility_id == models.Utility.utility_id
        ).outerjoin(
            models.Generator, models.Plant.plant_code == models.Generator.plant_code
        ).filter(
            models.Plant.latitude >= southWestLat,
            models.Plant.latitude <= northEastLat,
            models.Plant.longitude >= southWestLng,
            models.Plant.longitude <= northEastLng
        )
        results = q.all()
        if not results:
            logging.warning("No plants found within the specified bounds.")
            raise HTTPException(status_code=404, detail="No plants found")
        
        plants_dict = {}

        # First, accumulate capacities per plant and technology.
        for plant, utility_name, generator_id, technology, capacity in results:
            pcode = plant.plant_code
            if pcode not in plants_dict:
                plants_dict[pcode] = {
                    "plant_code": plant.plant_code,
                    "plant_name": plant.plant_name,
                    "latitude": plant.latitude,
                    "longitude": plant.longitude,
                    "utility_name": utility_name,
                    "tech_breakdown": {},  # will store summed capacities per technology
                    "total_capacity_mw": 0.0,
                }
            if technology is not None:
                # Initialize the technology sum if not present
                if technology not in plants_dict[pcode]["tech_breakdown"]:
                    plants_dict[pcode]["tech_breakdown"][technology] = 0.0
                # Add the capacity for that technology
                plants_dict[pcode]["tech_breakdown"][technology] += capacity or 0.0

        # Then, compute total capacity per plant from the summed technology breakdown.
        for pcode, plant_data in plants_dict.items():
            plant_data["total_capacity_mw"] = sum(plant_data["tech_breakdown"].values())

        # Return the list of aggregated plant records.
        return list(plants_dict.values())
    except Exception as e:
        logging.error(f"Error querying plants: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
