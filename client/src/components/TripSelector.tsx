import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Plane } from "lucide-react";
import { toast } from "sonner";

interface TripSelectorProps {
  onSelectTrip: (tripId: number) => void;
}

export function TripSelector({ onSelectTrip }: TripSelectorProps) {
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
      if (trip?.id) onSelectTrip(trip.id);
    },
    onError: () => toast.error("Erro ao criar viagem"),
  });

  const handleCreateTrip = () => {
    if (!newTripName.trim()) {
      toast.error("Nome da viagem é obrigatório");
      return;
    }
    createTripMutation.mutate({
      name: newTripName,
      description: newTripDescription || undefined,
    });
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
            <Button onClick={() => setShowDialog(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Viagem
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => onSelectTrip(trip.id)}
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

            <Button onClick={() => setShowDialog(true)} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Viagem
            </Button>
          </>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Viagem</DialogTitle>
              <DialogDescription>Adicione os detalhes da sua nova viagem</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome da Viagem</label>
                <Input
                  placeholder="Ex: Sicília 2025"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
                <Input
                  placeholder="Ex: 5 dias explorando a Sicília"
                  value={newTripDescription}
                  onChange={(e) => setNewTripDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateTrip} disabled={createTripMutation.isPending} className="flex-1">
                  {createTripMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
