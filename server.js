// backend/server.js

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
// Render.com provides its own port number through this environment variable.
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(cors());      // Allows cross-origin requests (from your frontend)
app.use(express.json()); // Allows the server to understand JSON data

// --- Routes ---

// A simple test route to make sure the server is online
app.get('/', (req, res) => {
    res.send('Aura YouTube Backend is alive and running!');
});

// The main download route
app.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        // Get video information to use for the filename
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // Sanitize filename

        // Set the response headers to tell the browser this is a file download
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Download the highest quality audio-only stream and pipe it directly to the response.
        // This is very efficient because it doesn't save the file to the server's disk.
        ytdl(url, {
            quality: 'highestaudio',
            filter: 'audioonly',
        }).pipe(res);

    } catch (err) {
        console.error("Error in /download route:", err);
        res.status(500).json({ error: 'Failed to process the YouTube video.' });
    }
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});