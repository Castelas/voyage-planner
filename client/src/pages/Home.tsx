import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";
import { SiciliaMap } from "@/components/SiciliaMap";
import { ItineraryPanelV2 } from "@/components/ItineraryPanelV2";
import { AddAttractionDialog } from "@/components/AddAttractionDialog";
import { AttractionCard } from "@/components/AttractionCard";
import { TripSelector } from "@/components/TripSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Plus,
  Map,
  Calendar,
  List,
  Search,
  Filter,
  LogIn,
  LogOut,
  Plane,
  ChevronLeft,
  ChevronRight,
  Heart,
  CheckCircle,
  Lightbulb,
  Users,
  Download,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Attraction = RouterOutputs["attractions"]["listByTrip"][number];
type ViewMode = "map" | "itinerary";
type FilterStatus = "all" | "idea" | "confirmed";

export default function HomePage() {
  // ═══════════════════════════════════════════════════════════════════════════════
  // IMPORTANT: All hooks MUST be called unconditionally at the top of the component
  // This prevents the "Rendered more hooks than during the previous render" error
  // ═══════════════════════════════════════════════════════════════════════════════

  const { user, logout } = useAuth();
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const utils = trpc.useUtils();

  // Fetch trip data (even if not selected, to avoid hook order issues)
  const { data: currentTrip } = trpc.trips.get.useQuery(
    { tripId: selectedTripId || 0 },
    { enabled: !!selectedTripId }
  );
  const { data: attractions = [], isLoading: attractionsLoading } = trpc.attractions.listByTrip.useQuery(
    { tripId: selectedTripId || 0 },
    { enabled: !!selectedTripId }
  );
  const { data: days = [], isLoading: daysLoading } = trpc.itinerary.getDays.useQuery(
    { tripId: selectedTripId || 0 },
    { enabled: !!selectedTripId }
  );

  const deleteMutation = trpc.attractions.delete.useMutation({
    onSuccess: () => {
      if (selectedTripId) {
        utils.attractions.listByTrip.invalidate({ tripId: selectedTripId });
        utils.itinerary.getDays.invalidate({ tripId: selectedTripId });
      }
      toast.success("Atração removida");
    },
  });

  const voteMutation = trpc.attractions.vote.useMutation({
    onSuccess: (data) => {
      if (selectedTripId) {
        utils.attractions.listByTrip.invalidate({ tripId: selectedTripId });
      }
      toast.success(data.added ? "Favoritado!" : "Favorito removido");
    },
    onError: () => toast.error("Erro ao votar"),
  });

  const exportMutation = trpc.export.exportToGoogleDrive.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      console.log("Document content:", data.documentContent);
    },
    onError: () => toast.error("Erro ao exportar"),
  });

  // Filtered attractions for list view
  const filteredAttractions = useMemo(() => {
    return attractions.filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [attractions, filterStatus, searchQuery]);

  // Selected day data
  const selectedDay = days.find((d) => d.id === selectedDayId);
  const selectedDayAttractions = useMemo(() => {
    if (!selectedDay) return [];
    const ids = new Set(selectedDay.accommodationId ? [selectedDay.accommodationId] : []);
    attractions.forEach((a) => {
      if (a.id === selectedDay.accommodationId) ids.add(a.id);
    });
    return attractions.filter((a) => ids.has(a.id));
  }, [selectedDay, attractions]);

  // Directions for selected day
  const waypoints = useMemo(
    () =>
      selectedDayAttractions
        .filter((a) => a.lat && a.lng)
        .map((a) => ({ lat: a.lat!, lng: a.lng!, name: a.name })),
    [selectedDayAttractions]
  );

  const { data: directionsData } = trpc.itinerary.getDirections.useQuery(
    { waypoints },
    { enabled: waypoints.length > 1 }
  );

  const ideaCount = attractions.filter((a) => a.status === "idea").length;
  const confirmedCount = attractions.filter((a) => a.status === "confirmed").length;
  const favoriteCount = attractions.filter((a) => a.userVoted).length;

  // ═══════════════════════════════════════════════════════════════════════════════
  // Conditional rendering AFTER all hooks have been called
  // ═══════════════════════════════════════════════════════════════════════════════

  // If not logged in, show login button
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <Plane className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voyage Planner</h1>
          <p className="text-gray-600 mb-6">Planeje sua viagem colaborativamente com seus colegas</p>
          <a href={getLoginUrl()}>
            <Button className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // If logged in but no trip selected, show trip selector
  if (!selectedTripId) {
    return <TripSelector onSelectTrip={setSelectedTripId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentTrip?.name || "Voyage Planner"}</h1>
              <p className="text-sm text-gray-600">Planeje sua viagem</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="gap-1">
              <Lightbulb className="w-3 h-3" />
              {ideaCount} ideias
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              {confirmedCount} confirmadas
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Heart className="w-3 h-3" />
              {favoriteCount} favoritos seus
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportMutation.mutate({ tripId: selectedTripId })}
              disabled={exportMutation.isPending}
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedTripId(null)}>
              <Home className="w-4 h-4 mr-1" />
              Viagens
            </Button>
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-80" : "w-0"
          )}
        >
          {sidebarOpen && (
            <>
              {/* Add Attraction Button */}
              <div className="p-4 border-b border-gray-200">
                <Button onClick={() => setShowAddDialog(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {/* View Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setViewMode("map")}
                  className={cn(
                    "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                    viewMode === "map"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Map className="w-4 h-4 inline mr-2" />
                  Atrações
                </button>
                <button
                  onClick={() => setViewMode("itinerary")}
                  className={cn(
                    "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                    viewMode === "itinerary"
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Itinerário
                </button>
              </div>

              {/* Attractions View */}
              {viewMode === "map" && (
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar atração..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      size="sm"
                      variant={filterStatus === "all" ? "default" : "outline"}
                      onClick={() => setFilterStatus("all")}
                    >
                      Todas
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === "idea" ? "default" : "outline"}
                      onClick={() => setFilterStatus("idea")}
                    >
                      Ideias
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === "confirmed" ? "default" : "outline"}
                      onClick={() => setFilterStatus("confirmed")}
                    >
                      Confirmadas
                    </Button>
                  </div>

                  {/* Attractions List */}
                  {filteredAttractions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma atração ainda</p>
                      <p className="text-sm">Clique em "Adicionar" para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAttractions.map((attr) => (
                        <AttractionCard
                          key={attr.id}
                          attraction={attr}
                          onVote={() => voteMutation.mutate({ attractionId: attr.id })}
                          onDelete={() => deleteMutation.mutate({ id: attr.id })}
                          onSelect={() => setSelectedAttractionId(attr.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Itinerary View */}
              {viewMode === "itinerary" && (
                <div className="flex-1 overflow-y-auto">
                  <ItineraryPanelV2
                    days={days}
                    allAttractions={attractions}
                    selectedDayId={selectedDayId}
                    onSelectDay={setSelectedDayId}
                    tripId={selectedTripId}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <SiciliaMap
            attractions={attractions}
            selectedAttractionId={selectedAttractionId}
            directionsPolyline={directionsData?.polyline}
          />

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-4 top-4 z-10 bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Add Attraction Dialog */}
      <AddAttractionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={() => {
          if (selectedTripId) {
            utils.attractions.listByTrip.invalidate({ tripId: selectedTripId });
          }
          setShowAddDialog(false);
        }}
        tripId={selectedTripId}
      />
    </div>
  );
}
