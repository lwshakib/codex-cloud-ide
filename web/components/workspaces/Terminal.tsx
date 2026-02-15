"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { useWorkspaceStore } from '@/hooks/use-workspace-store';
import { socket } from '@/lib/socket';

const Terminal: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const { currentWorkspace } = useWorkspaceStore();

    useEffect(() => {
        if (!terminalRef.current || !currentWorkspace) return;

        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#0a0a0a',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selectionBackground: 'rgba(255, 255, 255, 0.3)',
                black: '#000000',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#bfbfbf',
                brightBlack: '#4d4d4d',
                brightRed: '#ff6e67',
                brightGreen: '#5af78e',
                brightYellow: '#f4f99d',
                brightBlue: '#caa9fa',
                brightMagenta: '#ff92d0',
                brightCyan: '#9aedfe',
                brightWhite: '#e6e6e6',
            },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // join workspace logic
        socket.emit('workspace:join', currentWorkspace.id);

        const onTerminalData = (data: string) => {
            term.write(data);
        };

        const onWorkspaceReady = () => {
            term.write('\r\n\x1b[32mWelcome to Codex IDE Terminal\x1b[0m\r\n');
            term.write('\x1b[34mContainer ready.\x1b[0m\r\n\r\n');
        };

        const onWorkspaceError = (err: string) => {
            term.write(`\r\n\x1b[31mError: ${err}\x1b[0m\r\n`);
        };

        socket.on('terminal:data', onTerminalData);
        socket.on('workspace:ready', onWorkspaceReady);
        socket.on('workspace:error', onWorkspaceError);

        term.onData((data) => {
            socket.emit('terminal:input', data);
        });

        const handleResize = () => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
                socket.emit('terminal:resize', {
                    cols: term.cols,
                    rows: term.rows,
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        resizeObserver.observe(terminalRef.current);

        return () => {
            resizeObserver.disconnect();
            socket.off('terminal:data', onTerminalData);
            socket.off('workspace:ready', onWorkspaceReady);
            socket.off('workspace:error', onWorkspaceError);
            term.dispose();
        };
    }, [currentWorkspace]);

    return (
        <div className="w-full h-full bg-[#0a0a0a] overflow-hidden">
            <div ref={terminalRef} className="w-full h-full p-2" />
        </div>
    );
};

export default Terminal;
