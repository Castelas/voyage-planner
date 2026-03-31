import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Hotel, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      toast.success("Dia atualizado");
    },
  });

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
              </div>
              {expandedDays.has(day.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {expandedDays.has(day.id) && (
            <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
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

              {/* Alojamento */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Hotel className="w-3 h-3" />
                  Alojamento
                </label>
                <div className="text-sm">
                  {day.accommodationId ? (
                    <div className="bg-white p-2 rounded border border-green-200">
                      <p className="font-medium text-green-900">
                        {allAttractions.find((a) => a.id === day.accommodationId)?.name || "Alojamento"}
                      </p>
                      <p className="text-xs text-green-700">
                        {allAttractions.find((a) => a.id === day.accommodationId)?.address}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Nenhum alojamento definido</p>
                  )}
                </div>
              </div>

              {/* Atrações do dia */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Atrações
                </label>
                <div className="text-sm text-gray-600">
                  <p className="italic">Arraste atrações do painel lateral para adicionar ao dia</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
