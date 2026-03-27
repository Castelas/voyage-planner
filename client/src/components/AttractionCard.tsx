import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical, Heart, MapPin, Star, Trash2, CheckCircle, Lightbulb } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc";

type Attraction = RouterOutputs["attractions"]["list"][number];

interface AttractionCardProps {
  attraction: Attraction;
  onVote?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number) => void;
  onSelect?: (attraction: Attraction) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  compact?: boolean;
  showDayBadge?: boolean;
  dayLabel?: string;
}

export function AttractionCard({
  attraction,
  onVote,
  onDelete,
  onToggleStatus,
  onSelect,
  isSelected,
  isDragging,
  dragHandleProps,
  compact = false,
  showDayBadge,
  dayLabel,
}: AttractionCardProps) {
  const isConfirmed = attraction.status === "confirmed";

  return (
    <Card
      className={cn(
        "group relative transition-all duration-200 cursor-pointer select-none",
        isSelected && "ring-2 ring-primary shadow-md",
        isDragging && "opacity-50 shadow-xl rotate-1",
        isConfirmed ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-amber-400",
        compact ? "p-2" : "p-3"
      )}
      onClick={() => onSelect?.(attraction)}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Photo thumbnail */}
        {!compact && attraction.photoUrl && (
          <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted">
            <img
              src={attraction.photoUrl}
              alt={attraction.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className={cn("font-medium leading-tight truncate", compact ? "text-xs" : "text-sm")}>
              {attraction.name}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {showDayBadge && dayLabel && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {dayLabel}
                </Badge>
              )}
            </div>
          </div>

          {!compact && attraction.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <MapPin size={10} className="flex-shrink-0" />
              {attraction.address}
            </p>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2">
              {/* Status badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus?.(attraction.id);
                }}
                className={cn(
                  "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full transition-colors",
                  isConfirmed
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                )}
              >
                {isConfirmed ? (
                  <CheckCircle size={10} />
                ) : (
                  <Lightbulb size={10} />
                )}
                {!compact && (isConfirmed ? "Confirmado" : "Ideia")}
              </button>

              {/* Rating */}
              {attraction.rating && (
                <span className="flex items-center gap-0.5 text-xs text-amber-500">
                  <Star size={10} fill="currentColor" />
                  {attraction.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onVote && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote(attraction.id);
                  }}
                  className={cn(
                    "flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full transition-colors",
                    attraction.userVoted
                      ? "text-rose-500 bg-rose-50"
                      : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                  )}
                >
                  <Heart size={10} fill={attraction.userVoted ? "currentColor" : "none"} />
                  {attraction.voteCount > 0 && (
                    <span>{attraction.voteCount}</span>
                  )}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(attraction.id);
                  }}
                  className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
