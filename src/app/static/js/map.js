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
