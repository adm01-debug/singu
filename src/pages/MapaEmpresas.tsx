import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Filter, X, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "sonner";

// Fix default marker icon
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const SHADOW = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png";
const mkIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: SHADOW,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const greenIcon = mkIcon("green");
const goldIcon = mkIcon("gold");
const redIcon = mkIcon("red");
const blueIcon = mkIcon("blue");

interface MappableCompany {
  id: string;
  name: string;
  nome_crm: string | null;
  ramo_atividade: string | null;
  status: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  relationship_score: number;
}

function getIcon(score: number) {
  if (score >= 70) return greenIcon;
  if (score >= 40) return goldIcon;
  if (score > 0) return redIcon;
  return blueIcon;
}

/* ── Geocoding ── */
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  const key = location.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(location)}`,
      { headers: { "User-Agent": "SINGU-CRM/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(key, coords);
      return coords;
    }
    geocodeCache.set(key, null);
    return null;
  } catch {
    return null;
  }
}

function buildLocationString(company: Record<string, unknown>): string | null {
  const city = company.city as string | null;
  const state = company.state as string | null;
  const address = company.address as string | null;
  
  // Try extra_data_rf for cidade_rfb
  let rfCity: string | null = null;
  const extra = company.extra_data_rf;
  if (extra && typeof extra === 'object') {
    rfCity = (extra as Record<string, unknown>).cidade_rfb as string | null;
  }
  
  const effectiveCity = city || rfCity;
  if (effectiveCity) {
    const parts = [effectiveCity];
    if (state) parts.push(state);
    return parts.join(", ") + ", Brasil";
  }
  if (address) return address + ", Brasil";
  return null;
}

/* ── Marker Cluster ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MarkerClusterLayer({ companies }: { companies: MappableCompany[] }) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (c: { getChildCount: () => number }) => {
        const count = c.getChildCount();
        const size = count > 50 ? 48 : count > 10 ? 40 : 32;
        return L.divIcon({
          html: `<div style="
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-radius: 50%;
            width: ${size}px; height: ${size}px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: ${size > 40 ? 14 : 12}px;
            box-shadow: 0 0 12px hsl(var(--primary) / 0.4);
            border: 2px solid hsl(var(--background) / 0.3);
          ">${count}</div>`,
          className: "",
          iconSize: L.point(size, size),
        });
      },
    });

    companies.forEach((company) => {
      const marker = L.marker([company.lat, company.lng], {
        icon: getIcon(company.relationship_score),
      });

      const scoreColor = company.relationship_score >= 60 ? "#22c55e"
        : company.relationship_score >= 30 ? "#eab308" : "#ef4444";
      
      const locationText = [company.city, company.state].filter(Boolean).join(", ");

      marker.bindPopup(`
        <div style="min-width:240px;font-size:12px;font-family:system-ui;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px">${company.nome_crm || company.name}</p>
          ${company.ramo_atividade ? `<p style="color:#888;margin:2px 0">🏢 ${company.ramo_atividade}</p>` : ""}
          ${locationText ? `<p style="margin:2px 0">📍 ${locationText}</p>` : ""}
          ${company.cnpj ? `<p style="margin:2px 0">📋 ${company.cnpj}</p>` : ""}
          ${company.email ? `<p style="margin:2px 0">✉️ ${company.email}</p>` : ""}
          ${company.phone ? `<p style="margin:2px 0">📞 ${company.phone}</p>` : ""}
          ${company.website ? `<p style="margin:2px 0">🌐 <a href="${company.website}" target="_blank" rel="noopener">${company.website.replace(/https?:\/\//, "").slice(0, 30)}</a></p>` : ""}
          <div style="border-top:1px solid #ddd;margin-top:6px;padding-top:4px;display:flex;justify-content:space-between">
            <span style="font-weight:600">Score</span>
            <span style="font-family:monospace;font-weight:700;color:${scoreColor}">${company.relationship_score}/100</span>
          </div>
        </div>
      `);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    if (companies.length > 0) {
      const bounds = L.latLngBounds(companies.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {
      if (clusterRef.current) map.removeLayer(clusterRef.current);
    };
  }, [companies, map]);

  return null;
}

/* ── Main Page ── */
export default function MapaEmpresas() {
  usePageTitle("Mapa de Empresas");
  const [minScore, setMinScore] = useState(0);
  const [selectedSector, setSelectedSector] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [mappedCompanies, setMappedCompanies] = useState<MappableCompany[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingTotal, setGeocodingTotal] = useState(0);
  const queryClient = useQueryClient();

  // Fetch companies from Supabase
  const { data: rawCompanies, isLoading } = useQuery({
    queryKey: ["companies-map-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,nome_crm,ramo_atividade,status,cnpj,email,phone,website,city,state,address,extra_data_rf,lat,lng")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Process: separate already-geocoded vs needs-geocoding
  const processAndGeocode = useCallback(async () => {
    if (!rawCompanies || rawCompanies.length === 0 || isGeocoding) return;

    const alreadyMapped: MappableCompany[] = [];
    const needsGeocoding: typeof rawCompanies = [];

    for (const c of rawCompanies) {
      if (c.lat != null && c.lng != null && !isNaN(c.lat) && !isNaN(c.lng) && c.lat !== 0) {
        alreadyMapped.push({
          id: c.id, name: c.name,
          nome_crm: c.nome_crm, ramo_atividade: c.ramo_atividade,
          status: c.status, cnpj: c.cnpj, email: c.email, phone: c.phone,
          website: c.website, city: c.city, state: c.state,
          lat: c.lat, lng: c.lng, relationship_score: 50,
        });
      } else {
        const loc = buildLocationString(c as Record<string, unknown>);
        if (loc) needsGeocoding.push(c);
      }
    }

    // Show already mapped immediately
    setMappedCompanies(alreadyMapped);

    if (needsGeocoding.length === 0) return;

    setIsGeocoding(true);
    setGeocodingTotal(needsGeocoding.length);
    setGeocodingProgress(0);

    const newResults: MappableCompany[] = [...alreadyMapped];
    let geocoded = 0;

    for (const c of needsGeocoding) {
      const loc = buildLocationString(c as Record<string, unknown>);
      if (!loc) continue;

      const coords = await geocode(loc);
      if (coords) {
        // Persist coordinates to DB
        await supabase.from("companies").update({ lat: coords.lat, lng: coords.lng }).eq("id", c.id);

        newResults.push({
          id: c.id, name: c.name,
          nome_crm: c.nome_crm, ramo_atividade: c.ramo_atividade,
          status: c.status, cnpj: c.cnpj, email: c.email, phone: c.phone,
          website: c.website, city: c.city, state: c.state,
          lat: coords.lat, lng: coords.lng, relationship_score: 50,
        });
        geocoded++;
      }
      setGeocodingProgress(prev => prev + 1);
      // Nominatim rate limit
      await new Promise(r => setTimeout(r, 1100));
    }

    setMappedCompanies(newResults);
    setIsGeocoding(false);

    if (geocoded > 0) {
      toast.success(`${geocoded} empresas geolocalizadas com sucesso`);
      queryClient.invalidateQueries({ queryKey: ["companies-map-data"] });
    }
  }, [rawCompanies, isGeocoding, queryClient]);

  useEffect(() => {
    if (rawCompanies && rawCompanies.length > 0 && mappedCompanies.length === 0 && !isGeocoding) {
      processAndGeocode();
    }
  }, [rawCompanies, mappedCompanies.length, isGeocoding, processAndGeocode]);

  const sectors = useMemo(() => {
    const s = new Set<string>();
    mappedCompanies.forEach(c => { if (c.ramo_atividade) s.add(c.ramo_atividade); });
    return Array.from(s).sort();
  }, [mappedCompanies]);

  const filtered = useMemo(() => {
    return mappedCompanies.filter(c => {
      if (c.relationship_score < minScore) return false;
      if (selectedSector !== "all" && c.ramo_atividade !== selectedSector) return false;
      return true;
    });
  }, [mappedCompanies, minScore, selectedSector]);

  const hasActiveFilters = minScore > 0 || selectedSector !== "all";
  const clearFilters = () => { setMinScore(0); setSelectedSector("all"); };

  return (
    <AppLayout>
      <SEOHead title="Mapa de Empresas" description="Visualização geográfica da carteira de clientes" />
      <Header title="Mapa de Empresas" subtitle="Visualize a localização geográfica dos seus clientes" hideBack />

      <div className="p-4 md:p-6 space-y-4">
        {/* Stats bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {filtered.length} empresas no mapa
                {hasActiveFilters && " (filtrado)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {rawCompanies?.length ?? 0} carregadas · {mappedCompanies.length} geolocalizadas
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {isGeocoding && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Geolocalizando... {geocodingProgress}/{geocodingTotal}
              </div>
            )}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">!</Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Score mínimo: <span className="text-primary font-mono font-bold">{minScore}</span>
                </Label>
                <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v)} min={0} max={100} step={5} />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Setor</Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {sectors.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-success/80" /> Score ≥ 70
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-warning/80" /> Score 40–69
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/80" /> Score &lt; 40
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary/80" /> Sem score
              </span>
              <span className="ml-auto font-mono">{filtered.length} resultados</span>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="rounded-lg border border-border/60 overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando empresas...</p>
            </div>
          ) : mappedCompanies.length === 0 && !isGeocoding ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Building2 className="h-12 w-12 opacity-30" />
              <p className="text-sm">Nenhuma empresa com localização disponível</p>
              <p className="text-xs">Empresas precisam ter cidade no cadastro para aparecer no mapa</p>
            </div>
          ) : (
            <MapContainer
              center={filtered.length > 0 ? [filtered[0].lat, filtered[0].lng] : [-14.235, -51.925]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarkerClusterLayer companies={filtered} />
            </MapContainer>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
