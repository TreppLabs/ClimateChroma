#!/bin/bash

# Function to stop both Flask and FastAPI
function stop_servers {
    echo "Stopping servers..."
    # Kill all background jobs
    kill $(jobs -p)
    wait
}

# Trap termination signals to stop servers gracefully
trap stop_servers SIGINT SIGTERM

# Start Uvicorn for FastAPI
echo "Starting FastAPI with Uvicorn..."
uvicorn fastapi_app.app.main:app --host 127.0.0.1 --port 8000 --reload &

# Wait for Uvicorn to start
sleep 5

# Perform a health check
echo "Performing health check..."
curl http://127.0.0.1:8000/health

# Start Flask
echo "Starting Flask app..."
export FLASK_APP=src/app/app
flask run --host=127.0.0.1 --port=5000 &

# Wait for both processes to finish
wait
