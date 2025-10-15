// Global variable for the map
let map;

// Hardcoded earnings data from CSV - updated with latest data
const locationEarningsData = {
    'ASSEMBLY - AMPHITHEATER': 0.69,
    'ASSEMBLY - AMUSEMENT PARK': 0.2,
    'ASSEMBLY - ARENA': 0.13,
    'ASSEMBLY - BAR': 0.18,
    'ASSEMBLY - COFFEE SHOP': 0.13,
    'ASSEMBLY - CONVENTION CENTER': 0.086,
    'ASSEMBLY - LIBRARY': 0.34,
    'ASSEMBLY - MUSEUM': 0.28,
    'ASSEMBLY - PASSENGER TERMINAL (E.G., AIRPORT, BUS, FERRY, TRAIN STATION)': 0.35,
    'ASSEMBLY - PLACE OF WORSHIP': 0.27,
    'ASSEMBLY - RESTAURANT': 0.18,
    'ASSEMBLY - THEATER': 0.39,
    'ASSEMBLY - UNSPECIFIED ASSEMBLY': 0.14,
    'BUSINESS - ATTORNEY OFFICE': 0.14,
    'BUSINESS - BANK': 0.6,
    'BUSINESS - DOCTOR OR DENTIST OFFICE': 0.2,
    'BUSINESS - FIRE STATION': 0.17,
    'BUSINESS - POST OFFICE': 0.23,
    'BUSINESS - PROFESSIONAL OFFICE': 0.19,
    'BUSINESS - RESEARCH AND DEVELOPMENT FACILITY': 0.18,
    'BUSINESS - UNSPECIFIED BUSINESS': 0.23,
    'EDUCATIONAL - SCHOOL, PRIMARY': 0.087,
    'EDUCATIONAL - SCHOOL, SECONDARY': 0.087,
    'EDUCATIONAL - UNIVERSITY OR COLLEGE': 0.073,
    'EDUCATIONAL - UNSPECIFIED EDUCATIONAL': 0.23,
    'FACTORY-INDUSTRIAL - FACTORY': 0.043,
    'FACTORY-INDUSTRIAL - UNSPECIFIED FACTORY AND INDUSTRIAL': 0.095,
    'INSTITUTIONAL - GROUP HOME': 0.12,
    'INSTITUTIONAL - LONG-TERM CARE FACILITY (E.G., NURSING HOME, HOSPICE, ETC.)': 0.27,
    'INSTITUTIONAL - UNSPECIFIED INSTITUTIONAL': 0.097,
    'MERCANTILE - AUTOMOTIVE SERVICE STATION': 0.23,
    'MERCANTILE - GAS STATION': 0.053,
    'MERCANTILE - GROCERY MARKET': 0.04,
    'MERCANTILE - RETAIL STORE': 0.16,
    'MERCANTILE - SHOPPING MALL': 0.28,
    'MERCANTILE - UNSPECIFIED MERCANTILE': 0.31,
    'OUTDOOR - CITY PARK': 0.11,
    'OUTDOOR - MUNI-MESH NETWORK': 0.24,
    'OUTDOOR - REST AREA': 0.09,
    'OUTDOOR - TRAFFIC CONTROL': 0.092,
    'OUTDOOR - UNSPECIFIED OUTDOOR': 0.18,
    'RESIDENTIAL - BOARDING HOUSE': 0.16,
    'RESIDENTIAL - DORMITORY': 0.07,
    'RESIDENTIAL - HOTEL OR MOTEL': 0.22,
    'RESIDENTIAL - PRIVATE RESIDENCE': 0.1,
    'RESIDENTIAL - UNSPECIFIED RESIDENTIAL': 0.11,
    'STORAGE - UNSPECIFIED STORAGE': 0.16
};

// Generate or retrieve a unique identifier for the session
function getSessionId() {
    // Check if a session ID already exists
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        // If not, generate a new one and store it
        sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
}

