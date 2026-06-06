import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Eye, 
  Compass, Calendar, Info, Users, ThermometerSun, Sunrise, Sunset,
  AlertTriangle
} from 'lucide-react';

// Reusable Weather and Season Insights Widget
const WeatherWidget = ({ placeName, stateName, coordinates, category }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const lat = coordinates?.latitude || 20.5937;
      const lng = coordinates?.longitude || 78.9629;
      const currentMonth = new Date().getMonth(); // 0-11

      // Deterministic Simulation based on Coordinates and Month
      let isHighAltitude = lat > 30; // Kashmir, Ladakh, Himachal
      let isCoastal = (lat < 20 && lng > 72 && lng < 74) || (lat < 20 && lng > 79 && lng < 81) || lat < 10; // Goa, Kerala, Puducherry
      let isDesert = lat > 24 && lat < 28 && lng < 75; // Rajasthan
      
      let temp = 25;
      let condition = 'Cloudy';
      let humidity = 60;
      let windSpeed = 10;
      let visibility = 8;
      let uvIndex = 5;
      let peakSeason = 'October to March';
      let offSeason = 'April to June';
      let monsoonSeason = 'July to September';
      let recommendedMonths = 'Nov, Dec, Jan, Feb';
      let crowdLevel = 'Medium';
      let seasonalAdvice = 'Pleasant weather. Perfect for sightseeing.';
      let avoidTip = 'No major warnings.';
      let activities = ['Sightseeing', 'Photography', 'Shopping'];

      // Adjust based on region
      if (isHighAltitude) {
        // Alpine/Himalayan
        if (currentMonth >= 10 || currentMonth <= 1) { // Winter Nov-Feb
          temp = Math.round(lat > 34 ? -5 + (currentMonth % 3) : 2 + (currentMonth % 4));
          condition = 'Snowy';
          humidity = 85;
          windSpeed = 15;
          visibility = 3;
          uvIndex = 2;
          seasonalAdvice = 'Heavy winter clothing and snow boots required. Roads can block.';
          avoidTip = 'Avoid late evening transit due to black ice.';
        } else if (currentMonth >= 5 && currentMonth <= 8) { // Monsoon/Summer June-Sep
          temp = 16 + (currentMonth % 5);
          condition = 'Rainy';
          humidity = 75;
          windSpeed = 12;
          visibility = 6;
          uvIndex = 7;
          seasonalAdvice = 'Mild summer showers. Carry an umbrella or light rain jacket.';
          avoidTip = 'Avoid trekking on steep slopes during heavy downpours due to landslides.';
        } else { // Spring/Autumn
          temp = 12 + (currentMonth % 4);
          condition = 'Sunny';
          humidity = 50;
          windSpeed = 8;
          visibility = 10;
          uvIndex = 6;
          seasonalAdvice = 'Clear sunny skies. Ideal for hiking and scenic sightseeing.';
        }
        peakSeason = 'April to June (Summer) & Dec to Feb (Snow lovers)';
        offSeason = 'July to September (Landslide risk)';
        monsoonSeason = 'July to August';
        recommendedMonths = 'April, May, June, September, October';
        crowdLevel = 'High';
        activities = ['Trekking', 'Mountain Biking', 'Snow Skiing', 'Photography'];
      } else if (isDesert) {
        // Arid/Desert (Rajasthan)
        if (currentMonth >= 3 && currentMonth <= 7) { // Extreme Summer Apr-Aug
          temp = 38 + (currentMonth % 6);
          condition = 'Sunny';
          humidity = 20;
          windSpeed = 16;
          visibility = 9;
          uvIndex = 9;
          seasonalAdvice = 'Extreme heat. Keep hydrated. Prefer indoor sightseeing or early morning walks.';
          avoidTip = 'Avoid direct sun exposure between 11:00 AM and 4:00 PM.';
        } else if (currentMonth >= 10 || currentMonth <= 1) { // Winter
          temp = 16 + (currentMonth % 4);
          condition = 'Sunny';
          humidity = 35;
          windSpeed = 9;
          visibility = 10;
          uvIndex = 4;
          seasonalAdvice = 'Crisp, sunny days and cold desert nights. Excellent time for safaris.';
          avoidTip = 'Nights are very cold, carry adequate woolen layers.';
        } else { // Monsoon/Post-monsoon
          temp = 28 + (currentMonth % 4);
          condition = 'Cloudy';
          humidity = 55;
          windSpeed = 12;
          visibility = 8;
          uvIndex = 6;
          seasonalAdvice = 'Pleasant post-monsoon breeze, green patches in desert regions.';
        }
        peakSeason = 'November to February (Winter Festival Season)';
        offSeason = 'April to June (Extreme Summer)';
        monsoonSeason = 'July to September';
        recommendedMonths = 'October, November, December, January, February';
        crowdLevel = 'High';
        activities = ['Camel Safari', 'Fort Tours', 'Dune Camping', 'Cultural Festivals'];
      } else if (isCoastal) {
        // Tropical Coastal (Kerala, Goa)
        temp = 27 + (currentMonth % 4);
        humidity = 80 + (currentMonth % 10);
        windSpeed = 14 + (currentMonth % 6);
        visibility = 8;
        uvIndex = 7;
        if (currentMonth >= 5 && currentMonth <= 8) { // Monsoon June-Sep
          condition = 'Rainy';
          seasonalAdvice = 'Heavy tropical monsoon. Lush green views. Great for ayurveda treatments.';
          avoidTip = 'Avoid beach swimming or water sports due to rough seas.';
        } else {
          condition = 'Sunny';
          seasonalAdvice = 'Pleasant beach weather. Light cotton clothes recommended.';
          avoidTip = 'High humidity, drink plenty of coconut water.';
        }
        peakSeason = 'November to February (Beach festivals, backwaters)';
        offSeason = 'March to May (Hot and humid)';
        monsoonSeason = 'June to September (Ayurvedic season)';
        recommendedMonths = 'October, November, December, January, February';
        crowdLevel = 'High';
        activities = ['Houseboat Cruise', 'Beach Walks', 'Ayurvedic Spa', 'Scuba Diving'];
      } else {
        // Plains / Central India (Delhi, Agra, Mumbai)
        if (currentMonth >= 3 && currentMonth <= 5) { // Summer
          temp = 34 + (currentMonth % 5);
          condition = 'Sunny';
          humidity = 40;
          windSpeed = 10;
          visibility = 9;
          uvIndex = 8;
          seasonalAdvice = 'Hot temperatures. Wear sunscreen and breathable fabrics.';
          avoidTip = 'Avoid walking long distances in midday heat.';
        } else if (currentMonth >= 6 && currentMonth <= 8) { // Monsoon
          temp = 28 + (currentMonth % 3);
          condition = 'Rainy';
          humidity = 80;
          windSpeed = 12;
          visibility = 7;
          uvIndex = 5;
          seasonalAdvice = 'Frequent showers. Great for nature getaways and water body views.';
          avoidTip = 'Watch out for local waterlogging and traffic updates.';
        } else { // Winter
          temp = 15 + (currentMonth % 6);
          condition = 'Sunny';
          humidity = 55;
          windSpeed = 7;
          visibility = 8;
          uvIndex = 4;
          seasonalAdvice = 'Cool nights and sunny pleasant days. Ideal for historical walks.';
          avoidTip = 'Morning fog might cause transport delay.';
        }
        peakSeason = 'October to March';
        offSeason = 'April to June';
        monsoonSeason = 'July to September';
        recommendedMonths = 'October, November, December, January, February, March';
        crowdLevel = 'High';
        activities = ['Heritage Walks', 'Local Markets', 'Street Food Tasting', 'Museum Tours'];
      }

      // Add Category Specific Tips
      if (category?.toLowerCase().includes('adventure') || category?.toLowerCase().includes('wildlife')) {
        activities.push('Wildlife Safari', 'Nature Photography');
      } else if (category?.toLowerCase().includes('heritage') || category?.toLowerCase().includes('religious')) {
        activities.push('Temple visits', 'Guided heritage walking');
      }

      // Sunrise & Sunset Simulation
      let sunrise = '06:02 AM';
      let sunset = '06:18 PM';
      if (lat > 25) {
        if (currentMonth >= 4 && currentMonth <= 8) {
          sunrise = '05:22 AM';
          sunset = '07:12 PM';
        } else {
          sunrise = '07:05 AM';
          sunset = '05:42 PM';
        }
      } else {
        if (currentMonth >= 4 && currentMonth <= 8) {
          sunrise = '05:45 AM';
          sunset = '06:48 PM';
        } else {
          sunrise = '06:22 AM';
          sunset = '06:05 PM';
        }
      }

      // Rain Probability Simulation
      let rainProbability = 10;
      if (condition === 'Rainy') {
        rainProbability = 80 + (currentMonth % 15);
      } else if (condition === 'Cloudy') {
        rainProbability = 35 + (currentMonth % 20);
      } else if (condition === 'Snowy') {
        rainProbability = 5;
      } else {
        rainProbability = 2 + (currentMonth % 5);
      }

      // Suitability badge logic
      let suitabilityLabel = 'Good to Visit';
      if (condition === 'Rainy' && isCoastal) {
        suitabilityLabel = 'Not Recommended';
      } else if (condition === 'Snowy' && temp < 0) {
        suitabilityLabel = 'Not Recommended';
      } else if (temp > 37) {
        suitabilityLabel = 'Not Recommended';
      } else if ((condition === 'Sunny' || condition === 'Cloudy') && temp >= 16 && temp <= 27) {
        suitabilityLabel = 'Ideal to Visit';
      }

      // Special overrides for hill stations
      if (placeName?.toLowerCase().includes('ooty') || placeName?.toLowerCase().includes('botanical') || placeName?.toLowerCase().includes('lake')) {
        if (temp > 35) suitabilityLabel = 'Good to Visit';
        else suitabilityLabel = 'Ideal to Visit';
      }

      // Simulate Kerala heavy monsoons during summer/monsoon months (June-Sep)
      const isKerala = (stateName || '').toLowerCase().includes('kerala') || 
                       (placeName || '').toLowerCase().includes('kerala') || 
                       (placeName || '').toLowerCase().includes('munnar') || 
                       (placeName || '').toLowerCase().includes('wayanad') || 
                       (placeName || '').toLowerCase().includes('alleppey') || 
                       (placeName || '').toLowerCase().includes('kovalam') || 
                       (placeName || '').toLowerCase().includes('varkala');
      if (isKerala && currentMonth >= 5 && currentMonth <= 8) {
        suitabilityLabel = 'Not Recommended';
        condition = 'Rainy';
        temp = 24;
        rainProbability = 95;
        avoidTip = 'Extremely heavy rainfall. High flooding risk in coastal areas and landslide warning in hilly districts.';
      }

      // Alternative Suggestions builder
      const getAlternatives = (pName, sName) => {
        const placeLower = (pName || '').toLowerCase();
        const stateLower = (sName || '').toLowerCase();
        const isKel = stateLower.includes('kerala') || placeLower.includes('kerala') || placeLower.includes('munnar') || placeLower.includes('wayanad') || placeLower.includes('alleppey') || placeLower.includes('kovalam') || placeLower.includes('varkala');
        
        if (isKel) {
          return [
            { name: "Ooty Botanical Garden", state: "Tamil Nadu", slug: "ooty-botanical-garden", reason: "Sunny & dry pleasant hill weather" },
            { name: "Amba Vilas Mysore Palace", state: "Karnataka", slug: "amba-vilas-mysore-palace", reason: "Pleasant heritage city walk" },
            { name: "Ooty Lake", state: "Tamil Nadu", slug: "ooty-lake", reason: "Scenic boating and clear skies" }
          ];
        }
        
        const isRaj = stateLower.includes('rajasthan') || placeLower.includes('jaipur') || placeLower.includes('jodhpur') || placeLower.includes('jaisalmer') || placeLower.includes('udaipur');
        if (isRaj) {
          return [
            { name: "Ooty Botanical Garden", state: "Tamil Nadu", slug: "ooty-botanical-garden", reason: "Cooler hill retreat away from heat" },
            { name: "Munnar Hills", state: "Kerala", slug: "munnar-hills", reason: "Lush green and cold tea plantations" },
            { name: "Ooty Lake", state: "Tamil Nadu", slug: "ooty-lake", reason: "Refreshing mountain temperatures" }
          ];
        }

        const isNorthCold = stateLower.includes('himachal') || stateLower.includes('kashmir') || stateLower.includes('ladakh') || placeLower.includes('manali') || placeLower.includes('shimla') || placeLower.includes('leh') || placeLower.includes('srinagar') || placeLower.includes('gulmarg');
        if (isNorthCold) {
          return [
            { name: "Taj Mahal", state: "Uttar Pradesh", slug: "taj-mahal", reason: "Pleasant historical walks (22°C)" },
            { name: "Meenakshi Temple", state: "Tamil Nadu", slug: "meenakshi-temple", reason: "Sunny cultural sightseeing" },
            { name: "Lalbagh Botanical Garden", state: "Karnataka", slug: "lalbagh-botanical-garden", reason: "Mild southern winter weather" }
          ];
        }

        // Fallback default
        return [
          { name: "Taj Mahal", state: "Uttar Pradesh", slug: "taj-mahal", reason: "Iconic historical monument sightseeing" },
          { name: "Ooty Botanical Garden", state: "Tamil Nadu", slug: "ooty-botanical-garden", reason: "Scenic gardens & pleasant breeze" }
        ];
      };

      const alternatives = getAlternatives(placeName, stateName || '');

      // Generate 7-Day Forecast dynamically
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      const forecast = [];

      for (let i = 1; i <= 7; i++) {
        const dayName = weekdays[(today + i) % 7];
        const tempOffset = Math.sin(i) * 2.5;
        const forecastDayTemp = Math.round(temp + tempOffset);
        
        let dayCond = condition;
        if (condition === 'Rainy' && i % 3 === 0) dayCond = 'Cloudy';
        if (condition === 'Snowy' && i % 4 === 0) dayCond = 'Cloudy';
        if (condition === 'Sunny' && i % 5 === 0) dayCond = 'Cloudy';

        forecast.push({
          day: dayName,
          temp: forecastDayTemp,
          condition: dayCond
        });
      }

      setWeatherData({
        temp,
        condition,
        humidity,
        windSpeed,
        visibility,
        uvIndex,
        sunrise,
        sunset,
        rainProbability,
        suitabilityLabel,
        alternatives,
        peakSeason,
        offSeason,
        monsoonSeason,
        recommendedMonths,
        crowdLevel,
        seasonalAdvice,
        avoidTip,
        activities,
        forecast
      });
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [coordinates, category, placeName, stateName]);

  const getConditionIcon = (cond, className = "h-6 w-6") => {
    switch (cond) {
      case 'Sunny':
        return <Sun className={`${className} text-amber-500 fill-amber-500/20`} />;
      case 'Rainy':
        return <CloudRain className={`${className} text-sky-505`} />;
      case 'Snowy':
        return <CloudSnow className={`${className} text-sky-200`} />;
      default:
        return <Cloud className={`${className} text-slate-400`} />;
    }
  };

  const getBadgeStyles = (label) => {
    switch (label) {
      case 'Ideal to Visit':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-200/30';
      case 'Not Recommended':
        return 'bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 border-rose-200/30';
      default:
        return 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border-amber-200/30';
    }
  };

  if (loading) {
    return (
      <div className="glass-card bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-200/40 dark:border-slate-800/40 shadow-sm animate-pulse space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            <div className="h-8 w-24 bg-slate-300 dark:bg-slate-800 rounded-md"></div>
          </div>
          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="glass-card bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-200/40 dark:border-slate-800/40 shadow-sm space-y-6">
      
      {/* Header and Current Conditions */}
      <div className="flex justify-between items-start">
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest flex items-center gap-1.5">
            <ThermometerSun className="h-4 w-4 text-indigo-500" />
            Live Weather & Insights
          </h3>
          <div className="flex items-center gap-3.5 mt-2.5">
            <span className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-slate-105 tracking-tight">
              {weatherData.temp}°C
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{weatherData.condition}</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{placeName}</p>
            </div>
          </div>
          {/* Dynamic Suitability badge indicator */}
          <div className="mt-2.5">
            <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getBadgeStyles(weatherData.suitabilityLabel)}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {weatherData.suitabilityLabel}
            </span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-955/40 rounded-2xl border border-slate-100 dark:border-slate-850">
          {getConditionIcon(weatherData.condition, "h-10 w-10")}
        </div>
      </div>

      {/* Weather Stats Parameters (Sunrise, Sunset, Rain Prob, Humidity, Wind, UV) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Droplets className="h-3 w-3 text-sky-400" /> Humidity
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-705 dark:text-slate-300">{weatherData.humidity}%</p>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Wind className="h-3 w-3 text-teal-400" /> Wind Speed
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-705 dark:text-slate-300">{weatherData.windSpeed} km/h</p>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <CloudRain className="h-3 w-3 text-indigo-400" /> Rain Prob.
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-indigo-650 dark:text-indigo-400">{weatherData.rainProbability}%</p>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sunrise className="h-3 w-3 text-amber-500" /> Sunrise
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-705 dark:text-slate-300">{weatherData.sunrise}</p>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sunset className="h-3 w-3 text-rose-455" /> Sunset
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-705 dark:text-slate-300">{weatherData.sunset}</p>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Eye className="h-3 w-3 text-slate-400" /> Visibility
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-705 dark:text-slate-300">{weatherData.visibility} km</p>
        </div>
      </div>

      {/* Smart Weather Travel Assistant Recommendations */}
      {weatherData.suitabilityLabel === 'Not Recommended' && weatherData.alternatives && weatherData.alternatives.length > 0 && (
        <div className="bg-rose-50/45 dark:bg-rose-955/10 border border-rose-200/40 dark:border-rose-900/20 rounded-2xl p-4 text-xs text-left space-y-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-455 font-bold">
            <AlertTriangle className="h-4.5 w-4.5" />
            <span className="text-[11px] font-black uppercase tracking-wider">Smart Weather Alert</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
            Due to unfavorable weather conditions (e.g. heavy rain or extreme temperatures) at **{placeName || 'this destination'}**, the Travel Assistant recommends these pleasant alternative destinations instead:
          </p>
          <div className="space-y-2.5 pt-1">
            {weatherData.alternatives.map((alt, idx) => (
              <Link 
                key={idx} 
                to={`/destination/${alt.slug}`}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white dark:bg-slate-900/60 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 border border-slate-150 dark:border-slate-850 rounded-xl cursor-pointer hover:border-indigo-500/20 hover:shadow-xs transition duration-300 group text-left block"
              >
                <div>
                  <strong className="text-slate-800 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors font-extrabold block">
                    {alt.name}
                  </strong>
                  <span className="text-[10px] text-slate-450 font-bold block mt-0.5">{alt.state}</span>
                </div>
                <div className="mt-1.5 sm:mt-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 px-2.5 py-1 rounded-lg text-[9px] font-bold">
                  {alt.reason}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Panel (7-Day Card) */}
      <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          7-Day Forecast Card
        </h4>
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
          {weatherData.forecast.map((day, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/10 min-w-16 flex-shrink-0 text-center space-y-2 hover:border-indigo-100/50 transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{day.day}</span>
              {getConditionIcon(day.condition, "h-5 w-5")}
              <span className="text-xs font-bold text-slate-705 dark:text-slate-200">{day.temp}°C</span>
            </div>
          ))}
        </div>
      </div>

      {/* Season Insights (Best Time to Visit) */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left space-y-3.5">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-indigo-500" />
          Best Time to Visit
        </h4>
        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Peak Season</span>
              <strong className="text-slate-750 dark:text-slate-350">{weatherData.peakSeason}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Off Season</span>
              <strong className="text-slate-750 dark:text-slate-350">{weatherData.offSeason}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Monsoon Season</span>
              <strong className="text-slate-750 dark:text-slate-350">{weatherData.monsoonSeason}</strong>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Crowd Level</span>
              <span className={`inline-block mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                weatherData.crowdLevel === 'High' 
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-205' 
                  : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-250'
              }`}>
                {weatherData.crowdLevel}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2.5">
            <div className="flex gap-2.5 items-start">
              <Info className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[9px] text-slate-400 block uppercase tracking-wider">Travel Advice</span>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{weatherData.seasonalAdvice}</p>
              </div>
            </div>
            {weatherData.avoidTip && (
              <div className="flex gap-2.5 items-start bg-red-50/30 dark:bg-red-950/10 border border-red-100/30 dark:border-red-900/20 p-2.5 rounded-xl">
                <Info className="h-4.5 w-4.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[9px] text-red-500 block font-bold uppercase tracking-wider">Safety Tip</span>
                  <p className="text-xs font-semibold text-red-655 dark:text-red-400 leading-relaxed mt-0.5">{weatherData.avoidTip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Seasonal Activities */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left space-y-3.5">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-indigo-500" />
          Recommended Seasonal Activities
        </h4>
        <div className="flex flex-wrap gap-2">
          {weatherData.activities.map((act, idx) => (
            <span 
              key={idx} 
              className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 text-xs font-bold py-1.5 px-3 rounded-xl"
            >
              {act}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

export default WeatherWidget;
