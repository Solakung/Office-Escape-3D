import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Serve local vendor dependencies (such as Three.js fallback)
app.use('/vendor', express.static(path.join(__dirname, 'node_modules/three/build')));

// Serve static files from root directory
app.use(express.static(__dirname));

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Office Escape 3D running on http://${HOST}:${PORT}`);
});
