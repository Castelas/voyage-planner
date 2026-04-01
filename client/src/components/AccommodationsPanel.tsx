import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Hotel, Plus, X, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Day = RouterOutputs["itinerary"]["getDays"][number];

interface AccommodationsPanelProps {
  days: Day[];
  tripId: number;
  onAccommodationAdded?: () => void;
}

export function AccommodationsPanel({ days, tripId, onAccommodationAdded }: AccommodationsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [accommodationName, setAccommodationName] = useState("");
  const [accommodationAddress, setAccommodationAddress] = useState("");
  const [accommodationPhone, setAccommodationPhone] = useState("");
  const [selectedDayForAccommodation, setSelectedDayForAccommodation] = useState<number | null>(null);

  const createAccommodationMutation = trpc.attractions.create.useMutation({
    onSuccess: () => {
      toast.success("Alojamento adicionado");
      setAccommodationName("");
      setAccommodationAddress("");
      setAccommodationPhone("");
      setShowAddForm(false);
      onAccommodationAdded?.();
    },
    onError: () => toast.error("Erro ao adicionar alojamento"),
  });

  const handleAddAccommodation = () => {
    if (!accommodationName.trim()) {
      toast.error("Nome do alojamento é obrigatório");
      return;
    }
    if (!selectedDayForAccommodation) {
      toast.error("Selecione um dia");
      return;
    }

    createAccommodationMutation.mutate({
      tripId,
      name: accommodationName,
      address: accommodationAddress,
      latitude: 0,
      longitude: 0,
      type: "accommodation",
      phoneNumber: accommodationPhone || undefined,
    } as any);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Hotel className="w-5 h-5 text-green-600" />
          Alojamentos
        </h2>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 space-y-3 bg-green-50 border-green-200">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome do Alojamento *</label>
            <Input
              placeholder="Ex: Hotel Palermo"
              value={accommodationName}
              onChange={(e) => setAccommodationName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Endereço</label>
            <Input
              placeholder="Ex: Via Roma, 123, Palermo"
              value={accommodationAddress}
              onChange={(e) => setAccommodationAddress(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <Input
              placeholder="Ex: +39 091 123 4567"
              value={accommodationPhone}
              onChange={(e) => setAccommodationPhone(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Selecione o Dia *</label>
            <Select
              value={selectedDayForAccommodation?.toString() || ""}
              onValueChange={(value) => setSelectedDayForAccommodation(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um dia" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day.id} value={day.id.toString()}>
                    {day.label || `Dia ${day.dayNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddAccommodation}
              disabled={createAccommodationMutation.isPending}
              className="flex-1"
            >
              {createAccommodationMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </Card>
      )}

      {days.length === 0 ? (
        <p className="text-gray-500 text-sm italic">Nenhum dia disponível</p>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <Card key={day.id} className="p-3 border-green-200 bg-green-50">
              <h3 className="font-medium text-sm text-gray-900 mb-2">
                {day.label || `Dia ${day.dayNumber}`}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {day.accommodationId ? "Alojamento definido" : "Sem alojamento"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
