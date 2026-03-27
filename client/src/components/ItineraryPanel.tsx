import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttractionCard } from "@/components/AttractionCard";
import { cn } from "@/lib/utils";
import { Clock, Navigation, MapPin, ChevronDown, ChevronUp, Route } from "lucide-react";
import { toast } from "sonner";

type Attraction = RouterOutputs["attractions"]["list"][number];
type DayData = RouterOutputs["itinerary"]["getDays"][number];

interface ItineraryPanelProps {
  days: DayData[];
  allAttractions: Attraction[];
  selectedDayId: number | null;
  onSelectDay: (dayId: number) => void;
  onAttractionSelect: (attraction: Attraction) => void;
  onRefresh: () => void;
}

// ─── Sortable Attraction Item ────────────────────────────────────────────────

function SortableAttractionItem({
  attraction,
  onVote,
  onDelete,
  onToggleStatus,
  onSelect,
  isSelected,
}: {
  attraction: Attraction;
  onVote?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number) => void;
  onSelect?: (a: Attraction) => void;
  isSelected?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attraction.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AttractionCard
        attraction={attraction}
        onVote={onVote}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onSelect={onSelect}
        isSelected={isSelected}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        compact
      />
    </div>
  );
}

// ─── Day Column ──────────────────────────────────────────────────────────────

