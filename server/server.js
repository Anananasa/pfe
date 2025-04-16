const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Stockage temporaire des messages (à remplacer par une base de données)
const messages = {};

// Route pour récupérer les messages d'un incident
app.get('/api/messages/:incidentId', (req, res) => {
  const { incidentId } = req.params;
  res.json(messages[incidentId] || []);
});

// Route pour sauvegarder un message
app.post('/api/messages', (req, res) => {
  const { incidentId, message } = req.body;
  if (!messages[incidentId]) {
    messages[incidentId] = [];
  }
  messages[incidentId].push(message);
  res.json(message);
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('Un client s\'est connecté:', socket.id);

  socket.on('join-room', (incidentId) => {
    socket.join(`incident-${incidentId}`);
    console.log(`Client ${socket.id} a rejoint la room incident-${incidentId}`);
  });

  socket.on('send-message', (data) => {
    const { incidentId, message } = data;
    io.to(`incident-${incidentId}`).emit('new-message', message);
    console.log(`Message reçu dans incident-${incidentId}:`, message);
  });

  socket.on('disconnect', () => {
    console.log('Un client s\'est déconnecté:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 