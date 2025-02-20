from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_app.app import models, schemas, database

router = APIRouter(prefix="/clicks", tags=["clicks"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.UserClickCreate)
def create_user_click(click: schemas.UserClickCreate, db: Session = Depends(get_db)):
    db_click = models.UserClick(latitude=click.latitude, longitude=click.longitude)
    db.add(db_click)
    db.commit()
    db.refresh(db_click)
    return db_click