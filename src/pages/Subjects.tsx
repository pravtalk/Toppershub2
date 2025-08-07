import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Calculator, FlaskConical, Globe, PenTool, Microscope } from "lucide-react";
import Navigation from "@/components/Navigation";

const Subjects = () => {
  const subjects = [
    {
      id: 1,
      title: "Mathematics",
      description: "Algebra, Geometry, Calculus & more",
      icon: Calculator,
      color: "bg-blue-500",
      lectures: 45,
      notes: 120
    },
    {
      id: 2,
      title: "Science",
      description: "Physics, Chemistry, Biology",
      icon: FlaskConical,
      color: "bg-green-500",
      lectures: 60,
      notes: 180
    },
    {
      id: 3,
      title: "Social Science",
      description: "History, Geography, Civics",
      icon: Globe,
      color: "bg-purple-500",
      lectures: 35,
      notes: 95
    },
    {
      id: 4,
      title: "English",
      description: "Literature, Grammar, Writing",
      icon: PenTool,
      color: "bg-orange-500",
      lectures: 30,
      notes: 80
    },
    {
      id: 5,
      title: "Computer Science",
      description: "Programming, Data Structures",
      icon: Microscope,
      color: "bg-cyan-500",
      lectures: 25,
      notes: 70
    },
    {
      id: 6,
      title: "Business Studies",
      description: "Economics, Accounting, Management",
      icon: BookOpen,
      color: "bg-pink-500",
      lectures: 40,
      notes: 110
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            PraveshCoderZ
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📚 Subjects</div>
          <h2 className="text-2xl font-bold mb-2">Explore our learning resources</h2>
          <p className="text-muted-foreground">Choose a subject to access lectures, notes and practice materials</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const IconComponent = subject.icon;
            return (
              <Card
                key={subject.id}
                className="gradient-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${subject.color} p-3 flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{subject.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{subject.description}</p>
                    
                    <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                      <span>{subject.lectures} Lectures</span>
                      <span>{subject.notes} Notes</span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="study" size="sm" className="flex-1">
                        View Lectures
                      </Button>
                      <Button variant="outline" size="sm">
                        Notes
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-muted-foreground">
                  ⚡ Powered by @PraveshCoderZ
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default Subjects;