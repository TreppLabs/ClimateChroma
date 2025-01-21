
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
