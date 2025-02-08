from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

# Update the connection string to remove the password
SQLALCHEMY_DATABASE_URL = "postgresql://postgres@127.0.0.1:5432/climatechroma"

# Add detailed logging with a prefix
# logging.basicConfig(level=logging.INFO, format='[FastAPI] %(asctime)s - %(levelname)s - %(message)s')
# logging.info(f"Connecting to database at {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
# engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Confirm database connection
try:
    with engine.connect() as connection:
        logging.info("Database connection successful.")
except Exception as e:
    logging.error(f"Database connection failed: {e}")
