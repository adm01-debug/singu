import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useQuery } from "@tanstack/react-query";
import { queryExternalData } from "@/lib/externalData";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Filter, X, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { usePageTitle } from "@/hooks/usePageTitle";
import { logger } from "@/lib/logger";

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
  nome_crm: string;
  ramo_atividade: string | null;
  status: string | null;
  cnpj: string | null;
  website: string | null;
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

/* ── Geocoding cache ── */
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

/* ── Extract city from extra_data_rf ── */
function extractCity(extraDataRf: string | null): string | null {
  if (!extraDataRf) return null;
  try {
    const parsed = typeof extraDataRf === 'string' ? JSON.parse(extraDataRf) : extraDataRf;
    return parsed.cidade_rfb || null;
  } catch {
    return null;
  }
}

/* ── Marker Cluster ── */
function MarkerClusterGroup({ companies }: { companies: MappableCompany[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (c) => {
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

      marker.bindPopup(`
        <div style="min-width:220px;font-size:12px;font-family:system-ui;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px">${company.nome_crm}</p>
          ${company.ramo_atividade ? `<p style="color:#888;margin:2px 0">${company.ramo_atividade}</p>` : ""}
          ${company.cnpj ? `<p style="margin:2px 0">📋 ${company.cnpj}</p>` : ""}
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
  const [geocodedCompanies, setGeocodedCompanies] = useState<MappableCompany[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);

  // Fetch companies with cities from external DB
  const { data: rawCompanies, isLoading } = useQuery({
    queryKey: ["companies-map-data"],
    queryFn: async () => {
      const { data, error } = await queryExternalData<Record<string, unknown>>({
        table: 'companies',
        select: 'id,nome_crm,ramo_atividade,status,cnpj,website,extra_data_rf',
        range: { from: 0, to: 99 },
        order: { column: 'updated_at', ascending: false },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Geocode companies
  const doGeocode = useCallback(async () => {
    if (!rawCompanies || rawCompanies.length === 0 || isGeocoding) return;
    setIsGeocoding(true);
    const results: MappableCompany[] = [];
    let progress = 0;

    for (const company of rawCompanies) {
      const city = extractCity(company.extra_data_rf as string | null);
      if (!city) continue;

      const coords = await geocode(city + ", Brasil");
      if (coords) {
        results.push({
          id: company.id as string,
          nome_crm: (company.nome_crm || company.nome_fantasia || 'Sem nome') as string,
          ramo_atividade: company.ramo_atividade as string | null,
          status: company.status as string | null,
          cnpj: company.cnpj as string | null,
          website: company.website as string | null,
          lat: coords.lat,
          lng: coords.lng,
          relationship_score: 50, // default
        });
      }
      progress++;
      setGeocodingProgress(progress);
      // Nominatim rate limit
      await new Promise(r => setTimeout(r, 1100));
    }

    setGeocodedCompanies(results);
    setIsGeocoding(false);
  }, [rawCompanies, isGeocoding]);

  useEffect(() => {
    if (rawCompanies && rawCompanies.length > 0 && geocodedCompanies.length === 0 && !isGeocoding) {
      doGeocode();
    }
  }, [rawCompanies, geocodedCompanies.length, isGeocoding, doGeocode]);

  const sectors = useMemo(() => {
    const s = new Set<string>();
    geocodedCompanies.forEach(c => { if (c.ramo_atividade) s.add(c.ramo_atividade); });
    return Array.from(s).sort();
  }, [geocodedCompanies]);

  const filtered = useMemo(() => {
    return geocodedCompanies.filter(c => {
      if (c.relationship_score < minScore) return false;
      if (selectedSector !== "all" && c.ramo_atividade !== selectedSector) return false;
      return true;
    });
  }, [geocodedCompanies, minScore, selectedSector]);

  const hasActiveFilters = minScore > 0 || selectedSector !== "all";
  const clearFilters = () => { setMinScore(0); setSelectedSector("all"); };

  return (
    <AppLayout>
      <Header title="Mapa de Empresas" subtitle="Visualize a localização geográfica dos seus clientes" />

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
                {rawCompanies?.length ?? 0} carregadas · {geocodedCompanies.length} geolocalizadas
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {isGeocoding && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Geolocalizando... {geocodingProgress}/{rawCompanies?.length ?? 0}
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
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Score ≥ 70
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Score 40–69
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Score &lt; 40
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Sem score
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
          ) : geocodedCompanies.length === 0 && !isGeocoding ? (
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
              <MarkerClusterGroup companies={filtered} />
            </MapContainer>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
