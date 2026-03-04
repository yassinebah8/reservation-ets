// ===== AUTH =====

function toggleForm() {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    login.style.display = login.style.display === 'none' ? 'block' : 'none';
    register.style.display = register.style.display === 'none' ? 'block' : 'none';
    hideMessage();
}

function showMessage(text, type) {
    const msg = document.getElementById('message') || document.getElementById('modalMessage');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
}

function hideMessage() {
    const msg = document.getElementById('message');
    if (msg) msg.style.display = 'none';
}

async function register() {
    const nom = document.getElementById('registerNom').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, password })
    });

    const data = await res.json();
    if (res.ok) {
        showMessage('Compte créé ! Connectez-vous.', 'success');
        toggleForm();
    } else {
        showMessage(data.error, 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/salles.html';
    } else {
        showMessage(data.error, 'error');
    }
}

async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    window.location.href = '/';
}

// ===== SALLES =====

let salleSelectionnee = null;

async function chargerSalles() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { window.location.href = '/'; return; }

    document.getElementById('userNom').textContent = '👤 ' + user.nom;

    const res = await fetch('/salles');
    const salles = await res.json();

    const grid = document.getElementById('sallesGrid');
    grid.innerHTML = '';

    salles.forEach(salle => {
        grid.innerHTML += `
            <div class="salle-card">
                <h3>${salle.nom}</h3>
                <p>📍 ${salle.localisation}</p>
                <p>👥 Capacité : ${salle.capacite} personnes</p>
                <button onclick="ouvrirModal(${salle.id})">Réserver</button>
            </div>
        `;
    });
}

function ouvrirModal(salleId) {
    salleSelectionnee = salleId;
    document.getElementById('modal').classList.add('active');
}

function fermerModal() {
    document.getElementById('modal').classList.remove('active');
    salleSelectionnee = null;
}

async function confirmerReservation() {
    const date = document.getElementById('dateReservation').value;
    const debut = document.getElementById('heureDebut').value;
    const fin = document.getElementById('heureFin').value;

    if (!date || !debut || !fin) {
        document.getElementById('modalMessage').textContent = 'Remplis tous les champs !';
        document.getElementById('modalMessage').className = 'message error';
        document.getElementById('modalMessage').style.display = 'block';
        return;
    }

    const res = await fetch('/salles/reserver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            salle_id: salleSelectionnee,
            date_reservation: date,
            heure_debut: debut + ':00',
            heure_fin: fin + ':00'
        })
    });

    const data = await res.json();
    const msgEl = document.getElementById('modalMessage');
    msgEl.style.display = 'block';

    if (res.ok) {
        msgEl.textContent = '✅ Réservation créée !';
        msgEl.className = 'message success';
        setTimeout(() => fermerModal(), 1500);
    } else {
        msgEl.textContent = data.error;
        msgEl.className = 'message error';
    }
}

// ===== RESERVATIONS =====

async function voirReservations() {
    const res = await fetch('/salles/mes-reservations');
    const reservations = await res.json();

    const list = document.getElementById('reservationsList');

    if (reservations.length === 0) {
        list.innerHTML = '<p>Aucune réservation.</p>';
    } else {
        list.innerHTML = reservations.map(r => `
            <div class="reservation-card">
                <div>
                    <h3>${r.salle_nom}</h3>
                    <p>📍 ${r.localisation}</p>
                    <p>📅 ${r.date_reservation.substring(0, 10)} | 
                       🕐 ${r.heure_debut} - ${r.heure_fin}</p>
                </div>
                <button class="btn-annuler" onclick="annulerReservation(${r.id})">Annuler</button>
            </div>
        `).join('');
    }

    document.getElementById('modalReservations').classList.add('active');
}

function fermerModalReservations() {
    document.getElementById('modalReservations').classList.remove('active');
}

async function annulerReservation(id) {
    const res = await fetch(`/salles/annuler/${id}`, { method: 'DELETE' });
    if (res.ok) {
        voirReservations();
    }
}

// Charger les salles si on est sur la page salles
if (document.getElementById('sallesGrid')) {
    chargerSalles();
}