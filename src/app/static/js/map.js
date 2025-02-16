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
let stationsVisible = true;
let markersVisible = true;
let heatmapVisible = false;

L.control.mousePosition().addTo(map);

// Global variable to store plants data returned from FastAPI
var plantsData = [];

// Helper to get selected technologies from the checkboxes
function getSelectedTechs() {
  const checkboxes = document.querySelectorAll('#tech-checkboxes input[type="checkbox"]');
  return Array.from(checkboxes)
              .filter(cb => cb.checked)
              .map(cb => cb.value);
}

// Render plant markers based on the selected technology filter.
// If no technologies are selected, show all plants with all tech info.
// Otherwise, only show plants that contain at least one of the selected technologies,
// and display in their popup only the capacities of those techs.
function renderPlantMarkers() {
  plantsCluster.clearLayers();
  const selectedTech = getSelectedTechs();
  plantsData.forEach(plant => {
    // Determine if the plant has any tech that matches the filter.
    const plantTechs = Object.keys(plant.tech_breakdown);
    if (selectedTech.length > 0 && !selectedTech.some(tech => plantTechs.includes(tech))) {
      // Skip this plant if no match
      return;
    }
    
    let techInfo = '';
    let filteredTech = {};
    if (selectedTech.length > 0) {
      for (const [tech, cap] of Object.entries(plant.tech_breakdown)) {
        if (selectedTech.includes(tech)) {
          filteredTech[tech] = cap;
        }
      }
    } else {
      filteredTech = plant.tech_breakdown;
    }
    
    if (Object.keys(filteredTech).length > 0) {
      techInfo = `<br>Total Capacity: ${plant.total_capacity_mw.toFixed(1)} MW`;
      for (const [tech, cap] of Object.entries(filteredTech)) {
        techInfo += `<br><b>${tech}</b>: ${cap.toFixed(1)} MW`;
      }
    }
    
    const marker = L.marker([plant.latitude, plant.longitude], { icon: greenIcon });
    marker.bindPopup(`<b>Plant Name:</b> ${plant.plant_name}<br><b>Utility:</b> ${plant.utility_name}${techInfo}`);
    plantsCluster.addLayer(marker);
  });
}

// Function to render the heatmap based on filtered plants data.
function renderHeatmap() {
  // Remove the existing heatLayer if present.
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }
  
  const selectedTech = getSelectedTechs();
  let heatPoints = [];
  plantsData.forEach(plant => {
    const plantTechs = Object.keys(plant.tech_breakdown);
    // If a tech filter is active and the plant does not contain any of the selected techs, skip it.
    if (selectedTech.length > 0 && !selectedTech.some(tech => plantTechs.includes(tech))) {
      return;
    }
    
    let weight = 0;
    if (selectedTech.length > 0) {
      // Sum up only the capacities of the selected technologies.
      for (const [tech, cap] of Object.entries(plant.tech_breakdown)) {
        if (selectedTech.includes(tech)) {
          weight += cap;
        }
      }
    } else {
      // If no filter is applied, use the plant's total capacity.
      weight = plant.total_capacity_mw;
    }
    
    // If the weight is 0, you may want to skip it.
    if (weight > 0) {
      heatPoints.push([plant.latitude, plant.longitude, weight]);
    }
  });
  
  // Create the heatLayer using the filtered points.
  heatLayer = L.heatLayer(heatPoints, {
    radius: 25,
    blur: 15,
    maxZoom: 17
  }).addTo(map);
}

// Toggle the display of the technologies panel.
document.getElementById('toggle-tech-btn').addEventListener('click', function() {
  let container = document.getElementById('tech-selector-container');
  container.style.display = (container.style.display === 'none' || container.style.display === '') ? 'block' : 'none';
});

// Apply the filter when the "Apply Filter" button is clicked.
document.getElementById('apply-tech-filter').addEventListener('click', function() {
  renderPlantMarkers();
  renderHeatmap();
  // Hide panel after applying
  document.getElementById('tech-selector-container').style.display = 'none';
});

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

// Global variable that holds the fetched plants data.
var plantsData = [];

// Fetch power plants and store the resulting data in plantsData.
function fetchPowerPlants(bounds) {
  const { _southWest, _northEast } = bounds;
  return fetch(`${FASTAPI_BASE_URL}/plants?southWestLat=${_southWest.lat}&southWestLng=${_southWest.lng}&northEastLat=${_northEast.lat}&northEastLng=${_northEast.lng}`)
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.detail); });
      }
      return response.json();
    })
    .then(data => {
      plantsData = data;
      return data;
    })
    .catch(error => {
      console.error('Error fetching power plants:', error);
    });
}

// ----- UPDATE FUNCTIONS -----

async function updateMapLayers() {
  if (stationsVisible) {
    fetchWeatherStations(map.getBounds()); // Fetch weather stations also renders the layer
  } else {
    weatherStationsLayer.clearLayers();
  }
  // Update power plant layers only if markers or heatmap are visible.
  if (markersVisible || heatmapVisible) {
    await fetchPowerPlants(map.getBounds());
    // Update plant markers layer.
    if (markersVisible) {
      renderPlantMarkers();
    } else {
      plantsCluster.clearLayers();
    }
    // Update heatLayer.
    if (heatmapVisible) {
      renderHeatmap();
    } else {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    }
  } else {
    // Neither markers nor heatmap are active—ensure corresponding layers are removed.
    plantsCluster.clearLayers();
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }
  }
}

// Fetch initial data when map loads and on moveend
map.on('load', () => {
  updateMapLayers();
});
map.on('moveend', () => {
  updateMapLayers();
});
updateMapLayers();

// ----- TOGGLE FUNCTIONS -----

function toggleStations() {
  stationsVisible = !stationsVisible;
  updateMapLayers();
}

function togglePowerPlants() {
  markersVisible = !markersVisible;
  updateMapLayers();
}

function toggleHeatmap() {
  heatmapVisible = !heatmapVisible; 
  updateMapLayers();
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

// Record user clicks just so we can
map.on('click', function(e) {
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
  .then()
  .catch(error => console.error('Error recording click:', error));
});