async function determineLocationType(lat, lon) {
    const reverseGeocodeUrl = `https://nominatim-proxy.russ-162.workers.dev/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    // Get the unique session ID for the header
    const sessionId = getSessionId();

    try {
        const response = await fetch(reverseGeocodeUrl, {
            headers: { 
                "User-Agent": `offload map - ${sessionId}`
            }
        });
        const locationData = await response.json();

        const className = locationData.class || "";
        const typeName = locationData.type || "";

        const locationType = classifyLocation(className, typeName);
        displayLocationType(locationType);
    } catch (error) {
        console.error("Error fetching location type:", error);
        document.getElementById("location-status").textContent = "Error determining location type";
    }
}

function classifyLocation(className, typeName) {
    // Log the class and type of the location to the console
    console.log("Location Class:", className);
    console.log("Location Type:", typeName);
    const residentialClasses = {
        "building": ["apartments", "block", "dormitory", "flats", "house", "home", "residential", "terrace", "yes", "detached", "construction", "semidetached_house", "static_caravan"],
        "place": ["apartments", "block", "dormitory", "flats", "house", "residential", "terrace", "yes"],
        "highway": ["residential", "cycleway", "tertiary", "footway", "living_street", "construction", "bridleway", "elevator", "raceway"],
        "amenity": ["dormitory", "trailer_park", "events_venue"],
        "landuse": ["residential", "farmyard"],
        "leisure": ["garden", "recreation_ground", "fitness_station", "slipway"],
        "historic": ["heritage"],
        "club": ["religion"]
    };

    const businessClasses = {
        "aerialway": ["yes"],
        "military": ["yes", "base", "training_area"],
        "man_made": ["bridge", "tower", "flagpole", "pier", "manhole", "mast", "works", "tunnel", "water_tower", "wastewater_plant", "storage_tank", "silo", "petroleum_well", "water_tower", "flare", "surveillance", "reservoir_covered", "chimney", "lighthouse", "water_works"],
        "shop": ["money_lender", "convenience", "tattoo", "shoes", "funeral_directors", "mall", "clothes", "locksmith", "tobacco", "supermarket", "hunting",
            "car_repair", "jewelry", "music", "mobile_phone", "houseware", "car", "car_parts", "department_store", "deli", "dry_cleaning", "laundry",
            "fortune_teller", "chemist", "hearing_aids", "yes", "furniture", "newsagent", "hairdresser", "party", "car_rental", "beauty", "cannabis",
            "country_store", "rental", "dental_supplies", "motorcycle", "bicycle", "lighting", "alcohol", "variety_store", "garden_centre", "trade",
            "doityourself", "radiotechnics", "art", "motorcycle_repair", "stationery", "tyres", "boutique", "beverages", "health_food", "toys",
            "sports", "bakery", "gift", "wholesale", "caravan", "electronics", "copyshop", "e-cigarette", "storage_rental", "erotic", "antiques",
            "vacant", "cosmetics", "yes", "optician", "charity", "books", "kitchen", "online", "fuel", "repair", "paint", "hardware", "craft", "watches", "florist", "clothes;_wedding", "hairdresser_supply", "weapons"],
        "highway": ["primary", "secondary", "trunk", "service", "motorway", "bus_stop", "pedestrian", "primary_link", "unclassified", "path", "track",
            "motorway_junction", "services", "trunk_link", "steps", "turning_loop", "motorway_link", "toll_gantry"],
        "tourism": ["attraction", "hotel", "artwork", "motel", "museum", "viewpoint", "picnic_site", "gallery", "apartment", "theme_park", "camp_site", "zoo", "aquarium", "caravan_site"],
        "historic": ["factory", "district", "building", "park", "maritime", "memorial", "cemetery", "locomotive", "tomb", "ruins", "heritage"],
        "craft": ["plumber", "brewery", "hvac", "insulation", "stonemason", "electronics_repair", "welder", "window_construction", "upholsterer"],
        "healthcare": ["rehabilitation", "optometrist", "alternative", "nurse"],
        "office": ["yes", "ngo", "tax_advisor", "estate_agent", "company", "coworking", "telecommunication", "government", "lawyer", "insurance",
            "accountant", "association", "property_management", "financial", "therapist", "educational_institution", "consulting", "software", "it"],
        "building": ["commercial", "church", "garage", "hospital", "hotel", "industrial", "office", "public", "retail", "school", "shop", "stadium",
            "store", "train_station", "university", "mixed", "storage", "warehouse", "civic", "transportation", "government", "fire_station", "parking"],
        "amenity": [
            "airport", "arts_centre", "atm", "auditorium", "bank", "bar", "bicycle_parking", "bicycle_rental", "brothel", "bureau_de_change",
            "bus_station", "cafe", "car_rental", "car_wash", "casino", "cinema", "club", "college", "community_centre", "courthouse",
            "crematorium", "dentist", "doctors", "driving_school", "embassy", "fast_food", "ferry_terminal", "fuel", "grave_yard",
            "hall", "health_centre", "hospital", "hotel", "ice_cream", "library", "market", "marketplace", "nightclub", "office",
            "park", "parking", "pharmacy", "place_of_worship", "police", "post_office", "pub", "reception_area", "restaurant", "sauna",
            "shop", "shopping", "social_club", "studio", "supermarket", "taxi", "theatre", "townhall", "veterinary", "youth_centre",
            "kindergarten", "nursery", "nursing_home", "preschool", "retirement_home", "school", "university", "waste_disposal", "post_box",
            "clinic", "conference_centre", "food_court", "social_centre", "waste_basket", "parking_entrance", "car_wash", "college",
            "bicycle_parking", "bus_station", "social_centre", "casino", "conference_centre", "food_court", "marketplace", "fast_food",
            "dentist", "school", "waste_disposal", "restaurant", "university", "arts_centre", "bar", "pharmacy", "place_of_worship",
            "bench", "parking", "fire_station", "loading_dock", "parking_space", "bicycle_repair_station", "toilets", "shelter",
            "animal_boarding", "childcare", "social_facility", "recycling", "fountain", "research_institute", "animal_shelter",
            "telephone", "vending_machine", "lifeguard", "drinking_water", "reception_desk", "paint", "post_depot", "money_transfer", "events_venue", "prison", "charging_station", "shower"],
        "landuse": ["commercial", "construction", "industrial"],
        "aeroway": ["terminal", "aerodrome", "hangar", "apron", "holding_position", "runway", "windsock", "navigationaid"],
        "railway": ["platform", "signal_box", "stop", "station", "junction", "subway_entrance", "yard", "service_station"],
        "leisure": ["fitness_centre", "playground", "pitch", "common", "golf_course", "swimming_pool", "sports_centre", "dog_park", "outdoor_seating",
            "marina", "nature_reserve", "stadium", "village_green", "psychic", "picnic_table", "disc_golf_course", "bowling_alley", "track",
            "recreation_ground", "slipway", "ice_rink", "water_park", "amusement_arcade", "trampoline_park", "resort", "swimming_area"],
        "boundary": ["administrative"],
        "junction": ["yes"],
        "emergency": ["phone", "assembly_point", "lifeguard", "ambulance_station", "psap"],
        "club": ["social", "religion", "yes"]
    };

    if (className in residentialClasses && residentialClasses[className].includes(typeName)) {
        return "Residential";
    } else if (className in businessClasses && businessClasses[className].includes(typeName)) {
        return "Business";
    } else {
        return "Other";
    }
}

function displayLocationType(locationType) {
    const statusElement = document.getElementById("location-status");
    const tooltipContainer = statusElement.parentElement;  // The container for the tooltip

    if (locationType === "Business") {
        statusElement.textContent = "Business";
        statusElement.className = "location-status business";
        statusElement.title = "This location is likely to be accepted by the carriers";
    } else if (locationType === "Residential") {
        statusElement.textContent = "Residential";
        statusElement.className = "location-status residential";
        statusElement.title = "This location is most likely to be rejected by the carriers";
    } else {
        statusElement.textContent = "Other";
        statusElement.className = "location-status other";
        statusElement.title = "This location classification hasn't been determined yet";
    }

    // Make the status element and its tooltip container visible
    tooltipContainer.style.display = 'block';
    statusElement.style.display = 'inline';
}

function calculateOffload() {
    // Get the values from the input fields
    const footTraffic = parseFloat(document.getElementById('foot-traffic').value);
    const dwellTime = document.getElementById('dwell-time').value;
    const locationType = document.getElementById('location-type').value;

    // Check if the input is valid
    if (isNaN(footTraffic) || footTraffic < 0) {
        alert("Please enter a valid positive number for foot traffic.");
        return;
    }

    // Define multipliers based on dwell time
    let minMultiplier, maxMultiplier;
    
    switch(dwellTime) {
        case 'short': // 15 minutes (current calculation)
            minMultiplier = 0.1;
            maxMultiplier = 1.0;
            break;
        case 'medium': // 45 minutes
            minMultiplier = 0.3;
            maxMultiplier = 3.0;
            break;
        case 'long': // 2+ hours (120+ minutes)
            minMultiplier = 0.8;
            maxMultiplier = 8.0;
            break;
        default:
            minMultiplier = 0.1;
            maxMultiplier = 1.0;
    }

    // Calculate the minimum and maximum estimated offload in GB
    const minEstimatedOffloadMB = (footTraffic / 2) * minMultiplier; // Minimum offload in megabits (Mb)
    const maxEstimatedOffloadMB = (footTraffic / 2) * maxMultiplier; // Maximum offload in megabits (Mb)

    // Convert both to megabytes (MB) and then to gigabytes (GB)
    const minEstimatedOffloadGB = minEstimatedOffloadMB / 1024;
    const maxEstimatedOffloadGB = maxEstimatedOffloadMB / 1024;

    let resultHTML = `<strong>Estimated Offload:</strong> On average around ${maxEstimatedOffloadGB.toFixed(2)} GB<br>`;
    
    // Check if location type is selected and has data
    if (locationType && locationEarningsData[locationType] !== undefined) {
        const avgEarningsPerGB = locationEarningsData[locationType];
        
        // Calculate user's estimated earnings using location-specific data
        if (avgEarningsPerGB && avgEarningsPerGB > 0) {
            const minEarningsSpecific = minEstimatedOffloadGB * avgEarningsPerGB;
            const maxEarningsSpecific = maxEstimatedOffloadGB * avgEarningsPerGB;
            resultHTML += `<strong>Your Estimated Earnings:</strong> $${minEarningsSpecific.toFixed(2)} - $${maxEarningsSpecific.toFixed(2)}<br>`;
        } else {
            // Fall back to hardcoded range if no specific earning per GB data
            const minEarnings = minEstimatedOffloadGB * 0.05;
            const maxEarnings = maxEstimatedOffloadGB * 0.50;
            resultHTML += `<strong>Your Estimated Earnings (fallback range):</strong> $${minEarnings.toFixed(2)} - $${maxEarnings.toFixed(2)}<br>`;
        }
        
    } else {
        // Use existing hardcoded range if no location type selected or data not available
        const minEarnings = minEstimatedOffloadGB * 0.05;
        const maxEarnings = maxEstimatedOffloadGB * 0.50;
        resultHTML += `<strong>Estimated Earnings (standard range):</strong> $${minEarnings.toFixed(2)} - $${maxEarnings.toFixed(2)}<br>`;
        
        if (!locationType) {
            resultHTML += `<em>Tip: Select a location type above for more accurate earnings estimates.</em><br>`;
        }
    }

    // Display the result
    const resultElement = document.getElementById("offload-result");
    resultElement.innerHTML = resultHTML;
}

async function showSuggestions(query) {
    const suggestionsList = document.getElementById('suggestions');
    if (!query) {
        suggestionsList.style.display = 'none';
        return;
    }

    // Get the unique session ID for the header
    const sessionId = getSessionId();

    try {
        const response = await fetch(
            `https://nominatim-proxy.russ-162.workers.dev/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, 
            {
                headers: {
                    "User-Agent": `offload map - ${sessionId}`
                }
            }
        );
        const data = await response.json();

        suggestionsList.innerHTML = '';
        if (data.length > 0) {
            data.forEach(place => {
                const suggestionItem = document.createElement('li');
                suggestionItem.textContent = place.display_name;
                suggestionItem.onclick = () => selectSuggestion(place.display_name);
                suggestionsList.appendChild(suggestionItem);
            });
            suggestionsList.style.display = 'block';
        } else {
            suggestionsList.style.display = 'none';
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        suggestionsList.style.display = 'none';
    }
}

