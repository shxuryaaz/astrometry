import { useState } from 'react';
import Select from 'react-select';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { 
  Download, 
  Share2, 
  ToggleLeft, 
  ToggleRight,
  ZoomIn,
  ZoomOut,
  Info,
  Calendar,
  Loader2
} from 'lucide-react';

interface KundliPageProps {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'end_user' | 'astrologer' | 'admin';
    credits: number;
    referralCode: string;
  };
}

export function KundliPage({ user }: KundliPageProps) {
  const [selectedChart, setSelectedChart] = useState<'rasi' | 'navamsa' | 'dasamsa' | 'bhava'>('rasi');
  const [showTransits, setShowTransits] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Birth details form
  const [birthDetails, setBirthDetails] = useState({
    dob: '',
    tob: '',
    pob: '',
    lat: 19.0760,
    lon: 72.8777
  });
  
  // API data
  const [kundliData, setKundliData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Place search
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [placeOptions, setPlaceOptions] = useState<any[]>([
    { value: { name: 'Mumbai', lat: 19.0760, lon: 72.8777, address: 'Mumbai, Maharashtra, India' }, label: 'Mumbai, Maharashtra, India' },
    { value: { name: 'Delhi', lat: 28.7041, lon: 77.1025, address: 'Delhi, India' }, label: 'Delhi, India' },
    { value: { name: 'Bangalore', lat: 12.9716, lon: 77.5946, address: 'Bangalore, Karnataka, India' }, label: 'Bangalore, Karnataka, India' },
    { value: { name: 'Chennai', lat: 13.0827, lon: 80.2707, address: 'Chennai, Tamil Nadu, India' }, label: 'Chennai, Tamil Nadu, India' },
    { value: { name: 'New York', lat: 40.7128, lon: -74.0060, address: 'New York, NY, USA' }, label: 'New York, NY, USA' },
    { value: { name: 'London', lat: 51.5074, lon: -0.1278, address: 'London, UK' }, label: 'London, UK' }
  ]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const chartTypes = [
    { id: 'rasi', label: 'Rasi Chart', active: true },
    { id: 'navamsa', label: 'Navamsa (D9)' },
    { id: 'dasamsa', label: 'Dasamsa (D10)' },
    { id: 'bhava', label: 'Bhava Chart' }
  ];

  // Geocoding function using Nominatim (free OpenStreetMap service)
  const searchPlaces = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) {
      setPlaceOptions([]);
      return [];
    }

    setIsLoadingPlaces(true);
    
    try {
      // Using Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=8&addressdetails=1`
      );
      
      const data = await response.json();
      
      const options = data.map((place: any) => ({
        value: {
          name: place.display_name,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
          address: place.display_name
        },
        label: place.display_name,
        formatted_address: place.display_name
      }));
      
      setPlaceOptions(options);
      return options;
    } catch (error) {
      console.error('Geocoding error:', error);
      setPlaceOptions([]);
      return [];
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Handle place selection
  const handlePlaceChange = (selectedOption: any) => {
    if (selectedOption) {
      setSelectedPlace(selectedOption);
      setBirthDetails({
        ...birthDetails,
        pob: selectedOption.value.address,
        lat: selectedOption.value.lat,
        lon: selectedOption.value.lon
      });
    }
  };

  // API call function
  const fetchKundliData = async () => {
    if (!birthDetails.dob || !birthDetails.tob || !birthDetails.pob) {
      setError('Please fill in all birth details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/kundli`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(birthDetails),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.message || 'Failed to fetch kundli data');
      } else {
        setKundliData(data.data);
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get house coordinates
  const getHouseCoordinates = (houseNumber: number) => {
    const housePositions = {
      1: { x: 162, y: 87 },   // House 1
      2: { x: 237, y: 87 },   // House 2  
      3: { x: 312, y: 87 },   // House 3
      4: { x: 312, y: 162 },  // House 4
      5: { x: 312, y: 237 },  // House 5
      6: { x: 312, y: 312 },  // House 6
      7: { x: 237, y: 312 },  // House 7
      8: { x: 162, y: 312 },  // House 8
      9: { x: 87, y: 312 },   // House 9
      10: { x: 87, y: 237 },  // House 10
      11: { x: 87, y: 162 },  // House 11
      12: { x: 87, y: 87 }    // House 12
    };
    return housePositions[houseNumber as keyof typeof housePositions] || { x: 200, y: 200 };
  };

  // Get planets from API data or use mock data
  const planets = kundliData?.planet_positions?.map((planet: any) => {
    // Extract house number from house string (e.g., "House 5" -> 5)
    const houseNumber = parseInt(planet.house?.replace('House ', '') || '1');
    const coords = getHouseCoordinates(houseNumber);
    
    return {
      name: planet.planet,
      symbol: planet.symbol,
      sign: planet.sign,
      degree: planet.degree,
      house: planet.house,
      nakshatra: planet.nakshatra,
      retrograde: planet.retrograde,
      x: coords.x,
      y: coords.y,
      aiSummary: `${planet.planet} in ${planet.sign} indicates...`
    };
  }) || [
    { 
      name: 'Sun', 
      sign: 'Aries', 
      degree: '12°34\'', 
      house: '10th House', 
      nakshatra: 'Bharani',
      retrograde: false,
      x: 200, 
      y: 100,
      aiSummary: 'Sun in Aries in 10th house indicates strong leadership qualities and career success potential. Probability of promotion this year: 78%'
    },
    { 
      name: 'Moon', 
      sign: 'Cancer', 
      degree: '25°12\'', 
      house: '1st House', 
      nakshatra: 'Pushya',
      retrograde: false,
      x: 100, 
      y: 200,
      aiSummary: 'Moon in Cancer in 1st house shows strong intuition and emotional depth. Favorable period for personal growth: 85%'
    },
    { 
      name: 'Mars', 
      sign: 'Leo', 
      degree: '8°45\'', 
      house: '2nd House', 
      nakshatra: 'Magha',
      retrograde: true,
      x: 300, 
      y: 150,
      aiSummary: 'Mars retrograde in Leo in 2nd house suggests review of financial decisions. Exercise patience in investments: 62%'
    },
    { 
      name: 'Mercury', 
      sign: 'Virgo', 
      degree: '18°22\'', 
      house: '3rd House', 
      nakshatra: 'Hasta',
      retrograde: false,
      x: 180, 
      y: 280,
      aiSummary: 'Mercury in Virgo in 3rd house enhances communication skills. Excellent time for learning and networking: 92%'
    }
  ];

  const handlePlanetClick = (planet: any) => {
    setSelectedPlanet(planet);
  };

  const handleExportChart = () => {
    // Implementation for chart export
    console.log('Exporting chart...');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="h1 text-[var(--text-primary)] mb-2">Kundli Analysis</h1>
          <p className="text-[var(--text-secondary)]">
            Interactive natal chart for {user.displayName || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={Share2}
            size="sm"
          >
            Share
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleExportChart}
          >
            Export Chart
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* User Info Panel */}
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Birth Details</h3>
          
          {!kundliData ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={birthDetails.dob}
                  onChange={(e) => setBirthDetails({...birthDetails, dob: e.target.value})}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Time of Birth</label>
                <Input
                  type="time"
                  value={birthDetails.tob}
                  onChange={(e) => setBirthDetails({...birthDetails, tob: e.target.value})}
                  placeholder="HH:MM"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Place of Birth</label>
                <Select
                  value={selectedPlace}
                  onChange={handlePlaceChange}
                  onInputChange={(inputValue) => {
                    searchPlaces(inputValue);
                  }}
                  options={placeOptions}
                  isLoading={isLoadingPlaces}
                  placeholder="Search for a city..."
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: 'var(--bg-700)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      minHeight: '40px',
                      '&:hover': {
                        borderColor: 'var(--accent-500)'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--bg-700)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      zIndex: 9999
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? 'var(--bg-600)' : 'var(--bg-700)',
                      color: 'var(--text-primary)',
                      '&:hover': {
                        backgroundColor: 'var(--bg-600)'
                      }
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'var(--text-primary)'
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'var(--text-primary)'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: 'var(--text-secondary)'
                    })
                  }}
                />
              </div>
              
              {error && (
                <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              )}
              
              <Button
                onClick={fetchKundliData}
                disabled={loading}
                fullWidth
                className="mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating Kundli...
                  </>
                ) : (
                  'Generate Kundli'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Date of Birth</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {kundliData.birth_details?.date_of_birth || birthDetails.dob}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Time of Birth</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {kundliData.birth_details?.time_of_birth || birthDetails.tob}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Place of Birth</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {kundliData.birth_details?.place_of_birth || birthDetails.pob}
                </p>
              </div>
              
              <Button
                onClick={() => setKundliData(null)}
                variant="secondary"
                size="sm"
                fullWidth
                className="mt-4"
              >
                Edit Details
              </Button>
            </div>
          )}

          <hr className="my-4 border-[rgba(255,255,255,0.1)]" />

          {/* Chart Type Toggles */}
          <div className="space-y-2">
            <h4 className="font-medium text-[var(--text-primary)] mb-3">Chart Type</h4>
            {chartTypes.map((chart) => (
              <button
                key={chart.id}
                onClick={() => setSelectedChart(chart.id as any)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-smooth
                  ${selectedChart === chart.id
                    ? 'bg-[var(--accent-500)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {chart.label}
              </button>
            ))}
          </div>

          <hr className="my-4 border-[rgba(255,255,255,0.1)]" />

          {/* Transit Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Show Transits
            </span>
            <button
              onClick={() => setShowTransits(!showTransits)}
              className="text-[var(--accent-500)]"
            >
              {showTransits ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
          </div>
        </Card>

        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              {chartTypes.find(c => c.id === selectedChart)?.label}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={ZoomOut}
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              />
              <span className="text-xs text-[var(--text-secondary)] min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                icon={ZoomIn}
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
              />
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="bg-[var(--bg-800)] rounded-lg p-4 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            <svg
              width="100%"
              height="400"
              viewBox="0 0 400 400"
              className="transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Chart Background */}
              <rect width="400" height="400" fill="transparent" />
              
              {/* Houses */}
              <g stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none">
                {/* Outer square */}
                <rect x="50" y="50" width="300" height="300" />
                
                {/* Inner divisions */}
                <line x1="50" y1="125" x2="350" y2="125" />
                <line x1="50" y1="200" x2="350" y2="200" />
                <line x1="50" y1="275" x2="350" y2="275" />
                <line x1="125" y1="50" x2="125" y2="350" />
                <line x1="200" y1="50" x2="200" y2="350" />
                <line x1="275" y1="50" x2="275" y2="350" />
                
                {/* Diagonal lines for diamond pattern */}
                <line x1="50" y1="50" x2="350" y2="350" />
                <line x1="350" y1="50" x2="50" y2="350" />
              </g>

              {/* House Numbers */}
              <g fill="rgba(255,255,255,0.4)" fontSize="12" textAnchor="middle">
                <text x="87" y="87">12</text>
                <text x="162" y="87">1</text>
                <text x="237" y="87">2</text>
                <text x="312" y="87">3</text>
                <text x="312" y="162">4</text>
                <text x="312" y="237">5</text>
                <text x="312" y="312">6</text>
                <text x="237" y="312">7</text>
                <text x="162" y="312">8</text>
                <text x="87" y="312">9</text>
                <text x="87" y="237">10</text>
                <text x="87" y="162">11</text>
              </g>

              {/* Planets */}
              {planets.map((planet: any) => (
                <g key={planet.name}>
                  {/* Planet Circle */}
                  <circle
                    cx={planet.x}
                    cy={planet.y}
                    r="12"
                    fill="var(--accent-500)"
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:fill-[var(--accent-400)] transition-colors"
                    onClick={() => handlePlanetClick(planet)}
                  />
                  
                  {/* Planet Symbol/Initial */}
                  <text
                    x={planet.x}
                    y={planet.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    className="pointer-events-none font-medium"
                  >
                    {planet.symbol || planet.name.charAt(0)}
                  </text>
                  
                  {/* Retrograde indicator */}
                  {planet.retrograde && (
                    <circle
                      cx={planet.x + 8}
                      cy={planet.y - 8}
                      r="3"
                      fill="var(--danger)"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              ))}

              {/* Transit overlay */}
              {showTransits && (
                <g opacity="0.6">
                  <circle cx="150" cy="150" r="8" fill="var(--accent-400)" />
                  <text x="150" y="154" textAnchor="middle" fontSize="8" fill="white">T</text>
                </g>
              )}
            </svg>

            {/* Chart loading overlay for empty state */}
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-800)] opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-[var(--text-secondary)] text-sm">
                Click planets for detailed analysis
              </p>
            </div>
          </div>
        </Card>

        {/* Planet Details Panel */}
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Planet Positions</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {planets.map((planet: any) => (
              <div
                key={planet.name}
                className="p-3 bg-[var(--bg-800)] rounded-lg border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-smooth cursor-pointer"
                onClick={() => handlePlanetClick(planet)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[var(--accent-500)] rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {planet.symbol || planet.name.charAt(0)}
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">
                    {planet.name}
                  </span>
                  {planet.retrograde && (
                    <span className="text-xs px-1 py-0.5 bg-[var(--danger)] text-white rounded">
                      R
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <p>{planet.sign} • {planet.degree}</p>
                  <p>{planet.house} House • {planet.nakshatra}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4 border-[rgba(255,255,255,0.1)]" />

          {/* Quick Transit Summary */}
          <div>
            <h4 className="font-medium text-[var(--text-primary)] mb-3">
              Today's Transits
            </h4>
            <div className="space-y-2">
              {kundliData?.todays_transits?.map((transit: string, index: number) => (
                <div key={index} className="text-xs">
                  <span className="text-[var(--text-secondary)]">{transit.split(':')[0]}:</span>
                  <span className="text-[var(--text-primary)] ml-1">{transit.split(':')[1]}</span>
                </div>
              )) || (
                <>
                  <div className="text-xs">
                    <span className="text-[var(--text-secondary)]">Moon:</span>
                    <span className="text-[var(--text-primary)] ml-1">Entering Sagittarius</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-[var(--text-secondary)]">Mercury:</span>
                    <span className="text-[var(--text-primary)] ml-1">Direct in Capricorn</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Planet Detail Modal */}
      {selectedPlanet && (
        <Modal
          isOpen={!!selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
          title={`${selectedPlanet.name} Analysis`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Planet Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-[var(--bg-800)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">Position Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Sign:</span>
                    <span className="text-[var(--text-primary)]">{selectedPlanet.sign}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Degree:</span>
                    <span className="text-[var(--text-primary)]">{selectedPlanet.degree}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">House:</span>
                    <span className="text-[var(--text-primary)]">{selectedPlanet.house}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Nakshatra:</span>
                    <span className="text-[var(--text-primary)]">{selectedPlanet.nakshatra}</span>
                  </div>
                  {selectedPlanet.retrograde && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Status:</span>
                      <span className="text-[var(--danger)]">Retrograde</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bg-[var(--bg-800)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">AI Analysis</h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {selectedPlanet.aiSummary}
                </p>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                icon={Info}
                fullWidth
                onClick={() => {
                  setSelectedPlanet(null);
                  // Navigate to ask question with prefilled context
                }}
              >
                Ask Follow-up Question
              </Button>
              <Button
                variant="secondary"
                icon={Calendar}
                onClick={() => console.log('Show transit timeline')}
              >
                Transit Timeline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}