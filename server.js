// backend/server.js (FINAL, UPGRADED, AND WORKING VERSION)

const express = require('express');
const cors = require('cors');
// THIS IS THE CRITICAL CHANGE: We are now using the new library.
const ytdl = require('@distube/ytdl-core');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.send('Aura YouTube Backend is alive. Using @distube/ytdl-core.');
});

apiRouter.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s.-]/gi, ''); // Sanitize filename

        // This library is more robust and often doesn't need extra headers,
        // but we'll keep them just in case.
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
        // This provides more useful error messages back to the frontend.
        if (err.statusCode === 410 || err.statusCode === 403) {
            return res.status(err.statusCode).json({ error: 'Video is age-restricted, private, or otherwise unavailable.' });
        }
        return res.status(500).json({ error: 'The server failed to process the video. It might be a protected music video.' });
    }
});

app.use('/', apiRouter);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
