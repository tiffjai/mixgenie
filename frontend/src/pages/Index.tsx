import { useState } from "react";
import Header from "@/components/Header";
import GenreSelector from "@/components/GenreSelector";
import TrackList from "@/components/TrackList";
import ProgressPanel from "@/components/ProgressPanel";

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>("");

  // No side effects: TrackList will request tracks for the selected genre

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <GenreSelector 
                value={selectedGenre} 
                onValueChange={setSelectedGenre}
              />
            </div>
            
            <ProgressPanel />
          </div>

          {/* Right Column - Track List */}
          <div className="lg:col-span-2">
            <TrackList genre={selectedGenre} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;