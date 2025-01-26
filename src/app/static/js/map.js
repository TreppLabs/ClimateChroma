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
marker.bindPopup('<b>Hello!</b><br>Thdis is San Francisco.').openPopup();

// Function to make a call to the backend to fetch historical temperature data
function fetchHistoricalTemperature(lat, lon) {
  console.log("fetchHistoricalTemperature:" + lat + " " + lon);
  fetch(`/temperature?lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      console.log('Historical Temperature:', data.temperature);
    })
    .catch(error => {
      console.error('Error fetching historical temperature:', error);
    });
}

console.log("calling fetchHistoricalTemperature");
// Example usage
fetchHistoricalTemperature(41.7749, -122.4194);
