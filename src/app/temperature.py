from flask import Blueprint, request, jsonify
import os
import requests
from .data_download import get_stations_by_bbox, get_weather_by_station_id


temperature_bp = Blueprint('temperature', __name__)

@temperature_bp.route('/temperature')
def temperature():
    print(f"in temperature, with args () {request.args}")
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    if not lat or not lon:
        return jsonify({"error": "Missing latitude or longitude"}), 400

    try:
        # Define a bounding box with a small buffer around the point
        buffer = 0.1  # Adjust the buffer size as needed
        lon_min = float(lon) - buffer
        lat_min = float(lat) - buffer
        lon_max = float(lon) + buffer
        lat_max = float(lat) + buffer

        # Get stations by bounding box
        stations = get_stations_by_bbox(lon_min=lon_min, lat_min=lat_min, lon_max=lon_max, lat_max=lat_max, limit=10)
        if not stations:
            return jsonify({"error": "No stations found"}), 404

        # Use the first station to get weather data
        station_id = stations['results'][0]['id']
        start_date = '2022-01-01'
        end_date = '2022-01-02'
        weather_data = get_weather_by_station_id(station_id, start_date=start_date, end_date=end_date)
        print(f"weather_data: {weather_data}")
        # temperature = weather_data.get('temperature', 'N/A')
        precipitation = weather_data[0]['value']
        return jsonify({"precipitation": precipitation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500