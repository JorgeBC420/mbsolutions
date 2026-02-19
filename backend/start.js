#!/usr/bin/env node

/**
 * Script de utilidad para iniciar el servidor backend
 * Uso: node start.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename__ = fileURLToPath(import.meta.url);
const __dirname__ = path.dirname(__filename__);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          MB Solutions - Backend Server                    ║');
console.log('║          Inicializando servidor backend...                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Iniciar el servidor
const server = spawn('node', ['server.js'], {
    cwd: __dirname__,
    stdio: 'inherit'
});

server.on('error', (error) => {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
});

server.on('close', (code) => {
    if (code !== 0) {
        console.error(`\n❌ El servidor terminó con código ${code}`);
        process.exit(code);
    }
});

// Permitir terminar el servidor con Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n📭 Cerrando servidor...');
    server.kill();
    process.exit(0);
});
