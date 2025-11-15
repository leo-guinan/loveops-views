/**
 * Admin Observability Routes
 * 
 * Provides endpoints for viewing queue status and tracing documents
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

interface QueueStatus {
  name: string;
  base_path: string;
  ready: number;
  in_progress: number;
  done: number;
  dead: number;
  scheduled: number;
  total: number;
}

interface JobInfo {
  id: string;
  queue: string;
  state: 'ready' | 'in_progress' | 'done' | 'dead' | 'scheduled';
  file: string;
  payload?: any;
  created?: Date;
  modified?: Date;
}

interface TraceStep {
  step: string;
  queue: string;
  state: string;
  timestamp?: Date;
  jobId?: string;
  payload?: any;
  error?: string;
}

interface TraceResult {
  documentId: string;
  trace: TraceStep[];
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  currentStep?: string;
}

function getQueueStatus(queuesDir: string, queueName: string): QueueStatus | null {
  const queuePath = path.join(queuesDir, queueName);
  
  if (!fs.existsSync(queuePath)) {
    return null;
  }

  const states = ['ready', 'in_progress', 'done', 'dead', 'scheduled'];
  const counts: Record<string, number> = {};
  let total = 0;

  for (const state of states) {
    const statePath = path.join(queuePath, state);
    try {
      if (fs.existsSync(statePath)) {
        const files = fs.readdirSync(statePath).filter(f => f.endsWith('.json'));
        counts[state] = files.length;
        total += files.length;
      } else {
        counts[state] = 0;
      }
    } catch (error) {
      counts[state] = 0;
    }
  }

  return {
    name: queueName,
    base_path: queuePath,
    ready: counts.ready || 0,
    in_progress: counts.in_progress || 0,
    done: counts.done || 0,
    dead: counts.dead || 0,
    scheduled: counts.scheduled || 0,
    total
  };
}

function getAllQueueStatus(queuesDir: string): QueueStatus[] {
  const queues: QueueStatus[] = [];
  
  try {
    const entries = fs.readdirSync(queuesDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('loveops-')) {
        const status = getQueueStatus(queuesDir, entry.name);
        if (status) {
          queues.push(status);
        }
      }
    }
  } catch (error) {
    console.error('Error reading queues directory:', error);
  }
  
  return queues;
}

function getJobsInState(queuesDir: string, queueName: string, state: string, limit: number = 100): JobInfo[] {
  const statePath = path.join(queuesDir, queueName, state);
  
  if (!fs.existsSync(statePath)) {
    return [];
  }

  const jobs: JobInfo[] = [];
  const files = fs.readdirSync(statePath)
    .filter(f => f.endsWith('.json'))
    .slice(0, limit);

  for (const file of files) {
    const filePath = path.join(statePath, file);
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const payload = JSON.parse(content);
      
      jobs.push({
        id: payload.id || file.replace('.json', ''),
        queue: queueName,
        state: state as any,
        file: file,
        payload: payload.payload || payload,
        created: stats.birthtime,
        modified: stats.mtime
      });
    } catch (error) {
      console.error(`Error reading job file ${filePath}:`, error);
    }
  }

  return jobs.sort((a, b) => {
    const aTime = a.created?.getTime() || 0;
    const bTime = b.created?.getTime() || 0;
    return bTime - aTime;
  });
}

function findDocument(queuesDir: string, documentId: string): JobInfo[] {
  const results: JobInfo[] = [];
  const queues = getAllQueueStatus(queuesDir);

  for (const queue of queues) {
    const states = ['ready', 'in_progress', 'done', 'dead', 'scheduled'];
    
    for (const state of states) {
      const jobs = getJobsInState(queuesDir, queue.name, state, 1000);
      const matching = jobs.filter(job => {
        if (job.id === documentId) return true;
        if (job.payload?.documentId === documentId) return true;
        if (job.payload?.id === documentId) return true;
        if (job.payload?.event?.id === documentId) return true;
        if (job.payload?.event?.actorId === documentId) return true;
        if (JSON.stringify(job.payload).includes(documentId)) return true;
        return false;
      });
      results.push(...matching);
    }
  }

  return results;
}

function traceDocument(queuesDir: string, documentId: string): TraceResult {
  const jobs = findDocument(queuesDir, documentId);
  
  if (jobs.length === 0) {
    return {
      documentId,
      trace: [],
      status: 'not_found'
    };
  }

  const trace: TraceStep[] = [];
  let currentState: string | undefined;
  let hasFailed = false;

  const byQueue: Record<string, JobInfo[]> = {};
  for (const job of jobs) {
    if (!byQueue[job.queue]) {
      byQueue[job.queue] = [];
    }
    byQueue[job.queue].push(job);
  }

  for (const [queueName, queueJobs] of Object.entries(byQueue)) {
    queueJobs.sort((a, b) => {
      const aTime = a.created?.getTime() || 0;
      const bTime = b.created?.getTime() || 0;
      return aTime - bTime;
    });

    for (const job of queueJobs) {
      const stepNames: Record<string, string> = {
        'loveops-events-ingest': 'Event Ingestion',
        'loveops-policy-matching': 'Matching',
        'loveops-policy-coaching': 'Coaching',
        'loveops-notifications': 'Notification',
        'loveops-metrics': 'Metrics'
      };

      const stateNames: Record<string, string> = {
        'ready': 'Queued',
        'in_progress': 'Processing',
        'done': 'Completed',
        'dead': 'Failed',
        'scheduled': 'Scheduled'
      };

      const baseName = stepNames[queueName] || queueName.replace('loveops-', '');
      const step: TraceStep = {
        step: `${baseName} - ${stateNames[job.state] || job.state}`,
        queue: queueName,
        state: job.state,
        timestamp: job.created,
        jobId: job.id,
        payload: job.payload
      };

      if (job.state === 'dead') {
        step.error = 'Job exceeded max retries';
        hasFailed = true;
      }

      trace.push(step);
      currentState = job.state;
    }
  }

  let status: 'processing' | 'completed' | 'failed' | 'not_found';
  if (hasFailed) {
    status = 'failed';
  } else if (currentState === 'done') {
    status = 'completed';
  } else if (currentState === 'ready' || currentState === 'in_progress') {
    status = 'processing';
  } else {
    status = 'processing';
  }

  return {
    documentId,
    trace,
    status,
    currentStep: trace[trace.length - 1]?.step
  };
}

export function createAdminObservabilityRouter(queuesDir?: string): Router {
  const router = Router();
  const queuesPath = queuesDir || process.env.VQ_QUEUES_DIR || '/var/queues';

  router.get('/queues/status', (req: Request, res: Response) => {
    try {
      const status = getAllQueueStatus(queuesPath);
      res.json({
        success: true,
        queues: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting queue status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get queue status',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  router.get('/queues/:queueName/status', (req: Request, res: Response) => {
    try {
      const { queueName } = req.params;
      const status = getQueueStatus(queuesPath, queueName);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: `Queue ${queueName} not found`
        });
      }

      res.json({
        success: true,
        queue: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting queue status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get queue status',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  router.get('/queues/:queueName/jobs/:state', (req: Request, res: Response) => {
    try {
      const { queueName, state } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const jobs = getJobsInState(queuesPath, queueName, state, limit);
      
      res.json({
        success: true,
        queue: queueName,
        state: state,
        jobs: jobs,
        count: jobs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get jobs',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  router.get('/trace/:documentId', (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const trace = traceDocument(queuesPath, documentId);
      
      res.json({
        success: true,
        trace: trace,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracing document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trace document',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  router.get('/search/:query', (req: Request, res: Response) => {
    try {
      const { query } = req.params;
      const jobs = findDocument(queuesPath, query);
      
      res.json({
        success: true,
        query: query,
        results: jobs,
        count: jobs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return router;
}

