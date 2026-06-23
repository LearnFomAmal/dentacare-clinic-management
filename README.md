# DentaCare - Clinic Management System

DentaCare is a full-stack dental clinic management application built using the MERN stack. The project includes separate dashboards and workflows for patients, doctors, and admins.

## Project Overview

DentaCare helps manage the core operations of a dental clinic, including patient authentication, doctor management, appointment booking, slot management, payments, coupons, referrals, reports, reviews, banners, notifications, and role-based dashboards.

## Features

### Patient Features

* Patient registration and login
* OTP verification
* Google login support
* View doctors and specialties
* Book appointments based on available doctor slots
* Apply coupons and referral rewards
* View appointment history
* Upload and manage appointment-related reports
* Cancel or reschedule appointments where allowed
* View payment and refund status
* Submit reviews for doctors

### Doctor Features

* Doctor login
* View assigned appointments
* Approve or reject appointment requests
* Manage availability and slots
* View patient appointment details
* View reports attached to appointments
* Track appointment status

### Admin Features

* Admin login
* Manage doctors
* Manage specialties
* Manage coupons
* Manage banners
* View and manage appointments
* Approve or reject records where required
* Monitor users, payments, reviews, and platform activity

## Tech Stack

### Frontend

* React
* Vite
* Redux Toolkit
* React Router
* React Hook Form
* Tailwind CSS
* Axios
* React Hot Toast

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* HTTP-only Cookies
* Nodemailer
* Cloudinary
* Razorpay Integration

### Database

* MongoDB Atlas

## Project Structure

```txt
dentacare-clinic-management
├── backend
│   ├── app.js
│   ├── server.js
│   ├── config
│   ├── middlewares
│   ├── modules
│   ├── utils
│   └── package.json
│
├── frontend
│   ├── src
│   ├── public
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Environment Variables

Create separate `.env` files for frontend and backend.

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Backend `.env`

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

FRONTEND_URL=http://localhost:5173

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Installation and Setup

### Clone the repository

```bash
git clone <repository-url>
cd dentacare-clinic-management
```

### Backend setup

```bash
cd backend
npm install
npm run dev
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Running the Project Locally

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:5000
```

API base URL:

```txt
http://localhost:5000/api/v1
```

## Deployment Notes

The project can be deployed on an AWS EC2 instance.

Basic deployment setup:

```txt
Frontend: React build served on EC2
Backend: Express API running with PM2
Database: MongoDB Atlas
Image Storage: Cloudinary
Payment Gateway: Razorpay
```

For a simple first deployment without a domain, the frontend and backend can be run on separate ports using the EC2 public IP.

Example:

```txt
Frontend: http://EC2_PUBLIC_IP:3000
Backend: http://EC2_PUBLIC_IP:5000/api/v1
```

## Current Status

This project is under active development as part of a MERN stack learning and full-stack development portfolio project.

## Author

Amal Anilkumar
