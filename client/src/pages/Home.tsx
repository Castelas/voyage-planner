import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";
import { SiciliaMap } from "@/components/SiciliaMap";
import { ItineraryPanel } from "@/components/ItineraryPanel";
import { AddAttractionDialog } from "@/components/AddAttractionDialog";
import { AttractionCard } from "@/components/AttractionCard";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Attraction = RouterOutputs["attractions"]["list"][number];

type ViewMode = "map" | "itinerary";
type FilterStatus = "all" | "idea" | "confirmed";

export default function Home() {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const utils = trpc.useUtils();

  const { data: attractions = [], isLoading: attractionsLoading } = trpc.attractions.list.useQuery();
  const { data: days = [], isLoading: daysLoading } = trpc.itinerary.getDays.useQuery();

  const toggleStatusMutation = trpc.attractions.toggleStatus.useMutation({
    onSuccess: () => utils.attractions.list.invalidate(),
  });

  const deleteMutation = trpc.attractions.delete.useMutation({
    onSuccess: () => {
      utils.attractions.list.invalidate();
      utils.itinerary.getDays.invalidate();
      toast.success("Atração removida");
    },
  });

  const voteMutation = trpc.attractions.vote.useMutation({
    onSuccess: (data) => {
      utils.attractions.list.invalidate();
      toast.success(data.added ? "Favoritado!" : "Favorito removido");
    },
    onError: () => toast.error("Faça login para votar"),
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
  const selectedDay = days.find((d) => d.day.id === selectedDayId);
  const selectedDayAttractions = useMemo(() => {
    if (!selectedDay) return [];
    const ids = new Set(selectedDay.attractions.map((a) => a.id));
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
    { enabled: waypoints.length >= 2 }
  );

  // Stats
  const confirmedCount = attractions.filter((a) => a.status === "confirmed").length;
  const ideaCount = attractions.filter((a) => a.status === "idea").length;
  const votedCount = attractions.filter((a) => a.userVoted).length;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b bg-card shadow-sm z-10">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Plane size={16} className="text-primary-foreground rotate-45" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Sicília 2025</h1>
              <p className="text-xs text-muted-foreground leading-tight">5 dias de aventura</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{ideaCount} ideias</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{confirmedCount} confirmadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart size={12} className="text-rose-400" />
              <span>{votedCount} favoritos seus</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="gap-1.5"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-muted-foreground max-w-[100px] truncate">{user.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="gap-1">
                  <LogOut size={14} />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="gap-1.5"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── Sidebar ──────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex-shrink-0 flex flex-col border-r bg-card transition-all duration-300 overflow-hidden",
            sidebarOpen ? "w-80" : "w-0"
          )}
        >
          {sidebarOpen && (
            <>
              {/* View mode tabs */}
              <div className="flex-shrink-0 p-3 border-b">
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => setViewMode("map")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      viewMode === "map"
                        ? "bg-white shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List size={12} />
                    Atrações
                  </button>
                  <button
                    onClick={() => setViewMode("itinerary")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      viewMode === "itinerary"
                        ? "bg-white shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Calendar size={12} />
                    Itinerário
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {viewMode === "map" ? (
                  <div className="p-3 space-y-3">
                    {/* Search & filter */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar atração..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                      <div className="flex gap-1">
                        {(["all", "idea", "confirmed"] as FilterStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={cn(
                              "flex-1 py-1 px-2 rounded-md text-xs font-medium transition-all",
                              filterStatus === status
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {status === "all" ? "Todas" : status === "idea" ? "Ideias" : "Confirmadas"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attractions list */}
                    {attractionsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : filteredAttractions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Map size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {searchQuery || filterStatus !== "all"
                            ? "Nenhuma atração encontrada"
                            : "Nenhuma atração ainda"}
                        </p>
                        {!searchQuery && filterStatus === "all" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Clique em "Adicionar" para começar
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredAttractions.map((attraction) => (
                          <AttractionCard
                            key={attraction.id}
                            attraction={attraction}
                            onVote={(id) => voteMutation.mutate({ attractionId: id })}
                            onDelete={(id) => deleteMutation.mutate({ id })}
                            onToggleStatus={(id) => toggleStatusMutation.mutate({ id })}
                            onSelect={(a) => setSelectedAttractionId(a.id)}
                            isSelected={selectedAttractionId === attraction.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3">
                    {daysLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <ItineraryPanel
                        days={days}
                        allAttractions={attractions}
                        selectedDayId={selectedDayId}
                        onSelectDay={(id) => {
                          setSelectedDayId(id === selectedDayId ? null : id);
                        }}
                        onAttractionSelect={(a) => setSelectedAttractionId(a.id)}
                        onRefresh={() => {
                          utils.itinerary.getDays.invalidate();
                          utils.attractions.list.invalidate();
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-20 w-5 h-10 bg-card border border-l-0 rounded-r-md flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-all duration-300"
          style={{ left: sidebarOpen ? "320px" : "0px" }}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* ─── Map ──────────────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <SiciliaMap
            attractions={attractions}
            selectedAttractionId={selectedAttractionId}
            selectedDayAttractions={selectedDayAttractions}
            directionsPolyline={directionsData?.polyline ?? null}
            onAttractionClick={(a) => setSelectedAttractionId(a.id)}
            className="w-full h-full"
          />

          {/* Day info overlay */}
          {selectedDayId && directionsData && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">
                  {days.find((d) => d.day.id === selectedDayId)?.day.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>🗺️ {directionsData.totalDistance}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>⏱️ {directionsData.totalDuration}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span>{selectedDayAttractions.length} paradas</span>
              </div>
              <button
                onClick={() => setSelectedDayId(null)}
                className="text-xs text-muted-foreground hover:text-foreground ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Map legend */}
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border rounded-lg p-2.5 text-xs space-y-1.5 shadow-sm">
            <p className="font-semibold text-xs mb-1 text-muted-foreground uppercase tracking-wide">Legenda</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-sm" />
              <span>Ideia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" />
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm" />
              <span>Selecionada</span>
            </div>
          </div>

          {/* Login prompt */}
          {!user && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border rounded-lg px-3 py-2 flex items-center gap-2 text-xs shadow-sm">
              <Users size={12} className="text-primary" />
              <span className="text-muted-foreground">
                <button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="text-primary hover:underline font-medium"
                >
                  Faça login
                </button>{" "}
                para votar e colaborar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add Attraction Dialog */}
      <AddAttractionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={() => {
          utils.attractions.list.invalidate();
          utils.itinerary.getDays.invalidate();
        }}
      />
    </div>
  );
}
