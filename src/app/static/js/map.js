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

// Function to make a call to the backend to fetch power plants within the current map region
function fetchPowerPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  console.log(`Fetching power plants with bounds: southWestLat=${_southWest.lat}, southWestLng=${_southWest.lng}, northEastLat=${_northEast.lat}, northEastLng=${_northEast.lng}`); // Debugging output
  fetch(`http://127.0.0.1:8000/plants?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
  // fetch(`http://127.0.0.1:8000/health`)
  .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.detail); });
      }
      return response.json();
    })
    .then(data => {
      console.log('Power plants data:', data); // Debugging output
      generatorsLayer.clearLayers(); // Clear existing markers
      if (data && data.length > 0) {
        data.forEach(plant => {
          const plantMarker = L.marker([plant.latitude, plant.longitude]).addTo(generatorsLayer);
          plantMarker.bindPopup(`<b>Plant Name:</b> ${plant.plant_name}<br><b>Utility:</b> ${plant.utility.utility_name}`);
        });
      } else {
        console.log('No power plants found in the current map region.');
      }
    }).catch(error => {
      console.error('Error fetching power plants:', error);
    });
}

// Function to get the bounds of the map and fetch weather stations and power plants
function updateWeatherStations() {
  const bounds = map.getBounds();
  fetchWeatherStations(bounds);
}

function updatePowerPlants() {
  const bounds = map.getBounds();
  fetchPowerPlants(bounds);
}

// Fetch data when the map is loaded
map.on('load', () => {
  updateWeatherStations();
  updatePowerPlants();
});

// Fetch data when the map is moved (zoomed or panned)
map.on('moveend', () => {
  updateWeatherStations();
  updatePowerPlants();
});

// Trigger the initial data fetch
updateWeatherStations();
updatePowerPlants();

// Add control section for toggling layers
const controlSection = L.control({ position: 'bottomright' });

controlSection.onAdd = function () {
  const div = L.DomUtil.create('div', 'control-section');
  div.innerHTML = `
    <button id="toggle-stations">Toggle Stations</button>
    <button id="toggle-generators">Toggle Generators</button>
  `;
  return div;
};

controlSection.addTo(map);

// Event listener for toggling weather stations
document.getElementById('toggle-stations').addEventListener('click', () => {
  if (map.hasLayer(weatherStationsLayer)) {
    map.removeLayer(weatherStationsLayer);
  } else {
    weatherStationsLayer.clearLayers(); // Clear existing markers
    map.addLayer(weatherStationsLayer);
    updateWeatherStations(); // Fetch stations again if layer is re-enabled
  }
});

// Event listener for toggling power plants
document.getElementById('toggle-generators').addEventListener('click', () => {
  if (map.hasLayer(generatorsLayer)) {
    map.removeLayer(generatorsLayer);
  } else {
    generatorsLayer.clearLayers(); // Clear existing markers
    map.addLayer(generatorsLayer);
    updatePowerPlants(); // Fetch plants again if layer is re-enabled
  }
});


