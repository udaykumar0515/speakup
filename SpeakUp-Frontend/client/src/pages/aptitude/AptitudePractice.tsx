import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, BrainCircuit, BookOpen } from "lucide-react";
import AptitudeQuiz from "./AptitudeQuiz";

const TOPICS = [
  { id: "quantitative", label: "Quantitative Aptitude", icon: Calculator, desc: "Numbers, algebra, and math problems" },
  { id: "logical", label: "Logical Reasoning", icon: BrainCircuit, desc: "Patterns, sequences, and logic puzzles" },
  { id: "verbal", label: "Verbal Ability", icon: BookOpen, desc: "Grammar, vocabulary, and comprehension" },
];

export default function AptitudePractice() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  if (selectedTopic) {
    return <AptitudeQuiz topic={selectedTopic} onExit={() => setSelectedTopic(null)} />;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-display font-bold">Aptitude Practice</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a topic to start a practice quiz. Each quiz consists of 5 questions to test your skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOPICS.map((topic) => (
            <Card 
              key={topic.id}
              className="hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedTopic(topic.id)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <topic.icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{topic.label}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{topic.desc}</p>
                </div>
                <Button className="w-full mt-4" variant="outline">Start Quiz</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
