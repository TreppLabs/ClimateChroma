// Initialize the map and set its view
const map = L.map('map').setView([37.7749, -122.4194], 10); // San Francisco

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define marker icons
var redIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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

// ----- DATA FETCH FUNCTIONS -----

// Fetch weather stations (Flask API)
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
      weatherStationsLayer.clearLayers();
      const results = data.results || [];
      results.forEach(station => {
        const marker = L.marker([station.latitude, station.longitude]);
        marker.bindPopup(`<b>Station:</b> ${station.name}`);
        weatherStationsLayer.addLayer(marker);
      });
    })
    .catch(error => console.error('Error fetching weather stations:', error));
}

// Fetch power plants data (FastAPI)
const FASTAPI_BASE_URL = "http://127.0.0.1:8000";
function fetchPowerPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  console.log(`Fetching power plants: SW(${_southWest.lat}, ${_southWest.lng}), NE(${_northEast.lat}, ${_northEast.lng})`);
  fetch(`${FASTAPI_BASE_URL}/plants?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => {
      if (!response.ok) {
         return response.json().then(err => { throw new Error(err.detail); });
      }
      return response.json();
    })
    .then(data => {
      console.log('Power plants data:', data);
      plantsCluster.clearLayers();
      if (data && data.length > 0) {
        data.forEach(plant => {
          let techInfo = '';
          for (const [tech, cap] of Object.entries(plant.tech_breakdown)) {
            techInfo += `<br><b>${tech}</b>: ${cap.toFixed(1)} MW`;
          }
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

// Fetch heatmap data (also from FastAPI)
function fetchHeatmapPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  console.log(`Fetching heatmap data: SW(${_southWest.lat}, ${_southWest.lng}), NE(${_northEast.lat}, ${_northEast.lng})`);
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
          heatData.push([plant.latitude, plant.longitude, weight]);
        });
      }
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
      heatLayer = L.heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 17 });
      if (heatmapVisible) {
        map.addLayer(heatLayer);
      }
    })
    .catch(error => {
      console.error('Error fetching heatmap data:', error);
    });
}

// ----- UPDATE FUNCTIONS -----

function updateWeatherStations() {
  fetchWeatherStations(map.getBounds());
}

function updatePowerPlants() {
  fetchPowerPlants(map.getBounds());
}

function updateHeatmap() {
  fetchHeatmapPlants(map.getBounds());
}


// Fetch initial data when map loads and on moveend
map.on('load', () => {
  updateWeatherStations();
  updatePowerPlants();
  updateHeatmap();
});
map.on('moveend', () => {
  updateWeatherStations();
  updatePowerPlants();
  updateHeatmap();
});
updateWeatherStations();
updatePowerPlants();
updateHeatmap();

// ----- TOGGLE FUNCTIONS -----

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

// ----- CONTROL SECTION -----

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

// Attach event listeners for toggle buttons
document.getElementById('toggle-stations').addEventListener('click', toggleStations);
document.getElementById('toggle-generators').addEventListener('click', togglePowerPlants);
document.getElementById('toggle-heatmap').addEventListener('click', toggleHeatmap);

// ----- ADDITIONAL INTERACTIONS -----

// Example: Record user clicks (single click)
map.on('click', function(e) {
  console.log('You clicked the map at:', e.latlng);
  // Send click data to FastAPI endpoint on port 8000
  fetch('http://127.0.0.1:8000/clicks/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      latitude: e.latlng.lat,
      longitude: e.latlng.lng
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to record click');
    }
    return response.json();
  })
  .then(data => console.log('Click recorded:', data))
  .catch(error => console.error('Error recording click:', error));
});