import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, BookOpen, Clock, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface BatchCardProps {
  batch: {
    id: number | string;
    title: string;
    subtitle: string;
    image: string;
    tags: string[];
    stats: {
      lessons: string;
      resources: string;
      support: string;
    };
    isNew?: boolean;
  };
  onEdit?: () => void;
  showEdit?: boolean;
}

const BatchCard = ({ batch, onEdit, showEdit = false }: BatchCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEnroll = () => {
    if (!user) {
      navigate('/auth');
      toast({
        title: 'Login Required',
        description: 'Please login to enroll in courses.',
      });
    } else {
      // Navigate to batch view page
      navigate(`/batch/${batch.id}`);
    }
  };
  return (
    <Card className="gradient-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
        {batch.image ? (
          <img 
            src={batch.image} 
            alt={batch.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl font-bold text-primary/30">PC</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        
        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="outline" className="bg-primary text-primary-foreground text-xs">
            {batch.tags[0]}
          </Badge>
          {batch.isNew && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">
              New
            </Badge>
          )}
        </div>

        {/* Edit Button */}
        {showEdit && onEdit && (
          <div className="absolute top-3 right-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="bg-background/80 backdrop-blur-sm"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Subject Tag */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-info text-white">
            {batch.subtitle}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-bold text-lg mb-2 text-accent">{batch.title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="text-destructive">🎯</span>
          <span>CBSE</span>
          <span className="text-success">🟢</span>
          <span>Enrollment Open</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="font-bold text-accent text-lg">{batch.stats.lessons}</div>
            <div className="text-xs text-muted-foreground">LESSONS</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-accent text-lg">{batch.stats.resources}</div>
            <div className="text-xs text-muted-foreground">RESOURCES</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-accent text-lg">{batch.stats.support}</div>
            <div className="text-xs text-muted-foreground">SUPPORT</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Comprehensive batch for Class {batch.title.includes("11th") ? "11th" : batch.title.includes("10th") ? "10th" : "12th"} CBSE {batch.subtitle} students. Next Toppers
        </p>

        <Button 
          variant="secondary" 
          className="w-full rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
          onClick={handleEnroll}
        >
          {user ? "Let's Study" : "Login to Enroll"}
        </Button>
      </div>
    </Card>
  );
};

export default BatchCard;