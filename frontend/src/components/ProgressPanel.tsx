import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Brain, CheckCircle, AlertCircle } from "lucide-react";
import { getSamples } from "@/components/frontendAPI";

interface Sample {
  name: string;
  path: string;
}

const ProgressPanel = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        const data = await getSamples();
        setSamples(data.samples || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to fetch samples");
        setSamples([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  const hasAIModel = true; // Assume AI model exists for now
  const hasEnvConfig = true; // Assume env config exists for now

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Samples Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4" />
            <span className="font-medium">Audio Samples</span>
            <Badge variant={samples.length > 0 ? "default" : "secondary"}>
              {samples.length} files
            </Badge>
          </div>
          
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading samples...</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : samples.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p>No audio samples found in downloads directory.</p>
              <p className="mt-1">Add .wav files to get started.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Found {samples.length} audio sample{samples.length !== 1 ? 's' : ''}:
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {samples.map((sample, index) => (
                  <div key={index} className="text-xs text-muted-foreground bg-muted/50 p-1 rounded">
                    {sample.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Model Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="font-medium">AI Model</span>
            <Badge variant={hasAIModel ? "default" : "destructive"}>
              {hasAIModel ? "Available" : "Missing"}
            </Badge>
          </div>
          
          {hasAIModel ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              AImix_model.onnx is ready for mixing
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              AI model not found. Using fallback mixing.
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium text-sm">How to use:</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Select a music genre</li>
            <li>2. Click "Generate AI Mix" to analyze samples</li>
            <li>3. View the generated gain and pan settings</li>
            <li>4. Settings are applied automatically</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressPanel;
