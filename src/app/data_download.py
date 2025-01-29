import os
import requests

def test_download():
    return "The data_download module is working correctly!"

import requests
import os

def hello_noaa():
    # Get the API token from the environment variable
    api_token = os.getenv("NOAA_API_TOKEN")

    if not api_token:
        raise ValueError("NOAA API token not found. Ensure the NOAA_API_TOKEN environment variable is set.")
    
    # API endpoint
    url = "https://www.ncei.noaa.gov/cdo-web/api/v2/datasets"
    
    # Headers
    headers = {
        "token": api_token
    }
    
    # Make the request
    response = requests.get(url, headers=headers)
    
    # Raise an error if the response status is not 200
    response.raise_for_status()

    # print(response.json())
    
    return response.json()

# Function to get NOAA stations by state code e.g. "CA"
def get_stations_by_state(state: str, limit=10):
    api_token = os.getenv("NOAA_API_TOKEN")
    if not api_token:
        raise ValueError("NOAA API token not found. Ensure the NOAA_API_TOKEN environment variable is set.")
    
    # Build the URL to query the NOAA API for stations in the given state
    url = f"https://www.ncei.noaa.gov/cdo-web/api/v2/stations?datasetid=GHCND&locationid=FIPS:{state}&limit={limit}"
    
    # Set the request headers with the API token
    headers = {'token': api_token}
    
    # Make the API request
    response = requests.get(url, headers=headers)
    
    # Check for successful response
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None


def get_stations_by_bbox(lon_min, lat_min, lon_max, lat_max, limit=10):
    """
    Fetches stations within a bounding box (lat/lon).
    
    Parameters:
        lon_min, lat_min, lon_max, lat_max (float): Bounding box for latitude/longitude
        limit (int): Limit on number of stations to return
        
    Returns:
        dict: JSON response from the API containing station data
    """
    # Ensure the API token is set in your environment
    api_token = os.getenv("NOAA_API_TOKEN")
    if not api_token:
        raise ValueError("NOAA API token not found. Ensure the NOAA_API_TOKEN environment variable is set.")
    
    # Set headers with API token
    headers = {
        "token": api_token
    }
    

    # Define the URL with bounding box and limit
    url = f"https://www.ncei.noaa.gov/cdo-web/api/v2/stations?datasetid=GHCND&extent={lat_min},{lon_min},{lat_max},{lon_max}&limit={limit}"
    
    # Make the API request
    response = requests.get(url, headers=headers)

    print(f"NOAA response for station request: {response.json()}")
    
    # Check for valid response
    if response.status_code == 200:
        return response.json()  # Return JSON data if successful
    else:
        raise ValueError(f"Error {response.status_code}: {response.text}")

def get_weather_by_station_id(station_id, start_date, end_date, limit=1000):
    """
    Fetch weather data for a single station within a specified date range.

    Args:
        station_id (str): NOAA station ID (e.g., "GHCND:USW00023174").
        start_date (str): Start date in "YYYY-MM-DD" format.
        end_date (str): End date in "YYYY-MM-DD" format.
        limit (int): Maximum number of results per API call (default: 1000).

    Returns:
        list: Weather data for the station as a list of dictionaries.
    """
    import os
    import requests

    api_token = os.getenv("NOAA_API_TOKEN")
    if not api_token:
        raise ValueError("NOAA API token not found. Ensure the NOAA_API_TOKEN environment variable is set.")

    headers = {"token": api_token}
    base_url = "https://www.ncei.noaa.gov/cdo-web/api/v2/data"
    
    weather_data = []

    # Prepare the query parameters
    params = {
        "datasetid": "GHCND",
        "startdate": start_date,
        "enddate": end_date,
        "stationid": station_id,
        "limit": limit,
        "datatypeid": "PRCP",  # Only request average temperature data
        "units": "metric"  # Ensure the units are in metric
    }

    # this worked form command line, although that station returned TMIN/TMAX
        # curl -X GET "https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=GHCND:USW00094728&startdate=2023-01-01&enddate=2023-01-31&datatypeid=TMIN&datatypeid=TMAX&limit=1000" \
    # -H "token: YOUR_NOAA_API_TOKEN"
    # in SF station, there was no TMIN/TMAX, only PRCP:
        # https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=GHCND:US1CAMR0016&startdate=2023-01-01&enddate=2023-01-31&datatypeid=PRCP&limit=1000"

    print(f"base_url: {base_url}")
    print(f"headers: {headers}")
    print(f"params: {params}")

    # Make the API request
    response = requests.get(base_url, headers=headers, params=params)

    print(f"\nNOAA response for weather request: {response.json()}")
    if response.status_code == 200:
        weather_data.extend(response.json().get("results", []))
    else:
        print(f"Failed to fetch data for station {station_id}. HTTP Status: {response.status_code}")
        print("headers")
        print(response.headers)
        print("text")
        print(response.text)

    return weather_data

def hardcoded_temperature():
    return {"temperature": 72}
