import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  MessageSquare, X, Send, Trash2, Mic, MicOff, 
  MapPin, HelpCircle, Calendar, DollarSign, Compass, 
  Car, Star, Eye, Sparkles, Navigation, Info, ExternalLink
} from 'lucide-react';

const QuickSuggestionChips = [
  { text: "I have ₹15,000 and 4 days.", query: "I have ₹15,000 and 4 days." },
  { text: "Suggest a honeymoon destination.", query: "Suggest a honeymoon destination." },
  { text: "Best places near Chennai.", query: "Best places near Chennai." },
  { text: "Budget trip for family.", query: "Budget trip for family." },
  { text: "Best hill stations in South India.", query: "Best hill stations in South India." },
  { text: "Places to visit during monsoon.", query: "Places to visit during monsoon." }
];

const DESTINATION_REGISTRY = [
  // Hill Stations
  {
    name: "Ooty",
    state: "Tamil Nadu",
    category: "Hill Stations",
    subcategory: "Classic Hill Station",
    region: "South",
    travelStyle: "Relaxed / Scenic",
    bestSeason: "October to June",
    budgetRange: "Mid-range",
    averageDailyCost: 3200,
    familyFriendlyScore: 9,
    adventureScore: 6,
    religiousScore: 3,
    natureScore: 9,
    tags: ["Hill Station", "Honeymoon", "Family", "Nature"],
    reason: "Pleasant climate, tea gardens, family-friendly.",
    bestTime: "October to June",
    topAttractions: ["Ooty Lake", "Botanical Gardens", "Doddabetta Peak"],
    travelDuration: "3 - 4 Days",
    whyItMatches: "It is one of the most famous hill stations in South India with tea estates and comfortable weather."
  },
  {
    name: "Kodaikanal",
    state: "Tamil Nadu",
    category: "Hill Stations",
    subcategory: "Mist & Lakes",
    region: "South",
    travelStyle: "Relaxed / Honeymoon",
    bestSeason: "September to May",
    budgetRange: "Mid-range",
    averageDailyCost: 3000,
    familyFriendlyScore: 8,
    adventureScore: 7,
    religiousScore: 2,
    natureScore: 9,
    tags: ["Hill Station", "Honeymoon", "Family", "Nature"],
    reason: "Lakes, viewpoints, honeymoon destination.",
    bestTime: "September to May",
    topAttractions: ["Kodaikanal Lake", "Coaker's Walk", "Pillar Rocks"],
    travelDuration: "3 - 4 Days",
    whyItMatches: "A scenic South Indian mountain retreat famous for its star-shaped lake and misty paths."
  },
  {
    name: "Munnar",
    state: "Kerala",
    category: "Hill Stations",
    subcategory: "Tea Estate Paradise",
    region: "South",
    travelStyle: "Scenic / Romantic",
    bestSeason: "September to May",
    budgetRange: "Mid-range",
    averageDailyCost: 3500,
    familyFriendlyScore: 8,
    adventureScore: 7,
    religiousScore: 2,
    natureScore: 10,
    tags: ["Hill Station", "Honeymoon", "Family", "Nature", "Adventure"],
    reason: "Tea plantations, waterfalls, trekking.",
    bestTime: "September to May",
    topAttractions: ["Eravikulam National Park", "Mattupetty Dam", "Anamudi Peak"],
    travelDuration: "3 - 4 Days",
    whyItMatches: "It matches your preference for lush nature trails and vast green tea estate vistas in South India."
  },
  {
    name: "Coorg",
    state: "Karnataka",
    category: "Hill Stations",
    subcategory: "Coffee Capital / Scotland of India",
    region: "South",
    travelStyle: "Nature / Adventure",
    bestSeason: "October to March",
    budgetRange: "Mid-range",
    averageDailyCost: 3400,
    familyFriendlyScore: 9,
    adventureScore: 8,
    religiousScore: 4,
    natureScore: 9,
    tags: ["Hill Station", "Nature", "Adventure", "Family", "Honeymoon"],
    reason: "Coffee estates, nature, adventure.",
    bestTime: "October to March",
    topAttractions: ["Abbey Falls", "Raja's Seat", "Dubare Elephant Camp"],
    travelDuration: "3 - 4 Days",
    whyItMatches: "Offers a rich combination of nature, aromatic coffee plantation walks, and outdoor activities."
  },
  {
    name: "Wayanad",
    state: "Kerala",
    category: "Hill Stations",
    subcategory: "Green Rainforest Getaway",
    region: "South",
    travelStyle: "Nature / Adventure",
    bestSeason: "October to May",
    budgetRange: "Budget",
    averageDailyCost: 2400,
    familyFriendlyScore: 8,
    adventureScore: 8,
    religiousScore: 2,
    natureScore: 9,
    tags: ["Hill Station", "Nature", "Adventure", "Family", "Budget"],
    reason: "Spice plantations, waterfalls, cave exploration.",
    bestTime: "October to May",
    topAttractions: ["Edakkal Caves", "Banasura Sagar Dam", "Chembra Peak"],
    travelDuration: "3 - 4 Days",
    whyItMatches: "A budget-friendly hill station in South India featuring trekking trails and natural spice groves."
  },
  {
    name: "Yercaud",
    state: "Tamil Nadu",
    category: "Hill Stations",
    subcategory: "Quiet Lake Retreat",
    region: "South",
    travelStyle: "Relaxed / Budget",
    bestSeason: "October to June",
    budgetRange: "Budget",
    averageDailyCost: 2200,
    familyFriendlyScore: 9,
    adventureScore: 5,
    religiousScore: 3,
    natureScore: 8,
    tags: ["Hill Station", "Nature", "Family", "Budget"],
    reason: "Orchards, quiet lakes, orange groves.",
    bestTime: "October to June",
    topAttractions: ["Yercaud Lake", "Lady's Seat", "Pagoda Point"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "An affordable, tranquil hill resort in South India ideal for a quick weekend getaway."
  },
  {
    name: "Araku Valley",
    state: "Andhra Pradesh",
    category: "Hill Stations",
    subcategory: "Tribal Valley & Coffee",
    region: "South",
    travelStyle: "Scenic / Cultural",
    bestSeason: "September to March",
    budgetRange: "Budget",
    averageDailyCost: 2000,
    familyFriendlyScore: 8,
    adventureScore: 6,
    religiousScore: 3,
    natureScore: 8,
    tags: ["Hill Station", "Nature", "Family", "Cultural", "Budget"],
    reason: "Scenic valleys, waterfalls, caves.",
    bestTime: "September to March",
    topAttractions: ["Borra Caves", "Araku Tribal Museum", "Katiki Waterfalls"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "A scenic valley hill station in Andhra Pradesh famous for coffee and Borra caves."
  },
  {
    name: "Coonoor",
    state: "Tamil Nadu",
    category: "Hill Stations",
    subcategory: "Quiet Tea Sanctuary",
    region: "South",
    travelStyle: "Relaxed / Scenic",
    bestSeason: "October to June",
    budgetRange: "Mid-range",
    averageDailyCost: 3100,
    familyFriendlyScore: 8,
    adventureScore: 5,
    religiousScore: 2,
    natureScore: 9,
    tags: ["Hill Station", "Nature", "Family"],
    reason: "Quiet alternative to Ooty, tea gardens, toy train.",
    bestTime: "October to June",
    topAttractions: ["Sim's Park", "Dolphin's Nose", "Lamb's Rock"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "A quieter South Indian tea-growing hill town with stunning viewpoints and botanical parks."
  },
 
  // Religious Places
  {
    name: "Tirupati",
    state: "Andhra Pradesh",
    category: "Religious Places",
    subcategory: "Venkateswara Temple",
    region: "South",
    travelStyle: "Spiritual / Family",
    bestSeason: "September to March",
    budgetRange: "Mid-range",
    averageDailyCost: 2500,
    familyFriendlyScore: 10,
    adventureScore: 2,
    religiousScore: 10,
    natureScore: 5,
    tags: ["Religious", "Family", "Spiritual"],
    reason: "Sacred Venkateswara Temple on Tirumala hills.",
    bestTime: "September to March",
    topAttractions: ["Sri Venkateswara Temple", "Silathoranam", "Kapila Theertham"],
    travelDuration: "2 Days",
    whyItMatches: "It is one of the most visited spiritual shrines in South India."
  },
  {
    name: "Rameswaram",
    state: "Tamil Nadu",
    category: "Religious Places",
    subcategory: "Jyotirlinga Temple",
    region: "South",
    travelStyle: "Spiritual / Coastal",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 2000,
    familyFriendlyScore: 9,
    adventureScore: 3,
    religiousScore: 10,
    natureScore: 7,
    tags: ["Religious", "Family", "Spiritual", "Beach"],
    reason: "Ramanathaswamy Temple, holy wells, beach bathing.",
    bestTime: "October to March",
    topAttractions: ["Ramanathaswamy Temple", "Agnitheertham", "Pamban Bridge"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "A sacred island town in Tamil Nadu, containing one of the 12 holy Jyotirlinga shrines."
  },
  {
    name: "Madurai",
    state: "Tamil Nadu",
    category: "Religious Places",
    subcategory: "Meenakshi Amman Temple",
    region: "South",
    travelStyle: "Spiritual / Cultural",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 2200,
    familyFriendlyScore: 9,
    adventureScore: 2,
    religiousScore: 10,
    natureScore: 3,
    tags: ["Religious", "Family", "Spiritual", "Heritage"],
    reason: "Stunning gopurams of Meenakshi Temple, cultural markets.",
    bestTime: "October to March",
    topAttractions: ["Meenakshi Amman Temple", "Thirumalai Nayakkar Mahal", "Gandhi Museum"],
    travelDuration: "2 Days",
    whyItMatches: "Historic temple city in Tamil Nadu famous for ancient Dravidian architecture."
  },
  {
    name: "Kashi",
    state: "Uttar Pradesh",
    category: "Religious Places",
    subcategory: "Spiritual Ghats & Temples",
    region: "North",
    travelStyle: "Spiritual / Cultural",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 1800,
    familyFriendlyScore: 8,
    adventureScore: 3,
    religiousScore: 10,
    natureScore: 4,
    tags: ["Religious", "Family", "Spiritual", "Heritage"],
    reason: "Ganga river ghats, ancient Kashi Vishwanath temple, evening Ganga Aarti.",
    bestTime: "October to March",
    topAttractions: ["Kashi Vishwanath Temple", "Dashashwamedh Ghat", "Assi Ghat"],
    travelDuration: "3 Days",
    whyItMatches: "One of the oldest continuously inhabited cities and the spiritual capital of India on the Ganges."
  },
  {
    name: "Jagannath Puri",
    state: "Odisha",
    category: "Religious Places",
    subcategory: "Chardham Temple",
    region: "East",
    travelStyle: "Spiritual / Beach",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 1900,
    familyFriendlyScore: 9,
    adventureScore: 4,
    religiousScore: 10,
    natureScore: 6,
    tags: ["Religious", "Family", "Spiritual", "Beach", "Heritage"],
    reason: "Lord Jagannath Temple, famous annual Rath Yatra, golden beaches.",
    bestTime: "October to March",
    topAttractions: ["Jagannath Temple", "Puri Beach", "Konark Sun Temple"],
    travelDuration: "3 Days",
    whyItMatches: "A sacred Chardham pilgrimage destination situated on the coast of Odisha."
  },
  {
    name: "Vaishno Devi",
    state: "Jammu and Kashmir",
    category: "Religious Places",
    subcategory: "Cave Shrine",
    region: "North",
    travelStyle: "Spiritual / Trekking",
    bestSeason: "Year-round",
    budgetRange: "Mid-range",
    averageDailyCost: 2800,
    familyFriendlyScore: 9,
    adventureScore: 6,
    religiousScore: 10,
    natureScore: 8,
    tags: ["Religious", "Family", "Spiritual", "Adventure"],
    reason: "Holy cave temple of Mata Vaishno Devi on the Trikuta Hills.",
    bestTime: "March to October (Pleasant)",
    topAttractions: ["Vaishno Devi Bhawan", "Ardh Kuwari Gufa", "Bhairon Ghati"],
    travelDuration: "3 Days",
    whyItMatches: "A highly revered mountain cave shrine in Jammu and Kashmir involving a spiritual trek."
  },
 
  // Wildlife
  {
    name: "Bandipur",
    state: "Karnataka",
    category: "Wildlife",
    subcategory: "Tiger Reserve",
    region: "South",
    travelStyle: "Adventure / Wildlife",
    bestSeason: "October to May",
    budgetRange: "Mid-range",
    averageDailyCost: 3500,
    familyFriendlyScore: 9,
    adventureScore: 8,
    religiousScore: 2,
    natureScore: 10,
    tags: ["Wildlife", "Nature", "Adventure", "Family"],
    reason: "Deciduous forests, tiger reserve, elephant sightings, jungle safaris.",
    bestTime: "October to May",
    topAttractions: ["Bandipur National Park", "Himavad Gopalaswamy Betta", "Kabini River"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "A premium wildlife national park in Karnataka ideal for spotting tigers and elephants."
  },
  {
    name: "Nagarhole",
    state: "Karnataka",
    category: "Wildlife",
    subcategory: "National Park",
    region: "South",
    travelStyle: "Adventure / Wildlife",
    bestSeason: "October to May",
    budgetRange: "Luxury",
    averageDailyCost: 5500,
    familyFriendlyScore: 9,
    adventureScore: 8,
    religiousScore: 2,
    natureScore: 10,
    tags: ["Wildlife", "Nature", "Adventure", "Family"],
    reason: "Kabini backwaters, rich wildlife safaris, leopards, elephants.",
    bestTime: "October to May",
    topAttractions: ["Nagarhole National Park", "Kabini River Safari", "Taraka Dam"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "Offers pristine forests and high-probability leopard/tiger safari sightings."
  },
  {
    name: "Jim Corbett",
    state: "Uttarakhand",
    category: "Wildlife",
    subcategory: "Tiger Reserve",
    region: "North",
    travelStyle: "Adventure / Wildlife",
    bestSeason: "November to May",
    budgetRange: "Mid-range",
    averageDailyCost: 4000,
    familyFriendlyScore: 8,
    adventureScore: 9,
    religiousScore: 2,
    natureScore: 10,
    tags: ["Wildlife", "Nature", "Adventure", "Family"],
    reason: "Bengal tigers, river valleys, jeep safaris.",
    bestTime: "November to May",
    topAttractions: ["Corbett Tiger Reserve", "Dhikala Zone", "Corbett Waterfall"],
    travelDuration: "3 - 4 Days",
    whyItMatches: "India's premier tiger sanctuary located in the foothills of Uttarakhand."
  },
  {
    name: "Kaziranga",
    state: "Assam",
    category: "Wildlife",
    subcategory: "One-horned Rhino Sanctuary",
    region: "East",
    travelStyle: "Adventure / Wildlife",
    bestSeason: "November to April",
    budgetRange: "Mid-range",
    averageDailyCost: 3200,
    familyFriendlyScore: 9,
    adventureScore: 8,
    religiousScore: 2,
    natureScore: 10,
    tags: ["Wildlife", "Nature", "Family", "Heritage"],
    reason: "UNESCO Site, home of the great one-horned rhinoceros.",
    bestTime: "November to April",
    topAttractions: ["Kaziranga National Park", "Orchid Park", "Brahmaputra River Safari"],
    travelDuration: "3 Days",
    whyItMatches: "A legendary UNESCO wildlife sanctuary in Assam famous for Rhinos and rich birdlife."
  },
  {
    name: "Periyar",
    state: "Kerala",
    category: "Wildlife",
    subcategory: "Lake & Elephant Sanctuary",
    region: "South",
    travelStyle: "Adventure / Wildlife",
    bestSeason: "October to May",
    budgetRange: "Mid-range",
    averageDailyCost: 2800,
    familyFriendlyScore: 9,
    adventureScore: 7,
    religiousScore: 2,
    natureScore: 10,
    tags: ["Wildlife", "Nature", "Family", "Adventure"],
    reason: "Scenic lake, boat cruises, wild elephants, spice gardens.",
    bestTime: "October to May",
    topAttractions: ["Periyar National Park", "Periyar Lake Boat Cruise", "Mangala Devi Temple"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "A scenic wildlife reserve in Kerala where you can watch elephants from lake cruises."
  },
 
  // Beaches
  {
    name: "Goa",
    state: "Goa",
    category: "Beaches",
    subcategory: "Sandy Beaches & Forts",
    region: "West",
    travelStyle: "Relaxed / Coastal",
    bestSeason: "November to February",
    budgetRange: "Mid-range",
    averageDailyCost: 3800,
    familyFriendlyScore: 8,
    adventureScore: 8,
    religiousScore: 3,
    natureScore: 8,
    tags: ["Beach", "Adventure", "Honeymoon", "Family"],
    reason: "Pristine white sand beaches, fort viewpoints, water sports.",
    bestTime: "November to February",
    topAttractions: ["Baga Beach", "Basilica of Bom Jesus", "Fort Aguada"],
    travelDuration: "3 - 5 Days",
    whyItMatches: "India's ultimate beach capital featuring historical heritage and marine adventures."
  },
  {
    name: "Varkala",
    state: "Kerala",
    category: "Beaches",
    subcategory: "Cliff Beach",
    region: "South",
    travelStyle: "Relaxed / Scenic",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 2200,
    familyFriendlyScore: 8,
    adventureScore: 6,
    religiousScore: 3,
    natureScore: 9,
    tags: ["Beach", "Nature", "Budget"],
    reason: "Arabian Sea cliffs, natural springs, cafes.",
    bestTime: "October to March",
    topAttractions: ["Varkala Cliff Beach", "Janardanaswamy Temple", "Kapil Lake"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "A unique cliff-backed coastal destination in Kerala with budget-friendly sea views."
  },
  {
    name: "Kovalam",
    state: "Kerala",
    category: "Beaches",
    subcategory: "Lighthouse Beach",
    region: "South",
    travelStyle: "Relaxed / Coastal",
    bestSeason: "September to March",
    budgetRange: "Mid-range",
    averageDailyCost: 3000,
    familyFriendlyScore: 9,
    adventureScore: 7,
    religiousScore: 2,
    natureScore: 8,
    tags: ["Beach", "Family"],
    reason: "Crescent beaches, iconic lighthouse, calm waters.",
    bestTime: "September to March",
    topAttractions: ["Lighthouse Beach", "Hawa Beach", "Samudra Beach"],
    travelDuration: "3 Days",
    whyItMatches: "A family-friendly sandy beach resort area in Kerala with tranquil swimming waters."
  },
  {
    name: "Gokarna",
    state: "Karnataka",
    category: "Beaches",
    subcategory: "Scenic Trek Beaches",
    region: "South",
    travelStyle: "Relaxed / Adventure",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 2000,
    familyFriendlyScore: 8,
    adventureScore: 8,
    religiousScore: 6,
    natureScore: 9,
    tags: ["Beach", "Adventure", "Religious", "Spiritual", "Budget"],
    reason: "Om-shaped beaches, beach trekking, temples, cafes.",
    bestTime: "October to March",
    topAttractions: ["Om Beach", "Mahabaleshwar Temple", "Kudle Beach"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "An active beach trekking destination in Karnataka, mixing spiritual spots with serene bays."
  },
  {
    name: "Puri",
    state: "Odisha",
    category: "Beaches",
    subcategory: "Golden Beach",
    region: "East",
    travelStyle: "Spiritual / Coastal",
    bestSeason: "October to March",
    budgetRange: "Budget",
    averageDailyCost: 1900,
    familyFriendlyScore: 9,
    adventureScore: 4,
    religiousScore: 9,
    natureScore: 7,
    tags: ["Beach", "Religious", "Spiritual", "Family"],
    reason: "Golden sand beaches, close to Jagannath Temple.",
    bestTime: "October to March",
    topAttractions: ["Puri Beach", "Swargadwar Beach", "Raghurajpur Crafts Village"],
    travelDuration: "2 - 3 Days",
    whyItMatches: "Matches your query for sea coastlines in Eastern India with holy temple surroundings."
  },
  {
    name: "Andaman",
    state: "Andaman and Nicobar Islands",
    category: "Beaches",
    subcategory: "Coral Reefs & Island Beaches",
    region: "Islands",
    travelStyle: "Relaxed / Luxury",
    bestSeason: "October to May",
    budgetRange: "Luxury",
    averageDailyCost: 7500,
    familyFriendlyScore: 9,
    adventureScore: 9,
    religiousScore: 1,
    natureScore: 10,
    tags: ["Beach", "Nature", "Adventure", "Honeymoon", "Family"],
    reason: "Coral reefs, Radhanagar Beach, scuba diving.",
    bestTime: "October to May",
    topAttractions: ["Radhanagar Beach (Havelock)", "Ross Island", "Cellular Jail"],
    travelDuration: "5 - 7 Days",
    whyItMatches: "Pristine crystal-clear island beaches and world-class coral reef scuba diving in India."
  }
];

// Simple bold text formatting helper
const renderMessageText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-indigo-750 dark:text-indigo-400">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const Chatbot = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // States
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Database lookup pools
  const [allPlaces, setAllPlaces] = useState([]);
  const [allStates, setAllStates] = useState([]);

  // Speech Recognition ref
  const recognitionRef = useRef(null);

  // Load chat history and database pools
  useEffect(() => {
    // 1. Fetch places & states
    const loadBotData = async () => {
      try {
        const [placesRes, statesRes] = await Promise.all([
          axios.get(`${window.API_BASE_URL}/api/places`),
          axios.get(`${window.API_BASE_URL}/api/states`)
        ]);
        setAllPlaces(placesRes.data);
        setAllStates(statesRes.data);
      } catch (err) {
        console.error("Chatbot failed to load database registries", err);
      }
    };
    loadBotData();

    // 2. Chat history sync
    const savedChat = localStorage.getItem('travelbharat_chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default welcome greeting
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: 'Namaste! 🇮🇳 I am your TravelBharat AI Assistant. Ask me to find the perfect destination based on your budget, days, style, or starting location!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    // 3. Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
      };
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
        }
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Sync state to LocalStorage
  const saveChatHistory = (list) => {
    localStorage.setItem('travelbharat_chat_history', JSON.stringify(list));
  };

  // Autoscroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Voice recognition toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Clear Chat history
  const handleClearChat = () => {
    const defaultMsg = [
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Namaste! 🇮🇳 I am your TravelBharat AI Assistant. Ask me to find the perfect destination based on your budget, days, style, or starting location!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
    saveChatHistory(defaultMsg);
  };

  // Smart Recommendation Engine Parser
  const runRecommendationEngine = (queryText) => {
    const text = queryText.toLowerCase();

    // 1. Detect Category Intent explicitly
    let detectedCategory = null;
    const isHillStation = text.includes('hill station') || text.includes('hill stations') || text.includes('mountain') || text.includes('hills') || text.includes('hillstation') || text.includes('hillstations') || text.includes('highlands');
    const isReligious = text.includes('religious') || text.includes('temple') || text.includes('temples') || text.includes('spiritual') || text.includes('pilgrimage') || text.includes('pilgrimages') || text.includes('shrine') || text.includes('shrines') || text.includes('sacred') || text.includes('holy');
    const isWildlife = text.includes('wildlife') || text.includes('safari') || text.includes('safaris') || text.includes('forest') || text.includes('national park') || text.includes('national parks') || text.includes('tiger') || text.includes('rhino') || text.includes('animals') || text.includes('animal') || text.includes('sanctuary') || text.includes('sanctuaries');
    const isBeach = text.includes('beach') || text.includes('beaches') || text.includes('coast') || text.includes('coasts') || text.includes('sea') || text.includes('seas') || text.includes('sand') || text.includes('coastal') || text.includes('shore') || text.includes('shores') || text.includes('ocean');

    if (isHillStation) {
      detectedCategory = 'Hill Stations';
    } else if (isReligious) {
      detectedCategory = 'Religious Places';
    } else if (isWildlife) {
      detectedCategory = 'Wildlife';
    } else if (isBeach) {
      detectedCategory = 'Beaches';
    } else {
      // Check if query contains specific destination name, and infer category from it
      const matchedDest = DESTINATION_REGISTRY.find(d => text.includes(d.name.toLowerCase()));
      if (matchedDest) {
        detectedCategory = matchedDest.category;
      }
    }

    // 1.1 Detect specific destination tags from the tagging system
    const detectedTags = [];
    if (isHillStation) detectedTags.push("Hill Station");
    if (isBeach) detectedTags.push("Beach");
    if (isReligious || text.includes('temple') || text.includes('temples') || text.includes('spiritual') || text.includes('pilgrimage')) detectedTags.push("Religious");
    if (isWildlife || text.includes('safari') || text.includes('national park') || text.includes('national parks') || text.includes('forest')) detectedTags.push("Wildlife");
    
    // Additional tags
    if (text.includes('heritage') || text.includes('fort') || text.includes('palace') || text.includes('ruin') || text.includes('ancient') || text.includes('history') || text.includes('historical') || text.includes('monument')) {
      detectedTags.push("Heritage");
    }
    if (text.includes('adventure') || text.includes('trekking') || text.includes('trek') || text.includes('rafting') || text.includes('sports') || text.includes('hiking')) {
      detectedTags.push("Adventure");
    }
    if (text.includes('honeymoon') || text.includes('romantic') || text.includes('couple') || text.includes('romantic getaway')) {
      detectedTags.push("Honeymoon");
    }
    if (text.includes('family') || text.includes('kids') || text.includes('children') || text.includes('parents') || text.includes('picnic')) {
      detectedTags.push("Family");
    }
    if (text.includes('nature') || text.includes('scenic') || text.includes('viewpoint') || text.includes('valley') || text.includes('greenery') || text.includes('waterfall') || text.includes('falls')) {
      detectedTags.push("Nature");
    }
    if (text.includes('budget') || text.includes('cheap') || text.includes('affordable')) {
      detectedTags.push("Budget");
    }

    // 2. Parse budget constraints
    let budgetLimit = null;
    const thousandMatch = text.match(/(\d+)\s*k\b/i);
    const rawNumberMatch = text.match(/(?:rs\.?|₹|inr)?\s*(\d{1,3}(?:,\d{3})+|\d{4,6})\b/i);
    if (thousandMatch) {
      budgetLimit = parseInt(thousandMatch[1]) * 1000;
    } else if (rawNumberMatch) {
      budgetLimit = parseInt(rawNumberMatch[1].replace(/,/g, ''));
    }

    // 3. Parse duration days
    let durationDays = null;
    const daysMatch = text.match(/\b(\d+)\s*(?:day|days|d)\b/i);
    if (daysMatch) {
      durationDays = parseInt(daysMatch[1]);
    }

    // 4. Parse location / region / state
    let region = null;
    if (text.includes('south india') || text.includes('southern india') || text.includes('near chennai') || text.includes('from chennai') || text.includes('around chennai') || text.includes('near bangalore') || text.includes('kerala') || text.includes('tamil nadu') || text.includes('karnataka') || text.includes('andhra')) {
      region = 'South';
    } else if (text.includes('north india') || text.includes('northern india') || text.includes('near delhi') || text.includes('from delhi') || text.includes('around delhi') || text.includes('kashmir') || text.includes('uttarakhand') || text.includes('himachal')) {
      region = 'North';
    } else if (text.includes('east india') || text.includes('eastern india') || text.includes('odisha') || text.includes('assam') || text.includes('sikkim')) {
      region = 'East';
    } else if (text.includes('west india') || text.includes('western india') || text.includes('goa') || text.includes('mumbai') || text.includes('gujarat')) {
      region = 'West';
    }

    // 5. Filter the registry based on detected category
    let filteredList = DESTINATION_REGISTRY;
    if (detectedCategory) {
      filteredList = DESTINATION_REGISTRY.filter(d => d.category === detectedCategory);
    }

    // Apply strict tagging filter: must match ALL detected tags if possible, or fall back to matching ANY
    if (detectedTags.length > 0) {
      let tagMatchAll = filteredList.filter(d => 
        detectedTags.every(t => d.tags.includes(t))
      );
      if (tagMatchAll.length === 0) {
        tagMatchAll = filteredList.filter(d => 
          detectedTags.some(t => d.tags.includes(t))
        );
      }
      if (tagMatchAll.length > 0) {
        filteredList = tagMatchAll;
      }
    }

    // Apply Location / Region filtering as a soft fallback filter
    if (region) {
      const regionMatch = filteredList.filter(d => d.region === region);
      if (regionMatch.length > 0) {
        filteredList = regionMatch;
      }
    }

    // Apply Budget filtering if specified
    if (budgetLimit) {
      const calcDuration = durationDays || 3;
      const budgetMatch = filteredList.filter(d => {
        const estTotalCost = d.averageDailyCost * calcDuration;
        return estTotalCost <= budgetLimit;
      });
      if (budgetMatch.length > 0) {
        filteredList = budgetMatch;
      }
    }

    // Suitability Scoring for final sorting
    filteredList = filteredList.map(item => {
      let score = 50; // base score

      // Name matches
      if (text.includes(item.name.toLowerCase())) score += 100;

      // Add score for each matching detected tag
      detectedTags.forEach(t => {
        if (item.tags.includes(t)) {
          score += 35;
        }
      });

      // Budget preference terms
      if (text.includes('budget') || text.includes('cheap') || text.includes('affordable') || text.includes('low cost')) {
        if (item.budgetRange === 'Budget') score += 40;
        else if (item.budgetRange === 'Mid-range') score += 10;
        else score -= 20;
      } else if (text.includes('luxury') || text.includes('premium') || text.includes('expensive')) {
        if (item.budgetRange === 'Luxury') score += 40;
        else if (item.budgetRange === 'Mid-range') score += 10;
        else score -= 20;
      }

      // Duration preference matching
      if (durationDays) {
        const matches = item.travelDuration.match(/\d+/g);
        if (matches) {
          const minD = parseInt(matches[0]);
          const maxD = matches[1] ? parseInt(matches[1]) : minD;
          if (durationDays >= minD && durationDays <= maxD) {
            score += 30;
          } else if (Math.abs(durationDays - minD) <= 1) {
            score += 15;
          }
        }
      }

      // Season preference matching
      if (text.includes('monsoon') || text.includes('rain') || text.includes('rains')) {
        if (item.state === 'Kerala' || item.state === 'Goa' || item.name === 'Munnar' || item.name === 'Coorg') {
          score += 40;
        }
      } else if (text.includes('summer') || text.includes('hot') || text.includes('april') || text.includes('may') || text.includes('june')) {
        if (item.category === 'Hill Stations') score += 30;
      } else if (text.includes('winter') || text.includes('cold') || text.includes('december') || text.includes('january') || text.includes('february')) {
        if (item.category === 'Beaches' || item.name === 'Kashi' || item.name === 'Tirupati') score += 30;
      }

      // Travel Style preference matching
      if (text.includes('honeymoon') || text.includes('romantic') || text.includes('couple') || text.includes('wife')) {
        if (item.travelStyle.toLowerCase().includes('romantic') || item.travelStyle.toLowerCase().includes('honeymoon')) score += 45;
      }
      if (text.includes('family') || text.includes('kids') || text.includes('parents')) {
        score += item.familyFriendlyScore * 4;
      }
      if (text.includes('adventure') || text.includes('trekking') || text.includes('trek')) {
        score += item.adventureScore * 4;
      }
      if (text.includes('religious') || text.includes('spiritual') || text.includes('temple') || text.includes('pilgrimage')) {
        score += item.religiousScore * 4;
      }
      if (text.includes('nature') || text.includes('scenic') || text.includes('peaceful') || text.includes('quiet')) {
        score += item.natureScore * 4;
      }

      return { ...item, suitabilityScore: score };
    });

    // Sort by score descending
    filteredList.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    // If a category intent was explicitly requested, return all matching destinations in it.
    // Otherwise return top 4 recommendations.
    const limit = (detectedCategory || detectedTags.includes("Hill Station") || detectedTags.includes("Beach") || detectedTags.includes("Religious") || detectedTags.includes("Wildlife")) ? 8 : 4;
    const recommendations = filteredList.slice(0, limit);

    if (recommendations.length === 0) {
      return {
        textResponse: "I couldn't find any destinations matching your criteria. Try adjusting your category or style preferences!",
        bestMatchCard: null
      };
    }

    // Build the formatted text response
    let textResponse = `Here are the best ${detectedCategory || (detectedTags.length > 0 ? detectedTags.join(' & ') : 'travel')} options matching your query:\n\n`;
    
    recommendations.forEach((rec, idx) => {
      const calcDuration = durationDays || 4;
      
      textResponse += `${idx + 1}. **${rec.name} (${rec.state})**\n`;
      textResponse += `   Reason: ${rec.reason}\n`;
      textResponse += `   Budget: ₹${(rec.averageDailyCost * calcDuration).toLocaleString()} - ₹${((rec.averageDailyCost + 800) * calcDuration).toLocaleString()} (${rec.budgetRange})\n`;
      textResponse += `   Best Time: ${rec.bestTime}\n`;
      textResponse += `   Top Attractions: ${rec.topAttractions.join(', ')}\n`;
      textResponse += `   Travel Duration: ${rec.travelDuration}\n`;
      textResponse += `   Why It Matches User Query: ${rec.whyItMatches}\n\n`;
    });

    // Build the best match structured preview card
    const bestMatch = recommendations[0];
    const dbMatch = allPlaces.find(p => p.name.toLowerCase() === bestMatch.name.toLowerCase());
    
    const cardDuration = durationDays || 4;
    const cardCost = bestMatch.averageDailyCost * cardDuration + 3000;
    const transportType = cardDuration > 5 || cardCost > 25000 ? 'Flight + Cab' : (region ? 'Train + Cab' : 'Volvo Bus / Cab');

    const bestMatchCard = {
      destinationName: bestMatch.name,
      destinationSlug: dbMatch?.slug || bestMatch.name.toLowerCase().replace(/\s+/g, '-'),
      stateName: bestMatch.state,
      reason: bestMatch.reason,
      estimatedCost: cardCost,
      transport: transportType,
      duration: `${cardDuration} Days`,
      bestSeason: bestMatch.bestTime,
      travelStyleMatch: bestMatch.travelStyle.toUpperCase(),
      attractions: bestMatch.topAttractions,
      itinerary: [
        `Day 1: Arrive in ${bestMatch.name}, check into stay, and experience sunset at ${bestMatch.topAttractions[0]}.`,
        `Day 2: Morning visit to ${bestMatch.topAttractions[1]}, explore local traditional cuisine.`,
        `Day 3: Trek or take sightseeing rides to ${bestMatch.topAttractions[2]}.`,
        `Day 4: Checkout from stay and head out on your return route.`
      ].slice(0, cardDuration)
    };

    return {
      textResponse,
      bestMatchCard
    };
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add User Message
    const userMsg = {
      id: Date.now() + '-user',
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputValue('');
    saveChatHistory(updated);
    setIsTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      const recResult = runRecommendationEngine(text);
      const botMsg = {
        id: Date.now() + '-bot',
        sender: 'bot',
        text: recResult.textResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // Structured payload
        recommendation: recResult.bestMatchCard
      };
      
      const nextList = [...updated, botMsg];
      setMessages(nextList);
      setIsTyping(false);
      saveChatHistory(nextList);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4.5 shadow-2xl flex items-center justify-center border border-indigo-500/20 cursor-pointer relative"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6.5 w-6.5" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageSquare className="h-6.5 w-6.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse notification badge if unopened */}
          {!isOpen && messages.length <= 1 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-black text-white items-center justify-center">1</span>
            </span>
          )}
        </motion.button>
      </div>

      {/* 2. CHAT DRAWER CONTAINER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-24 right-6 w-[340px] sm:w-[410px] h-[580px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-805/85 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden text-left"
          >
            {/* Chat Header */}
            <div className="bg-indigo-650 p-4 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <Sparkles className="h-5 w-5 text-indigo-200 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">AI Travel Assistant</h3>
                  <span className="text-[9px] uppercase font-bold text-indigo-200 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Online Guide
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 relative z-10">
                {/* Clear Chat Button */}
                <button
                  onClick={handleClearChat}
                  title="Clear chat history"
                  className="p-1.5 rounded-lg hover:bg-white/15 text-indigo-100 hover:text-white transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-indigo-100 hover:text-white transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-4 bg-slate-50/50 dark:bg-slate-955/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'user' ? (
                    
                    /* USER TEXT MESSAGE */
                    <div className="max-w-[85%] bg-indigo-600 text-white font-semibold text-xs py-2.5 px-4 rounded-2xl rounded-tr-none shadow-md">
                      {msg.text}
                      <span className="block text-[8px] text-indigo-200 font-bold mt-1 text-right">{msg.timestamp}</span>
                    </div>

                  ) : (

                    /* BOT RESPONSES */
                    <div className="max-w-[90%] space-y-2">
                      {msg.text && (
                        <div className="bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-200/40 dark:border-slate-800 font-medium text-xs py-2.5 px-4 rounded-2xl rounded-tl-none shadow-xs whitespace-pre-wrap leading-relaxed">
                          {renderMessageText(msg.text)}
                          <span className="block text-[8px] text-slate-450 font-bold mt-1">{msg.timestamp}</span>
                        </div>
                      )}

                      {/* AI Structured Recommendation Card */}
                      {msg.recommendation && (
                        <div className="bg-white/90 dark:bg-slate-850/90 border border-slate-205 dark:border-slate-800 rounded-2xl p-4 shadow-md space-y-4 text-xs">
                          
                          {/* Recommended Destination banner */}
                          <div className="flex justify-between items-start pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold py-0.5 px-2 rounded-md uppercase tracking-wider">
                                {msg.recommendation.travelStyleMatch || 'RECOMMENDED'}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-850 dark:text-white mt-1">
                                Recommended: {msg.recommendation.destinationName || ''}
                              </h4>
                              <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">{msg.recommendation.stateName || ''}</p>
                            </div>
                            <Link 
                              to={`/destination/${msg.recommendation.destinationSlug || ''}`}
                              onClick={() => setIsOpen(false)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 px-3 rounded-lg text-[10px] transition flex items-center gap-0.5"
                            >
                              Explore <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>

                          {/* Reason */}
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Why Visit</span>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                              {msg.recommendation.reason || ''}
                            </p>
                          </div>

                          {/* Logistics metrics */}
                          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-955/20 p-3 rounded-xl border border-slate-150/40 dark:border-slate-850">
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Estimated Cost</span>
                              <strong className="text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold">₹{(msg.recommendation.estimatedCost || 0).toLocaleString()}</strong>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Duration</span>
                              <strong className="text-slate-700 dark:text-slate-200 text-[11px] font-extrabold">{msg.recommendation.duration || ''}</strong>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Best Season</span>
                              <strong className="text-amber-600 dark:text-amber-500 text-[11px] font-extrabold">
                                {msg.recommendation.bestSeason ? msg.recommendation.bestSeason.split(' ')[0] : ''}
                              </strong>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Transport</span>
                              <strong className="text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {msg.recommendation.transport || ''}
                              </strong>
                            </div>
                          </div>

                          {/* Attractions list */}
                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Top Attractions</span>
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {(msg.recommendation.attractions || []).map((attr, idx) => (
                                <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                                  {attr}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Suggested Itinerary timeline */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[8px] text-slate-450 block uppercase tracking-wider font-bold">Suggested Daily Itinerary</span>
                            <div className="space-y-1.5 pl-2 border-l border-indigo-200 dark:border-slate-850">
                              {(msg.recommendation.itinerary || []).map((dayLine, i) => (
                                <p key={i} className="text-[10px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                                  {dayLine}
                                </p>
                              ))}
                            </div>
                          </div>
                          <span className="block text-[8px] text-slate-450 font-bold text-right pt-1">{msg.timestamp}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing loader indicators */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-850 border border-slate-200/40 dark:border-slate-800 py-3 px-4.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips (above input) */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-850 overflow-x-auto flex gap-1.5 scrollbar-none flex-shrink-0 bg-white dark:bg-slate-900">
              {QuickSuggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/60 dark:border-slate-850/80 text-slate-650 dark:text-slate-350 text-[10px] font-bold px-3 py-1.5 rounded-full flex-shrink-0 cursor-pointer select-none transition"
                >
                  {chip.text}
                </button>
              ))}
            </div>

            {/* Input Message Area */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-850 flex items-center gap-2 flex-shrink-0 bg-white dark:bg-slate-900">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your budget/duration/questions..."
                className="w-full text-xs font-semibold py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-850 focus:border-indigo-500 transition"
              />

              {/* Speech Recognition Mic */}
              <button
                onClick={toggleListening}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isListening 
                    ? 'bg-rose-500 border-rose-600 text-white animate-pulse' 
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-955 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-850 text-slate-550 dark:text-slate-400'
                }`}
                title={isListening ? "Listening... click to stop" : "Start voice typing"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="p-2.5 bg-indigo-650 hover:bg-indigo-750 disabled:bg-slate-100 dark:disabled:bg-slate-950 text-white disabled:text-slate-400 rounded-xl transition cursor-pointer flex-shrink-0 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
