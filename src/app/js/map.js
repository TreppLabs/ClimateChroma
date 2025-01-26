// Initialize the map and set its view
const map = L.map('map').setView([38.7749, -127.4194], 10); // San Francisco

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add a marker to the map
const marker = L.marker([37.7749, -122.4194]).addTo(map);

// Add a popup to the marker
marker.bindPopup('<b>Hello!</b><br>This is San Francisco.').openPopup();

// Function to make a dummy call to the backend
function fetchTemperature(lat, lon) {
  fetch(`/temperature?lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      if (data.temperature) {
        console.log('Temperature:', data.temperature);
      } else {
        console.error('Error:', data.error);
      }
    })
    .catch(error => {
      console.error('Error fetching temperature:', error);
    });
}

// Example call to fetch temperature for a specific location
fetchTemperature(37.7749, -122.4194); // San Francisco
