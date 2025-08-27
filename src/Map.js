import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './Map.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoid3dlbiIsImEiOiJjamxjaXhnaW0wMHpyM3FwN2RndDdsMGQ0In0.VGO0vIuZXaVGlKtUvBrLzA';

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [lng, setLng] = useState(110.512);
  const [lat, setLat] = useState(-66.3894);
  const [zoom, setZoom] = useState(8.8);
  const [aoiVisible, setAoiVisible] = useState(true);
  const [aspaVisible, setAspaVisible] = useState(true);
  const [islandsVisible, setIslandsVisible] = useState(true);
  const [stationsVisible, setStationsVisible] = useState(true);

  // Initialize map when component mounts
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [lng, lat],
      zoom: zoom,
      attributionControl: false
    });
    mapRef.current = map;

    // Add navigation control (the +/- zoom buttons)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl());
    map.addControl(new mapboxgl.ScaleControl());

    map.on('move', () => {
      setLng(map.getCenter().lng.toFixed(4));
      setLat(map.getCenter().lat.toFixed(4));
      setZoom(map.getZoom().toFixed(2));
    });

    // Load AOI and ASPA GeoJSON files
    map.on('load', () => {
      // AOI (Windmill Islands Planning Area) - blue line
      fetch('/aoi_shapefile.geojson')
      .then(response => {
        if (!response.ok) throw new Error('GeoJSON not found');
        return response.json();
      })
      .then(data => {
        map.addSource('shapefile', {
        type: 'geojson',
        data: data
        });
        map.addLayer({
        id: 'shapefile-layer',
        type: 'line',
        source: 'shapefile',
        paint: {
          'line-color': '#2e86de',
          'line-width': 2
        },
        layout: {
          visibility: aoiVisible ? 'visible' : 'none'
        }
        });
      })
      .catch(err => {
        // Optionally handle error (e.g., file not found)
      });

      // ASPA - red dashed line
      fetch('/aspa.geojson')
      .then(response => {
        if (!response.ok) throw new Error('ASPA GeoJSON not found');
        return response.json();
      })
      .then(data => {
        map.addSource('aspa', {
        type: 'geojson',
        data: data
        });
        map.addLayer({
        id: 'aspa-layer',
        type: 'line',
        source: 'aspa',
        paint: {
          'line-color': '#ff0000',
          'line-width': 2,
          'line-dasharray': [2, 2]
        },
        layout: {
          visibility: aspaVisible ? 'visible' : 'none'
        }
        });
      })
      .catch(err => {
        // Optionally handle error (e.g., file not found)
      });
      
      // Islands - simple point layer
      fetch('/islands.geojson')
      .then(response => {
        if (!response.ok) throw new Error('Islands GeoJSON not found');
        return response.json();
      })
      .then(data => {
        map.addSource('islands', {
        type: 'geojson',
        data: data
        });
        map.addLayer({
        id: 'islands-layer',
        type: 'circle',
        source: 'islands',
        paint: {
          'circle-radius': 4,
          'circle-color': '#222',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
        });
        // Add label layer for islands
        map.addLayer({
        id: 'islands-label',
        type: 'symbol',
        source: 'islands',
        layout: {
          'text-field': ['get', 'gaz_name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'visibility': islandsVisible ? 'visible' : 'none'
        },
        paint: {
          'text-color': '#222',
          'text-halo-color': '#fff',
          'text-halo-width': 1.2
        }
        });
      })
      .catch(err => {
        // Optionally handle error (e.g., file not found)
      });

      // Research Stations - red house symbol
      fetch('/research_station.geojson')
      .then(response => {
        if (!response.ok) throw new Error('Research Station GeoJSON not found');
        return response.json();
      })
      .then(data => {
        map.addSource('research_station', {
          type: 'geojson',
          data: data
        });
        // Add a custom red house icon if not present
        if (!map.hasImage('house-red')) {
          const houseSVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="16,4 28,14 28,28 20,28 20,20 12,20 12,28 4,28 4,14" fill="#e74c3c" stroke="#b71c1c" stroke-width="2"/><polygon points="16,4 28,14 4,14" fill="#e74c3c" stroke="#b71c1c" stroke-width="2"/></svg>`;
          const img = new window.Image(32, 32);
          img.onload = () => map.addImage('house-red', img);
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(houseSVG);
        }
        map.addLayer({
          id: 'research_station-layer',
          type: 'symbol',
          source: 'research_station',
          layout: {
            'icon-image': 'house-red',
            'icon-size': 0.8,
            'icon-allow-overlap': true,
            'visibility': stationsVisible ? 'visible' : 'none'
          }
        });
      })
      .catch(err => {
        // Optionally handle error (e.g., file not found)
      });
    });

    // Clean up on unmount
    return () => map.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to update AOI, ASPA, Islands, and Research Stations layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('shapefile-layer')) {
      map.setLayoutProperty('shapefile-layer', 'visibility', aoiVisible ? 'visible' : 'none');
    }
    if (map.getLayer('aspa-layer')) {
      map.setLayoutProperty('aspa-layer', 'visibility', aspaVisible ? 'visible' : 'none');
    }
    if (map.getLayer('islands-layer')) {
      map.setLayoutProperty('islands-layer', 'visibility', islandsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('islands-label')) {
      map.setLayoutProperty('islands-label', 'visibility', islandsVisible ? 'visible' : 'none');
    }
    if (map.getLayer('research_station-layer')) {
      map.setLayoutProperty('research_station-layer', 'visibility', stationsVisible ? 'visible' : 'none');
    }
  }, [aoiVisible, aspaVisible, islandsVisible, stationsVisible]);

  return (
    <div className="map-wrapper">
      <div className='sidebarStyle'>
        <div>
          IceCon: Expert Elicitation Mapping for Antarctic Conservation Planning
        </div>
      </div>
      <div className='legendStyle'>
        <div className='legend-title'>Legend</div>
        <div className='legend-item' style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={aoiVisible}
            onChange={e => setAoiVisible(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <span className='legend-line' style={{ background: '#2e86de', marginRight: 6 }}></span>
          Windmill Islands Planning Area
        </div>
        <div className='legend-item' style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={aspaVisible}
            onChange={e => setAspaVisible(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <span style={{ display: 'inline-block', width: 22, height: 0, borderTop: '2px dashed #ff0000', marginRight: 6 }}></span>
          ASPA (Antarctic Specially Protected Area)
        </div>
        <div className='legend-item' style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={islandsVisible}
            onChange={e => setIslandsVisible(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#222', border: '2px solid #fff', marginRight: 8 }}></span>
          Islands
        </div>
        <div className='legend-item' style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={stationsVisible}
            onChange={e => setStationsVisible(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          <span style={{ display: 'inline-block', width: 18, height: 18, marginRight: 8 }}>
            <svg width="18" height="18" viewBox="0 0 32 32">
              <polygon points="16,4 28,14 28,28 20,28 20,20 12,20 12,28 4,28 4,14" fill="#e74c3c" stroke="#b71c1c" strokeWidth="2"/>
              <polygon points="16,4 28,14 4,14" fill="#e74c3c" stroke="#b71c1c" strokeWidth="2"/>
            </svg>
          </span>
          Research Stations
        </div>
      </div>
      <div className='map-container' ref={mapContainerRef} />
      <div className='custom-disclaimer'>
        <strong>Disclaimer:</strong> This tool is intended solely for scientific research and expert feedback regarding conservation features and potential threats in Windmill Islands. The information presented herein is preliminary, subject to ongoing validation, and should not be interpreted as legally binding or as official policy.<br />
        For further information or inquiries, please contact Wen Wen at <a href="mailto:ww.wen@hdr.qut.edu.au" style={{ color: '#0074d9' }}>ww.wen@hdr.qut.edu.au</a>.
      </div>
    </div>
  );
};
export default Map;