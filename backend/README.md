# Skope Kitchens - Backend

Express.js backend server for the Skope Kitchens Vendor Onboarding Portal.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the server with auto-reload on file changes.

### Production

```bash
npm start
```

The server will run on `http://localhost:5000` (or the port specified in `.env`)

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/skope-kitchens
PORT=5000
JWT_SECRET=your-secret-key-here
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health check

### Authentication (Mock - TODO: Implement)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Vendor Analysis (Mock - TODO: Implement)
- `POST /api/vendors/analyze` - Analyze vendor eligibility

## Database Setup

### MongoDB Connection

The server is configured to connect to MongoDB using Mongoose. Update `MONGODB_URI` in your `.env` file.

### Models (TODO)

Create Mongoose models for:
- User
- Vendor
- AnalysisResult

## Project Structure

```
backend/
├── index.js          # Server entry point
├── package.json      # Dependencies
└── README.md         # This file
```

## Next Steps

1. Create database models in `models/` directory
2. Implement authentication middleware
3. Add route handlers in `routes/` directory
4. Integrate with real LLM service for vendor analysis
5. Add email service for sending analysis reports
6. Implement proper error handling and validation

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

