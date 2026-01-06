import { Layout } from "@/components/layout/Layout";
import { LiveVoiceOrb } from "@/components/LiveVoiceOrb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquareText } from "lucide-react";

export default function VoiceOrbDemo() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Voice Orb Demo</h1>
          <p className="text-xl text-muted-foreground">Realtime voice-responsive avatar (mic input)</p>
        </div>

        <Card className="border-none shadow-2xl bg-gradient-to-b from-white to-muted/20">
          <CardHeader className="text-center pb-0">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquareText className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>AI Voice Interaction</CardTitle>
            <CardDescription>
              Grant microphone access to see the orb respond to your voice volume in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LiveVoiceOrb />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Web Audio API</h3>
              <p className="text-sm text-muted-foreground">
                Uses browser's native audio analyzer to measure frequency and volume without any external latency.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Reactive Scaling</h3>
              <p className="text-sm text-muted-foreground">
                The orb's scale and glow intensity are mapped to your voice magnitude for organic-feeling responses.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Future Proof</h3>
              <p className="text-sm text-muted-foreground">
                Built to be easily connected to AI text-to-speech engines for full bidirectional conversation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
