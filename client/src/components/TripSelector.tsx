import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Plane, LogOut } from "lucide-react";
import { TripWizard } from "./TripWizard";
import { toast } from "sonner";

interface TripSelectorProps {
  onSelectTrip: (tripId: number) => void;
  onLogout: () => void;
}

export function TripSelector({ onSelectTrip, onLogout }: TripSelectorProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newTripDescription, setNewTripDescription] = useState("");

  const { data: trips = [], isLoading } = trpc.trips.list.useQuery();
  const createTripMutation = trpc.trips.create.useMutation({
    onSuccess: (trip) => {
      toast.success("Viagem criada!");
      setNewTripName("");
      setNewTripDescription("");
      setShowDialog(false);
      if (trip?.id) {
        localStorage.setItem("selectedTripId", trip.id.toString());
        onSelectTrip(trip.id);
      }
    },
    onError: () => toast.error("Erro ao criar viagem"),
  });

  const handleSelectTrip = (tripId: number) => {
    localStorage.setItem("selectedTripId", tripId.toString());
    onSelectTrip(tripId);
  };

  const handleTripCreatedFromWizard = (tripId: number) => {
    localStorage.setItem("selectedTripId", tripId.toString());
    onSelectTrip(tripId);
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Plane className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-bounce" />
          <p className="text-gray-600">Carregando viagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <Plane className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Minhas Viagens</h1>
        </div>

        <p className="text-gray-600 text-center mb-6">Selecione uma viagem para começar a planejar</p>

        {trips.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Você ainda não tem nenhuma viagem</p>
            <div className="flex gap-2">
              <Button onClick={() => setShowWizard(true)} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Viagem
              </Button>
              <Button onClick={onLogout} variant="outline" size="icon">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip.id)}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                  {trip.description && <p className="text-sm text-gray-600 mt-1">{trip.description}</p>}
                  {trip.startDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      {trip.startDate} a {trip.endDate}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowWizard(true)} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Nova Viagem
              </Button>
              <Button onClick={onLogout} variant="outline" size="icon">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        <TripWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onTripCreated={handleTripCreatedFromWizard}
        />
      </div>
    </div>
  );
}
