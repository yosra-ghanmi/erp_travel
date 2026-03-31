document.addEventListener('DOMContentLoaded', () => {
  // Initialize map
  const map = L.map('map').setView([34.0, 9.0], 6);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Layer groups
  const allServicesGroup = L.markerClusterGroup ? L.markerClusterGroup() : L.featureGroup().addTo(map);
  if (L.markerClusterGroup) map.addLayer(allServicesGroup);
  
  const itineraryGroup = L.featureGroup().addTo(map);
  const dayLayers = {};
  let routePolyline = null;
  let currentItinerary = null;

  // Icons
  const createIcon = (color, iconClass) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="${iconClass}"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  const icons = {
    'Hotel': createIcon('#e74c3c', 'fas fa-bed'),
    'Activity': createIcon('#f39c12', 'fas fa-camera'),
    'Restaurant': createIcon('#27ae60', 'fas fa-utensils'),
    'Transport': createIcon('#8e44ad', 'fas fa-bus'),
    'default': createIcon('#34495e', 'fas fa-map-marker-alt')
  };

  const getIconForType = (type) => {
    if (!type) return icons['default'];
    for (const key in icons) {
      if (type.toLowerCase().includes(key.toLowerCase())) return icons[key];
    }
    return icons['default'];
  };

  const getColorForType = (type) => {
    if (!type) return '#34495e';
    if (type.toLowerCase().includes('hotel')) return '#e74c3c';
    if (type.toLowerCase().includes('activity')) return '#f39c12';
    if (type.toLowerCase().includes('restaurant')) return '#27ae60';
    if (type.toLowerCase().includes('transport')) return '#8e44ad';
    return '#34495e';
  };

  const getIconClassForType = (type) => {
    if (!type) return 'fas fa-map-marker-alt';
    if (type.toLowerCase().includes('hotel')) return 'fas fa-bed';
    if (type.toLowerCase().includes('activity')) return 'fas fa-camera';
    if (type.toLowerCase().includes('restaurant')) return 'fas fa-utensils';
    if (type.toLowerCase().includes('transport')) return 'fas fa-bus';
    return 'fas fa-map-marker-alt';
  };

  // UI Elements
  const loadingOverlay = document.getElementById('loading-overlay');
  const itineraryContent = document.getElementById('itinerary-content');
  const btnLoadServices = document.getElementById('btn-load-services');
  const btnGenerateBc = document.getElementById('btn-bc');
  const btnPrint = document.getElementById('btn-print');
  const inputReservation = document.getElementById('reservationNo');
  const dayToggleContainer = document.getElementById('day-toggles');

  // Functions
  const showLoading = () => loadingOverlay.style.display = 'flex';
  const hideLoading = () => loadingOverlay.style.display = 'none';

  const createPopupContent = (item) => {
    const color = getColorForType(item.type || item.serviceType);
    return `
      <div class="custom-popup">
        <div class="popup-header" style="background-color: ${color}">
          ${item.type || item.serviceType || 'Location'}
        </div>
        <div class="popup-body">
          <div class="popup-title">${item.title || item.name}</div>
          ${item.destination ? `<div class="popup-type"><i class="fas fa-map-pin"></i> ${item.destination}</div>` : ''}
          <div class="popup-desc">${item.description || ''}</div>
        </div>
      </div>
    `;
  };

  const loadAllServices = async () => {
    showLoading();
    try {
      const res = await fetch('/api/services/locations');
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      
      allServicesGroup.clearLayers();
      
      data.services.forEach(service => {
        if (service.latitude && service.longitude) {
          const marker = L.marker([service.latitude, service.longitude], {
            icon: getIconForType(service.serviceType)
          });
          
          marker.bindPopup(createPopupContent(service));
          allServicesGroup.addLayer(marker);
        }
      });
      
      if (allServicesGroup.getLayers().length > 0) {
        map.fitBounds(allServicesGroup.getBounds().pad(0.1));
      }
      
      alert(`Loaded ${data.services.length} services`);
    } catch (error) {
      console.error(error);
      alert('Error loading services: ' + error.message);
    } finally {
      hideLoading();
    }
  };

  const renderSidebar = (itinerary) => {
    if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
      itineraryContent.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
          <p>No itinerary loaded. Generate one to see details here.</p>
        </div>
      `;
      return;
    }

    let html = '';
    itinerary.days.forEach((day, dayIndex) => {
      html += `
        <div class="day-card" data-day="${dayIndex}">
          <div class="day-header" onclick="toggleDay(${dayIndex})">
            <span>Day ${day.day}</span>
            <i class="fas fa-chevron-down" id="icon-day-${dayIndex}"></i>
          </div>
          <ul class="day-items" id="items-day-${dayIndex}">
      `;
      
      (day.items || []).forEach((item, itemIndex) => {
        const iconClass = getIconClassForType(item.type);
        const color = getColorForType(item.type);
        
        html += `
            <li class="itinerary-item" onclick="flyToItem(${dayIndex}, ${itemIndex})">
              <div class="item-icon" style="background-color: ${color}">
                <i class="${iconClass}"></i>
              </div>
              <div class="item-details">
                <div class="item-title">${item.title}</div>
                <div class="item-desc">${item.description || ''}</div>
              </div>
            </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    });
    
    itineraryContent.innerHTML = html;
  };

  window.toggleDay = (dayIndex) => {
    const items = document.getElementById(`items-day-${dayIndex}`);
    const icon = document.getElementById(`icon-day-${dayIndex}`);
    if (items.style.display === 'none') {
      items.style.display = 'block';
      icon.className = 'fas fa-chevron-down';
      if (dayLayers[dayIndex]) map.addLayer(dayLayers[dayIndex]);
    } else {
      items.style.display = 'none';
      icon.className = 'fas fa-chevron-right';
      if (dayLayers[dayIndex]) map.removeLayer(dayLayers[dayIndex]);
    }
    updateRouteLine();
  };

  window.flyToItem = (dayIndex, itemIndex) => {
    if (!currentItinerary) return;
    const item = currentItinerary.days[dayIndex].items[itemIndex];
    if (item.latitude && item.longitude) {
      map.flyTo([item.latitude, item.longitude], 15, {
        animate: true,
        duration: 1.5
      });
      
      // Find and open popup
      if (dayLayers[dayIndex]) {
        dayLayers[dayIndex].eachLayer(layer => {
          const latlng = layer.getLatLng();
          if (latlng.lat === item.latitude && latlng.lng === item.longitude) {
            setTimeout(() => layer.openPopup(), 1500);
          }
        });
      }
    }
  };

  const updateRouteLine = () => {
    if (routePolyline) {
      map.removeLayer(routePolyline);
    }
    
    const pts = [];
    Object.keys(dayLayers).forEach(dayIndex => {
      if (map.hasLayer(dayLayers[dayIndex])) {
        dayLayers[dayIndex].eachLayer(layer => {
          pts.push(layer.getLatLng());
        });
      }
    });
    
    if (pts.length > 1) {
      routePolyline = L.polyline(pts, { 
        color: '#3498db', 
        weight: 4, 
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
      }).addTo(map);
    }
  };

  const renderDayToggles = (itinerary) => {
    if (!itinerary || !itinerary.days) {
      dayToggleContainer.innerHTML = '';
      return;
    }
    
    let html = '<div class="day-toggle-control"><strong>Filter Days</strong><br>';
    itinerary.days.forEach((day, index) => {
      html += `
        <label>
          <input type="checkbox" checked onchange="toggleMapDay(${index}, this.checked)"> Day ${day.day}
        </label>
      `;
    });
    html += '</div>';
    dayToggleContainer.innerHTML = html;
  };

  window.toggleMapDay = (dayIndex, isVisible) => {
    if (isVisible) {
      if (dayLayers[dayIndex]) map.addLayer(dayLayers[dayIndex]);
    } else {
      if (dayLayers[dayIndex]) map.removeLayer(dayLayers[dayIndex]);
    }
    updateRouteLine();
  };

  const plotItinerary = (itinerary) => {
    currentItinerary = itinerary;
    itineraryGroup.clearLayers();
    if (routePolyline) map.removeLayer(routePolyline);
    
    // Clear old day layers
    Object.keys(dayLayers).forEach(k => {
      if (map.hasLayer(dayLayers[k])) map.removeLayer(dayLayers[k]);
      delete dayLayers[k];
    });
    
    const allPts = [];
    
    (itinerary.days || []).forEach((day, dayIndex) => {
      const dayGroup = L.featureGroup();
      dayLayers[dayIndex] = dayGroup;
      
      (day.items || []).forEach((item, itemIndex) => {
        if (item.latitude && item.longitude) {
          const marker = L.marker([item.latitude, item.longitude], {
            icon: getIconForType(item.type)
          });
          
          marker.bindPopup(createPopupContent(item));
          
          // Add day label
          marker.bindTooltip(`Day ${day.day}: ${item.title}`, {
            direction: 'top',
            offset: [0, -30]
          });
          
          dayGroup.addLayer(marker);
          allPts.push([item.latitude, item.longitude]);
        }
      });
      
      dayGroup.addTo(map);
    });
    
    updateRouteLine();
    
    if (allPts.length > 0) {
      map.fitBounds(L.latLngBounds(allPts).pad(0.2));
    }
    
    renderSidebar(itinerary);
    renderDayToggles(itinerary);
  };

  // Event Listeners
  btnLoadServices.addEventListener('click', loadAllServices);
  
  btnGenerateBc.addEventListener('click', async () => {
    const resNo = inputReservation.value.trim();
    if (!resNo) {
      alert('Please enter a Reservation No.');
      return;
    }
    
    showLoading();
    try {
      const url = `/api/itinerary/${encodeURIComponent(resNo)}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch itinerary');
      }
      
      const data = await res.json();
      plotItinerary(data);
      
      // Hide all services if showing itinerary
      if (map.hasLayer(allServicesGroup)) {
        map.removeLayer(allServicesGroup);
      }
      
    } catch (error) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      hideLoading();
    }
  });
  
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Geolocation
  map.locate({setView: false, maxZoom: 16});
  map.on('locationfound', (e) => {
    L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: "#3498db",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map).bindPopup("You are here");
  });

  // Initial render
  renderSidebar(null);
});