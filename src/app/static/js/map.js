// filepath: /Users/jimruppert/Projects/ClimateChroma/src/app/static/js/map.js
// Initialize the map and set its view
const map = L.map('map').setView([37.7749, -122.4194], 10); // San Francisco

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add a marker to the map
const marker = L.marker([37.7749, -122.4194]).addTo(map);

// Add a popup to the marker
marker.bindPopup('<b>Hello!</b><br>This is San Francisco.').openPopup();

// Function to make a call to the backend to fetch weather stations within the current map region
function fetchWeatherStations(bounds) {
  const { _southWest, _northEast } = bounds;
  fetch(`/weather-stations?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => response.json())
    .then(data => {
      const results = data.results || data; // Extract results if present
      console.log('Weather Stations:', results);
      results.forEach(station => {
        console.log(`Station: ${station.name}, Location: (${station.latitude}, ${station.longitude})`);
      });
      results.forEach(station => {
        const stationMarker = L.marker([station.latitude, station.longitude]).addTo(map);
        stationMarker.bindPopup(`<b>Station ID:</b> ${station.id}<br><b>Name:</b> ${station.name}`);
      });
    }).catch(error => {
      console.error('Error fetching weather stations:', error);
    });
}

// Function to get the bounds of the map and fetch weather stations
function updateWeatherStations() {
  const bounds = map.getBounds();
  fetchWeatherStations(bounds);
}

// Fetch weather stations when the map is loaded
map.on('load', updateWeatherStations);

// Fetch weather stations when the map is moved (zoomed or panned)
map.on('moveend', updateWeatherStations);

// Trigger the initial weather stations fetch
updateWeatherStations();

// Function to make a call to the backend to fetch historical temperature data
function fetchTemperature(lat, lon) {
  fetch(`/temperature?lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      console.log('Response:', data);
      if (typeof data.precipitation === 'number') {
        console.log('Temperature(PRCP, LOL):', data.precipitation);
      } else {
        console.error('Error:', data.error);
      }
    })
    .catch(error => {
      console.error('Error fetching temperature:', error);
    });
}

// Function to get the center coordinates of the map and fetch temperature
function updateTemperature() {
  const center = map.getCenter();
  fetchTemperature(center.lat, center.lng);
}

// Fetch temperature when the map is loaded
map.on('load', updateTemperature);

// Fetch temperature when the map is moved (zoomed or panned)
map.on('moveend', updateTemperature);

// Trigger the initial temperature fetch
updateTemperature();
