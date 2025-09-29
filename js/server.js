const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hospital_patient_manager_secret_key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND role = ?',
            [email, role]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Patient routes
app.get('/api/patients', authenticateToken, async (req, res) => {
    try {
        const [patients] = await pool.execute(`
        SELECT id, first_name, last_name, date_of_birth, gender,
        phone, email, address, emergency_contact, created_at
        FROM patients
        ORDER BY created_at DESC
        `);

        const formattedPatients = patients.map(patient => ({
            ...patient,
            age: new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
        }));

        res.json(formattedPatients);
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact } = req.body;

        const [result] = await pool.execute(`
        INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [firstName, lastName, dateOfBirth, gender, phone, email, address, emergencyContact]);

        const [newPatient] = await pool.execute(
            'SELECT * FROM patients WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newPatient[0]);
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Appointment routes
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const [appointments] = await pool.execute(`
        SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users d ON a.doctor_id = d.id AND d.role = 'doctor'
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);

        res.json(appointments);
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { patientId, doctorId, appointmentDate, appointmentTime, notes } = req.body;

        const [result] = await pool.execute(`
        INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, notes, status)
        VALUES (?, ?, ?, ?, ?, 'scheduled')
        `, [patientId, doctorId, appointmentDate, appointmentTime, notes]);

        const [newAppointment] = await pool.execute(`
        SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users d ON a.doctor_id = d.id
        WHERE a.id = ?
        `, [result.insertId]);

        res.status(201).json(newAppointment[0]);
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Medical records routes
app.get('/api/medical-records/:patientId', authenticateToken, async (req, res) => {
    try {
        const { patientId } = req.params;

        const [records] = await pool.execute(`
        SELECT mr.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
        FROM medical_records mr
        JOIN users d ON mr.doctor_id = d.id
        WHERE mr.patient_id = ?
        ORDER BY mr.visit_date DESC
        `, [patientId]);

        res.json(records);
    } catch (error) {
        console.error('Get medical records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/medical-records', authenticateToken, async (req, res) => {
    try {
        const { patientId, doctorId, visitDate, diagnosis, treatment, prescription, notes } = req.body;

        const [result] = await pool.execute(`
        INSERT INTO medical_records (patient_id, doctor_id, visit_date, diagnosis, treatment, prescription, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [patientId, doctorId, visitDate, diagnosis, treatment, prescription, notes]);

        res.status(201).json({ id: result.insertId, message: 'Medical record created successfully' });
    } catch (error) {
        console.error('Create medical record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Billing routes
app.get('/api/billing', authenticateToken, async (req, res) => {
    try {
        const [bills] = await pool.execute(`
        SELECT b.*, p.first_name as patient_first_name, p.last_name as patient_last_name
        FROM billing b
        JOIN patients p ON b.patient_id = p.id
        ORDER BY b.created_at DESC
        `);

        res.json(bills);
    } catch (error) {
        console.error('Get billing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/billing', authenticateToken, async (req, res) => {
    try {
        const { patientId, services, totalAmount, status = 'pending' } = req.body;

        const [result] = await pool.execute(`
        INSERT INTO billing (patient_id, services, total_amount, status)
        VALUES (?, ?, ?, ?)
        `, [patientId, JSON.stringify(services), totalAmount, status]);

        res.status(201).json({ id: result.insertId, message: 'Bill created successfully' });
    } catch (error) {
        console.error('Create bill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [patientCount] = await pool.execute('SELECT COUNT(*) as count FROM patients');
        const [appointmentCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURDATE()'
        );
        const [pendingBills] = await pool.execute(
            'SELECT COUNT(*) as count FROM billing WHERE status = "pending"'
        );
        const [doctorCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = "doctor"'
        );

        res.json({
            totalPatients: patientCount[0].count,
            todayAppointments: appointmentCount[0].count,
            pendingBills: pendingBills[0].count,
            activeDoctors: doctorCount[0].count
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Hospital Patient Manager server running on port ${PORT}`);
});

module.exports = app;
