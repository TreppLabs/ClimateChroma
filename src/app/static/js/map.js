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

// Layer groups for weather stations and generators
const weatherStationsLayer = L.layerGroup().addTo(map);
const generatorsLayer = L.layerGroup();

// Function to make a call to the backend to fetch weather stations within the current map region
function fetchWeatherStations(bounds) {
  const { _southWest, _northEast } = bounds;
  fetch(`/weather-stations?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('No weather stations found');
      }
      return response.json();
    })
    .then(data => {
      const results = data.results; // Extract results if present
      weatherStationsLayer.clearLayers(); // Clear existing markers
      if (results && results.length > 0) {
        results.forEach(station => {
          const stationMarker = L.marker([station.latitude, station.longitude]).addTo(weatherStationsLayer);
          stationMarker.bindPopup(`<b>Station ID:</b> ${station.id}<br><b>Name:</b> ${station.name}`);
        });
      } else {
        console.log('No weather stations found in the current map region.');
      }
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

// Add control section for toggling layers
const controlSection = L.control({ position: 'bottomright' });

controlSection.onAdd = function () {
  const div = L.DomUtil.create('div', 'control-section');
  div.innerHTML = `
    <button id="toggle-stations">Toggle Stations</button>
  `;
  console.log('Control section added to the map'); // Debugging output
  return div;
};

controlSection.addTo(map);

// Event listener for toggling weather stations
document.getElementById('toggle-stations').addEventListener('click', () => {
  if (map.hasLayer(weatherStationsLayer)) {
    map.removeLayer(weatherStationsLayer);
  } else {
    map.addLayer(weatherStationsLayer);
    updateWeatherStations(); // Fetch stations again if layer is re-enabled
  }
});


