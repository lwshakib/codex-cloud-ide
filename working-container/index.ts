import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import * as pty from 'node-pty';
import path from 'path';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/workspace';

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected to working-container');

  // Terminal handling
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: WORKSPACE_DIR,
    env: process.env as Record<string, string>
  });

  ptyProcess.on('data', (data: string) => {
    socket.emit('terminal:data', data);
  });

  socket.on('terminal:input', (data: string) => {
    ptyProcess.write(data);
  });

  socket.on('terminal:resize', ({ cols, rows }: { cols: number; rows: number }) => {
    try {
        ptyProcess.resize(cols, rows);
    } catch (e) {
        console.error('Resize error:', e);
    }
  });

  // Recursive file listing
  const listFilesRecursive = async (dir: string): Promise<any[]> => {
    const fullPath = path.resolve(WORKSPACE_DIR, dir);
    if (!fullPath.startsWith(WORKSPACE_DIR)) return [];

    try {
        const files = await fs.promises.readdir(fullPath, { withFileTypes: true });
        const result = await Promise.all(files.map(async (file) => {
            if (file.isDirectory() && (file.name === 'node_modules' || file.name === '.git')) {
                return null;
            }

            const filePath = path.join(fullPath, file.name);
            const relativePath = path.relative(WORKSPACE_DIR, filePath).replace(/\\/g, '/');
            
            let size = 0;
            try {
                const stats = await fs.promises.stat(filePath);
                size = stats.size;
            } catch (_e) { /* ignore */ }

            const node: any = {
                name: file.name,
                type: file.isDirectory() ? 'folder' : 'file',
                path: relativePath,
                size: size 
            };

            if (file.isDirectory()) {
                node.children = await listFilesRecursive(relativePath);
            }

            return node;
        }));
        return result.filter(Boolean);
    } catch (e) {
        return [];
    }
  };

  socket.on('fs:list', async (dir: string = '.') => {
    try {
      const files = await listFilesRecursive(dir);
      socket.emit('fs:list:result', files);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      socket.emit('fs:error', message);
    }
  });

  socket.on('fs:read', async (filePath: string) => {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return socket.emit('fs:error', 'Invalid path');
    }

    try {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      socket.emit('fs:read:result', { content, filePath });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      socket.emit('fs:error', message);
    }
  });

  socket.on('fs:write', async ({ filePath, content }: { filePath: string; content: string }) => {
    const fullPath = path.resolve(WORKSPACE_DIR, filePath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return socket.emit('fs:error', 'Invalid path');
    }

    try {
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.promises.writeFile(fullPath, content);
      socket.emit('fs:write:success', filePath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      socket.emit('fs:error', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from working-container');
    ptyProcess.kill();
  });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Working container agent listening on port ${PORT}`);
});