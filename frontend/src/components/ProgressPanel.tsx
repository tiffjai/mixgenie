import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Loader2, CheckCircle } from "lucide-react";

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
}

const ProgressPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps: ProgressStep[] = [
    { id: "download", label: "Downloading samples", completed: false },
    { id: "ai", label: "Running AI model", completed: false },
    { id: "effects", label: "Applying effects", completed: false },
  ];

  const handleStartMixing = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentStep(0);

    // Simulate mixing process
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Simulate step progress
      for (let p = 0; p <= 100; p += 10) {
        setProgress((i * 100 + p) / steps.length);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsRunning(false);
    setProgress(100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mixing Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                index < currentStep || (!isRunning && progress === 100)
                  ? "bg-audio-active text-audio-active-foreground"
                  : index === currentStep && isRunning
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {index < currentStep || (!isRunning && progress === 100) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : index === currentStep && isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-sm ${
                index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Button
          onClick={handleStartMixing}
          disabled={isRunning}
          size="lg"
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Mixing
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgressPanel;