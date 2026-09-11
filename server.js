// Tiny web server so the game runs the same way locally, in UAT and in production.
// Express is the project's one runtime dependency; look at package.json and package-lock.json
// to see what it pulls in with it.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// A health endpoint gives the deploy step (and a monitoring tool) something to check.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Pipeline Runner listening on http://localhost:${port}`);
});
