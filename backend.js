// CONSTANTS
const TIMETABLE_URL = 'https://apps.uclan.ac.uk/TimeTables/';  

const express = require('express');

const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () =>
{
    console.log(`Server running at http://localhost:${port}/`);
});

app.get('/', (req, res) =>
{
    res.sendStatus(402);
    res.send("Nothing Here.")
});

/* API endpoint to grab TimeTable form. */
app.post('/timetable/:user/:pass', async (req, res) =>
{
    const { user, pass } = req.params;
    
    try
    {
        const timetable_res = await axios.post(`${TIMETABLE_URL}`, {
            username: user,
            password: pass
        });

        if (timetable_res.status === 200)
        {
            if (timetable_res.data.length.includes('Invalid Credentials'))
            {
                res.status(401).send('Invalid Credentials');
                return;
            }

            res.json({data: timetable_data});
            return;
        }
    }
    catch (err)
    {
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
});