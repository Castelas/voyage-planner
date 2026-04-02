import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Hotel, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Day = RouterOutputs["itinerary"]["getDays"][number];
type Attraction = RouterOutputs["attractions"]["listByTrip"][number];

interface ItineraryPanelV2Props {
  days: Day[];
  allAttractions?: Attraction[];
  selectedDayId: number | null;
  onSelectDay: (dayId: number) => void;
  tripId: number;
}

export function ItineraryPanelV2({ days, allAttractions = [], selectedDayId, onSelectDay, tripId }: ItineraryPanelV2Props) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set(days.map((d) => d.id)));
  const [selectedAttractionTime, setSelectedAttractionTime] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();

  // Fetch day details with attractions
  const { data: dayDetails = {} } = trpc.itinerary.getDayWithAttractions.useQuery(
    { dayId: selectedDayId || 0 },
    { enabled: !!selectedDayId }
  );

  const toggleDayExpanded = (dayId: number) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(dayId)) {
      newSet.delete(dayId);
    } else {
      newSet.add(dayId);
    }
    setExpandedDays(newSet);
  };

  const updateDayMutation = trpc.itinerary.updateDay.useMutation({
    onSuccess: () => {
      utils.itinerary.getDays.invalidate({ tripId });
      toast.success("Dia atualizado");
    },
  });

  const addAttractionToDayMutation = trpc.itinerary.assignToDay.useMutation({
    onSuccess: () => {
      if (selectedDayId) {
        utils.itinerary.getDayWithAttractions.invalidate({ dayId: selectedDayId });
        utils.itinerary.getDays.invalidate({ tripId });
      }
      toast.success("Atração adicionada ao dia");
    },
    onError: (error: any) => {
      console.error("Erro:", error);
      toast.error("Erro ao adicionar atração");
    },
  });

  const removeAttractionFromDayMutation = trpc.itinerary.removeFromDay.useMutation({
    onSuccess: () => {
      if (selectedDayId) {
        utils.itinerary.getDayWithAttractions.invalidate({ dayId: selectedDayId });
        utils.itinerary.getDays.invalidate({ tripId });
      }
      toast.success("Atração removida do dia");
    },
    onError: () => toast.error("Erro ao remover atração"),
  });

  const handleAddAttractionToDay = (dayId: number, attractionId: number) => {
    const time = selectedAttractionTime[dayId];
    const attractionsLength = dayDetails && 'attractions' in dayDetails ? (dayDetails.attractions as Attraction[]).length : 0;
    addAttractionToDayMutation.mutate({
      dayId,
      attractionId,
      time: time || undefined,
      order: attractionsLength + 1,
    });
    setSelectedAttractionTime((prev) => ({
      ...prev,
      [dayId]: "",
    }));
  };

  const handleRemoveAttractionFromDay = (attractionId: number) => {
    removeAttractionFromDayMutation.mutate({
      attractionId,
    });
  };

  // Get attractions already added to selected day
  const dayAttractions = selectedDayId && dayDetails && 'attractions' in dayDetails ? (dayDetails.attractions as Attraction[]) : [];
  const availableAttractions = allAttractions.filter(
    (a) => !dayAttractions.some((da: Attraction) => da.id === a.id)
  );

  return (
    <div className="p-4 space-y-3">
      {days.map((day) => (
        <Card key={day.id} className="overflow-hidden">
          <button
            onClick={() => {
              onSelectDay(day.id);
              toggleDayExpanded(day.id);
            }}
            className={cn(
              "w-full p-4 text-left hover:bg-gray-50 transition-colors",
              selectedDayId === day.id && "bg-blue-50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{day.label || `Dia ${day.dayNumber}`}</h3>
                {day.date && <p className="text-sm text-gray-600">{day.date}</p>}
                {day.startTime && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {day.startTime} - {day.endTime || "Aberto"}
                  </div>
                )}
                {selectedDayId === day.id && dayAttractions.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {dayAttractions.length} atração{dayAttractions.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
              </div>
              {expandedDays.has(day.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {expandedDays.has(day.id) && (
            <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
              {/* Horários */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Horários do Dia</label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={day.startTime || ""}
                    onChange={(e) =>
                      updateDayMutation.mutate({
                        dayId: day.id,
                        startTime: e.target.value || undefined,
                      })
                    }
                    placeholder="Início"
                    className="text-sm"
                  />
                  <Input
                    type="time"
                    value={day.endTime || ""}
                    onChange={(e) =>
                      updateDayMutation.mutate({
                        dayId: day.id,
                        endTime: e.target.value || undefined,
                      })
                    }
                    placeholder="Fim"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Atrações do dia */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Atrações do Dia ({dayAttractions.length})
                </label>

                {/* Lista de atrações adicionadas */}
                {dayAttractions.length > 0 && (
                  <div className="space-y-2 mb-4 bg-white p-3 rounded-lg border border-gray-200">
                    {dayAttractions.map((attraction: Attraction, index: number) => (
                      <div
                        key={attraction.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {index + 1}. {attraction.name}
                          </p>
                          {attraction.address && (
                            <p className="text-xs text-gray-600 truncate">{attraction.address}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAttractionFromDay(attraction.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar atração */}
                {availableAttractions.length > 0 && (
                  <div className="flex gap-2 p-3 bg-white rounded-lg border border-gray-200">
                    <Select
                      onValueChange={(attractionId) => {
                        handleAddAttractionToDay(day.id, parseInt(attractionId));
                      }}
                    >
                      <SelectTrigger className="text-sm flex-1">
                        <SelectValue placeholder="+ Adicionar atração" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAttractions.map((attraction) => (
                          <SelectItem key={attraction.id} value={attraction.id.toString()}>
                            {attraction.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {availableAttractions.length === 0 && dayAttractions.length === 0 && (
                  <p className="text-xs text-gray-500 italic">Nenhuma atração adicionada. Crie atrações na aba de Atrações.</p>
                )}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
