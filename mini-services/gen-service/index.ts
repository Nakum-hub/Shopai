import { Server } from 'socket.io';

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Generation pipeline stages
const PIPELINE_STAGES = [
  { id: 'voice', name: 'Processing Voice', agent: 'Voice Agent', duration: 2000 },
  { id: 'understanding', name: 'Understanding Business', agent: 'Business Analyzer', duration: 3000 },
  { id: 'planning', name: 'Planning Structure', agent: 'Planner Agent', duration: 2500 },
  { id: 'branding', name: 'Generating Branding', agent: 'Branding Agent', duration: 3000 },
  { id: 'content', name: 'Creating Content', agent: 'Content Agent', duration: 4000 },
  { id: 'sections', name: 'Building Sections', agent: 'Section Builder', duration: 5000 },
  { id: 'assembling', name: 'Assembling Pages', agent: 'Assembler', duration: 3000 },
  { id: 'validating', name: 'Validating', agent: 'Validator', duration: 2000 },
  { id: 'deploying', name: 'Deploying Preview', agent: 'Deployer', duration: 2500 },
];

// Active generation jobs
const activeJobs = new Map<string, {
  currentStage: number;
  progress: number;
  status: string;
  storefrontId: string;
}>();

function emitLog(socket: any, jobId: string, level: string, agent: string, message: string, detail?: string) {
  socket.emit('generation:log', {
    jobId,
    log: {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      level,
      agent,
      message,
      detail,
    },
  });
}

async function runGenerationPipeline(socket: any, jobId: string, storefrontId: string) {
  const job = {
    currentStage: 0,
    progress: 0,
    status: 'running',
    storefrontId,
  };
  activeJobs.set(jobId, job);

  const totalDuration = PIPELINE_STAGES.reduce((s, st) => s + st.duration, 0);
  let elapsed = 0;

  // Emit start
  socket.emit('generation:start', { jobId, storefrontId });
  emitLog(socket, jobId, 'info', 'System', 'Generation pipeline started', `Storefront: ${storefrontId}`);

  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stage = PIPELINE_STAGES[i];
    job.currentStage = i;
    
    // Emit stage start
    socket.emit('generation:stage', {
      jobId,
      stage: i,
      totalStages: PIPELINE_STAGES.length,
      stageName: stage.name,
      agent: stage.agent,
    });
    emitLog(socket, jobId, 'info', stage.agent, `Starting: ${stage.name}`);

    // Simulate progress within stage
    const steps = 5;
    for (let s = 1; s <= steps; s++) {
      await new Promise((resolve) => setTimeout(resolve, stage.duration / steps));
      elapsed += stage.duration / steps;
      job.progress = Math.round((elapsed / totalDuration) * 100);

      socket.emit('generation:progress', {
        jobId,
        progress: job.progress,
        stage: i,
        totalStages: PIPELINE_STAGES.length,
        message: `${stage.name} (${s}/${steps})`,
      });
    }

    // Emit stage complete
    const messages = [
      'Voice transcript extracted successfully',
      'Business profile analyzed and structured',
      'Page structure and component hierarchy planned',
      'Color palette, typography, and brand assets generated',
      'Product descriptions, hero copy, and section content written',
      `${Math.floor(Math.random() * 4 + 5)} storefront sections built with responsive design`,
      'All sections assembled into a complete HTML page',
      'HTML validation passed, mobile responsiveness verified',
      'Preview deployment complete, URL generated',
    ];
    emitLog(socket, jobId, 'success', stage.agent, messages[i] || `${stage.name} complete`);
  }

  // Complete
  job.status = 'complete';
  job.progress = 100;
  socket.emit('generation:complete', {
    jobId,
    storefrontId,
    success: true,
  });
  emitLog(socket, jobId, 'success', 'System', 'Generation complete! Storefront is ready for preview.');

  activeJobs.delete(jobId);
}

io.on('connection', (socket) => {
  console.log(`[GenService] Client connected: ${socket.id}`);

  // Start generation
  socket.on('generation:start', (data: { jobId: string; storefrontId: string }) => {
    console.log(`[GenService] Starting generation: ${data.jobId}`);
    runGenerationPipeline(socket, data.jobId, data.storefrontId);
  });

  // Cancel generation
  socket.on('generation:cancel', (data: { jobId: string }) => {
    console.log(`[GenService] Cancelling generation: ${data.jobId}`);
    activeJobs.delete(data.jobId);
    socket.emit('generation:cancelled', { jobId: data.jobId });
    emitLog(socket, data.jobId, 'warning', 'System', 'Generation cancelled by user');
  });

  // Pause/resume
  socket.on('generation:pause', (data: { jobId: string }) => {
    const job = activeJobs.get(data.jobId);
    if (job) {
      job.status = 'paused';
      emitLog(socket, data.jobId, 'warning', 'System', 'Generation paused');
    }
  });

  socket.on('generation:resume', (data: { jobId: string }) => {
    const job = activeJobs.get(data.jobId);
    if (job) {
      job.status = 'running';
      emitLog(socket, data.jobId, 'info', 'System', 'Generation resumed');
    }
  });

  // Heartbeat
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', () => {
    console.log(`[GenService] Client disconnected: ${socket.id}`);
  });
});

const PORT = 3002;
io.listen(PORT);
console.log(`[GenService] Generation WebSocket service running on port ${PORT}`);
