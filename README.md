# TravelBharat – Explore India State by State

TravelBharat is a premium, state-of-the-art interactive tourism platform designed to help travelers explore India's diverse landscapes and plan itineraries. It offers custom route optimization, dynamic cost estimation, real-time weather alerts, smart recommendations, destination comparisons, and a fun gamified achievement badges dashboard.

---

## 🚀 Key Features

### 1. Smart Weather Travel Assistant
- **Real-Time Forecasts**: View current temperatures, humidity levels, wind speed, UV index, and sunset/sunrise timings.
- **7-Day Weather Forecasts**: Horizontal scrolling cards display weekly trends for all tourist spots.
- **Dynamic Suitability Badges**: Places are automatically flagged as:
  - 🟢 **Ideal to Visit** (based on temperature comfort, sunny/cloudy sky, and peak seasons)
  - 🟡 **Good to Visit** (moderate conditions, post-monsoons)
  - 🔴 **Not Recommended** (heavy coastal rains, freezing winters, or extreme summer heat waves)
- **Automatic Smart Alternatives**: When weather conditions at a target location are unfavourable (🔴), the travel assistant automatically displays safer, high-quality alternatives (e.g. recommending Ooty, Coorg, or Mysore when Kerala is experiencing heavy rains).

### 2. Traveler Achievement System
- **Explorer Gamification**: Track your journey and unlock digital achievements displayed in the My Trips dashboard.
- **Badges to Unlock**:
  - 🏆 **Visited 5 States**: Explored 5+ unique states.
  - 🏆 **Visited 10 States**: Explored 10+ unique states.
  - 🏆 **Temple Explorer**: Visited/saved 3+ temples/religious landmarks.
  - 🏆 **Hill Station Lover**: Saved 3+ mountain valleys or peaks.
  - 🏆 **Beach Explorer**: Visited/saved 3+ coastal beachfronts, lakes, or backwaters.
  - 🏆 **Food Explorer**: Saved 3+ dining recommendations or local restaurants.
- **Premium Cards Grid**: Interactive grid cards built using Framer Motion with sleek gold glows and linear progress indicators.

### 3. AI Itinerary Planner & Route Optimizer
- **Automated Roadmap**: Instantly generates a day-by-day travel timeline complete with morning, afternoon, and evening recommendations.
- **Transit Optimization**: Real-time road distance and travel time calculations using the Haversine formula with a realistic road winding multiplier.
- **Full-Width Interactive Maps**: Leaflet-powered maps rendering customizable travel paths, start points (green marker), lodging hotels (blue marker), and tour stops (red markers).
- **Transport Switcher**: Instantly switch modes of transport (Car, Bus, Train, Flight) with dynamic distance, travel time, and budget ledger updates.

### 4. Destination Comparison & Tags
- **Destination Tagging**: Filter and explore destinations using curated tags (Hill Station, Beach, Heritage, Religious, Wildlife, Adventure, etc.) to ensure accurate matches.
- **Comparison Grid**: Select up to 3 destinations side-by-side to compare accessibility, entry ticket pricing, user ratings, popularity percentages, best visiting season, family-friendly scores, and adventure indices.

---

## 🛠 Technology Stack

- **Frontend**: React.js (Vite), TailwindCSS, Framer Motion, React-Leaflet (Leaflet Maps), Lucide-React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **APIs**: Reverse Geocoding (Nominatim OpenStreetMap)

---

## 📂 Folder Structure

```text
travelbharat/
├── backend/                  # Node/Express API Server
│   ├── models/               # MongoDB Mongoose Schemas (Place, State, City, Category, User)
│   ├── routes/               # Express Controllers (Auth, States, Cities, Places, BulkImport)
│   ├── curatedPlacesData.json# Database seed dataset
│   ├── server.js             # Express app entrypoint
│   └── package.json
├── frontend/                 # React client SPA
│   ├── src/
│   │   ├── components/       # Reusable components (WeatherWidget, ItineraryPlanner, RouteMap, etc.)
│   │   ├── context/          # State providers (QuickViewContext, CompareContext, ThemeContext)
│   │   ├── pages/            # Page layouts (Home, Explore, PlaceDetail, StatePage, MyTrips)
│   │   ├── App.jsx           # Main routing configuration
│   │   └── main.jsx          # Client mount entrypoint
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── LICENSE                   # MIT License
├── .gitignore                # Monorepo ignore settings
└── README.md                 # Project Documentation
```

---

## ⚙️ Installation & Running Steps

### Prerequisites
- Make sure [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) are installed on your machine.

### 1. Database Setup
1. Start your local MongoDB server (listening on port `27017`).
2. The database will automatically populate via seed files on backend startup.

### 2. Backend Installation & Run
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Boot the API server:
   ```bash
   npm run dev
   ```
   *The backend will boot up on `http://localhost:5000`.*

### 3. Frontend Installation & Run
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend application will start on `http://localhost:5173`.*

---

## 🔮 Future Enhancements
- **Multi-user authentication**: Live synchronization of personal wishlists and shared trips across multiple devices.
- **Offline Maps caching**: Cache route trajectories using Service Workers for high-altitude locations with low connectivity.
- **Direct bookings integration**: Hotkeys linking dynamically to local booking portals.

---

## 👥 Author Information
Built with ❤️ for TravelBharat. Explore the incredible heritage, nature, and culture of India!
