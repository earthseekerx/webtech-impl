# Hospital Patient Manager - Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Web browser (Chrome, Firefox, Safari, Edge)

## Installation Steps

### 1. Clone or Download Project
- git clone <repository-url>
- cd hospital-patient-manager

### 2. Install Dependencies
- npm install

### 3. Database Setup
1. Create MySQL database:
- CREATE DATABASE hospital_management;

2. Import database schema:
- mysql -u root -p hospital_management < database/schema.sql

### 4. Environment Configuration
Create `.env` file in root directory:
- DB_HOST=localhost
- DB_USER=root
- DB_PASSWORD=your_mysql_password
- DB_NAME=hospital_management
- JWT_SECRET=your_jwt_secret_key
- PORT=3000

### 5. Start Application
Development mode
- npm run dev

Production mode
- npm start

### 6. Access Application
Open browser and navigate to: `http://localhost:3000`

## Default Login Credentials

### Administrator
- Email: admin@hospital.com
- Password: admin123
- Role: Administrator

### Doctor
- Email: dr.smith@hospital.com
- Password: doctor123
- Role: Doctor

### Staff
- Email: alice@hospital.com
- Password: staff123
- Role: Hospital Staff

## Features Overview

### Patient Management
- Patient registration with complete profile
- Search and filter patients
- Medical history tracking
- Emergency contact management

### Appointment System
- Schedule appointments with doctors
- View appointment calendar
- Appointment status tracking
- Automated notifications

### Medical Records
- Electronic Medical Records (EMR)
- Prescription management
- Medical history documentation
- Doctor notes and observations

### Billing System
- Service billing and invoicing
- Payment tracking
- Insurance management
- Financial reporting

### Dashboard Analytics
- Patient statistics
- Appointment metrics
- Billing summaries
- Performance indicators

## Security Features
- JWT-based authentication
- Role-based access control
- Password encryption
- SQL injection protection
- XSS protection

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Support
For technical support or questions, contact the development team.