function DayColumn({
  day,
  attractions,
  isSelected,
  onSelect,
  onVote,
  onDelete,
  onToggleStatus,
  onAttractionSelect,
  selectedAttractionId,
  directionsInfo,
}: {
  day: DayData["day"];
  attractions: Attraction[];
  isSelected: boolean;
  onSelect: () => void;
  onVote: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onAttractionSelect: (a: Attraction) => void;
  selectedAttractionId?: number | null;
  directionsInfo?: { totalDistance: string; totalDuration: string } | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const confirmedCount = attractions.filter((a) => a.status === "confirmed").length;

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all duration-200",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      {/* Day header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {day.dayNumber}
          </div>
          <div>
            <p className="font-semibold text-sm">{day.label}</p>
            {attractions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {attractions.length} atração{attractions.length !== 1 ? "ões" : ""}
                {confirmedCount > 0 && ` · ${confirmedCount} confirmada${confirmedCount !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {directionsInfo && isSelected && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Navigation size={10} />
                {directionsInfo.totalDistance}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {directionsInfo.totalDuration}
              </span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Drop zone */}
      {!collapsed && (
        <div className="px-2 pb-2 min-h-[60px]">
          <SortableContext
            items={attractions.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            {attractions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-12 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                <MapPin size={14} className="mb-1 opacity-40" />
                Arraste atrações aqui
              </div>
            ) : (
              <div className="space-y-1.5">
                {attractions.map((attraction, idx) => (
                  <div key={attraction.id} className="relative">
                    {idx > 0 && directionsInfo?.totalDuration && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pl-4 py-0.5">
                        <Route size={9} />
                        <span className="text-[10px]">↓</span>
                      </div>
                    )}
                    <SortableAttractionItem
                      attraction={attraction}
                      onVote={onVote}
                      onDelete={onDelete}
                      onToggleStatus={onToggleStatus}
                      onSelect={onAttractionSelect}
                      isSelected={selectedAttractionId === attraction.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// ─── Main Itinerary Panel ────────────────────────────────────────────────────

export function ItineraryPanel({
  days,
  allAttractions,
  selectedDayId,
  onSelectDay,
  onAttractionSelect,
  onRefresh,
}: ItineraryPanelProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const assignMutation = trpc.itinerary.assignToDay.useMutation({
    onSuccess: () => {
      utils.itinerary.getDays.invalidate();
      utils.attractions.list.invalidate();
    },
    onError: () => toast.error("Erro ao mover atração"),
  });

  const removeMutation = trpc.itinerary.removeFromDay.useMutation({
    onSuccess: () => {
      utils.itinerary.getDays.invalidate();
      utils.attractions.list.invalidate();
    },
  });

  const reorderMutation = trpc.itinerary.reorder.useMutation({
    onSuccess: () => utils.itinerary.getDays.invalidate(),
  });

  const deleteMutation = trpc.attractions.delete.useMutation({
    onSuccess: () => {
      utils.attractions.list.invalidate();
      utils.itinerary.getDays.invalidate();
      toast.success("Atração removida");
    },
  });

  const toggleStatusMutation = trpc.attractions.toggleStatus.useMutation({
    onSuccess: () => {
      utils.attractions.list.invalidate();
      utils.itinerary.getDays.invalidate();
    },
  });

  const voteMutation = trpc.attractions.vote.useMutation({
    onSuccess: (data) => {
      utils.attractions.list.invalidate();
      toast.success(data.added ? "Favoritado!" : "Favorito removido");
    },
    onError: () => toast.error("Faça login para votar"),
  });

  // Directions for selected day
  const selectedDay = days.find((d) => d.day.id === selectedDayId);
  const selectedDayAttractions = selectedDay?.attractions ?? [];
  const waypoints = selectedDayAttractions
    .filter((a) => a.lat && a.lng)
    .map((a) => ({ lat: a.lat!, lng: a.lng!, name: a.name }));

  const { data: directionsData } = trpc.itinerary.getDirections.useQuery(
    { waypoints },
    { enabled: waypoints.length >= 2 }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Build a map of attractionId -> dayId
  const attractionDayMap = new Map<number, number>();
  days.forEach((d) => {
    d.attractions.forEach((a) => attractionDayMap.set(a.id, d.day.id));
  });

  // Unassigned attractions (not in any day)
  const assignedIds = new Set(Array.from(attractionDayMap.keys()));
  const unassigned = allAttractions.filter((a) => !assignedIds.has(a.id));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeAttrId = active.id as number;
    const overId = over.id as string | number;

    // Determine target container
    let targetDayId: number | null = null;
    let targetIsUnassigned = false;

    if (overId === "unassigned") {
      targetIsUnassigned = true;
    } else if (typeof overId === "number") {
      // Over an attraction - find which day it belongs to
      const dayId = attractionDayMap.get(overId as number);
      if (dayId) targetDayId = dayId;
      else targetIsUnassigned = true;
    } else if (typeof overId === "string" && overId.startsWith("day-")) {
      targetDayId = parseInt(overId.replace("day-", ""));
    }

    const sourceDayId = attractionDayMap.get(activeAttrId) ?? null;

    if (targetIsUnassigned) {
      if (sourceDayId) {
        removeMutation.mutate({ attractionId: activeAttrId });
      }
      return;
    }

    if (!targetDayId) return;

    if (sourceDayId === targetDayId) {
      // Reorder within same day
      const dayData = days.find((d) => d.day.id === targetDayId);
      if (!dayData) return;
      const ids = dayData.attractions.map((a) => a.id);
      const oldIdx = ids.indexOf(activeAttrId);
      const newIdx = ids.indexOf(overId as number);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const newOrder = arrayMove(ids, oldIdx, newIdx);
        reorderMutation.mutate({ dayId: targetDayId, orderedAttractionIds: newOrder });
      }
    } else {
      // Move to different day
      const targetDay = days.find((d) => d.day.id === targetDayId);
      const newOrder = targetDay ? targetDay.attractions.length : 0;
      assignMutation.mutate({ attractionId: activeAttrId, dayId: targetDayId, order: newOrder });
    }
  };

  const activeAttraction = activeId
    ? allAttractions.find((a) => a.id === activeId)
    : null;

  const handleAttractionSelect = (attraction: Attraction) => {
    setSelectedAttractionId(attraction.id);
    onAttractionSelect(attraction);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3 h-full overflow-y-auto pb-4">
        {/* Days */}
        {days.map((dayData) => (
          <DayColumn
            key={dayData.day.id}
            day={dayData.day}
            attractions={dayData.attractions as unknown as Attraction[]}
            isSelected={selectedDayId === dayData.day.id}
            onSelect={() => onSelectDay(dayData.day.id)}
            onVote={(id) => voteMutation.mutate({ attractionId: id })}
            onDelete={(id) => deleteMutation.mutate({ id })}
            onToggleStatus={(id) => toggleStatusMutation.mutate({ id })}
            onAttractionSelect={handleAttractionSelect}
            selectedAttractionId={selectedAttractionId}
            directionsInfo={
              selectedDayId === dayData.day.id && directionsData
                ? { totalDistance: directionsData.totalDistance, totalDuration: directionsData.totalDuration }
                : null
            }
          />
        ))}

        {/* Unassigned / Ideas pool */}
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30">
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Banco de Ideias</p>
                <p className="text-xs text-muted-foreground">
                  {unassigned.length} atração{unassigned.length !== 1 ? "ões" : ""} não alocada{unassigned.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="p-2 min-h-[60px]">
            <SortableContext
              id="unassigned"
              items={unassigned.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {unassigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-12 text-xs text-muted-foreground">
                  <span className="opacity-40">Todas as atrações estão alocadas</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {unassigned.map((attraction) => (
                    <SortableAttractionItem
                      key={attraction.id}
                      attraction={attraction}
                      onVote={(id) => voteMutation.mutate({ attractionId: id })}
                      onDelete={(id) => deleteMutation.mutate({ id })}
                      onToggleStatus={(id) => toggleStatusMutation.mutate({ id })}
                      onSelect={handleAttractionSelect}
                      isSelected={selectedAttractionId === attraction.id}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAttraction && (
          <AttractionCard
            attraction={activeAttraction}
            compact
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
