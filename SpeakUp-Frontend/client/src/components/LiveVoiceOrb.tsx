import { useState, useEffect, useRef } from "react";
import { AlertCircle, Mic, MicOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LiveVoiceOrb() {
  const [status, setStatus] = useState<"idle" | "listening" | "blocked" | "unsupported">("idle");
  const [error, setError] = useState<string | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startMicrophone = async () => {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        setStatus("unsupported");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      setStatus("listening");
      setError(null);
      updateAmplitude();
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("blocked");
        setError("Microphone access denied. Please enable permissions in your browser settings.");
      } else {
        setError("Could not access microphone: " + err.message);
      }
    }
  };

  const stopMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setStatus("idle");
    setAmplitude(0);
  };

  const updateAmplitude = () => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteTimeDomainData(dataArray);

    // Calculate RMS amplitude
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const float = (dataArray[i] - 128) / 128;
      sum += float * float;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    
    // Smooth the amplitude for visual scaling (range 0 to 1)
    setAmplitude(prev => prev * 0.7 + rms * 0.3);

    animationFrameRef.current = requestAnimationFrame(updateAmplitude);
  };

  useEffect(() => {
    return () => stopMicrophone();
  }, []);

  // Map amplitude to visual properties
  const scale = 1 + amplitude * 1.5; // Scale up to 2.5x
  const glowStrength = amplitude * 40; // Max 40px glow
  const hueShift = amplitude * 30; // Shift hue slightly

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-12">
      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative flex items-center justify-center h-64 w-64">
        {/* The Orb */}
        <div
          className="rounded-full transition-all duration-75 ease-out shadow-2xl flex items-center justify-center"
          style={{
            width: '120px',
            height: '120px',
            background: `radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.9), hsl(var(--primary) / 1))`,
            transform: `scale(${scale})`,
            boxShadow: `0 0 ${20 + glowStrength}px ${5 + glowStrength/2}px hsl(var(--primary) / 0.4)`,
            filter: `hue-rotate(${hueShift}deg)`,
            border: `2px solid hsl(var(--primary) / 0.2)`
          }}
        >
          <div className="absolute inset-0 rounded-full bg-white opacity-10 animate-pulse" />
        </div>

        {/* Status Label */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <BadgeInfo className={status === 'listening' ? "text-primary animate-pulse" : "text-muted-foreground"} />
          <span className={`text-sm font-bold uppercase tracking-widest ${status === 'listening' ? 'text-primary' : 'text-muted-foreground'}`}>
            {status === 'idle' && "Idle"}
            {status === 'listening' && "Listening..."}
            {status === 'blocked' && "Microphone Blocked"}
            {status === 'unsupported' && "Web Audio Not Supported"}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          size="lg" 
          onClick={startMicrophone} 
          disabled={status === "listening"}
          className="gap-2 font-bold shadow-md"
        >
          <Mic className="w-4 h-4" />
          Start Microphone
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          onClick={stopMicrophone} 
          disabled={status !== "listening"}
          className="gap-2 font-bold"
        >
          <MicOff className="w-4 h-4" />
          Stop Microphone
        </Button>
      </div>

      {/* 
        DEVELOPER NOTES:
        - Future Integration: This component currently uses navigator.mediaDevices.getUserMedia to capture live audio.
        - To connect AI Voices: Replace the stream input source with a MediaElementSourceNode from a <audio> tag or a MediaStream from a WebRTC connection.
        - Multiple Orbs: For GD simulations, we can instantiate multiple instances of an orb (without the mic logic) and pass amplitude data as a prop.
        - User vs Bot Orbs: Wrap this in a higher-order component to differentiate between user input and bot audio output.
      */}
    </div>
  );
}

function BadgeInfo({ className }: { className?: string }) {
  return (
    <div className={`w-2 h-2 rounded-full bg-current ${className}`} />
  );
}
