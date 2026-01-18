// Complete Working University TimeTable Scraper

require('dotenv').config(); // Load Env Vars
const cheerio = require('cheerio');

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // For Row Day Parsing
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const url = 'https://apps.uclan.ac.uk/timetables/';

/*
Brief: Fetch Timetable HTML using HTTP Basic Authentication
@Param1 user - User's Email
@Param2 pass - User's Password

@Return: timetableHTML - Raw HTML of the timetable page
@ReturnT: Timetable HTML fetched successfully
@ReturnF: Fetch Error
*/
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

/*
Brief: Parse events recursively from text
@Param1 text - Raw event text
@Param2 events - Events Array (Event in JSON object)

@Return: events - Array of parsed event JSON objects
@ReturnT: Parsed events
@ReturnF: No events found
*/
const parseEvents = (text, events = []) => {
  // "09:00 - 10:00 Module Name Group A Location Description"
  // Regex Pattern: DD:DD - DD:DD Module Name Group X Location Description
  const eventPattern = /(\d{2}:\d{2}) - (\d{2}:\d{2}) (.+?) Group (.+?) (.+?) (.+)/;
  const match = text.match(eventPattern);

  if (match) {

    /*
    Event JSON object

    startTime - Event start time
    endTime - Event end time
    moduleName - Module name
    group - Group identifier
    time - Formatted time string
    location - Event location
    description - Event description
    */
    const eventJson = {startTime: match[1],
      endTime: match[2],
      moduleName: match[3],
      group: match[4],
      time: `${match[1]} - ${match[2]}`,
      location: match[5],
      description: `${match[3]} Group ${match[4]} - ${match[6]}`,
    };

    events.push(eventJson);

    // Remove the matched part and recurse on the remaining text
    const remainingText = text.replace(match[0], '').trim();
    return parseEvents(remainingText, events);
  }
  return events;
}

/*
Brief: Parse user events from raw timetable HTML
@Param1 timetableHTML - Raw HTML of the timetable page

@Return: eventArray - Array of user events
@ReturnT: Parsed user events
@ReturnF: Parsing Error
*/  
const parseUserEvents = async (timetableHTML) => 
{
  const $ = cheerio.load(timetableHTML);

  // Remove Whitespace and Newlines for easier parsing
  // Regex Source: 
  // https://stackoverflow.com/questions/1232040/how-to-remove-all-white-spaces-in-a-string-in-javascript
  const eventText = $('td').filter((index, td) => $(td).text().includes('Group')).text().trim().replace(/\s+/g, ' ');

  const parsedEvents = parseEvents(eventText);

  // Return based on parsed events
  if (parsedEvents.length === 0) 
  {
    return { success: false, error: 'No events found' }; 
  }

  return { success: true, events: parsedEvents };
}

fetchTimetable('KRobinson25@Lancashire.ac.uk', 'Rebel250904^^^^').then(async html => 
{
  console.log('Timetable HTML fetched successfully.');
  console.log('Timetable HTML length:', html.length);
  
  // Parse the HTML to extract events and return after parsing
  return await parseUserEvents(html);
}).catch(err => {
  console.error('Error:', err.message);
});

module.exports = { fetchTimetable };