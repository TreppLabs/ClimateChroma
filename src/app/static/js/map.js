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

// Layer groups for weather stations and power plants
const weatherStationsLayer = L.layerGroup().addTo(map);
const plantsCluster = L.markerClusterGroup();
map.addLayer(plantsCluster);
let heatLayer = null;
let markersVisible = true;
let heatmapVisible = false;

/* --- FUNCTIONS --- */

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

// Existing: Fetch power plants to update the marker clusters
// we specify full URL because we are using a different port for the FastAPI queries 
// as opposed to the Flask queries
const FASTAPI_BASE_URL = "http://127.0.0.1:8000";


function fetchPowerPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  console.log(`Fetching power plants with bounds: SW(${_southWest.lat}, ${_southWest.lng}), NE(${_northEast.lat}, ${_northEast.lng})`);
  fetch(`${FASTAPI_BASE_URL}/plants?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.detail); });
      }
      return response.json();
    })
    .then(data => {
      console.log('Power plants data:', data);
      plantsCluster.clearLayers(); // Clear existing markers
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

// New: Fetch data for the heatmap layer
function fetchHeatmapPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  console.log(`Fetching heatmap data with bounds: SW(${_southWest.lat}, ${_southWest.lng}), NE(${_northEast.lat}, ${_northEast.lng})`);
  fetch(`${FASTAPI_BASE_URL}/plants?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.detail); });
      }
      return response.json();
    })
    .then(data => {
      let heatData = [];
      if (data && data.length > 0) {
        data.forEach(plant => {
          let weight = plant.total_capacity_mw || 0;
          // Modify weight if needed for visualization scaling
          heatData.push([plant.latitude, plant.longitude, weight]);
        });
      }
      // Remove previous heatLayer if it exists
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
      // Create a new heatLayer using Leaflet.heat
      heatLayer = L.heatLayer(heatData, {radius: 25, blur: 15, maxZoom: 17});
      // Only add the layer if the heatmap toggle is active
      if (heatmapVisible) {
        map.addLayer(heatLayer);
      }
    })
    .catch(error => {
      console.error('Error fetching heatmap data:', error);
    });
}

// Toggle functions for marker clusters and heatmap
function togglePowerPlants() {
  if (markersVisible) {
    map.removeLayer(plantsCluster);
    markersVisible = false;
  } else {
    map.addLayer(plantsCluster);
    markersVisible = true;
    // Optionally update markers with current bounds:
    fetchPowerPlants(map.getBounds());
  }
}

function toggleHeatmap() {
  if (heatmapVisible) {
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }
    heatmapVisible = false;
  } else {
    // Activate heatmap toggle and fetch data.
    heatmapVisible = true;
    fetchHeatmapPlants(map.getBounds());
  }
}

// Update data on map movement if the corresponding layers are visible.
map.on('moveend', function() {
  const bounds = map.getBounds();
  if (markersVisible) {
    fetchPowerPlants(bounds);
  }
  if (heatmapVisible) {
    fetchHeatmapPlants(bounds);
  }
});

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
const controlSection = L.control({ position: 'topright' });
controlSection.onAdd = function () {
  const div = L.DomUtil.create('div', 'control-section');
  div.innerHTML = `
    <button id="toggle-stations">Toggle Stations</button>
    <button id="toggle-generators">Toggle Generators</button>
    <button id="toggle-heatmap">Toggle Capacity Heatmap</button>
  `;
  return div;
};
controlSection.addTo(map);

function toggleStations() {
  if (map.hasLayer(weatherStationsLayer)) {
    map.removeLayer(weatherStationsLayer);
  } else {
    map.addLayer(weatherStationsLayer);
  }
}

function togglePowerPlants() {
  if (markersVisible) {
    map.removeLayer(plantsCluster);
    markersVisible = false;
  } else {
    map.addLayer(plantsCluster);
    markersVisible = true;
    // Optionally update markers for current bounds
    fetchPowerPlants(map.getBounds());
  }
}

function toggleHeatmap() {
  if (heatmapVisible) {
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }
    heatmapVisible = false;
  } else {
    heatmapVisible = true;
    fetchHeatmapPlants(map.getBounds());
  }
}

// Event listeners for the buttons:
document.getElementById('toggle-stations').addEventListener('click', toggleStations);
document.getElementById('toggle-generators').addEventListener('click', togglePowerPlants);
document.getElementById('toggle-heatmap').addEventListener('click', toggleHeatmap);