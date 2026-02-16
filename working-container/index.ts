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
  const shell = 'bash';
  const shellArgs = ['-i'];
  console.log(`[Agent] Using interactive shell: ${shell} ${shellArgs.join(' ')}`);
  const terminals = new Map<string, pty.IPty>();

  socket.on('terminal:create', (terminalId: string) => {
    console.log(`[Agent] terminal:create received for ID: ${terminalId}`);
    try {
        if (terminals.has(terminalId)) {
            console.log(`[Agent] Terminal ${terminalId} already exists, killing old one.`);
            terminals.get(terminalId)?.kill();
        }

        const ptyProcess = pty.spawn(shell, shellArgs, {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: WORKSPACE_DIR,
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor',
                HOME: '/root',
                USER: 'root'
            } as Record<string, string>
        });

        terminals.set(terminalId, ptyProcess);

        ptyProcess.onData((data: string) => {
            if (data.length > 0) {
                console.log(`[Agent] PTY OUT (${terminalId}): ${data.length} chars`);
            }
            socket.emit('terminal:data', { terminalId, data });
        });

        ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
            console.log(`[Agent] PTY ${terminalId} exited with code ${exitCode}`);
            socket.emit('terminal:exit', terminalId);
            terminals.delete(terminalId);
        });

        console.log(`[Agent] Terminal ${terminalId} successfully spawned`);
        socket.emit('terminal:data', {
            terminalId,
            data: `\r\n\x1b[32m[Agent] Shell spawned successfully (${shell})\x1b[0m\r\n`
        });

        // Heartbeat for debugging
        const heartbeat = setInterval(() => {
            if (terminals.has(terminalId)) {
                // Sending a null char or empty string to keep connection alive and verify path
                socket.emit('terminal:data', { terminalId, data: '' });
            } else {
                clearInterval(heartbeat);
            }
        }, 5000);
    } catch (err) {
        console.error(`[Agent] Failed to spawn terminal ${terminalId}:`, err);
        socket.emit('terminal:data', { terminalId, data: `\r\n\x1b[31m[Agent] Failed to spawn shell: ${err}\x1b[0m\r\n` });
    }
  });

  socket.on('terminal:input', ({ terminalId, data }: { terminalId: string; data: string }) => {
    const ptyProcess = terminals.get(terminalId);
    if (ptyProcess) {
        ptyProcess.write(data);
    } else {
        console.warn(`[Agent] Received input for non-existent terminal: ${terminalId}`);
    }
  });

  socket.on('terminal:resize', ({ terminalId, cols, rows }: { terminalId: string; cols: number; rows: number }) => {
    try {
        const ptyProcess = terminals.get(terminalId);
        if (ptyProcess && (ptyProcess as any)._writable !== false) {
            ptyProcess.resize(cols, rows);
        }
    } catch (e: any) {
        if (e.message?.includes('EBADF') || e.message?.includes('positive')) {
            return;
        }
        console.error('Resize error:', e);
    }
  });

  socket.on('terminal:kill', (terminalId: string) => {
    const ptyProcess = terminals.get(terminalId);
    if (ptyProcess) {
        ptyProcess.kill();
        terminals.delete(terminalId);
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
    terminals.forEach((t) => t.kill());
    terminals.clear();
  });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Working container agent listening on port ${PORT}`);
});