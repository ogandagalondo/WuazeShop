const path = require('path');
const projectDir = path.resolve(__dirname, '..', '..', '..');
process.env.BRAINSTORM_DIR = path.join(projectDir, '.superpowers', 'brainstorm', 'session-1');
process.env.BRAINSTORM_OPEN = '1';
require('./server.cjs');
