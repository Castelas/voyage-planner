import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Plane, LogOut, Trash2 } from "lucide-react";
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
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);

  const { data: trips = [], isLoading } = trpc.trips.list.useQuery();

  const deleteTripMutation = trpc.trips.delete.useMutation({
    onSuccess: () => {
      toast.success("Viagem deletada");
      setTripToDelete(null);
    },
    onError: () => toast.error("Erro ao deletar viagem"),
  });

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
        <p className="text-gray-600">Carregando viagens...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <Plane className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Voyage Planner</h1>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Minhas Viagens</h2>

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
                <div key={trip.id} className="flex gap-2 items-stretch">
                  <button
                    onClick={() => handleSelectTrip(trip.id)}
                    className="flex-1 p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                    {trip.description && (
                      <p className="text-sm text-gray-600 mt-1">{trip.description}</p>
                    )}
                    {trip.startDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        {trip.startDate} a {trip.endDate}
                      </p>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTripToDelete(trip.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={tripToDelete !== null}
          onOpenChange={(open) => !open && setTripToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deletar Viagem?</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar esta viagem? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setTripToDelete(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (tripToDelete) {
                    deleteTripMutation.mutate({ tripId: tripToDelete });
                  }
                }}
                disabled={deleteTripMutation.isPending}
                className="flex-1"
              >
                {deleteTripMutation.isPending ? "Deletando..." : "Deletar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
