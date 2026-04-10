// ─── Mock data for dashboard development ───────────────────────────────────
// TODO: Replace with real Supabase queries once the database is wired up.

export type AgentStatus = 'running' | 'idle' | 'error' | 'paused'

export interface Agent {
  id: string
  name: string
  description: string
  status: AgentStatus
  model: string
  lastRunAt: string
  runsToday: number
  successRate: number
}

export interface Run {
  id: string
  agentId: string
  agentName: string
  status: 'success' | 'running' | 'failed' | 'queued'
  startedAt: string
  duration: number | null // seconds
  output: string | null
}

export interface LogEvent {
  id: string
  timestamp: string
  source: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

export interface Device {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'warning'
  lastSeen: string
  firmwareVersion: string
  ip: string
}

// ─── Agents ────────────────────────────────────────────────────────────────

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agt-001',
    name: 'scraper',
    description: 'Crawls target URLs and extracts structured data',
    status: 'running',
    model: 'gpt-4o-mini',
    lastRunAt: '2024-04-10T10:42:01Z',
    runsToday: 48,
    successRate: 97,
  },
  {
    id: 'agt-002',
    name: 'classifier',
    description: 'Labels and routes ingested records by topic',
    status: 'running',
    model: 'gpt-4o',
    lastRunAt: '2024-04-10T10:42:04Z',
    runsToday: 142,
    successRate: 99,
  },
  {
    id: 'agt-003',
    name: 'notifier',
    description: 'Dispatches Slack / webhook alerts on trigger conditions',
    status: 'idle',
    model: 'gpt-4o-mini',
    lastRunAt: '2024-04-10T10:41:07Z',
    runsToday: 7,
    successRate: 100,
  },
  {
    id: 'agt-004',
    name: 'summarizer',
    description: 'Generates daily digest summaries from run outputs',
    status: 'paused',
    model: 'claude-3-haiku',
    lastRunAt: '2024-04-09T23:00:00Z',
    runsToday: 0,
    successRate: 94,
  },
  {
    id: 'agt-005',
    name: 'planner',
    description: 'Decomposes user goals into subtasks for other agents',
    status: 'idle',
    model: 'gpt-4o',
    lastRunAt: '2024-04-10T09:15:00Z',
    runsToday: 3,
    successRate: 88,
  },
  {
    id: 'agt-006',
    name: 'monitor',
    description: 'Watches device telemetry and raises alerts',
    status: 'error',
    model: 'gpt-4o-mini',
    lastRunAt: '2024-04-10T10:38:00Z',
    runsToday: 22,
    successRate: 72,
  },
]

// ─── Runs ──────────────────────────────────────────────────────────────────

export const MOCK_RUNS: Run[] = [
  { id: 'run-142', agentId: 'agt-001', agentName: 'scraper', status: 'running', startedAt: '2024-04-10T10:42:01Z', duration: null, output: null },
  { id: 'run-141', agentId: 'agt-002', agentName: 'classifier', status: 'running', startedAt: '2024-04-10T10:42:04Z', duration: null, output: null },
  { id: 'run-140', agentId: 'agt-003', agentName: 'notifier', status: 'success', startedAt: '2024-04-10T10:41:07Z', duration: 3, output: 'Dispatched 2 webhooks.' },
  { id: 'run-139', agentId: 'agt-002', agentName: 'classifier', status: 'success', startedAt: '2024-04-10T10:39:00Z', duration: 14, output: '38 records classified.' },
  { id: 'run-138', agentId: 'agt-006', agentName: 'monitor', status: 'failed', startedAt: '2024-04-10T10:38:00Z', duration: 2, output: 'Error: device RPI-002 unreachable.' },
  { id: 'run-137', agentId: 'agt-001', agentName: 'scraper', status: 'success', startedAt: '2024-04-10T10:35:00Z', duration: 21, output: 'Fetched 52 records from 3 URLs.' },
  { id: 'run-136', agentId: 'agt-005', agentName: 'planner', status: 'success', startedAt: '2024-04-10T09:15:00Z', duration: 8, output: 'Decomposed goal into 4 subtasks.' },
  { id: 'run-135', agentId: 'agt-004', agentName: 'summarizer', status: 'success', startedAt: '2024-04-09T23:00:00Z', duration: 31, output: 'Daily digest generated.' },
  { id: 'run-134', agentId: 'agt-002', agentName: 'classifier', status: 'queued', startedAt: '2024-04-10T10:42:10Z', duration: null, output: null },
]

// ─── Events / Logs ─────────────────────────────────────────────────────────

export const MOCK_EVENTS: LogEvent[] = [
  { id: 'evt-001', timestamp: '10:42:07', source: 'agent/notifier', level: 'info', message: 'dispatched webhook to https://hooks.example.com/alert' },
  { id: 'evt-002', timestamp: '10:42:06', source: 'device/rpi-001', level: 'info', message: 'heartbeat received — temp: 41°C, mem: 62%' },
  { id: 'evt-003', timestamp: '10:42:04', source: 'agent/classifier', level: 'info', message: 'processing batch of 48 records' },
  { id: 'evt-004', timestamp: '10:42:01', source: 'agent/scraper', level: 'info', message: 'run #142 started' },
  { id: 'evt-005', timestamp: '10:38:02', source: 'agent/monitor', level: 'error', message: 'device RPI-002 unreachable — connection timeout' },
  { id: 'evt-006', timestamp: '10:38:00', source: 'agent/monitor', level: 'warn', message: 'retrying device RPI-002 (attempt 3/3)' },
  { id: 'evt-007', timestamp: '10:35:21', source: 'agent/scraper', level: 'info', message: 'run #137 completed — 52 records in 21s' },
  { id: 'evt-008', timestamp: '09:15:08', source: 'agent/planner', level: 'info', message: 'goal decomposed into 4 subtasks' },
  { id: 'evt-009', timestamp: '09:15:00', source: 'system', level: 'debug', message: 'scheduler tick — checking run queue' },
  { id: 'evt-010', timestamp: '08:00:01', source: 'system', level: 'info', message: 'application started — v0.1.0-hackathon' },
]

// ─── Devices ───────────────────────────────────────────────────────────────

export const MOCK_DEVICES: Device[] = [
  {
    id: 'dev-001',
    name: 'RPI-001',
    type: 'Raspberry Pi 4',
    status: 'online',
    lastSeen: '10:42:06',
    firmwareVersion: '1.4.2',
    ip: '192.168.1.42',
  },
  {
    id: 'dev-002',
    name: 'RPI-002',
    type: 'Raspberry Pi 5',
    status: 'offline',
    lastSeen: '10:36:00',
    firmwareVersion: '1.3.0',
    ip: '192.168.1.43',
  },
]

// ─── Overview stats ────────────────────────────────────────────────────────

export const OVERVIEW_STATS = {
  totalAgents: MOCK_AGENTS.length,
  runningAgents: MOCK_AGENTS.filter((a) => a.status === 'running').length,
  runsToday: MOCK_RUNS.filter((r) => r.status !== 'queued').length,
  totalEvents: MOCK_EVENTS.length,
  onlineDevices: MOCK_DEVICES.filter((d) => d.status === 'online').length,
  totalDevices: MOCK_DEVICES.length,
  failedRuns: MOCK_RUNS.filter((r) => r.status === 'failed').length,
}
