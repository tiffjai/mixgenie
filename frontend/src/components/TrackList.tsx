import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTracksByGenre } from "@/components/frontendAPI";

interface Track {
  id: string;
  name: string;
  gain?: number;
  pan?: number;
}

const API_URL = "http://localhost:3001/api/tracks";

interface TrackListProps {
  genre?: string;
}

const TrackList = ({ genre }: TrackListProps) => {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchTracksByGenre(genre || "")
      .then((data) => !cancelled && setTracks(data.tracks || []))
      .catch(() => !cancelled && setTracks([]));
    return () => { cancelled = true; };
  }, [genre]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Project Tracks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
          >
            <div className="flex-1">
              <p className="font-medium text-foreground">{track.name}</p>
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
                  <Badge variant="secondary">{track.pan > 0 ? 'R' : 'L'}{Math.abs(track.pan)}</Badge>
                ) : (
                  <span className="text-muted-foreground">--</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrackList;
