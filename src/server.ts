const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Enable CORS for your Vite frontend
app.use(cors());
app.use(express.json());

// Import the AI mixing functionality
let runModel;
try {
  runModel = require('./run-model2').runModel;
} catch (error) {
  console.warn('Could not load run-model2:', error.message);
}

// Store the current mixing state
let currentMixingState = {
  tracks: [],
  isProcessing: false,
  lastGenre: '',
  error: null
};

// Helpers to keep logic clean
function receiveGenre(req) {
  const { genre } = req.body || {};
  if (typeof genre === 'string' && genre.trim().length > 0) return genre.trim();
  return undefined;
}

function getSampleFiles() {
  try {
    const downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      return [];
    }
    return fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.wav'))
      .map(file => path.join('downloads', file));
  } catch (error) {
    console.error('Error reading downloads directory:', error);
    return [];
  }
}

function buildTracksFromSamples(sampleFiles, gains = [], pans = []) {
  const instruments = [
    "Vocal",
    "Guitar", 
    "Bass",
    "Drums",
    "Piano",
    "Strings",
    "Synth",
    "Percussion"
  ];

  return sampleFiles.slice(0, 8).map((filePath, index) => {
    const fileName = path.basename(filePath);
    const instrumentName = instruments[index] || `Track_${index + 1}`;
    
    return {
      id: `track_${index + 1}`,
      name: `${instrumentName} (${fileName})`,
      gain: gains[index] !== undefined ? Number(gains[index].toFixed(1)) : undefined,
      pan: pans[index] !== undefined ? Number(pans[index].toFixed(1)) : undefined,
      filePath: filePath,
      instrument: instrumentName
    };
  });
}

// Endpoint to get current tracks and mixing state
app.post('/api/tracks', (req, res) => {
  const genre = receiveGenre(req);
  
  if (genre && genre !== currentMixingState.lastGenre && !currentMixingState.isProcessing) {
    // Trigger AI mixing process for new genre
    processMixingForGenre(genre);
  }
  
  res.json({ 
    tracks: currentMixingState.tracks,
    isProcessing: currentMixingState.isProcessing,
    genre: currentMixingState.lastGenre,
    error: currentMixingState.error
  });
});

// Endpoint to trigger AI mixing process
app.post('/api/generate-mix', async (req, res) => {
  const { genre } = req.body;
  
  if (!genre) {
    return res.status(400).json({ error: 'Genre is required' });
  }

  if (currentMixingState.isProcessing) {
    return res.status(409).json({ error: 'Mixing process already in progress' });
  }

  try {
    await processMixingForGenre(genre);
    res.json({ 
      success: true, 
      tracks: currentMixingState.tracks,
      message: 'Mix generated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get available sample files
app.get('/api/samples', (req, res) => {
  const sampleFiles = getSampleFiles();
  res.json({ 
    samples: sampleFiles.map(filePath => ({
      name: path.basename(filePath),
      path: filePath
    }))
  });
});

async function processMixingForGenre(genre) {
  currentMixingState.isProcessing = true;
  currentMixingState.error = null;
  currentMixingState.lastGenre = genre;

  try {
    const sampleFiles = getSampleFiles();
    
    if (sampleFiles.length === 0) {
      throw new Error('No audio samples found in downloads directory');
    }

    console.log(`Processing ${sampleFiles.length} samples for genre: ${genre}`);

    let gains = [];
    let pans = [];

    if (runModel && fs.existsSync('AImix_model.onnx')) {
      // Use AI model to generate mixing parameters
      const instruments = [
        "Vocal", "Guitar", "Bass", "Drums", 
        "Piano", "Strings", "Synth", "Percussion"
      ];
      
      console.log('Running AI model for mixing...');
      [gains, pans] = await runModel('AImix_model.onnx', genre, sampleFiles, instruments);
      console.log('AI model completed. Gains:', gains, 'Pans:', pans);
    } else {
      // Fallback: generate reasonable default values based on genre
      console.log('Using fallback mixing values (AI model not available)');
      gains = generateFallbackGains(genre, sampleFiles.length);
      pans = generateFallbackPans(sampleFiles.length);
    }

    // Update the current state with new tracks
    currentMixingState.tracks = buildTracksFromSamples(sampleFiles, gains, pans);
    
  } catch (error) {
    console.error('Error in mixing process:', error);
    currentMixingState.error = error.message;
    // Still create tracks without AI-generated values
    const sampleFiles = getSampleFiles();
    currentMixingState.tracks = buildTracksFromSamples(sampleFiles);
  } finally {
    currentMixingState.isProcessing = false;
  }
}

function generateFallbackGains(genre, trackCount) {
  // Generate genre-appropriate gain values
  const baseGains = {
    'Pop': [-2, -3, -1, -2, -4, -5, -3, -4],
    'Rock': [-1, -2, -1, -1, -3, -4, -2, -3],
    'Jazz': [-3, -4, -2, -3, -1, -2, -4, -5],
    'Electronic': [-2, -4, -1, -2, -3, -2, -1, -3],
    'Classical': [-4, -3, -2, -4, -1, -2, -3, -4]
  };
  
  const gains = baseGains[genre] || baseGains['Pop'];
  return gains.slice(0, trackCount);
}

function generateFallbackPans(trackCount) {
  // Generate balanced panning
  const pans = [-30, 30, 0, 0, -15, 15, -45, 45];
  return pans.slice(0, trackCount);
}

// Initialize with existing samples
const initialSamples = getSampleFiles();
if (initialSamples.length > 0) {
  currentMixingState.tracks = buildTracksFromSamples(initialSamples);
}

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log(`Found ${getSampleFiles().length} audio samples in downloads directory`);
});
