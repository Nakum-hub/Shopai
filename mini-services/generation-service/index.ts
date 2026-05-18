import { Server, Socket } from "socket.io";

// =============================================================================
// Types (mirrored from the main project for standalone service use)
// =============================================================================

type GenerationStatus =
  | "idle"
  | "processing_voice"
  | "understanding_business"
  | "planning_structure"
  | "generating_branding"
  | "generating_content"
  | "generating_sections"
  | "assembling_pages"
  | "validating"
  | "repairing"
  | "complete"
  | "error";

interface GenerationLog {
  id: string;
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  agent: string;
  message: string;
  detail?: string;
}

interface GenerationProgressPayload {
  storefrontId: string;
  status: GenerationStatus;
  message: string;
  progress: number;
  agent: string;
  logs: GenerationLog[];
}

interface StartGenerationPayload {
  storefrontId: string;
  businessProfile: unknown;
}

interface GenerationCompletePayload {
  storefrontId: string;
  success: boolean;
}

// =============================================================================
// Pipeline Stage Definitions
// =============================================================================

interface PipelineStage {
  status: GenerationStatus;
  agent: string;
  message: string;
  progress: number;
  logMessage: string;
  logLevel: GenerationLog["level"];
  logDetail?: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    status: "processing_voice",
    agent: "Voice Processor",
    message: "Processing voice input...",
    progress: 5,
    logMessage: "Voice transcript extraction started",
    logLevel: "info",
    logDetail: "Analyzing audio stream and converting to text",
  },
  {
    status: "understanding_business",
    agent: "Business Analyzer",
    message: "Understanding your business...",
    progress: 15,
    logMessage: "Business profile analysis in progress",
    logLevel: "info",
    logDetail: "Extracting key entities, category, and value proposition",
  },
  {
    status: "planning_structure",
    agent: "Planner",
    message: "Planning website structure...",
    progress: 25,
    logMessage: "Page structure planned successfully",
    logLevel: "success",
    logDetail: "Determined optimal section layout based on business type",
  },
  {
    status: "generating_branding",
    agent: "Branding Agent",
    message: "Creating brand identity...",
    progress: 35,
    logMessage: "Brand identity generated",
    logLevel: "success",
    logDetail: "Color palette, typography, and visual language defined",
  },
  {
    status: "generating_content",
    agent: "Content Agent",
    message: "Writing compelling copy...",
    progress: 50,
    logMessage: "Content generation complete",
    logLevel: "success",
    logDetail: "Hero copy, product descriptions, and CTAs written",
  },
  {
    status: "generating_sections",
    agent: "UI Agent",
    message: "Building page sections...",
    progress: 65,
    logMessage: "Page sections built",
    logLevel: "success",
    logDetail: "Responsive UI components rendered for all sections",
  },
  {
    status: "assembling_pages",
    agent: "Product Agent",
    message: "Assembling storefront pages...",
    progress: 80,
    logMessage: "Storefront pages assembled",
    logLevel: "success",
    logDetail: "All sections combined into a complete storefront layout",
  },
  {
    status: "validating",
    agent: "Debug Agent",
    message: "Validating output quality...",
    progress: 90,
    logMessage: "Quality validation in progress",
    logLevel: "info",
    logDetail: "Checking HTML validity, responsiveness, and accessibility",
  },
  {
    status: "complete",
    agent: "System",
    message: "Storefront generated successfully!",
    progress: 100,
    logMessage: "Generation pipeline complete",
    logLevel: "success",
    logDetail: "Storefront is ready for preview and deployment",
  },
];

// =============================================================================
// Helpers
// =============================================================================

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Generation Pipeline Runner
// =============================================================================

