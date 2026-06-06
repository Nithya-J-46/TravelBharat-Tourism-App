require('dotenv').config();
const mongoose = require('mongoose');
const State = require('./models/State');
const City = require('./models/City');
const Category = require('./models/Category');

const levenshtein = (a, b) => {
  const tmp = [];
  const alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (let i = 0; i <= alen; i++) tmp[i] = [i];
  for (let j = 0; j <= blen; j++) tmp[0][j] = j;
  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
};

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat');
  
  const allStates = await State.find({});
  const allCities = await City.find({});
  console.log(`DB Count - States: ${allStates.length}, Cities: ${allCities.length}`);
  
  const ootyCity = allCities.find(c => c.name.toLowerCase() === 'ooty');
  console.log('Ooty City in DB:', ootyCity);
  
  if (ootyCity) {
    const term = 'ooti';
    const n = ootyCity.name.toLowerCase();
    const dist = levenshtein(term, n);
    const maxTypo = n.length > 6 ? 2 : 1;
    console.log(`Fuzzy match ooti vs ${n}:`);
    console.log(`- Levenshtein distance: ${dist}`);
    console.log(`- Max Typo threshold: ${maxTypo}`);
    console.log(`- Is Match: ${dist <= maxTypo}`);
  }
  
  mongoose.connection.close();
}

test();
