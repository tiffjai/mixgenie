const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for your Vite frontend
app.use(cors());
app.use(express.json());

// Helpers to keep logic clean
function receiveGenre(req) {
  const { genre } = req.body || {};
  if (typeof genre === 'string' && genre.trim().length > 0) return genre.trim();
  return undefined;
}

function buildTracksForGenre(genre) {
  // TODO: Replace with real lookup based on `genre`
  const base = [
    { id: '1', name: 'Vocal_Lead.wav', gain: -3, pan: -15 },
    { id: '2', name: 'Guitar_Rhythm.wav', gain: -4, pan: 20 },
    { id: '3', name: 'Bass_Line.wav', gain: -1, pan: 0 },
    { id: '4', name: 'Drums_Kit.wav', gain: -2, pan: 0 },
  ];
  const chosen = base;
  return (genre ? chosen.map(t => ({ ...t, name: `${genre}-${t.name}` })) : chosen);
}

// Single endpoint: receive genre and return tracks for that genre
app.post('/api/tracks', (req, res) => {
  const genre = receiveGenre(req);
  const tracks = buildTracksForGenre(genre);
  res.json({ tracks });
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});