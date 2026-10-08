import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { runDatasetParser, formatRecordsToCsv } from './src/parser/engine';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const outputsDir = path.resolve('outputs');
const inputsDir = path.resolve('inputs');
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
if (!fs.existsSync(inputsDir)) fs.mkdirSync(inputsDir, { recursive: true });

// Setup multer storage for dataset file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, inputsDir);
  },
  filename: (_req, file, cb) => {
    // Preserve original name or sanitize
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, sanitized);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// API: System info & paths
app.get('/api/system', (_req, res) => {
  res.json({
    status: 'online',
    outputsDir,
    inputsDir,
    timestamp: new Date().toISOString(),
    supportedFormats: ['.pdf', '.txt', '.csv']
  });
});

// API: List datasets
app.get('/api/datasets', (_req, res) => {
  const customFiles: string[] = [];
  try {
    if (fs.existsSync(inputsDir)) {
      customFiles.push(...fs.readdirSync(inputsDir).filter(f => !f.startsWith('.')));
    }
  } catch (err) {
    console.error('Error reading inputs dir:', err);
  }

  const datasets = [
    {
      id: '1',
      name: 'Hebbal Assembly Constituency - Part No: 1 (1.pdf)',
      electorCount: 415,
      isPreloaded: true,
      defaultOutput: '1.csv',
      description: 'Gandhi Vidyalaya Kannada & Tamil Primary School, Room No. 1'
    },
    {
      id: '2',
      name: 'Hebbal Assembly Constituency - Part No: 2 (2.pdf)',
      electorCount: 484,
      isPreloaded: true,
      defaultOutput: '2.csv',
      description: 'Gandhi Vidyalaya Kannada & Tamil Primary School, Room No. 2'
    },
    {
      id: '3',
      name: 'Hebbal Assembly Constituency - Part No: 3 (3.pdf)',
      electorCount: 608,
      isPreloaded: true,
      defaultOutput: '3.csv',
      description: 'BBMP Ward Office, Opp. Sterling Apartment, Room No. 1'
    },
    {
      id: '4',
      name: 'Hebbal Assembly Constituency - Part No: 4 (4.pdf)',
      electorCount: 588,
      isPreloaded: true,
      defaultOutput: '4.csv',
      description: 'BBMP Ward Office, Opp. Sterling Apartment, Room No. 2'
    },
    {
      id: '5',
      name: 'Hebbal Assembly Constituency - Part No: 5 (5.pdf)',
      electorCount: 643,
      isPreloaded: true,
      defaultOutput: '5.csv',
      description: 'Central Library BBMP Building, Lottegollahalli, Room No. 1'
    },
    {
      id: '6',
      name: 'Hebbal Assembly Constituency - Part No: 6 (6.pdf)',
      electorCount: 433,
      isPreloaded: true,
      defaultOutput: '6.csv',
      description: 'Central Library BBMP Building, Lottegollahalli, Room No. 2'
    },
    {
      id: '7',
      name: 'Hebbal Assembly Constituency - Part No: 7 (7.pdf)',
      electorCount: 553,
      isPreloaded: true,
      defaultOutput: '7.csv',
      description: 'Radhakrishna Public School, Basaveshwara Layout, Room No. 1'
    },
    {
      id: '8',
      name: 'Hebbal Assembly Constituency - Part No: 8 (8.pdf)',
      electorCount: 497,
      isPreloaded: true,
      defaultOutput: '8.csv',
      description: 'Radhakrishna Public School, Basaveshwara Layout, Room No. 2'
    },
    {
      id: '9',
      name: 'Hebbal Assembly Constituency - Part No: 9 (9.pdf)',
      electorCount: 592,
      isPreloaded: true,
      defaultOutput: '9.csv',
      description: 'Radhakrishna Public School, Basaveshwara Layout, Room No. 3'
    },
    {
      id: '10',
      name: 'Hebbal Assembly Constituency - Part No: 10 (10.pdf)',
      electorCount: 682,
      isPreloaded: true,
      defaultOutput: '10.csv',
      description: 'Sunrise English School, Bhoopsandra, Room No. 1'
    },
    {
      id: '208',
      name: 'Hebbal Assembly Constituency - Part No: 208',
      electorCount: 697,
      isPreloaded: true,
      defaultOutput: '208.csv',
      description: 'Presidency High School, HMT Layout, Ganganagar, Room No.3'
    },
    {
      id: '207',
      name: 'Hebbal Assembly Constituency - Part No: 207',
      electorCount: 654,
      isPreloaded: true,
      defaultOutput: '207.csv',
      description: 'Presidency High School, HMT Layout, Ganganagar, Room No.2'
    },
    ...customFiles.map(f => {
      const baseName = f.replace(/\.[^/.]+$/, "");
      return {
        id: baseName,
        name: `Custom Dataset: ${f}`,
        electorCount: 0,
        isPreloaded: false,
        fileName: f,
        defaultOutput: `${baseName}.csv`,
        description: `Uploaded file in /inputs/${f}`
      };
    })
  ];

  res.json({ datasets });
});

