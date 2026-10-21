const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'turnos.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readTurnos() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeTurnos(turnos) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(turnos, null, 2), 'utf8');
}

app.get('/api/turnos', (req, res) => {
  res.json(readTurnos());
});

app.post('/api/turnos', (req, res) => {
  const registro = req.body;

  if (!registro || !registro.fecha) {
    return res.status(400).json({ error: 'Falta la fecha del turno.' });
  }

  const turnos = readTurnos();
  const nuevoRegistro = {
    id: Date.now(),
    ...registro,
    creadoEn: new Date().toISOString()
  };

  turnos.push(nuevoRegistro);
  writeTurnos(turnos);

  return res.status(201).json({ ok: true, registro: nuevoRegistro });
});

app.delete('/api/turnos', (req, res) => {
  writeTurnos([]);
  res.json({ ok: true, message: 'Historial eliminado.' });
});

app.delete('/api/turnos/:id', (req, res) => {
  const id = Number(req.params.id);
  const turnos = readTurnos();
  const filtrados = turnos.filter((item) => Number(item.id) !== id);
  writeTurnos(filtrados);
  res.json({ ok: true, eliminados: turnos.length - filtrados.length });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
