// backend/server.js (FINAL, POWERFUL, WORKING VERSION)

const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json());

// --- Routes ---
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.send('Aura YouTube Backend is online. Using play-dl.');
});

apiRouter.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !play.validate(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        // 1. Search for the video to get its info. This is a more robust first step.
        const searchResults = await play.search(url, { limit: 1 });
        if (searchResults.length === 0) {
            return res.status(404).json({ error: 'Video not found.' });
        }
        
        const video = searchResults[0];
        const title = video.title.replace(/[^\w\s.-]/gi, ''); // Sanitize filename

        // 2. Fetch the audio stream from the video.
        // play-dl handles all the complex logic of finding a working stream.
        const stream = await play.stream(video.url, {
            quality: 2 // 0 = lowest, 1 = medium, 2 = highest
        });
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', stream.type);
        
        // 3. Pipe the stream directly to the response.
        stream.stream.pipe(res);

    } catch (err) {
        console.error("Download Error:", err);
        // Provide more useful error messages back to the frontend.
        return res.status(500).json({ error: 'Server failed to process video. It may be protected or unavailable.' });
    }
});

app.use('/', apiRouter);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