function selectSuggestion(address) {
    document.getElementById('address').value = address;
    document.getElementById('suggestions').style.display = 'none';
}

async function getCellTowerData(lat, lon) {
    const bbox = `${lat - 0.01},${lon - 0.01},${lat + 0.01},${lon + 0.01}`;
    const networks = [
        { name: 'AT&T', mcc: 310, mnc: 410 },
        { name: 'T-Mobile', mcc: 310, mnc: 260 },
        { name: 'Verizon', mcc: 311, mnc: 480 },
    ];

    let cellTowerSummary = '<h3>Cellular Coverage Summary:</h3>';

    for (const network of networks) {
        const coverageUrl = `https://opencellid.russ-162.workers.dev?BBOX=${bbox}&mcc=${network.mcc}&mnc=${network.mnc}&format=json`;
        try {
            const coverageResponse = await fetch(coverageUrl);
            const coverageData = await coverageResponse.json();

            let towerColor = ''; // Default text color

            if (coverageData.cells && coverageData.cells.length > 0) {
                const totalSignal = coverageData.cells.reduce((sum, cell) => {
                    return sum + (cell.averageSignalStrength ? parseFloat(cell.averageSignalStrength) : 0);
                }, 0);

                const averageSignal = totalSignal / coverageData.cells.length;

                // Determine text color based on the number of towers
                if (coverageData.cells.length > 1) {
                    towerColor = 'red';
                } else if (coverageData.cells.length <= 1) {
                    towerColor = 'green';
                }

                cellTowerSummary += `<p style="color:${towerColor};"><strong>${network.name}:</strong> ${coverageData.cells.length} cell tower(s) found.`;
                cellTowerSummary += averageSignal
                    ? ` Average signal strength: ${averageSignal.toFixed(2)} dBm.</p>`
                    : ` </p>`;
            } else {
                towerColor = 'green'; // No towers found, default to green
                cellTowerSummary += `<p style="color:${towerColor};"><strong>${network.name}:</strong> No cell towers found in the area.</p>`;
            }
        } catch (error) {
            console.error(`Error fetching data for ${network.name}:`, error);
            cellTowerSummary += `<p><strong>${network.name}:</strong> Unable to retrieve data.</p>`;
        }
    }

    document.getElementById('cell-tower-summary').innerHTML = cellTowerSummary;
    document.getElementById('cell-tower-summary').style.display = 'block';
}

