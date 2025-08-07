import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";

const LiveClasses = () => {
  const liveClasses = [
    {
      id: 1,
      title: "1st Live Class",
      instructor: "Prof. PraveshCoderz",
      subject: "Mathematics",
      difficulty: "Advanced",
      time: "5:00 PM",
      duration: "90 min",
      days: "Mon, Wed, Fri",
      startsIn: "5 hours 38 minutes",
      isLive: false
    },
    {
      id: 2,
      title: "2nd Live Class",
      instructor: "Prof. PraveshCoderz",
      subject: "Physics",
      difficulty: "Intermediate",
      time: "8:00 PM",
      duration: "90 min",
      days: "Tue, Thu",
      startsIn: "8 hours 38 minutes",
      isLive: false
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              PraveshCoderZ
            </h1>
            <div className="flex gap-2">
              <Badge variant="outline" className="gradient-accent text-accent-foreground">
                PREMIUM
              </Badge>
              <Badge variant="outline" className="bg-info text-white">
                UPCOMING CLASSES
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Live Classes Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Live Classes</h2>
          <p className="text-muted-foreground">Join upcoming live sessions with expert instructors</p>
        </div>

        <div className="space-y-4">
          {liveClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* Class Avatar */}
                <div className="w-16 h-16 rounded-xl gradient-primary p-3 flex items-center justify-center">
                  <div className="text-primary-foreground font-bold text-sm">
                    PC
                  </div>
                </div>

                {/* Class Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{classItem.title}</h3>
                    <Badge variant="outline" className="bg-warning text-black">
                      PRO
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {classItem.instructor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {classItem.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {classItem.days}
                    </div>
                  </div>

                  <Badge 
                    variant="secondary"
                    className={classItem.difficulty === "Advanced" ? "bg-destructive text-destructive-foreground" : 
                              classItem.difficulty === "Intermediate" ? "bg-warning text-black" : "bg-success text-white"}
                  >
                    {classItem.difficulty}
                  </Badge>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-muted-foreground">Starts in {classItem.startsIn}</div>
                      <div className="font-semibold">CLASS AT {classItem.time}</div>
                    </div>

                    <Button 
                      variant={classItem.isLive ? "join" : "study"}
                      size="default"
                    >
                      {classItem.isLive ? "Join Live" : "Set Reminder"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default LiveClasses;