# Experta Frontend

React application for the Experta AI Social Media Manager.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **AWS Amplify** - Authentication with Amazon Cognito
- **Axios** - HTTP client for API communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Update `.env` with your AWS Cognito and API Gateway values:
```
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
VITE_API_BASE_URL=https://your-api-gateway-url
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── chat/         # Chat sidebar components
│   │   └── onboarding/   # Onboarding flow components
│   ├── config/           # Configuration files
│   │   ├── amplify.js    # AWS Amplify configuration
│   │   └── api.js        # API client configuration
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles with Tailwind
├── public/               # Static assets
├── .env.example          # Environment variables template
└── package.json          # Dependencies and scripts
```

## Features

- **Authentication**: Login, signup, and session management with AWS Cognito
- **Dashboard**: Content calendar view with post management
- **Chat Sidebar**: Conversational interface for content adjustments
- **Onboarding**: Interactive brand setup flow
- **Protected Routes**: Automatic redirect for unauthenticated users

## API Integration

The application communicates with the backend API through the configured API client (`src/config/api.js`). All requests automatically include JWT tokens from Cognito for authentication.

## Environment Variables

- `VITE_COGNITO_USER_POOL_ID` - AWS Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID` - AWS Cognito App Client ID
- `VITE_COGNITO_IDENTITY_POOL_ID` - AWS Cognito Identity Pool ID (optional)
- `VITE_API_BASE_URL` - Backend API Gateway URL

## Deployment

The application is designed to be deployed on AWS Amplify. See the main project documentation for deployment instructions.
