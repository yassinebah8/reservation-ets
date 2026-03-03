const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware pour vérifier si l'utilisateur est connecté
const authRequired = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Vous devez être connecté' });
    }
    next();
};

// Voir toutes les salles disponibles
router.get('/', async (req, res) => {
    try {
        const [salles] = await db.execute(
            'SELECT * FROM salles WHERE disponible = true'
        );
        res.json(salles);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Faire une réservation
router.post('/reserver', authRequired, async (req, res) => {
    const { salle_id, date_reservation, heure_debut, heure_fin } = req.body;
    const user_id = req.session.user.id;
    try {
        // Vérifier si la salle est déjà réservée à cette heure
        const [conflict] = await db.execute(
            `SELECT * FROM reservations 
             WHERE salle_id = ? AND date_reservation = ?
             AND NOT (heure_fin <= ? OR heure_debut >= ?)`,
            [salle_id, date_reservation, heure_debut, heure_fin]
        );

        if (conflict.length > 0) {
            return res.status(409).json({ error: 'Salle déjà réservée à cette heure' });
        }

        await db.execute(
            `INSERT INTO reservations 
             (user_id, salle_id, date_reservation, heure_debut, heure_fin) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, salle_id, date_reservation, heure_debut, heure_fin]
        );

        res.json({ message: 'Réservation créée avec succès !' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Voir ses réservations
router.get('/mes-reservations', authRequired, async (req, res) => {
    const user_id = req.session.user.id;
    try {
        const [reservations] = await db.execute(
            `SELECT r.*, s.nom as salle_nom, s.localisation 
             FROM reservations r
             JOIN salles s ON r.salle_id = s.id
             WHERE r.user_id = ?
             ORDER BY r.date_reservation, r.heure_debut`,
            [user_id]
        );
        res.json(reservations);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Annuler une réservation
router.delete('/annuler/:id', authRequired, async (req, res) => {
    const user_id = req.session.user.id;
    const reservation_id = req.params.id;
    try {
        const [result] = await db.execute(
            'DELETE FROM reservations WHERE id = ? AND user_id = ?',
            [reservation_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Réservation introuvable' });
        }

        res.json({ message: 'Réservation annulée !' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;