// API: Upload custom dataset file
app.post('/api/upload', upload.single('datasetFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const originalName = req.file.originalname;
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const targetOutputName = `${baseName}.csv`;

  res.json({
    success: true,
    message: `Uploaded ${originalName} successfully to ${req.file.path}`,
    fileName: req.file.filename,
    baseName,
    outputCsvName: targetOutputName,
    filePath: req.file.path,
    size: req.file.size
  });
});

// API: Parse dataset with Server-Sent Events (SSE) streaming for compilation & execution progress
app.get('/api/parse-stream', async (req, res) => {
  const datasetId = (req.query.datasetId as string) || '208';
  const customName = (req.query.customName as string) || '';

  // Setup SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await runDatasetParser({
      datasetId,
      customName: customName || undefined,
      onProgress: (prog) => {
        sendEvent('progress', prog);
      },
      onLog: (log) => {
        sendEvent('log', log);
      }
    });

    sendEvent('complete', {
      success: true,
      datasetId: result.datasetId,
      datasetName: result.datasetName,
      outputCsvName: result.outputCsvName,
      outputCsvPath: result.outputCsvPath,
      totalRecords: result.totalRecords,
      csvContent: result.csvContent,
      durationMs: result.durationMs,
      outputsDir
    });
  } catch (error: any) {
    sendEvent('error', {
      error: error.message || 'Unknown parsing error'
    });
  } finally {
    res.end();
  }
});

// API: Non-streaming parse endpoint
app.post('/api/parse', async (req, res) => {
  const { datasetId = '208', customName, rawContent } = req.body;
  try {
    const result = await runDatasetParser({
      datasetId,
      customName,
      rawContent
    });
    res.json({
      success: true,
      ...result,
      outputsDir
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing parse job' });
  }
});

// API: List generated CSV outputs in outputs/
app.get('/api/outputs', (_req, res) => {
  try {
    if (!fs.existsSync(outputsDir)) {
      return res.json({ outputs: [], outputsDir });
    }
    const files = fs.readdirSync(outputsDir).filter(f => f.endsWith('.csv'));
    const outputs = files.map(filename => {
      const fullPath = path.join(outputsDir, filename);
      const stat = fs.statSync(fullPath);
      // Count lines
      let rowCount = 0;
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        rowCount = Math.max(0, lines.length - 1); // exclude header
      } catch {}

      return {
        filename,
        path: fullPath,
        sizeBytes: stat.size,
        sizeFormatted: `${(stat.size / 1024).toFixed(2)} KB`,
        rowCount,
        modifiedAt: stat.mtime.toISOString(),
        downloadUrl: `/api/download/${filename}`
      };
    });

    res.json({ outputs, outputsDir });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Download output CSV
app.get('/api/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(outputsDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found in output directory');
  }
  res.download(filePath, filename);
});

// API: Read raw CSV content
app.get('/api/outputs/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(outputsDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  res.type('text/plain').send(content);
});

// Initialize server with Vite middleware in dev or static files in production
async function startServer() {
  const http = await import('http');
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`  Electoral Roll Parser Server Running on Port ${PORT}`);
    console.log(`  Output Folder: ${outputsDir}`);
    console.log(`  Input Folder:  ${inputsDir}`);
    console.log(`========================================================\n`);
  });
}

startServer();
