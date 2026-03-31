import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Search, MapPin, Star, Loader2, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddAttractionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  tripId?: number;
}

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  photoReference?: string;
  category?: string;
};

export function AddAttractionDialog({ open, onClose, onAdded, tripId = 1 }: AddAttractionDialogProps) {
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  // Manual form
  const [manualName, setManualName] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualAddress, setManualAddress] = useState("");

  const { data: searchResults, isFetching } = trpc.attractions.searchPlaces.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const createMutation = trpc.attractions.create.useMutation({
    onSuccess: () => {
      toast.success("Atração adicionada com sucesso!");
      onAdded();
      handleClose();
    },
    onError: (err) => toast.error("Erro ao adicionar: " + err.message),
  });

  const handleClose = () => {
    setSearchQuery("");
    setSearchInput("");
    setSelectedPlace(null);
    setManualName("");
    setManualDesc("");
    setManualAddress("");
    setMode("search");
    onClose();
  };

  const handleSearch = () => {
    if (searchInput.trim().length > 2) {
      setSearchQuery(searchInput.trim());
    }
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place);
  };

  const handleAddPlace = () => {
    if (!selectedPlace) return;
    createMutation.mutate({
      tripId,
      name: selectedPlace.name,
      address: selectedPlace.address,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      placeId: selectedPlace.placeId,
      rating: selectedPlace.rating,
      category: selectedPlace.category,
      status: "idea",
    });
  };

  const handleAddManual = () => {
    if (!manualName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    createMutation.mutate({
      tripId,
      name: manualName.trim(),
      description: manualDesc.trim() || undefined,
      address: manualAddress.trim() || undefined,
      status: "idea",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            Adicionar Atração
          </DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setMode("search")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
              mode === "search" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Buscar no Google Places
          </button>
          <button
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all",
              mode === "manual" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Adicionar manualmente
          </button>
        </div>

        {mode === "search" ? (
          <div className="space-y-3">
            {/* Search input */}
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Valle dei Templi, Palermo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" disabled={isFetching}>
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>

            {/* Results */}
            {searchResults && searchResults.length > 0 && !selectedPlace && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((place) => (
                  <button
                    key={place.placeId}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{place.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          <MapPin size={10} className="inline mr-1" />
                          {place.address}
                        </p>
                        {place.rating && (
                          <p className="text-xs text-amber-500 mt-0.5">
                            <Star size={10} className="inline mr-0.5" fill="currentColor" />
                            {place.rating.toFixed(1)}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary mt-1 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults && searchResults.length === 0 && searchQuery && !isFetching && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum resultado encontrado. Tente outros termos.
              </p>
            )}

            {/* Selected place confirmation */}
            {selectedPlace && (
              <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{selectedPlace.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedPlace.address}</p>
                    {selectedPlace.rating && (
                      <p className="text-xs text-amber-500 mt-0.5">
                        <Star size={10} className="inline mr-0.5" fill="currentColor" />
                        {selectedPlace.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Trocar
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddPlace}
                    disabled={createMutation.isPending}
                    className="flex-1"
                    size="sm"
                  >
                    {createMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Plus size={14} className="mr-1" />
                    )}
                    Adicionar como ideia
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome da atração"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Endereço / Localização</Label>
              <Input
                id="address"
                placeholder="Ex: Agrigento, Sicília"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                placeholder="Notas sobre a atração..."
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleAddManual}
              disabled={createMutation.isPending || !manualName.trim()}
              className="w-full"
            >
              {createMutation.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Plus size={14} className="mr-1" />
              )}
              Adicionar atração
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