// DOM Content Loaded event handler
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize the Leaflet map centered on the United States with interaction disabled
        map = L.map('map', {
            center: [37.0902, -95.7129], // Initial center on the U.S.
            zoom: 4,                    // Initial zoom level
            scrollWheelZoom: false,      // Disable scroll zoom
            dragging: false,             // Disable dragging
            doubleClickZoom: false,      // Disable double-click zoom
            zoomControl: false,          // Disable zoom control buttons
            boxZoom: false,              // Disable box zoom
            keyboard: false,             // Disable keyboard controls
            touchZoom: false,            // Disable touch zoom
        });

        // Add a dark tile layer to the map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 4 // Prevents reloading tiles by limiting zoom range
        }).addTo(map);

        // Function to smoothly zoom to specified coordinates
        window.zoomToLocation = function(lat, lon) {
            map.flyTo([lat, lon], 14, { duration: 3, easeLinearity: 0.25 }); // Smooth transition to location
        };

        // Generate links function
        window.generateLinks = async function() {
            const address = document.getElementById('address').value;
            if (!address) {
                alert("Please enter an address.");
                return;
            }

            const geocodeUrl = `https://nominatim-proxy.russ-162.workers.dev/search?format=json&q=${encodeURIComponent(address)}`;
            try {
                const response = await fetch(geocodeUrl, {
                    headers: { "User-Agent": "offload map" }
                });
                const data = await response.json();

                if (data.length > 0) {
                    const { lat, lon } = data[0];

                    // Fly to the specified location with a smooth zoom transition
                    window.zoomToLocation(lat, lon);

                    const fccLink = `https://broadbandmap.fcc.gov/provider-detail/mobile?version=dec2023&zoom=18.00&vlon=${lon}&vlat=${lat}&providers=130077_400_on%2C130403_400_on%2C131425_400_on&env=0&pct_cvg=80`;
                    document.getElementById('fcc-link').innerHTML = `<a href="${fccLink}" target="_blank" class="link-button">Check FCC Broadband Map</a>`;

                    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                    document.getElementById('google-maps-link').innerHTML = `<a href="${googleMapsLink}" target="_blank" class="link-button">Check on Google Maps</a>`;

                    const foursquareLink = `https://foursquare.com/explore?ll=${lat},${lon}`;
                    document.getElementById('foursquare-link').innerHTML = `<a href="${foursquareLink}" target="_blank" class="link-button">Check on Foursquare</a>`;

                    const yelpLink = `https://www.yelp.com/search?find_loc=${lat},${lon}`;
                    document.getElementById('yelp-link').innerHTML = `<a href="${yelpLink}" target="_blank" class="link-button">Check on Yelp</a>`;

                    // Determine and display the location type based on classification
                    determineLocationType(lat, lon);

                    // Fetch and display cell tower data
                    await getCellTowerData(lat, lon);
                } else {
                    document.getElementById('fcc-link').textContent = "Location not found.";
                }
            } catch (error) {
                console.error("Error fetching geocode:", error);
                document.getElementById('fcc-link').textContent = "Error fetching geocode data.";
            }
        };
    } catch (error) {
        console.error("Error initializing map:", error);
    }
});
