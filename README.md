# Think Chef 🍳

A full-stack recipe management app built with React, Node.js, PostgreSQL, and OpenAI API, deployed on AWS (EC2, RDS, S3). Features AI-powered recipe generation, secure infrastructure, and modern cloud deployment.

## 🚀 Project Overview
Think Chef lets users discover, add, and manage recipes with a modern UI and secure, scalable backend. The app is production-ready, cost-optimized for AWS Free Tier, and follows best practices for security and deployment. It also features AI-powered recipe generation using OpenAI.

## 🌐 Live Demo
- **Frontend:** (http://think-chef-frontend-2025.s3-website.us-east-2.amazonaws.com)
- **Backend API:** http://52.14.60.162:3000

## 🛠️ Features
- User authentication (Firebase)
- Add, view, and search recipes
- AI-powered recipe generation (OpenAI, HuggingFace)
- Profile management
- Responsive, mobile-friendly UI
- Secure API with PostgreSQL database
- Deployed on AWS (EC2, RDS, S3)

## 📦 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, PostgreSQL
- **Cloud:** AWS EC2, RDS, S3
- **AI:** OpenAI.
- **Other:** PM2, dotenv, Firebase Auth

## 🏁 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/think-chef.git
cd think-chef
```

### 2. Install dependencies
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 3. Set up environment variables
- Copy `.env.production.template` in `backend/` to `.env.production` and fill in your secrets (including OpenAI/HuggingFace keys).
- Copy `.env.production` in `frontend/` and update API/Firebase keys as needed.

### 4. Run locally
**Backend:**
```bash
cd backend
npm run dev
```
**Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Build for production
**Frontend:**
```bash
cd frontend
npm run build
```

## 🏗️ Deployment
The project follows a robust, production-grade AWS deployment pipeline:

1. **Database (RDS PostgreSQL):**
   - Provisioned a PostgreSQL instance on AWS RDS within a private VPC for security
   - Configured security groups, SSL, automated backups, and restricted public access
   - Ran database migrations to set up schema and initial data

2. **Backend (EC2):**
   - Launched an Amazon Linux EC2 instance in the same VPC as RDS
   - Installed Node.js, PM2, and cloned the backend repository
   - Configured environment variables securely (never committed secrets)
   - Deployed the backend API with PM2 for process management and auto-restart
   - Set up CORS, SSL, and health check endpoints for production
   - Opened only necessary ports via security groups

3. **Frontend (S3 Static Hosting):**
   - Built the React frontend for production using Vite
   - Created and configured an S3 bucket for static website hosting
   - Uploaded the frontend build to S3 and set public read policy
   - (Optional) CloudFront CDN and custom domain can be added for HTTPS and global distribution

4. **Integration & Security:**
   - All API calls use environment-based URLs for seamless local/production switching
   - CORS configured to allow only trusted origins (S3/CloudFront)
   - Infrastructure hardened for security and AWS Free Tier cost optimization
   - AI-powered recipe generation enabled via OpenAI APIs

This approach ensures a scalable, secure, and cost-effective deployment suitable for production and demonstration purposes.

## 📄 Documentation


## 🤝 Contributing
Pull requests are welcome! For major changes, open an issue first to discuss what you would like to change.

## 📧 Contact
For questions, open an issue or contact the maintainer.

---

**Deployed with AWS Free Tier: EC2, RDS, S3, and best practices for security, AI integration, and cost optimization.**
