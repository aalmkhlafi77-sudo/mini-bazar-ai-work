import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Crosshair,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export interface SelectedLocationData {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  street?: string;
  building?: string;
  addressSummary: string;
  mapUrl: string;
}

interface CheckoutMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelected: (data: SelectedLocationData) => void;
  selectedCity?: string;
}

// Major Saudi cities coordinates for rapid map re-centering
const SAUDI_CITIES_COORDS: Record<string, [number, number]> = {
  الرياض: [24.7136, 46.6753],
  جدة: [21.5433, 39.1728],
  الدمام: [26.4207, 50.0888],
  'مكة المكرمة': [21.3891, 39.8579],
  'المدينة المنورة': [24.5247, 39.5692],
  الخبر: [26.2818, 50.2084],
  أبها: [18.2164, 42.5053],
  تبوك: [28.3835, 36.5662],
  القصيم: [26.326, 43.975],
};

export const CheckoutMapPicker: React.FC<CheckoutMapPickerProps> = ({
  initialLat = 24.7136,
  initialLng = 46.6753,
  onLocationSelected,
  selectedCity,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentCoords, setCurrentCoords] = useState<[number, number]>([initialLat, initialLng]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [activePresetCity, setActivePresetCity] = useState<string>(selectedCity || 'الرياض');

  // Custom luxury SVG icon for Leaflet pin
  const createCustomPinIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 34px;
            height: 34px;
            background: linear-gradient(135deg, #2F2B28 0%, #1A1715 100%);
            border: 2px solid #C6A36A;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(47, 43, 40, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background: #C6A36A;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
          <div style="
            position: absolute;
            bottom: -6px;
            width: 14px;
            height: 4px;
            background: rgba(0,0,0,0.25);
            border-radius: 50%;
            filter: blur(1px);
          "></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  };

  // Reverse Geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      setIsReverseGeocoding(true);
      setGeoError(null);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'MiniBazaarLuxuryStore/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('تعذر جلب تفاصيل العنوان');
      }

      const data = await response.json();
      const addr = data.address || {};

      // Match city name
      const rawCity =
        addr.city ||
        addr.town ||
        addr.state ||
        addr.county ||
        addr.municipality ||
        '';

      let matchedCity: string | undefined = undefined;
      const cleanCityStr = rawCity.replace(/محافظة|منطقة|أمانة|مدينة/g, '').trim();

      const saudiKnownCities = Object.keys(SAUDI_CITIES_COORDS);
      for (const sc of saudiKnownCities) {
        if (cleanCityStr.includes(sc) || sc.includes(cleanCityStr)) {
          matchedCity = sc;
          break;
        }
      }

      const district =
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.residential ||
        addr.city_district ||
        '';

      const street =
        addr.road ||
        addr.pedestrian ||
        addr.street ||
        addr.highway ||
        '';

      const building = addr.house_number || '';

      const summaryParts = [
        matchedCity || rawCity,
        district ? `حي ${district}` : '',
        street ? `شارع ${street}` : '',
        building ? `رقم ${building}` : '',
      ].filter(Boolean);

      const addressSummary = summaryParts.length > 0 ? summaryParts.join('، ') : data.display_name || 'موقع محدد على الخريطة';
      const mapUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;

      setDetectedAddress(addressSummary);

      onLocationSelected({
        latitude: lat,
        longitude: lon,
        city: matchedCity || (cleanCityStr ? cleanCityStr : undefined),
        district: district || undefined,
        street: street || undefined,
        building: building || undefined,
        addressSummary,
        mapUrl,
      });
    } catch (err: any) {
      console.warn('Reverse geocoding note:', err?.message);
      // Fallback: still send coordinates and google map url
      const mapUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`;
      const summary = `إحداثيات: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      setDetectedAddress(summary);
      onLocationSelected({
        latitude: lat,
        longitude: lon,
        addressSummary: summary,
        mapUrl,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: currentCoords,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // OpenStreetMap Tiles with attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      // Custom marker
      const marker = L.marker(currentCoords, {
        icon: createCustomPinIcon(),
        draggable: true,
        autoPan: true,
      }).addTo(map);

      // Marker drag handler
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCurrentCoords([position.lat, position.lng]);
        reverseGeocode(position.lat, position.lng);
      });

      // Map click handler (move marker on click)
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords([lat, lng]);
        map.panTo([lat, lng]);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size on first render to prevent tile grey gaps
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      // Keep map reference stable or clean up on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update map center when city preset changes
  const handleSelectPresetCity = (city: string) => {
    setActivePresetCity(city);
    const coords = SAUDI_CITIES_COORDS[city];
    if (coords && mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo(coords, 13, { duration: 1.2 });
      markerRef.current.setLatLng(coords);
      setCurrentCoords(coords);
      reverseGeocode(coords[0], coords[1]);
    }
  };

  // Browser Geolocation API Trigger
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي (Geolocation API).');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newCoords: [number, number] = [lat, lng];

        setCurrentCoords(newCoords);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo(newCoords, 16, { duration: 1.5 });
          markerRef.current.setLatLng(newCoords);
        }

        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError(
              'تم رفض الإذن بالوصول إلى الموقع الجغرافي في المتصفح. يمكنك اختيار موقعك مباشرة بالنقر على الخريطة.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('معلومات الموقع الجغرافي غير متوفرة حالياً. يرجى التحديد عبر الخريطة.');
            break;
          case error.TIMEOUT:
            setGeoError('انتهت مهلة طلب تحديد الموقع. يرجى المحاولة مرة أخرى أو النقر على الخريطة.');
            break;
          default:
            setGeoError('تعذر تحديد الموقع تلقائياً. يمكنك النقر على الخريطة لتثبيت العنوان.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Geolocation Controls & City Quick Jumps */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* GPS Locate Button */}
        <button
          type="button"
          onClick={handleAutoLocate}
          disabled={isLocating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-70"
          title="تحديد موقعي الجغرافي الحالي تلقائياً عبر GPS"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#C6A36A]" />
          ) : (
            <Navigation className="w-4 h-4 text-[#C6A36A]" />
          )}
          <span>{isLocating ? 'جارٍ جلب إحداثيات GPS...' : 'تحديد موقعي الحالي تلقائياً'}</span>
        </button>

        {/* Quick City Jumper */}
        <div className="flex items-center gap-1.5 text-xs text-[#6F584A]">
          <span className="font-semibold text-[11px] text-[#7C736D]">المدينة:</span>
          <div className="flex flex-wrap gap-1">
            {['الرياض', 'جدة', 'الدمام', 'مكة المكرمة'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelectPresetCity(city)}
                className={`px-2 py-1 rounded-[8px] text-[11px] font-medium transition-all ${
                  activePresetCity === city
                    ? 'bg-[#C6A36A] text-white'
                    : 'bg-[#F4ECE2] text-[#6F584A] hover:bg-[#E7D4BC]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Geolocation Status or Error Messages */}
      {geoError && (
        <div className="p-3 rounded-[12px] bg-[#B4574A]/10 border border-[#B4574A]/30 text-[#B4574A] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map Canvas Container */}
      <div className="relative rounded-[16px] overflow-hidden border border-[#D9C1A7] shadow-xs bg-[#F4ECE2]">
        <div
          ref={mapContainerRef}
          style={{ height: '270px', width: '100%', zIndex: 1 }}
          className="cursor-crosshair"
        />

        {/* Map Instructions Badge */}
        <div className="absolute top-2.5 right-2.5 z-[500] bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-[10px] text-[11px] text-[#2F2B28] shadow-xs border border-[#E5D8C9] pointer-events-none flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-[#C6A36A]" />
          <span>انقر على الخريطة أو اسحب العلامة لتحديد موقعك</span>
        </div>

        {/* Loading Overlay during reverse geocoding */}
        {isReverseGeocoding && (
          <div className="absolute bottom-2.5 right-2.5 z-[500] bg-[#2F2B28]/85 text-[#F5E9D8] px-3 py-1.5 rounded-[10px] text-xs flex items-center gap-2 shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A36A]" />
            <span>جارٍ استخراج اسم الحي والشارع تلقائياً...</span>
          </div>
        )}
      </div>

      {/* Detected Location Card with Coordinates and Google Maps Link */}
      {detectedAddress && (
        <div className="p-3.5 rounded-[14px] bg-[#F4ECE2]/80 border border-[#D9C1A7] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#2F2B28]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#8A7465] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#6F584A] mb-0.5">العنوان المكتشف من الخريطة:</div>
              <p className="text-[#2F2B28] text-xs leading-relaxed">{detectedAddress}</p>
              <div className="text-[10px] text-[#7C736D] mt-1 font-mono" dir="ltr">
                Coordinates: {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
              </div>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps?q=${currentCoords[0].toFixed(6)},${currentCoords[1].toFixed(6)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-[#D9C1A7] text-[#6F584A] hover:text-[#2F2B28] hover:bg-[#FBF8F3] text-[11px] font-semibold transition-all shrink-0 self-start sm:self-center"
          >
            <span>عرض في Google Maps</span>
            <ExternalLink className="w-3 h-3 text-[#8A7465]" />
          </a>
        </div>
      )}
    </div>
  );
};
