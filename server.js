// backend/server.js (FINAL, CORS-FIXED, WORKING VERSION)

const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 4000;

// --- CRITICAL CORS FIX ---
// The browser sends a "preflight" OPTIONS request to check permissions before
// sending the actual POST request. We need to handle this explicitly.
// This `cors()` configuration is more robust and explicitly allows everything we need.
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'OPTIONS'], // Allow these methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));

// --- Middleware ---
app.use(express.json());

// --- Routes ---
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.send('Aura YouTube Backend is alive and ready for requests.');
});

apiRouter.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s.-]/gi, '');

        const options = {
            quality: 'highestaudio',
            filter: 'audioonly',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
                    'Referer': 'https://www.youtube.com/'
                },
            },
        };
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        
        ytdl(url, options).pipe(res);

    } catch (err) {
        console.error("Download Error:", err);
        if (err.statusCode === 410 || err.statusCode === 403) {
            return res.status(err.statusCode).json({ error: 'Video is age-restricted, private, or unavailable.' });
        }
        return res.status(500).json({ error: 'The server failed to process the video. It might be a protected music video.' });
    }
});

app.use('/', apiRouter);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
