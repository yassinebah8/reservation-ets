const express = require('express');
const session = require('express-session');
require('dotenv').config();

const app = express();

app.use(express.static('public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'reservation_ets_secret',
    resave: false,
    saveUninitialized: false
}));

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const sallesRoutes = require('./routes/salles');
app.use('/salles', sallesRoutes);

app.get('/', (req, res) => {
    res.send('Serveur opérationnel !');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
