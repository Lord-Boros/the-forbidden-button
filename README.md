# Useless Button

A fun, interactive webpage featuring a button you shouldn't click! This project demonstrates creative use of web animations, effects, premium features, and full-stack integration.

## Quick Deployment

The easiest way to deploy this project:

1. **Deploy the Backend (Using Render.com)**

   - Sign up for a free account at [Render](https://render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Fill in these details:
     - Name: `useless-button`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
   - Add your environment variables in the "Environment" section
   - Click "Create Web Service"

2. **Set Up Database (Using MongoDB Atlas)**

   - Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier is fine)
   - Click "Connect" and choose "Connect your application"
   - Copy the connection string
   - Add it as `MONGODB_URI` in your Render.com environment variables

3. **Set Up Stripe (Optional, for premium features)**

   - Sign up at [Stripe](https://stripe.com)
   - Get your API keys from the dashboard
   - Add them to your Render.com environment variables

4. **Update Frontend Configuration**
   - In `index.html`, update the `API_URL` to your Render.com service URL:
     ```javascript
     const API_URL = "https://your-service-name.onrender.com/api";
     ```

Your application will be live at: `https://your-service-name.onrender.com`

## Features

- Interactive button with dynamic effects
- Premium subscription system with Stripe integration
- Achievement system with points and rewards
- User authentication and profiles
- Progressive ad removal system
- Real-time analytics tracking
- Advanced visual effects and animations
- Combo system and power-ups
- Screen-wide effects
- Custom cursor themes
- Milestone tracking

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT
- Payment Processing: Stripe
- Deployment: PM2
- Analytics: Custom implementation

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/useless-button.git
   cd useless-button
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment configuration:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Deployment

1. Ensure you have all required environment variables set up.

2. Run the deployment script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

The deployment script will:

- Install dependencies
- Run tests
- Build frontend assets
- Create database backup
- Start the application using PM2 (production) or nodemon (development)

## Environment Variables

Required environment variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT authentication
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_PRICE_ID`: Stripe price ID for premium subscription

Optional environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `ANALYTICS_ENABLED`: Enable/disable analytics
- `REDIS_URL`: Redis connection string for caching

## API Documentation

### Authentication

- `POST /api/register`: Register new user
- `POST /api/login`: Login user

### User Management

- `GET /api/profile`: Get user profile
- `PUT /api/preferences`: Update user preferences

### Stats & Achievements

- `POST /api/stats`: Update user stats
- `POST /api/check-achievements`: Check and grant achievements
- `GET /api/leaderboard`: Get global leaderboard

### Premium Features

- `POST /api/subscribe`: Create premium subscription
- `GET /api/premium-status`: Check premium status

## Analytics Events

The application tracks various events:

- User registration
- Login sessions
- Button clicks
- Achievement unlocks
- Premium conversions
- Feature usage
- Session duration
- Daily active users

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors
- Inspired by useless web projects
- Built with ❤️ and unnecessary complexity
