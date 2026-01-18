// Complete Working University TimeTable Scraper

require('dotenv').config();
const cheerio = require('cheerio');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const url = 'https://apps.uclan.ac.uk/timetables/';

async function fetchTimetable(user, pass) {
  // HTTP Basic Authentication: Base64 to encode "username:password"
  // Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme
  var token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');

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
    return {success: false, error: error.message};
  }
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // For Row Day Parsing

/*
Brief: Parse Timetable HTML to extract event data
@Param1 timetableHTML - Raw HTML of the timetable page

@Return: eventJSON - Structured JSON of timetable events
@ReturnT: Parsed JSON Events
@ReturnF: Parsing Error
*/
async function parseTimeTableHTML(timetableHTML)
{
  const userEvents = {date: "", day: "", events: [{}*6], module: ""};

  const $ = cheerio.load(timetableHTML);

  $('table tr').each((index, element) => {

    // For each row, get all event cells (td) that contain 'Group' in their text
    const eventCells = $(element).find('td').filter((index, td) => $(td).text().includes('Group'));

    const events = [];

    // Collect event details from each cell
    eventCells.each((index, td) => {
      /* 
      Source for RegEx to clean up whitespace:
      https://stackoverflow.com/questions/5963182/how-to-remove-extra-spaces-from-string-in-javascript
      */
      events.push($(td).text().trim().replace(/\s+/g, ' '));
    });
    if (events.length > 0) {
      console.log('Existing Events:', events, 'on Row:', index);
    }
  });

  return userEvents;
}

fetchTimetable('KRobinson25@Lancashire.ac.uk', 'Rebel250904^^^^').then(html => 
{
  console.log('Timetable HTML fetched successfully.');
  console.log('Timetable HTML length:', html.length);
  parseTimeTableHTML(html);
}).catch(err => {
  console.error('Error:', err.message);
});

module.exports = { fetchTimetable };