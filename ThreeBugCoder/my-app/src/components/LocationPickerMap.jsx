import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Search, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const DEFAULT_CENTER = { lat: -6.9175, lng: 107.6191 };
const DEFAULT_ZOOM = 12;

const pinIcon = L.divIcon({
  className: "bk-map-pin",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 7 11.6 7.3 11.9.4.3 1 .3 1.4 0C13 21.6 20 15.4 20 10c0-4.4-3.6-8-8-8z" fill="#b72d64"/><circle cx="12" cy="10" r="3.2" fill="#fff" stroke="#8a1148" stroke-width="1"/></svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32],
});

function extractPlace(data) {
  const a = data.address || {};
  const road = [a.house_number, a.road, a.pedestrian, a.footway].filter(Boolean).join(" ");
  const area = [a.neighbourhood, a.suburb, a.hamlet, a.city_district, a.village].filter(Boolean).join(", ");
  return {
    lat: Number(data.lat),
    lng: Number(data.lon),
    address: [road, area].filter(Boolean).join(", ") || data.display_name || "",
    city: a.city || a.town || a.municipality || a.county || a.state_district || "",
    province: a.state || a.region || "",
    postalCode: a.postcode || a.postal_code || "",
    displayName: data.display_name || "",
  };
}

export default function LocationPickerMap({ coords = null, onPick, disabled = false, onStatusChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const busyRef = useRef(false);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const response = await fetch(`${NOMINATIM}/reverse?format=jsonv2&accept-language=id&lat=${lat}&lon=${lng}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Reverse geocode gagal (${response.status})`);
      const data = await response.json();
      onPickRef.current?.(extractPlace(data));
    } catch (error) {
      onStatusChangeRef.current?.(error instanceof Error ? error.message : "Gagal membaca alamat.");
    } finally {
      busyRef.current = false;
    }
  }, []);

  const placeMarker = useCallback(
    (lat, lng) => {
      const map = mapRef.current;
      if (!map) return;
      const position = [lat, lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(position);
      } else {
        const marker = L.marker(position, { icon: pinIcon, draggable: !disabledRef.current }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }
    },
    [reverseGeocode]
  );

  const canMoveAround = () => !disabledRef.current && !busyRef.current;

  const runSearch = useCallback(
    async (event) => {
      event?.preventDefault?.();
      const q = query.trim();
      if (!q || !canMoveAround()) return;
      setBusy(true);
      setNotice("");
      try {
        const response = await fetch(
          `${NOMINATIM}/search?format=jsonv2&accept-language=id&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error(`Pencarian gagal (${response.status})`);
        const results = await response.json();
        if (!results.length) throw new Error("Lokasi tidak ditemukan.");
        const found = results[0];
        const lat = Number(found.lat);
        const lng = Number(found.lon);
        placeMarker(lat, lng);
        mapRef.current?.flyTo([lat, lng], 16, { duration: 0.8 });
        onPickRef.current?.(extractPlace(found));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Lokasi tidak ditemukan.");
      } finally {
        setBusy(false);
      }
    },
    [query, placeMarker]
  );

  const useMyLocation = useCallback(() => {
    if (!canMoveAround()) return;
    if (!("geolocation" in navigator)) {
      setNotice("Browser tidak mendukung geolokasi.");
      return;
    }
    setBusy(true);
    setNotice("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        placeMarker(latitude, longitude);
        mapRef.current?.flyTo([latitude, longitude], 16, { duration: 0.8 });
        await reverseGeocode(latitude, longitude);
        setBusy(false);
      },
      (error) => {
        setBusy(false);
        setNotice(
          error.code === error.PERMISSION_DENIED ? "Izin lokasi ditolak." : "Gagal mengambil lokasi dari perangkat."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [placeMarker, reverseGeocode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const current = coordsRef.current;
    const hasCoords = current && Number.isFinite(current.lat) && Number.isFinite(current.lng);
    const center = hasCoords ? [current.lat, current.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

    const map = L.map(container, {
      center,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasCoords) {
      const marker = L.marker(center, { icon: pinIcon, draggable: !disabledRef.current }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }

    const onClick = (event) => {
      if (!canMoveAround()) return;
      const { lat, lng } = event.latlng;
      placeMarker(lat, lng);
      reverseGeocode(lat, lng);
    };
    map.on("click", onClick);

    mapRef.current = map;

    return () => {
      map.off("click", onClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [placeMarker, reverseGeocode]);

  return (
    <div>
      <div style={styles.picker}>
        <div style={styles.toolbar}>
          <form style={styles.searchForm} onSubmit={runSearch}>
            <Search size={16} strokeWidth={2.2} style={styles.searchIcon} />
            <input
              style={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari lokasi, misal: Jl. Braga Bandung"
              disabled={disabled || busy}
              aria-label="Cari lokasi"
            />
          </form>
          <button
            type="button"
            style={styles.locateButton}
            onClick={useMyLocation}
            disabled={disabled || busy}
            title="Gunakan lokasi saya"
            aria-label="Gunakan lokasi saya"
          >
            <LocateFixed size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div ref={containerRef} style={styles.map}>
          <div style={styles.mapHint}>
            Klik peta atau seret pin untuk memilih lokasi &mdash; alamat akan terisi otomatis.
          </div>
        </div>
      </div>

      {busy && <p style={styles.notice}>Mencari lokasi...</p>}
      {notice && <p style={styles.noticeError}>{notice}</p>}
    </div>
  );
}

const styles = {
  picker: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 2,
  },
  toolbar: {
    display: "flex",
    gap: 8,
  },
  searchForm: {
    position: "relative",
    flex: 1,
    minWidth: 0,
  },
  searchIcon: {
    position: "absolute",
    top: "50%",
    left: 12,
    transform: "translateY(-50%)",
    color: "#9a7a74",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    height: 42,
    padding: "0 12px 0 38px",
    borderRadius: 8,
    border: "1.5px solid #ead8d5",
    background: "#fff",
    color: "#211714",
    fontSize: 14,
    outline: "none",
  },
  locateButton: {
    width: 42,
    height: 42,
    flex: "0 0 auto",
    borderRadius: 8,
    border: "1.5px solid #ead8d5",
    background: "#fff",
    color: "#b72d64",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  map: {
    position: "relative",
    zIndex: 0,
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
    border: "1.5px solid #ead8d5",
  },
  mapHint: {
    position: "absolute",
    left: 12,
    bottom: 40,
    zIndex: 2,
    maxWidth: "calc(100% - 24px)",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255, 255, 255, 0.92)",
    color: "#5f3b44",
    fontSize: 11.5,
    fontWeight: 600,
    pointerEvents: "none",
    boxShadow: "0 6px 16px -8px rgba(0, 0, 0, 0.5)",
  },
  notice: {
    margin: "8px 0 0",
    color: "#6f5850",
    fontSize: 12.5,
    fontWeight: 600,
  },
  noticeError: {
    margin: "8px 0 0",
    color: "#c0392b",
    fontSize: 12.5,
    fontWeight: 600,
  },
};