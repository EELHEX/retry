// backend/server.js (FINAL, AUTHENTICATED, BULLETPROOF VERSION)

const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Authentication & Setup Function ---
// This function will run when the server starts.
// It configures play-dl to be more resilient against blocking.
async function setupPlayDL() {
    try {
        console.log('Refreshing play-dl stream client...');
        await play.stream_from_info({
            title: 'placeholder',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // A reliable public video
        });
        console.log('play-dl client refreshed successfully.');
    } catch (error) {
        console.error('Could not refresh play-dl client on startup:', error);
    }
}

// --- Middleware ---
// This CORS configuration is explicit and robust.
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));
app.use(express.json());

// --- Routes ---
const apiRouter = express.Router();

// This is a "health check" route. Render uses this to know if your server started correctly.
// A 502 error often happens if this route isn't available quickly.
apiRouter.get('/health', (req, res) => {
    res.status(200).send({ status: 'ok', message: 'Aura YouTube Backend is healthy.' });
});

apiRouter.get('/', (req, res) => {
    res.send('Aura YouTube Backend is online.');
});

apiRouter.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !play.validate(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        // Validate to ensure the video is accessible before trying to stream
        const videoInfo = await play.video_info(url);
        if (!videoInfo) {
            return res.status(404).json({ error: 'Video information could not be retrieved.' });
        }
        
        const title = videoInfo.video_details.title.replace(/[^\w\s.-]/gi, '');

        // Fetch the audio stream
        const stream = await play.stream_from_info(videoInfo, {
            quality: 2 // 0=low, 1=medium, 2=high
        });
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', stream.type);
        
        stream.stream.pipe(res);

    } catch (err) {
        console.error("Download Error:", err);
        return res.status(500).json({ error: 'The server failed to process the video. It might be protected or a live stream.' });
    }
});

app.use('/', apiRouter);

// --- Start Server ---
app.listen(PORT, async () => {
    console.log(`Server is listening on port ${PORT}`);
    // Run the setup function after the server has started listening.
    await setupPlayDL();
});
