const db = require('./db');

async function initDB() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS salles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                capacite INT NOT NULL,
                localisation VARCHAR(100),
                disponible BOOLEAN DEFAULT TRUE
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                salle_id INT NOT NULL,
                date_reservation DATE NOT NULL,
                heure_debut TIME NOT NULL,
                heure_fin TIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (salle_id) REFERENCES salles(id)
            )
        `);

        // Ajouter salles de base si vide
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM salles');
        if (rows[0].count === 0) {
            await db.execute(`
                INSERT INTO salles (nom, capacite, localisation, disponible) VALUES
                ('Salle A-1450', 20, 'Pavillon A, 4ème étage', true),
                ('Salle B-2300', 10, 'Pavillon B, 3ème étage', true),
                ('Salle C-0110', 50, 'Pavillon C, 1er étage', true),
                ('Lab Informatique', 30, 'Pavillon A, 2ème étage', true)
            `);
        }

        console.log('Base de données initialisée !');
    } catch (err) {
        console.log('Erreur init DB:', err.message);
    }
}

module.exports = initDB;