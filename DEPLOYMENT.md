# Deployment Guide - HR Digital Consulting Platform

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

3. **Build for Production**
   ```bash
   npm run build
   ```

## Netlify Deployment

### Option 1: Drag & Drop Deployment
1. Run `npm run build`
2. Go to [Netlify](https://netlify.com)
3. Drag the `dist` folder to the deployment area
4. Your site will be live!

### Option 2: Git Integration
1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Deploy!

### Environment Configuration
The application is configured with:
- **Framework**: React (Vite)
- **Node Version**: 18+
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

## Features Verification Checklist

### ✅ User Authentication
- [x] User registration with profile creation
- [x] Secure login system
- [x] Browser storage for data persistence
- [x] Profile management and updates

### ✅ Chat Interface
- [x] Real-time chat with AI consultant
- [x] n8n webhook integration (`https://agents.customcx.com/webhook/HDRC`)
- [x] Conversation history management
- [x] Mobile-responsive design

### ✅ Data Management
- [x] Export conversations to PDF
- [x] Export all user data to JSON
- [x] Delete individual conversations
- [x] Clear all chat history
- [x] Complete account deletion

### ✅ UI/UX Features
- [x] Modern, minimal design
- [x] Responsive layout for all devices
- [x] Smooth animations and transitions
- [x] Accessible interface components
- [x] Loading states and error handling

### ✅ Privacy & Security
- [x] Local browser storage only
- [x] No server-side data persistence
- [x] User-controlled data management
- [x] GDPR-compliant data handling

## Demo Account

For testing purposes:
- **Email**: demo@hrdc.com
- **Password**: demo123

The demo account includes sample conversations to showcase the platform's capabilities.

## Webhook Integration

The platform sends POST requests to your n8n webhook with the following payload:

```json
{
  "message": "User's question",
  "userId": "unique-user-id",
  "conversationId": "conversation-id",
  "userProfile": {
    "name": "User Name",
    "email": "user@example.com",
    "company": "Company Name",
    "role": "User Role"
  }
}
```

Expected response format:
```json
{
  "message": "AI response text",
  "response": "Alternative response field"
}
```

## Troubleshooting

### Build Issues
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for any missing dependencies

### Deployment Issues
- Verify `netlify.toml` configuration
- Check build logs for errors
- Ensure all environment variables are set

### Webhook Issues
- Verify webhook URL is accessible
- Check CORS settings on your n8n instance
- Test webhook endpoint independently

## Support

For technical support or questions:
1. Check the README.md for detailed documentation
2. Review the troubleshooting section above
3. Contact the development team

## Performance Optimization

The application includes:
- Code splitting for optimal loading
- Lazy loading of components
- Optimized bundle sizes
- Efficient state management
- Responsive image handling

## Browser Compatibility

Tested and supported on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)
