// AURA BACKEND - FINAL WORKING VERSION

const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();
const PORT = process.env.PORT || 4000;

// This function "warms up" the downloader to prevent startup crashes on Render.
// This is the most critical part of the fix.
async function configurePlayDL() {
    console.log("Configuring play-dl...");
    await play.getFreeClientID();
    await play.setToken({
        youtube: {
            cookie: process.env.YOUTUBE_COOKIE || ''
        }
    });
    console.log("play-dl configured successfully.");
}

// Robust CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Health check for Render
app.get('/health', (req, res) => {
    res.status(200).send({ status: 'ok', message: 'Server is healthy.' });
});

app.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !play.validate(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL provided.' });
        }

        const videoInfo = await play.video_info(url);
        const title = videoInfo.video_details.title.replace(/[^\w\s.-]/gi, '') || 'youtube_audio';

        const stream = await play.stream_from_info(videoInfo, { quality: 2 });

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', stream.type);

        stream.stream.pipe(res);

    } catch (err) {
        console.error("Download failed:", err.message);
        res.status(500).json({ error: 'Failed to process video. It may be private or protected.' });
    }
});

// Start server and then configure downloader
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    configurePlayDL();
});
