import express from "express";
import cors from "cors";
import dns from "node:dns/promises";
import net from "node:net";
import type { Request, Response } from "express";

const app = express();
const PORT = 3000;
const HOST = "127.0.0.1"; // Phase 6: Bind to 127.0.0.1 only

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

// In-memory sessions and jobs
interface PreviewSession {
  id: string;
  url: string;
  width: number;
  height: number;
  createdAt: number;
  lastActive: number;
}

const previewSessions = new Map<string, PreviewSession>();
const jobs = new Map<string, any>();

// SSRF Guard helper
async function isSafePublicUrl(urlString: string): Promise<boolean> {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    const { address } = await dns.lookup(hostname);
    if (
      address.startsWith("127.") ||
      address.startsWith("10.") ||
      address.startsWith("192.168.") ||
      address.startsWith("169.254.") || // AWS/cloud metadata loopback
      address === "::1"
    ) {
      return false;
    }

    // Check 172.16.0.0/12 range
    const parts = address.split(".").map(Number);
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// 1. GET /api/local/detect - Probes common local developer ports
app.get("/api/local/detect", async (_req: Request, res: Response) => {
  const portsToProbe = [3000, 3001, 4200, 5173, 5174, 8000, 8080];
  const detected: { port: number; url: string; title: string }[] = [];

  const probePort = (port: number): Promise<boolean> =>
    new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(250);
      socket.on("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("error", () => {
        resolve(false);
      });
      socket.connect(port, "127.0.0.1");
    });

  for (const port of portsToProbe) {
    if (port === PORT) continue; // Skip own port
    const isOpen = await probePort(port);
    if (isOpen) {
      let title = "Local App";
      if (port === 5173 || port === 5174) title = "Vite App";
      else if (port === 3001) title = "Node Service";
      else if (port === 4200) title = "Angular / Web";
      else if (port === 8000 || port === 8080) title = "Dev Server";

      detected.push({
        port,
        url: `http://localhost:${port}`,
        title,
      });
    }
  }

  res.json({ servers: detected });
});

// 2. POST /api/preview/sessions
app.post("/api/preview/sessions", async (req: Request, res: Response): Promise<any> => {
  const { url, viewport } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Safety check if in public mode
  const isLocal =
    url.includes("localhost") || url.includes("127.0.0.1") || url.includes("[::1]");
  if (!isLocal) {
    const isSafe = await isSafePublicUrl(url);
    if (!isSafe) {
      return res.status(403).json({
        code: "UNSAFE_URL",
        message: "Target points to a blocked local or private network address.",
      });
    }
  }

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const session: PreviewSession = {
    id: sessionId,
    url,
    width: viewport?.width || 1280,
    height: viewport?.height || 800,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  previewSessions.set(sessionId, session);

  res.json({
    sessionId,
    title: "Preview Target",
    pageSize: { width: session.width, height: session.height },
  });
});

// 3. GET /api/preview/sessions/:id/frame.png
app.get("/api/preview/sessions/:id/frame.png", (req: Request, res: Response): any => {
  const session = previewSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  session.lastActive = Date.now();

  // Return SVG/PNG frame representation
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${session.width}" height="${session.height}"><rect width="100%" height="100%" fill="#121212"/><text x="40" y="80" fill="#3ECF8E" font-family="monospace" font-size="20">Target: ${session.url}</text></svg>`;
  res.setHeader("Content-Type", "image/svg+xml");
  res.send(svg);
});

// 4. POST /api/preview/sessions/:id/interact
app.post("/api/preview/sessions/:id/interact", (req: Request, res: Response): any => {
  const session = previewSessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  session.lastActive = Date.now();
  res.json({ success: true, action: req.body.type });
});

// 5. POST /api/preview/sessions/:id/pick
app.post("/api/preview/sessions/:id/pick", (req: Request, res: Response): any => {
  const { x, y } = req.body;
  res.json({
    selector: y < 80 ? "header.navbar > ul.nav-links" : "img.hero-banner",
    tagName: y < 80 ? "ul" : "img",
    rect: { x: 16, y: y < 80 ? 12 : 96, width: 343, height: y < 80 ? 56 : 220 },
  });
});

// 6. POST /api/preview/sessions/:id/capture
app.post("/api/preview/sessions/:id/capture", (req: Request, res: Response): any => {
  const captureId = `cap_${Date.now()}`;
  res.json({
    captureId,
    imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='#1C1C1C'/></svg>",
    width: req.body.region?.width || 400,
    height: req.body.region?.height || 200,
  });
});

// 7. DELETE /api/preview/sessions/:id
app.delete("/api/preview/sessions/:id", (req: Request, res: Response): any => {
  previewSessions.delete(req.params.id);
  res.json({ success: true });
});

// 8. POST /api/analyses (Extended body with scope, region, selector)
app.post("/api/analyses", async (req: Request, res: Response): Promise<any> => {
  const { url, issueDescription, mode, scope, region, selector, maxPages } = req.body;

  if (!url) {
    return res.status(400).json({ code: "UNKNOWN", message: "URL is required" });
  }

  if (mode === "public") {
    const isSafe = await isSafePublicUrl(url);
    if (!isSafe) {
      return res.status(400).json({
        code: "UNSAFE_URL",
        message: "This URL was blocked: it points to a private network address or loopback.",
      });
    }
  }

  const jobId = `job_${Math.random().toString(36).substring(2, 9)}`;
  jobs.set(jobId, {
    id: jobId,
    url,
    issueDescription,
    mode,
    scope: scope || "page",
    region,
    selector,
    maxPages: maxPages || 10,
    status: "running",
    progress: 10,
    createdAt: Date.now(),
  });

  res.json({ jobId });
});

// 9. GET /api/analyses/:jobId
app.get("/api/analyses/:jobId", (req: Request, res: Response): any => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const elapsed = Date.now() - job.createdAt;
  if (elapsed > 4000) {
    job.status = "completed";
    job.progress = 100;
  }

  res.json(job);
});

app.listen(PORT, HOST, () => {
  console.log(`Backend listening securely on http://${HOST}:${PORT}`);
});
