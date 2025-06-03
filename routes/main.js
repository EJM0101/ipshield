const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const router = express.Router();

const upload = multer({ dest: path.join(__dirname, '../uploads') });
const adapter = new FileSync(path.join(__dirname, '../data/depots.json'));
const db = low(adapter);
db.defaults({ depots: [] }).write();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/depot', (req, res) => {
  res.render('depot');
});

router.post('/depot', upload.single('fichier'), (req, res) => {
  const { email, titre, texte } = req.body;
  let contenu = texte || '';
  let type = texte ? 'Texte' : 'Fichier';
  let hash, nomFichier = null;

  if (req.file) {
    contenu = fs.readFileSync(req.file.path);
    nomFichier = req.file.originalname;
  }

  hash = crypto.createHash('sha256').update(contenu).digest('hex');

  const depot = {
    id: nanoid(),
    email,
    titre,
    type,
    fichier: nomFichier,
    hash,
    horodatage: new Date().toISOString()
  };

  db.get('depots').push(depot).write();
  res.render('certificat', { depot });
});

router.get('/verifier', (req, res) => {
  res.render('verifier');
});

router.post('/verifier', upload.single('fichier'), (req, res) => {
  const { texte } = req.body;
  let contenu = texte || '';
  let hash;

  if (req.file) {
    contenu = fs.readFileSync(req.file.path);
  }

  hash = crypto.createHash('sha256').update(contenu).digest('hex');
  const match = db.get('depots').find({ hash }).value();

  res.render('certificat', {
    depot: match || {
      titre: 'Aucune œuvre trouvée',
      hash,
      horodatage: 'Non enregistré',
      email: 'Inconnu',
      type: 'Inconnu',
      fichier: 'N/A'
    }
  });
});

router.get('/historique', (req, res) => {
  const depots = db.get('depots').value();
  res.render('historique', { depots });
});

module.exports = router;