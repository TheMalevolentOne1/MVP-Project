// Complete Working University TimeTable Scraper

require('dotenv').config();

const user = process.env.USEDR_UNI_ID || '';
const pass = process.env.USER_P || '';
const token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

const url = 'https://apps.uclan.ac.uk/timetables/';

async function fetchTimetable() {
  try {
    // GET request
    console.log('Fetching timetable with Basic Auth...');
    const getRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'User-Agent': userAgent
      }
    });
    
    console.log('GET Status:', getRes.status);
    const getText = await getRes.text();
    console.log('GET Response:', getText); // Log full response
    
    // POST request with JSON body (if needed)
    const body = { key: 'value' };
    console.log('\nSending POST request...');
    const postRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`,
        'User-Agent': userAgent,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log('POST Status:', postRes.status);
    const postText = await postRes.text();
    console.log('POST Response:', postText.substring(0, 500)); // Log first 500 chars
    
  } catch (error) {
    console.error('Error fetching timetable:', error.message);
  }
}

// Run the scraper
fetchTimetable();