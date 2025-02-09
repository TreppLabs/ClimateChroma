from flask import Blueprint, request, jsonify
import os
import requests
from .data_download import get_stations_by_bbox, get_weather_by_station_id

# API endpoints for weather data from NOAA API

weather_data_bp = Blueprint('weather', __name__)

@weather_data_bp.route('/weather-stations')
def weather_stations():
    south_west_lat = request.args.get('southWestLat')
    south_west_lng = request.args.get('southWestLng')
    north_east_lat = request.args.get('northEastLat')
    north_east_lng = request.args.get('northEastLng')

    if not south_west_lat or not south_west_lng or not north_east_lat or not north_east_lng:
        return jsonify({"error": "Missing bounding box coordinates"}), 400

    try:
        stations = get_stations_by_bbox(
            lon_min=float(south_west_lng),
            lat_min=float(south_west_lat),
            lon_max=float(north_east_lng),
            lat_max=float(north_east_lat),
            limit=100
        )
        if not stations:
            return jsonify({"message": "No stations found in the current map view"}), 200

        return jsonify(stations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Following is merely an example of how to fetch weather data for a given location
# not currenlty in use in the app
# the weather data coverage was not great, so we only return PRCP, as a proof of concept
@weather_data_bp.route('/weather')
def fetch_weather_info():
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
        precipitation = weather_data[0]['value']
        return jsonify({"precipitation": precipitation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500