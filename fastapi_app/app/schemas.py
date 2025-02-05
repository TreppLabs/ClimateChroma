from pydantic import BaseModel
from typing import List, Optional, Dict

class UtilityBase(BaseModel):
    utility_id: int
    utility_name: str

class Utility(UtilityBase):
    class Config:
        orm_mode = True

class PlantBase(BaseModel):
    plant_code: int
    utility_id: int
    plant_name: str
    latitude: float
    longitude: float

class Plant(PlantBase):
    utility: Utility
    class Config:
        orm_mode = True

class PlantDetail(BaseModel):
    plant_code: int
    plant_name: str
    latitude: float
    longitude: float
    utility_name: str
    tech_breakdown: Dict[str, float]  # e.g., {"coal": 123.4, "solar": 45.6}
    total_capacity_mw: float

    class Config:
        orm_mode = True

class GeneratorBase(BaseModel):
    plant_code: int
    generator_id: str
    technology: str
    nameplate_capacity_mw: float
    status: str

class Generator(GeneratorBase):
    plant: Plant
    class Config:
        orm_mode = True
