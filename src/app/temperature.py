from flask import Blueprint, request, jsonify
import os
import requests
import logging

temperature_bp = Blueprint('temperature', __name__)

def create_bbox(lat, lon):
    """
    Create a 1-degree square bounding box around the given latitude and longitude.
    """
    lat = float(lat)
    lon = float(lon)
    return f"{lat-0.5},{lon-0.5},{lat+0.5},{lon+0.5}"

@temperature_bp.route('/temperature')
def temperature():
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    print(f"Received request with lat: {lat}, lon: {lon}")

    if not lat or not lon:
        logging.error("Latitude and longitude are required")
        return jsonify({"error": "Latitude and longitude are required"}), 400

    api_token = os.getenv("NOAA_API_TOKEN")
    if not api_token:
        logging.debug(f"Environment variables: {os.environ}")
        logging.error("NOAA API token not found")
        return jsonify({"error": "NOAA API token not found"}), 500

    headers = {"token": api_token}
    bbox = create_bbox(lat, lon)  # Use the bbox function
    url = f"https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&startdate=2022-01-01&enddate=2022-01-01&extent={bbox}&limit=1"
    
    print(f"Requesting data with URL: {url}")

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return jsonify({"error": f"Request failed: {e}"}), 500

    try:
        data = response.json()
    except ValueError as e:
        logging.error(f"Error parsing JSON response: {e}")
        return jsonify({"error": "Error parsing JSON response"}), 500

    if data.get("results"):
        print(f"data: {data}")
        temperature = data["results"][0].get("value")
        return jsonify({"temperature": temperature})
    else:
        logging.error("No temperature data found")
        return jsonify({"error": "No temperature data found"}), 404