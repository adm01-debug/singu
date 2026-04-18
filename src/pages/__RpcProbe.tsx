/**
 * TEMPORARY DEV PROBE — /__rpc-probe
 * Bypasses session-level circuit-breakers and calls RPCs directly through
 * the same edge function bridge used by the app (callExternalRpc).
 * DELETE THIS FILE AFTER VALIDATION.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { callExternalRpc } from "@/lib/externalData";

export default function RpcProbe() {
  const [output, setOutput] = useState<string>("Click the button to probe RPCs...");
  const [running, setRunning] = useState(false);

  const isDev = import.meta.env.DEV;

  if (!isDev) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold">Not available in production</h1>
      </div>
    );
  }

  const runProbe = async () => {
    setRunning(true);
    const lines: string[] = [];
    const log = (s: string) => {
      lines.push(s);
      setOutput(lines.join("\n"));
      // eslint-disable-next-line no-console
      console.log(s);
    };

    log(`=== RPC PROBE @ ${new Date().toISOString()} ===`);
    log(`Edge URL: ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-data`);
    log("");

    // 1) get_instant_kpis
    log("--- get_instant_kpis ---");
    const t1 = performance.now();
    try {
      const { data, error } = await callExternalRpc("get_instant_kpis", {});
      const dt = (performance.now() - t1).toFixed(0);
      if (error) {
        log(`PROBE_ERROR (${dt}ms): ${error.message}`);
        console.error("PROBE_ERROR get_instant_kpis:", error);
      } else {
        log(`PROBE_RESULT (${dt}ms):`);
        log(JSON.stringify(data, null, 2));
        console.log("PROBE_RESULT get_instant_kpis:", data);
      }
    } catch (e) {
      log(`PROBE_THROW: ${(e as Error).message}`);
      console.error("PROBE_THROW get_instant_kpis:", e);
    }

    log("");
    log("--- get_duplicate_contacts ---");
    const t2 = performance.now();
    try {
      const { data, error } = await callExternalRpc("get_duplicate_contacts", {});
      const dt = (performance.now() - t2).toFixed(0);
      if (error) {
        log(`PROBE_ERROR (${dt}ms): ${error.message}`);
        console.error("PROBE_ERROR get_duplicate_contacts:", error);
      } else {
        const arr = Array.isArray(data) ? data : [];
        log(`PROBE_RESULT (${dt}ms): ${arr.length} duplicate(s) returned`);
        log(JSON.stringify(arr.slice(0, 3), null, 2));
        if (arr.length > 3) log(`... and ${arr.length - 3} more`);
        console.log("PROBE_RESULT get_duplicate_contacts:", data);
      }
    } catch (e) {
      log(`PROBE_THROW: ${(e as Error).message}`);
      console.error("PROBE_THROW get_duplicate_contacts:", e);
    }

    log("");
    log("=== PROBE COMPLETE ===");
    setRunning(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">RPC Probe (DEV only)</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Bypasses circuit-breakers. Calls <code>get_instant_kpis</code> and{" "}
        <code>get_duplicate_contacts</code> through the real edge function bridge.
      </p>
      <Button onClick={runProbe} disabled={running} className="mb-4">
        {running ? "Running..." : "Run probe"}
      </Button>
      <pre className="bg-muted p-4 rounded text-xs overflow-auto whitespace-pre-wrap max-h-[70vh]">
        {output}
      </pre>
    </div>
  );
}
