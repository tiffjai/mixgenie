import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, RotateCcw, Loader2, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTracksByGenre, generateMix } from "@/components/frontendAPI";

interface Track {
  id: string;
  name: string;
  gain?: number;
  pan?: number;
  instrument?: string;
  filePath?: string;
}

interface TrackListProps {
  genre?: string;
}

const TrackList = ({ genre }: TrackListProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenre, setLastGenre] = useState<string>("");

  const fetchTracks = async (selectedGenre: string) => {
    try {
      const data = await fetchTracksByGenre(selectedGenre);
      setTracks(data.tracks || []);
      setIsProcessing(data.isProcessing || false);
      setError(data.error || null);
      setLastGenre(data.genre || "");
    } catch (err) {
      console.error("Error fetching tracks:", err);
      setTracks([]);
      setError("Failed to fetch tracks");
    }
  };

  const handleGenerateMix = async () => {
    if (!genre) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      await generateMix(genre);
      // Refresh tracks after generation
      await fetchTracks(genre);
    } catch (err: any) {
      setError(err.message || "Failed to generate mix");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const selectedGenre = genre || "";
    
    fetchTracks(selectedGenre).then(() => {
      if (cancelled) return;
    });
    
    return () => { cancelled = true; };
  }, [genre]);

  // Poll for updates when processing
  useEffect(() => {
    if (!isProcessing) return;
    
    const interval = setInterval(() => {
      fetchTracks(genre || "");
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isProcessing, genre]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Samples & Mix
          </div>
          {genre && (
            <Button 
              onClick={handleGenerateMix}
              disabled={isProcessing || !genre}
              size="sm"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isProcessing ? "Generating..." : "Generate AI Mix"}
            </Button>
          )}
        </CardTitle>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}
        {isProcessing && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is analyzing audio samples and generating mix parameters...
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {tracks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audio samples found</p>
            <p className="text-sm">Add .wav files to the downloads directory</p>
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{track.name}</p>
                {track.instrument && (
                  <p className="text-sm text-muted-foreground">
                    Instrument: {track.instrument}
                  </p>
                )}
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Gain:</span>
                  {track.gain !== undefined ? (
                    <Badge variant="secondary">{track.gain}dB</Badge>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  <span>Pan:</span>
                  {track.pan !== undefined ? (
                    <Badge variant="secondary">
                      {track.pan === 0 ? 'C' : `${track.pan > 0 ? 'R' : 'L'}${Math.abs(track.pan)}`}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TrackList;
