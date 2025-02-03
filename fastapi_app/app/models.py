from sqlalchemy import Column, Integer, String, Float, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Utility(Base):
    __tablename__ = "utilities"
    utility_id = Column(Integer, primary_key=True, index=True)
    utility_name = Column(String, index=True)

class Plant(Base):
    __tablename__ = "plants"
    plant_code = Column(Integer, primary_key=True, index=True)
    utility_id = Column(Integer, ForeignKey("utilities.utility_id"))
    plant_name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    utility = relationship("Utility")

class Generator(Base):
    __tablename__ = "generators"
    plant_code = Column(Integer, ForeignKey("plants.plant_code"), primary_key=True)
    generator_id = Column(String, primary_key=True)
    technology = Column(String)
    nameplate_capacity_mw = Column(Float)
    status = Column(String)
    plant = relationship("Plant")
    __table_args__ = (
        PrimaryKeyConstraint('plant_code', 'generator_id'),
    )
