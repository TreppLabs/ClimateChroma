from sqlalchemy import Column, Integer, String, Float, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Utility(Base):
    __tablename__ = "utilities"
    utility_id = Column(Integer, primary_key=True, index=True)
    utility_name = Column(String, index=True)

    plants = relationship("Plant", back_populates="utility")

class Plant(Base):
    __tablename__ = "plants"
    plant_code = Column(Integer, primary_key=True, index=True)  # Changed from id to plant_code
    plant_name = Column(String, index=True)
    latitude = Column(Float, index=True)
    longitude = Column(Float, index=True)
    utility_id = Column(Integer, ForeignKey("utilities.utility_id"))

    utility = relationship("Utility", back_populates="plants")

class Generator(Base):
    __tablename__ = "generators"
    plant_code = Column(Integer, ForeignKey("plants.plant_code"), primary_key=True)  # Changed from id to plant_code
    generator_id = Column(String, primary_key=True)
    technology = Column(String)
    nameplate_capacity_mw = Column(Float)
    status = Column(String)
    plant = relationship("Plant")
    __table_args__ = (
        PrimaryKeyConstraint('plant_code', 'generator_id'),
    )
