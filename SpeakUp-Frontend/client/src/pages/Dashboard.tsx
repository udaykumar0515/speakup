import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Brain, MessageSquare, Users, FileText, ArrowRight } from "lucide-react";

const TOOLS = [
  {
    title: "Aptitude Practice",
    description: "Sharpen your logical and quantitative skills with topic-wise quizzes.",
    icon: Brain,
    href: "/aptitude",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Mock Interview",
    description: "Practice with AI-driven mock interviews and get instant feedback.",
    icon: MessageSquare,
    href: "/interview",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    title: "GD Simulator",
    description: "Participate in simulated group discussions with AI bots.",
    icon: Users,
    href: "/gd",
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    title: "Resume Analyzer",
    description: "Upload your resume to check ATS compatibility and get suggestions.",
    icon: FileText,
    href: "/resume",
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Voice Orb Demo",
    description: "Experience the real-time AI voice-reactive interface.",
    icon: MessageSquare,
    href: "/voice-orb-demo",
    color: "bg-pink-500",
    gradient: "from-pink-500 to-pink-600",
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Hello, {user?.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Ready to boost your placement preparation today?</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border text-sm font-medium">
            Next Goal: Complete 1 Aptitude Quiz
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((tool, index) => (
            <Link key={tool.title} href={tool.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden bg-card rounded-2xl p-6 border hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.gradient} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8`} />
                
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center shadow-lg shadow-black/5`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    Start Now
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{tool.description}</p>
                
                <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  Launch Tool <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-card rounded-2xl border p-6">
          <h3 className="font-display font-bold text-lg mb-4">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-xl border-muted">
            <p>No recent activity yet. Start your first practice session!</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
