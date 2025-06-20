// backend/server.js (FINAL, ROBUST VERSION)

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
    res.send('Aura YouTube Backend is alive and well.');
});

apiRouter.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s.-]/gi, ''); // Sanitize filename

        // THIS IS THE KEY FIX: ytdl-core often needs request options to bypass YouTube's throttling.
        // This makes our server's request look more like a standard browser request.
        const options = {
            quality: 'highestaudio',
            filter: 'audioonly',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
                },
            },
        };
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        
        ytdl(url, options).pipe(res);

    } catch (err) {
        console.error("Download Error:", err);
        // Give a more specific error if a known issue occurs
        if (err.message.includes('private')) {
            return res.status(403).json({ error: 'This video is private and cannot be downloaded.' });
        }
        if (err.message.includes('Status code: 410')) {
             return res.status(410).json({ error: 'This video is age-restricted or unavailable.' });
        }
        
        return res.status(500).json({ error: 'The server failed to process the video.' });
    }
});

app.use('/', apiRouter);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
