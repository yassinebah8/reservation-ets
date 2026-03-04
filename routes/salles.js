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
        // Validation heures entre 6h et 24h
        const debut = parseInt(heure_debut.split(':')[0]);
        const fin = parseInt(heure_fin.split(':')[0]);

        if (debut < 6 || fin > 24) {
            return res.status(400).json({ error: 'Réservation possible entre 6h et 24h seulement' });
        }

        if (fin <= debut) {
            return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
        }

        // Validation 4h max
        const duree = fin - debut;
        if (duree > 4) {
            return res.status(400).json({ error: 'Maximum 4 heures par réservation' });
        }

        // Vérifier limite 4h par jour pour cet utilisateur
        // Vérifier limite 4h par jour pour cet utilisateur
         const [reservationsDuJour] = await db.execute(
            `SELECT heure_debut, heure_fin FROM reservations 
             WHERE user_id = ? AND date_reservation = ?`,
            [user_id, date_reservation]
        );

         let totalMinutes = 0;
         reservationsDuJour.forEach(r => {
         const [dh, dm] = r.heure_debut.split(':').map(Number);
         const [fh, fm] = r.heure_fin.split(':').map(Number);
         totalMinutes += (fh * 60 + fm) - (dh * 60 + dm);
         });

        const dureeMinutes = (fin * 60) - (debut * 60);

        if (totalMinutes + dureeMinutes > 240) {
           const restantes = Math.floor((240 - totalMinutes) / 60);
           return res.status(400).json({ 
           error: `Limite de 4h par jour atteinte (${restantes}h restantes)` 
          });
        }

        // Vérifier conflit
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

router.get('/heures-prises', async (req, res) => {
    const { salle_id, date } = req.query;
    try {
        const [rows] = await db.execute(
            `SELECT heure_debut, heure_fin FROM reservations 
             WHERE salle_id = ? AND date_reservation = ?`,
            [salle_id, date]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;