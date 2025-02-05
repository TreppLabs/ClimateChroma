// Initialize the map and set its view
const map = L.map('map').setView([37.7749, -122.4194], 10); // San Francisco

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// This allows red markers instead of the default blue ones
var redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png',
  iconSize: [25, 41], 
  iconAnchor: [12, 41], 
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
var greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});



// Layer groups for weather stations
const weatherStationsLayer = L.layerGroup().addTo(map);

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

// NEW: Create a MarkerClusterGroup for power plants and add it to the map:
const plantsCluster = L.markerClusterGroup();
map.addLayer(plantsCluster);

// Modify fetchPowerPlants to use the marker cluster group
function fetchPowerPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  console.log(`Fetching power plants with bounds: southWestLat=${_southWest.lat}, southWestLng=${_southWest.lng}, northEastLat=${_northEast.lat}, northEastLng=${_northEast.lng}`);
  fetch(`http://127.0.0.1:8000/plants?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.detail); });
      }
      return response.json();
    })
    .then(data => {
      console.log('Power plants data:', data);
      plantsCluster.clearLayers(); // clear existing markers
      if (data && data.length > 0) {
        data.forEach(plant => {
          // Build technology breakdown text
          let techInfo = '';
          for (const [tech, cap] of Object.entries(plant.tech_breakdown)) {
            techInfo += `<br><b>${tech}</b>: ${cap.toFixed(1)} MW`;
          }
          // Include total capacity
          techInfo = `<br>Total Capacity: ${plant.total_capacity_mw.toFixed(1)} MW` + techInfo;
    
          const plantMarker = L.marker([plant.latitude, plant.longitude], { icon: greenIcon });
          plantMarker.bindPopup(`<b>Plant Name:</b> ${plant.plant_name}<br><b>Utility:</b> ${plant.utility_name}${techInfo}`);
          plantsCluster.addLayer(plantMarker);
        });
      } else {
        console.log('No power plants found in the current map region.');
      }
    })
    .catch(error => {
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
  if (map.hasLayer(plantsCluster)) {
    map.removeLayer(plantsCluster);
  } else {
    plantsCluster.clearLayers(); // Clear existing markers
    map.addLayer(plantsCluster);
    updatePowerPlants(); // Fetch plants again if layer is re-enabled
  }
});


