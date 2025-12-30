// Complete Working University TimeTable Scraper

require('dotenv').config();
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const url = 'https://apps.uclan.ac.uk/timetables/';

async function fetchTimetable(user, pass) {
  // HTTP Basic Authentication: Base64 to encode "username:password"
  // Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme
  var token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
  var user = process.env.USEDR_UNI_ID || '';
  var pass = process.env.USER_P || '';

  try {
    // GET request
    console.log('Fetching timetable with Basic Auth');
    const getRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'User-Agent': userAgent
      }
    });
    
    console.log('GET Status:', getRes.status);
    return await getRes.text();
  } catch (error) {
    console.error('Error fetching timetable:', error.message);
  }
}

module.exports = { fetchTimetable };