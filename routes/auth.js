const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

router.post('/register', async (req, res) => {
    const { nom, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO users (nom, email, password) VALUES (?, ?, ?)',
            [nom, email, hash]
        );
        res.json({ message: 'Compte créé avec succès !' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Email déjà utilisé ou erreur serveur' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?', [email]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'Utilisateur introuvable' });
        
        const match = await bcrypt.compare(password, rows[0].password);
        if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });

        req.session.user = { id: rows[0].id, nom: rows[0].nom };
        res.json({ message: 'Connecté !', user: req.session.user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Déconnecté !' });
});

module.exports = router;