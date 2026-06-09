import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import {
  ChevronDown, ChevronUp, Sparkles, Type, Radio,
  AlertCircle, Signal, Youtube, Shield, QrCode,
  RotateCcw, Users
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import type { StreamConfig } from "@/types/schema";
import { useWebSocket } from "@/hooks/use-websocket";

interface OverlayAdminProps {
  streams: StreamConfig[];
  onUpdate: (id: string, data: Partial<StreamConfig>) => void;
}

function EqBars({ color = "currentColor" }: { color?: string }) {
  return (
    <span className="flex items-end gap-0.5 h-6" style={{ color }} aria-hidden>
      <span className="eq-bar eq-bar-1" style={{ background: color }} />
      <span className="eq-bar eq-bar-2" style={{ background: color }} />
      <span className="eq-bar eq-bar-3" style={{ background: color }} />
      <span className="eq-bar eq-bar-4" style={{ background: color }} />
      <span className="eq-bar eq-bar-5" style={{ background: color }} />
    </span>
  );
}

function OnAirDot() {
  return (
    <span className="relative flex items-center justify-center w-4 h-4">
      <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 animate-signal-ping" />
      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500 animate-on-air" />
    </span>
  );
}

const SOURCE_ICON: Record<string, any> = {
  tiktok: SiTiktok,
  youtube: Youtube,
  camera: Radio,
};
const SOURCE_COLOR: Record<string, string> = {
  tiktok: "#ff2d55",
  youtube: "#ff0000",
  camera: "#38bdf8",
};

export function OverlayAdmin({ streams, onUpdate }: OverlayAdminProps) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [qrTrackUrl, setQrTrackUrl] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scanFlash, setScanFlash] = useState<number | null>(null);
  const { subscribe } = useWebSocket();

  const activeStreams = streams.filter(
    (s) => s.status === "streaming" || s.status === "reconnecting"
  );
  const isLive = activeStreams.some((s) => s.status === "streaming");

  const fetchInvite = useCallback(async () => {
    try {
      const res = await fetch("/api/invite", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.url);
        const trackUrl = `${window.location.origin}/api/qr/track?cb=${encodeURIComponent(data.url)}`;
        setQrTrackUrl(trackUrl);
      }
    } catch {}
  }, []);

  const fetchQrCount = useCallback(async () => {
    try {
      const res = await fetch("/api/qr/count", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setScanCount(data.count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchInvite();
    fetchQrCount();
  }, [fetchInvite, fetchQrCount]);

  useEffect(() => {
    const unsub = subscribe("qr_scan", (msg) => {
      const count = msg.data?.count ?? 0;
      setScanCount(count);
      setScanFlash(count);
      const t = setTimeout(() => setScanFlash(null), 4000);
      return () => clearTimeout(t);
    });
    return unsub;
  }, [subscribe]);

  const resetScans = async () => {
    try {
      await fetch("/api/qr/reset", { method: "POST", credentials: "include" });
    } catch {}
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="relative rounded-xl overflow-hidden border border-slate-700/60"
        style={{
          background: "linear-gradient(160deg, #080d18 0%, #0d1525 40%, #060e1c 100%)",
        }}
      >
        <div className="absolute inset-0 broadcast-scanline pointer-events-none" />

        <CollapsibleTrigger asChild>
          <button
            className="relative w-full px-4 py-3 flex items-center gap-3 text-left group"
            data-testid="button-overlay-admin-toggle"
          >
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)" }}
              >
                <Radio className="w-4.5 h-4.5" style={{ color: "#38bdf8" }} />
              </div>
              <EqBars color={isLive ? "#34d399" : "#334155"} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold tracking-wider text-sm">CONTROL ROOM</span>
                <span className="text-slate-600 text-[10px] font-mono tracking-widest hidden sm:inline">
                  BINTUNET
                </span>
                {isLive ? (
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.45)" }}
                  >
                    <OnAirDot />ON AIR
                  </span>
                ) : activeStreams.length > 0 ? (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-amber-300"
                    style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    <Signal className="w-3 h-3" />CONNECTING
                  </span>
                ) : (
                  <span className="text-slate-700 text-xs font-mono">STANDBY</span>
                )}
                <span
                  className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}
                >
                  <Shield className="w-2.5 h-2.5" />SAFE ROOM
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-0.5">
                {activeStreams.length === 0
                  ? "No active streams — start a stream to control overlays"
                  : `${activeStreams.length} active · overlay changes apply live without disconnecting`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {streams.length > 0 && (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-slate-500 text-xs font-mono">
                    {String(activeStreams.length).padStart(2, "0")}/{String(streams.length).padStart(2, "0")}
                  </span>
                  <span className="text-slate-700 text-[10px]">LIVE</span>
                </div>
              )}
              <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="relative border-t border-slate-800/60 px-4 pb-5 pt-3 space-y-4">
            {activeStreams.length === 0 ? (
              <div className="flex items-center gap-3 py-8 justify-center text-slate-600">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">Start a stream to access the control room.</p>
              </div>
            ) : (
              activeStreams.map((stream, i) => (
                <AdminStreamOverlay
                  key={stream.id}
                  stream={stream}
                  index={i}
                  onUpdate={onUpdate}
                />
              ))
            )}

            {/* QR Code Section */}
            <div
              className="rounded-xl overflow-hidden mt-2"
              style={{
                background: "linear-gradient(135deg, rgba(10,14,28,0.9) 0%, rgba(5,10,22,0.95) 100%)",
                border: "1px solid rgba(51,65,85,0.7)",
              }}
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800/50">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}
                  >
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 tracking-wide">ACCESS QR CODE</p>
                    <p className="text-[10px] text-slate-600">Scan to join the dashboard</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {scanCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-sky-400" />
                      <span className="text-xs font-bold text-sky-300">{scanCount}</span>
                      <span className="text-[10px] text-slate-500">scanned</span>
                    </div>
                  )}
                  {scanCount > 0 && (
                    <button
                      onClick={resetScans}
                      className="text-slate-700 hover:text-slate-400 transition-colors"
                      title="Reset scan count"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 flex gap-4 items-start">
                {qrTrackUrl ? (
                  <div
                    className="rounded-xl p-2 shrink-0 relative"
                    style={{ background: "rgba(255,255,255,1)", border: "2px solid rgba(56,189,248,0.3)" }}
                  >
                    <QRCodeSVG
                      value={qrTrackUrl}
                      size={96}
                      bgColor="#ffffff"
                      fgColor="#0a0a1a"
                      level="M"
                    />
                    {scanFlash !== null && (
                      <div
                        className="absolute inset-0 rounded-xl flex items-center justify-center"
                        style={{
                          background: "rgba(56,189,248,0.9)",
                          animation: "qr-flash 4s ease-out forwards",
                        }}
                      >
                        <div className="text-center">
                          <p className="text-2xl font-black text-white leading-none">{scanFlash}</p>
                          <p className="text-[9px] font-bold text-sky-100 tracking-wider uppercase mt-0.5">
                            {scanFlash === 1 ? "person" : "people"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-800/60 animate-pulse shrink-0" />
                )}

                <div className="flex-1 min-w-0 space-y-2 pt-1">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Display this QR on your stream. When scanned, the counter updates instantly.
                  </p>
                  {inviteUrl && (
                    <p
                      className="text-[9px] font-mono text-slate-700 break-all leading-relaxed"
                      title={inviteUrl}
                    >
                      {inviteUrl.length > 48 ? inviteUrl.slice(0, 48) + "…" : inviteUrl}
                    </p>
                  )}
                  {scanFlash !== null && (
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                      style={{
                        background: "rgba(56,189,248,0.1)",
                        border: "1px solid rgba(56,189,248,0.3)",
                        animation: "qr-flash-fade 4s ease-out forwards",
                      }}
                    >
                      <Users className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="text-xs font-semibold text-sky-300">
                        {scanFlash} {scanFlash === 1 ? "person" : "people"} scanned
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function AdminStreamOverlay({
  stream,
  index,
  onUpdate,
}: {
  stream: StreamConfig;
  index: number;
  onUpdate: (id: string, data: Partial<StreamConfig>) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const sourceType = stream.sourceType || "tiktok";
  const SourceIcon = SOURCE_ICON[sourceType] || Radio;
  const sourceColor = SOURCE_COLOR[sourceType] || "#38bdf8";

  const sourceLabel =
    sourceType === "youtube"
      ? stream.youtubeSourceUrl || "YouTube"
      : sourceType === "camera"
      ? stream.cameraDevice || "/dev/video0"
      : stream.tiktokUsername
      ? `@${stream.tiktokUsername}`
      : "Stream";

  const isStreaming = stream.status === "streaming";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(30,41,59,0.9)", background: "rgba(8,12,24,0.7)" }}
    >
      <div
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        data-testid={`button-admin-expand-${stream.id}`}
      >
        <div className="flex items-center gap-2 shrink-0">
          {isStreaming ? (
            <OnAirDot />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          )}
          <SourceIcon className="w-3.5 h-3.5" style={{ color: sourceColor }} />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-slate-300 font-bold text-xs tracking-wider">
            CH {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-slate-600 text-xs truncate">{sourceLabel}</span>
          {isStreaming && <EqBars color="#34d399" />}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-slate-600 text-[10px] font-mono tracking-widest">OVRL</span>
            <Switch
              checked={stream.overlayEnabled}
              onCheckedChange={(v) => onUpdate(stream.id, { overlayEnabled: v })}
              data-testid={`switch-admin-overlay-${stream.id}`}
            />
          </div>
          <span className="text-slate-700">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </div>

      {expanded && stream.overlayEnabled && (
        <div className="border-t border-slate-800/50 px-3 py-3 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest" style={{ color: "#38bdf8" }}>
            <Sparkles className="w-3 h-3" />
            SAFE ROOM — changes apply live · stream stays connected
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-600 uppercase tracking-widest">Channel Name</Label>
              <Input
                className="h-8 text-sm bg-slate-900/60 border-slate-700/60 text-slate-200 placeholder:text-slate-700 focus:border-sky-500/70"
                placeholder="BintuNet LIVE"
                value={stream.overlayChannelName}
                onChange={(e) => onUpdate(stream.id, { overlayChannelName: e.target.value })}
                data-testid={`input-admin-channel-${stream.id}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-600 uppercase tracking-widest">Headline</Label>
              <Input
                className="h-8 text-sm bg-slate-900/60 border-slate-700/60 text-slate-200 placeholder:text-slate-700 focus:border-sky-500/70"
                placeholder="Breaking news or tag line"
                value={stream.overlayHeadline}
                onChange={(e) => onUpdate(stream.id, { overlayHeadline: e.target.value })}
                disabled={!!stream.overlayLiveCount}
                data-testid={`input-admin-headline-${stream.id}`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <Type className="w-3 h-3" />Ticker
            </Label>
            <Input
              className="h-8 text-sm bg-slate-900/60 border-slate-700/60 text-slate-200 placeholder:text-slate-700 focus:border-sky-500/70"
              placeholder="Scrolling ticker text..."
              value={stream.overlayTickerText}
              onChange={(e) => onUpdate(stream.id, { overlayTickerText: e.target.value })}
              data-testid={`input-admin-ticker-${stream.id}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-600 uppercase tracking-widest">Banner</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stream.overlayBannerColor || "#c41e1e"}
                  onChange={(e) => onUpdate(stream.id, { overlayBannerColor: e.target.value })}
                  className="w-8 h-8 rounded-md cursor-pointer border border-slate-700"
                  data-testid={`input-admin-banner-color-${stream.id}`}
                />
                <span className="text-[10px] text-slate-600 font-mono">
                  {(stream.overlayBannerColor || "#c41e1e").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-600 uppercase tracking-widest">Ticker</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stream.overlayTickerColor || "#1a1a2e"}
                  onChange={(e) => onUpdate(stream.id, { overlayTickerColor: e.target.value })}
                  className="w-8 h-8 rounded-md cursor-pointer border border-slate-700"
                  data-testid={`input-admin-ticker-color-${stream.id}`}
                />
                <span className="text-[10px] text-slate-600 font-mono">
                  {(stream.overlayTickerColor || "#1a1a2e").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-600 uppercase tracking-widest">
                Speed {stream.overlayTickerSpeed || 80}
              </Label>
              <Slider
                value={[stream.overlayTickerSpeed || 80]}
                min={30}
                max={200}
                step={5}
                onValueChange={([v]) => onUpdate(stream.id, { overlayTickerSpeed: v })}
                data-testid={`slider-admin-speed-${stream.id}`}
              />
            </div>
          </div>

          {stream.overlayLogoPath && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-600 uppercase tracking-widest">Logo Position</Label>
                <Select
                  value={stream.overlayLogoPosition}
                  onValueChange={(v) => onUpdate(stream.id, { overlayLogoPosition: v as any })}
                >
                  <SelectTrigger className="h-8 text-sm bg-slate-900/60 border-slate-700/60 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-600 uppercase tracking-widest">Logo Animation</Label>
                <Select
                  value={stream.overlayLogoAnimation || "none"}
                  onValueChange={(v) => onUpdate(stream.id, { overlayLogoAnimation: v as any })}
                >
                  <SelectTrigger className="h-8 text-sm bg-slate-900/60 border-slate-700/60 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="pulse">Pulse</SelectItem>
                    <SelectItem value="breathe">Breathe</SelectItem>
                    <SelectItem value="fade-in">Fade In</SelectItem>
                    <SelectItem value="flash">Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Mini overlay preview */}
          <div
            className="relative rounded-lg overflow-hidden"
            style={{
              aspectRatio: stream.ratio === "mobile" ? "9/16" : "16/9",
              maxHeight: "100px",
              background: "linear-gradient(160deg, #0d1629 0%, #080e1c 100%)",
              border: "1px solid rgba(30,41,59,0.8)",
            }}
            data-testid={`admin-overlay-preview-${stream.id}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-slate-800 text-[7px] font-mono tracking-[0.3em]">PREVIEW</span>
            </div>
            {(stream.overlayChannelName || stream.overlayHeadline) && (
              <div className="absolute bottom-4 left-0 flex items-stretch text-[6px] leading-tight">
                {stream.overlayChannelName && (
                  <div
                    className="px-1.5 py-0.5 text-white font-bold flex items-center"
                    style={{ backgroundColor: stream.overlayBannerColor || "#c41e1e" }}
                  >
                    {stream.overlayChannelName}
                  </div>
                )}
                {stream.overlayHeadline && (
                  <div className="px-1.5 py-0.5 text-white bg-gray-900/90 flex items-center">
                    {stream.overlayHeadline}
                  </div>
                )}
              </div>
            )}
            {stream.overlayTickerText && (
              <div
                className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[5px] text-white overflow-hidden whitespace-nowrap"
                style={{ backgroundColor: (stream.overlayTickerColor || "#1a1a2e") + "E6" }}
              >
                <span className="inline-block animate-marquee">{stream.overlayTickerText}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {expanded && !stream.overlayEnabled && (
        <div className="border-t border-slate-800/50 px-3 py-2.5">
          <p className="text-xs text-slate-700">Enable overlay toggle above to access controls.</p>
        </div>
      )}
    </div>
  );
}