async function runGenerationPipeline(
  socket: Socket,
  sessionId: string,
  storefrontId: string
): Promise<void> {
  const logs: GenerationLog[] = [];

  // Initial log
  logs.push({
    id: generateLogId(),
    timestamp: Date.now(),
    level: "info",
    agent: "System",
    message: `Generation pipeline started for storefront: ${storefrontId}`,
    detail: `Session: ${sessionId}`,
  });

  console.log(
    `[GenerationService] Pipeline started | session=${sessionId} | storefront=${storefrontId}`
  );

  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stage = PIPELINE_STAGES[i];

    // Simulate processing delay (1.5s - 3s between stages)
    const delay = randomDelay(1500, 3000);
    await sleep(delay);

    // 5% chance of random error at the validation stage (index 7)
    if (
      i === 7 &&
      Math.random() < 0.05
    ) {
      // Emit the error
      const errorLog: GenerationLog = {
        id: generateLogId(),
        timestamp: Date.now(),
        level: "error",
        agent: "Debug Agent",
        message: "Validation error detected: inconsistent responsive breakpoints",
        detail: "Auto-repair initiated...",
      };
      logs.push(errorLog);

      const errorPayload: GenerationProgressPayload = {
        storefrontId,
        status: "error",
        message: "Validation error detected — initiating auto-repair...",
        progress: 90,
        agent: "Debug Agent",
        logs: [...logs],
      };
      socket.emit("generation_progress", errorPayload);
      console.log(
        `[GenerationService] Validation error detected | storefront=${storefrontId} | auto-repairing...`
      );

      // Wait for repair simulation
      await sleep(randomDelay(1500, 2500));

      // Emit repair progress
      const repairLog: GenerationLog = {
        id: generateLogId(),
        timestamp: Date.now(),
        level: "warning",
        agent: "Debug Agent",
        message: "Auto-repair in progress: fixing responsive breakpoints",
        detail: "Recomputing media queries and container constraints",
      };
      logs.push(repairLog);

      const repairPayload: GenerationProgressPayload = {
        storefrontId,
        status: "repairing",
        message: "Auto-repairing validation issues...",
        progress: 92,
        agent: "Debug Agent",
        logs: [...logs],
      };
      socket.emit("generation_progress", repairPayload);

      await sleep(randomDelay(1000, 2000));

      // Repair complete
      const repairDoneLog: GenerationLog = {
        id: generateLogId(),
        timestamp: Date.now(),
        level: "success",
        agent: "Debug Agent",
        message: "Auto-repair complete: all issues resolved",
        detail: "Responsive breakpoints corrected, re-running validation...",
      };
      logs.push(repairDoneLog);

      const repairDonePayload: GenerationProgressPayload = {
        storefrontId,
        status: "validating",
        message: "Re-validating after repair...",
        progress: 95,
        agent: "Debug Agent",
        logs: [...logs],
      };
      socket.emit("generation_progress", repairDonePayload);

      await sleep(randomDelay(1000, 1500));

      // Continue with the final complete stage
      const completeStage = PIPELINE_STAGES[8]; // "complete"
      const completeLog: GenerationLog = {
        id: generateLogId(),
        timestamp: Date.now(),
        level: completeStage.logLevel,
        agent: completeStage.agent,
        message: completeStage.logMessage,
        detail: completeStage.logDetail,
      };
      logs.push(completeLog);

      const completePayload: GenerationProgressPayload = {
        storefrontId,
        status: completeStage.status,
        message: completeStage.message,
        progress: completeStage.progress,
        agent: completeStage.agent,
        logs: [...logs],
      };
      socket.emit("generation_progress", completePayload);

      // Emit final completion event
      const completeResult: GenerationCompletePayload = {
        storefrontId,
        success: true,
      };
      socket.emit("generation_complete", completeResult);

      console.log(
        `[GenerationService] Pipeline complete (with auto-repair) | storefront=${storefrontId}`
      );
      return;
    }

    // Normal stage progression
    const stageLog: GenerationLog = {
      id: generateLogId(),
      timestamp: Date.now(),
      level: stage.logLevel,
      agent: stage.agent,
      message: stage.logMessage,
      detail: stage.logDetail,
    };
    logs.push(stageLog);

    const payload: GenerationProgressPayload = {
      storefrontId,
      status: stage.status,
      message: stage.message,
      progress: stage.progress,
      agent: stage.agent,
      logs: [...logs],
    };
    socket.emit("generation_progress", payload);

    console.log(
      `[GenerationService] Stage ${i + 1}/${PIPELINE_STAGES.length} | status=${stage.status} | progress=${stage.progress}% | agent=${stage.agent}`
    );
  }

  // Emit final completion event
  const completeResult: GenerationCompletePayload = {
    storefrontId,
    success: true,
  };
  socket.emit("generation_complete", completeResult);

  console.log(
    `[GenerationService] Pipeline complete | storefront=${storefrontId} | totalLogs=${logs.length}`
  );
}

// =============================================================================
// Socket.IO Server Setup
// =============================================================================

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 3002;

io.on("connection", (socket: Socket) => {
  // Assign a unique session ID and join a room
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  socket.data.sessionId = sessionId;
  socket.join(sessionId);

  console.log(`[GenerationService] Client connected: ${socket.id} | session=${sessionId}`);

  // Send session confirmation
  socket.emit("session_assigned", { sessionId });

  // Handle generation start
  socket.on(
    "start_generation",
    (data: StartGenerationPayload) => {
      const { storefrontId } = data;
      console.log(
        `[GenerationService] start_generation received | session=${sessionId} | storefront=${storefrontId}`
      );

      if (!storefrontId) {
        console.warn(
          `[GenerationService] Missing storefrontId in start_generation payload`
        );
        return;
      }

      // Run the generation pipeline asynchronously
      runGenerationPipeline(socket, sessionId, storefrontId).catch((err) => {
        console.error(
          `[GenerationService] Pipeline error | storefront=${storefrontId}`,
          err
        );
        socket.emit("generation_progress", {
          storefrontId,
          status: "error",
          message: "An unexpected error occurred during generation",
          progress: 0,
          agent: "System",
          logs: [
            {
              id: generateLogId(),
              timestamp: Date.now(),
              level: "error",
              agent: "System",
              message: `Pipeline failed: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        });
      });
    }
  );

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(
      `[GenerationService] Client disconnected: ${socket.id} | session=${sessionId} | reason=${reason}`
    );
    socket.leave(sessionId);
  });
});

io.listen(PORT);
console.log(
  `[GenerationService] 🚀 Generation WebSocket service running on port ${PORT}`
);
