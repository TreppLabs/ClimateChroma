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

// When a group checkbox is toggled, select/deselect all child tech checkboxes.
document.querySelectorAll('.group-checkbox').forEach(groupCheckbox => {
  groupCheckbox.addEventListener('change', function () {
    const group = this.getAttribute('data-group');
    const checked = this.checked;
    document.querySelectorAll(`.tech-checkbox[data-group="${group}"]`).forEach(techCheckbox => {
      techCheckbox.checked = checked;
    });
  });
});

// Optionally, if an individual tech checkbox is changed, update the corresponding group checkbox
// if all child checkboxes are selected, mark the group as checked.
document.querySelectorAll('.tech-checkbox').forEach(techCheckbox => {
  techCheckbox.addEventListener('change', function () {
    const group = this.getAttribute('data-group');
    const groupCheckbox = document.querySelector(`.group-checkbox[data-group="${group}"]`);
    const allChecked = Array.from(document.querySelectorAll(`.tech-checkbox[data-group="${group}"]`))
      .every(checkbox => checkbox.checked);
    groupCheckbox.checked = allChecked;
  });
});

// Update getSelectedTechs() to collect the values from the tech-checkboxes.
function getSelectedTechs() {
  const selected = [];
  document.querySelectorAll('.tech-checkbox:checked').forEach(checkbox => {
    selected.push(checkbox.value);
  });
  return selected;
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

// Global heatmap parameter defaults
var heatLayerRadius = 25;
var heatLayerBlur = 15;
var heatLayerMaxZoom = 17;

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
    radius: heatLayerRadius,
    blur: heatLayerBlur,
    maxZoom: heatLayerMaxZoom
  }).addTo(map);
}

const controlSection = L.control({ position: 'topright' });
controlSection.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'control-section');
  
  // Nest the heatmap options button and container in their own wrapper.
  div.innerHTML = `
    <div id="toggle-buttons">
      <button id="toggle-stations">Toggle Stations</button>
      <button id="toggle-generators">Toggle Generators</button>
      <button id="toggle-heatmap">Toggle Capacity Heatmap</button>
      <div id="heatmap-options-control" style="display: none;">
          <div id="heatmap-options-wrapper" style="float: right; margin-top: 5px;">
            <button id="heatmap-options-btn" style="float: right;">Heatmap Options</button>
 
            <div id="heatmap-options-container" style="display: none;">
              <h4>Heatmap Options</h4>
              <label>Radius:
                <input type="number" id="heat-radius" value="${heatLayerRadius}" min="1" max="50">
              </label><br>
              <label>Blur:
                <input type="number" id="heat-blur" value="${heatLayerBlur}" min="1" max="50">
              </label><br>
              <label>Max Zoom:
                <input type="number" id="heat-maxzoom" value="${heatLayerMaxZoom}" min="1" max="20">
              </label><br>
              <button id="update-heatmap-params">Update Heatmap</button>
            </div>
          </div?
      </div>
    </div>
  `;
  
  // Prevent clicks from propagating to the map.
  L.DomEvent.disableClickPropagation(div);
  return div;
};
controlSection.addTo(map);

// Attach event listeners for toggle buttons
document.getElementById('toggle-stations').addEventListener('click', toggleStations);
document.getElementById('toggle-generators').addEventListener('click', togglePowerPlants);
document.getElementById('toggle-heatmap').addEventListener('click', toggleHeatmap);

// Toggle heatmap options panel visibility when the "Heatmap Options" button is clicked.
document.getElementById('heatmap-options-btn').addEventListener('click', function() {
  const container = document.getElementById('heatmap-options-container');
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
});

// Update heatmap parameters and hide the options panel when "Update Heatmap" is clicked.
document.getElementById('update-heatmap-params').addEventListener('click', function() {
  heatLayerRadius = parseInt(document.getElementById('heat-radius').value, 10);
  heatLayerBlur = parseInt(document.getElementById('heat-blur').value, 10);
  heatLayerMaxZoom = parseInt(document.getElementById('heat-maxzoom').value, 10);

  if (heatmapVisible) {
    renderHeatmap();
  }
  // Hide the heatmap options panel.
  document.getElementById('heatmap-options-container').style.display = 'none';
});

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
  
  // Show or hide the heatmap options wrapper based on heatmapVisible.
  const optionsControl = document.getElementById('heatmap-options-control');
  if (heatmapVisible) {
    optionsControl.style.display = 'block';
  } else {
    optionsControl.style.display = 'none';
    // Also hide the options container if it's open.
    document.getElementById('heatmap-options-container').style.display = 'none';
  }
}


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