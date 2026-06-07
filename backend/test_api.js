const http = require('http');

function testEndpoint(path, label) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`\n=== ${label} ===`);
          console.log(`Status Code: ${res.statusCode}`);
          if (Array.isArray(result)) {
            console.log(`Results count: ${result.length}`);
            console.log(`Samples:`, result.slice(0, 3).map(r => ({
              text: r.text,
              type: r.type,
              path: r.path
            })));
          } else {
            console.log(`Result:`, {
              name: result.name,
              slug: result.slug,
              capital: result.capital,
              bestTimeToVisit: result.bestTimeToVisit,
              famousFor: result.famousFor,
              topCategories: result.topCategories,
              mustVisitDestinations: result.mustVisitDestinations,
              estimatedBudget: result.estimatedBudget,
              travelStyleTags: result.travelStyleTags,
              weatherOverview: result.weatherOverview,
              bestTravelSeason: result.bestTravelSeason,
              whyVisit: result.whyVisit,
              topExperiences: result.topExperiences,
              foodSpecialties: result.foodSpecialties,
              travelTips: result.travelTips
            });
          }
        } catch (err) {
          console.error(`Failed to parse JSON for ${label}:`, err);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Connection Error for ${label}:`, err);
      resolve();
    });
  });
}

async function run() {
  // Test 1: Fuzzy search spelling suggestion for "ooti"
  await testEndpoint('/api/places/suggestions?q=ooti', 'Suggestions for "ooti"');
  
  // Test 2: Fuzzy search spelling suggestion for "keral"
  await testEndpoint('/api/places/suggestions?q=keral', 'Suggestions for "keral"');
  
  // Test 3: Get a single place detail by its slug
  await testEndpoint('/api/places/slug/kerala-munnar-munnar-tea-gardens', 'Place Detail by Slug');
}

run();
