// Complete Working University TimeTable Scraper

require('dotenv').config(); // Load Env Vars
const cheerio = require('cheerio');

// For Building Code Mapping
const buildingCodes = {
  "AB": "Adelphi Building",
  "AC": "St Peter’s Arts Centre",
  "AL": "Allen Building",
  "BB": "Brook Building",
  "CB": "Chandler Building",
  "CM": "Computing & Technology Building",
  "DB": "Darwin Building",
  "EB": "Edward Building",
  "FB": "Foster Building",
  "FY": "Fylde Building",
  "GR": "Greenbank Building",
  "HA": "Harrington Building",
  "HB": "Harris Building",
  "HR": "Hanover Building",
  "JBF": "JB Firth Building",
  "KM": "Kirkham Building",
  "LE": "Leighton Building",
  "LIB": "Library & Learning and Information Services",
  "MB": "Maudland Building",
  "MC": "Medical Centre",
  "ME": "Media Factory",
  "MF": "Multi-Faith Centre / Oasis Faith & Spirituality Centre",
  "MO": "Moss Building",
  "PSC": "Pre-School Centre",
  "SB": "Stewart Building",
  "STF": "Sir Tom Finney Sports Centre",
  "SU": "Students’ Union / 53 Degrees",
  "STU": "Student Centre",
  "SPG": "St Peter’s Gardens",
  "US": "University Square",
  "VB": "Victoria Building",
  "VE": "Vernon Building",
  "WB": "Wharf Building",
  "Bm": "Boatsmans Court (Residence)",
  "Bw": "Bowran House (Residence)",
  "Dr": "Douglas Hall (Residence)",
  "Dw": "Derwent Hall (Residence)",
  "Er": "Eden Hall (Residence)",
  "iQ": "iQ Preston (Residence)",
  "LH": "Livesey House (Residence)",
  "Pn": "Pendle Hall (Residence)",
  "Ri": "Ribble Hall (Residence)",
  "Rr": "Roeburn Hall (Residence)",
  "Wr": "Whitendale Hall (Residence)"
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const url = 'https://apps.uclan.ac.uk/timetables/';

// HELPER FUNCTION

/*
Brief: Parse events recursively from text
@Param1 text - Raw event text
@Param2 events - Events Array (Event in JSON object)

@Return: events - Array of parsed event JSON objects
@ReturnT: Parsed events
@ReturnF: No events found
*/
const parseEvents = (text, events = []) => {
  // Updated pattern: time module location lecturer type (Group: group)
  const eventPattern = /(\d{2}:\d{2}) - (\d{2}:\d{2}) (.+?) (.+?) (.+?) (.+?) \(Group: (.+?)\)/;
  const match = text.match(eventPattern);

  if (match) 
  {
    const eventJson = {
      startTime: match[1],
      endTime: match[2],
      moduleName: match[3],
      location: buildingCodes[match[4]] || match[4],
      lecturer: match[5],
      type: match[6],
      group: match[7],
      time: `${match[1]} - ${match[2]}`,
      description: `${match[3]} - ${match[4]} - ${match[5]} - ${match[6]} (Group: ${match[7]})`,
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
  const allEvents = [];

  $('td').filter((index, td) => $(td).text().includes('Group')).each((i, td) => {
    const cellText = $(td).text().trim().replace(/\s+/g, ' ');
    const eventsFromCell = parseEvents(cellText);
    allEvents.push(eventsFromCell);
  });

  // Return based on parsed events
  if (allEvents.length === 0) 
  {
    return { success: false, error: 'No events found' }; 
  }

  console.log('Parsed Events:', allEvents);

  return { success: true, events: allEvents };
}

// MAIN FUNCTION

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

    if (!getRes.ok) 
      return {success: false, error: `Failed to fetch timetable: ${getRes.status} ${getRes.statusText}`};
    else
      return {success: true, events: await parseUserEvents(await getRes.text())};

  } catch (error) {
    console.error('Error fetching timetable:', error.message);
    return {success: false, error: error.message};
  }
}

// Example usage
/*fetchTimetable('KRobinson25@Lancashire.ac.uk', 'Rebel250904^^^^').then(async html => 
{
  console.log('Timetable HTML fetched successfully.');
  console.log('Timetable HTML length:', html.length);
  
  // Parse the HTML to extract events and return after parsing
  return await parseUserEvents(html);
}).catch(err => {
  console.error('Error:', err.message);
});*/

module.exports = { fetchTimetable };