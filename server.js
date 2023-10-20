const express = require('express');
const https = require('https');  // Agrega el módulo HTTPS
const fs = require('fs'); // Agrega el módulo File System
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Conectar a la base de datos SQLite y crear la tabla 'notes'
const db = new sqlite3.Database('notes.db');
db.serialize(function () {
  db.run(
    'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT, description TEXT, priority INTEGER)',    
  );
});

// Ruta para crear una nueva nota (POST)
app.post('/notes', (req, res) => {
  const { title, description, priority } = req.body;
  db.run('INSERT INTO notes (title, description, priority) VALUES (?, ?, ?)', [title, description, priority], function (err) {
    if (err) {
      res.status(500).json({ error: 'Error al guardar la nota' });
    } else {
      res.status(201).json({ id: this.lastID, title, description, priority });
    }
  });
});

// Ruta para crear una nueva nota con id (POST)
app.post('/notes/:customId', (req, res) => {
  const customId = req.params.customId;
  const { title, description, priority } = req.body;
  // Ahora puedes usar 'customId' para guardar la nota con el ID personalizado.
  db.run('INSERT INTO notes (id, title, description, priority) VALUES (?, ?, ?, ?)', [customId, title, description, priority], function (err) {
    if (err) {
      res.status(500).json({ error: 'Error al guardar la nota' });
    } else {
      res.status(201).json({ id: customId, title, description, priority });
    }
  });
});

// Ruta para obtener todas las notas (GET)
app.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes', function (err, rows) {
    if (err) {
      res.status(500).json({ error: 'Error al obtener las notas' });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Ruta para modificar una nota por su ID (PUT)
app.put('/notes/:id', (req, res) => {
    const noteId = req.params.id;
    const { title, description, priority } = req.body;
    
    // Verificar si el ID es un número válido
    if (!/^\d+$/.test(noteId)) {
      res.status(400).json({ status: 400, message: 'ID de nota no válido' });
      return;
    }
    
    // Actualizar la nota en la base de datos
    db.run('UPDATE notes SET title = ?, description = ?, priority = ? WHERE id = ?', [title, description, priority, noteId], function (err) {
      if (err) {
        res.status(500).json({ status: 500, message: 'Error al modificar la nota' });
      } else if (this.changes === 0) {
        res.status(404).json({ status: 404, message: 'Nota no encontrada' });
      } else {
        res.status(200).json({ status: 200, message: 'Nota modificada' });
      }
    });
});

// Ruta para eliminar una nota por su ID (DELETE)
app.delete('/notes/:id', (req, res) => {
    const noteId = req.params.id;
  
    // Verificar si el ID es un número válido
    if (!/^\d+$/.test(noteId)) {
      res.status(400).json({ status: 400, message: 'ID de nota no válido' });
      return;
    }
  
    db.run('DELETE FROM notes WHERE id = ?', noteId, function (err) {
      if (err) {
        res.status(500).json({ status: 500, message: 'Error al eliminar la nota' });
      } else if (this.changes === 0) {
        res.status(404).json({ status: 404, message: 'Nota no encontrada' });
      } else {
        res.status(200).json({ status: 200, message: 'Nota eliminada' });
      }
    });
  });

  // Ruta para eliminar todas las notas (DELETE)
app.delete('/notes', (req, res) => {
  db.run('DELETE FROM notes', function (err) {
      if (err) {
          res.status(500).json({ status: 500, message: 'Error al eliminar todas las notas' });
      } else {
          res.status(200).json({ status: 200, message: 'Todas las notas han sido eliminadas' });
      }
  });
});

  // Ruta para reiniciar la primary key y eliminar todos los registros (DELETE)
app.delete('/reset-notes', (req, res) => {
    db.serialize(() => {
      db.run('DELETE FROM notes', (err) => {
        if (err) {
          res.status(500).json({ status: 500, message: 'Error al reiniciar las notas' });
        } else {
          // Reiniciar la primary key
          db.run('DELETE FROM sqlite_sequence WHERE name = ?', 'notes', (err) => {
            if (err) {
              res.status(500).json({ status: 500, message: 'Error al reiniciar la primary key' });
            } else {
              res.status(200).json({ status: 200, message: 'Primary key reiniciada y notas eliminadas' });
            }
          });
        }
      });
    });
});

const httpsOptions = {
  key: fs.readFileSync('server.key'), // Ruta a tu clave privada
  cert: fs.readFileSync('server.cert') // Ruta a tu certificado
};

// Crea un servidor HTTPS en lugar de HTTP
const httpsServer = https.createServer(httpsOptions, app);

httpsServer.listen(port,'0.0.0.0', () => {
  console.log(`El servidor está escuchando en el puerto ${port}`);
});