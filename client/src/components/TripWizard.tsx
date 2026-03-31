import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

interface TripWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTripCreated: (tripId: number) => void;
}

export function TripWizard({ open, onOpenChange, onTripCreated }: TripWizardProps) {
  const [step, setStep] = useState(1);
  const [tripName, setTripName] = useState("");
  const [tripDescription, setTripDescription] = useState("");
  const [numDays, setNumDays] = useState("5");
  const [startDate, setStartDate] = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");

  const createTripMutation = trpc.trips.create.useMutation({
    onSuccess: (trip) => {
      if (trip?.id) {
        toast.success("Viagem criada com sucesso!");
        resetForm();
        onOpenChange(false);
        onTripCreated(trip.id);
      }
    },
    onError: () => toast.error("Erro ao criar viagem"),
  });

  const resetForm = () => {
    setStep(1);
    setTripName("");
    setTripDescription("");
    setNumDays("5");
    setStartDate("");
    setLocation("");
    setLocationLat("");
    setLocationLng("");
  };

  const handleNext = () => {
    if (step === 1 && !tripName.trim()) {
      toast.error("Nome da viagem é obrigatório");
      return;
    }
    if (step === 2 && !numDays) {
      toast.error("Número de dias é obrigatório");
      return;
    }
    if (step === 3 && !location.trim()) {
      toast.error("Local da viagem é obrigatório");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleCreate = () => {
    if (!tripName.trim() || !numDays || !location.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createTripMutation.mutate({
      name: tripName,
      description: tripDescription || undefined,
      startDate: startDate || undefined,
      numDays: parseInt(numDays),
      location: location,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLng: locationLng ? parseFloat(locationLng) : undefined,
    } as any);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Viagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Informações Básicas</h3>
              </div>
              <div>
                <Label htmlFor="tripName">Nome da Viagem *</Label>
                <Input
                  id="tripName"
                  placeholder="Ex: Paris 2025"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tripDescription">Descrição (opcional)</Label>
                <Input
                  id="tripDescription"
                  placeholder="Ex: 5 dias explorando a Europa"
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 2: Duration */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Duração da Viagem</h3>
              </div>
              <div>
                <Label htmlFor="numDays">Quantos dias? *</Label>
                <Input
                  id="numDays"
                  type="number"
                  min="1"
                  max="30"
                  value={numDays}
                  onChange={(e) => setNumDays(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Data de Início (opcional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Local da Viagem</h3>
              </div>
              <div>
                <Label htmlFor="location">Onde você vai viajar? *</Label>
                <Input
                  id="location"
                  placeholder="Ex: Paris, França"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="locationLat">Latitude (opcional)</Label>
                  <Input
                    id="locationLat"
                    type="number"
                    step="0.0001"
                    placeholder="48.8566"
                    value={locationLat}
                    onChange={(e) => setLocationLat(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="locationLng">Longitude (opcional)</Label>
                  <Input
                    id="locationLng"
                    type="number"
                    step="0.0001"
                    placeholder="2.3522"
                    value={locationLng}
                    onChange={(e) => setLocationLng(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Deixe em branco para usar o local padrão no mapa
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={createTripMutation.isPending}
                className="flex-1"
              >
                {createTripMutation.isPending ? "Criando..." : "Criar Viagem"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
