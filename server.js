// backend/server.js (CORRECTED AND MORE ROBUST)

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Create a Router ---
// This is a more stable way to define routes and avoids common 404 errors.
const apiRouter = express.Router();

// Test route
apiRouter.get('/', (req, res) => {
    res.send('Aura YouTube Backend is alive.');
});

// The main download route
apiRouter.post('/download', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'A valid YouTube URL is required.' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s.-]/gi, ''); // Sanitize filename even better

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        ytdl(url, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);

    } catch (err) {
        console.error("Download Error:", err.message);
        // Provide a more specific error message if possible
        const errorMessage = err.message.includes('private') ? 'Video is private or unavailable.' : 'Failed to process video.';
        res.status(500).json({ error: errorMessage });
    }
});

// --- Use the Router ---
// Tell the app to use our router for all requests starting with "/"
app.use('/', apiRouter);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
