# HR Digital Consulting Platform

A modern, responsive web application that provides HR professionals and managers with expert guidance on work policies, data security, AI systems, GDPR compliance, and employment law through an intelligent AI-powered consulting interface.

## Features

### 🔐 User Authentication & Profiles
- Secure user registration and login system
- Profile management with role-based information
- Browser-based storage for complete data privacy
- Account deletion and data export capabilities

### 💬 Intelligent Chat Interface
- Real-time chat with AI HR consultant
- Integration with n8n webhook for advanced AI responses
- Conversation history and management
- Mobile-responsive chat interface

### 📄 Document Export
- Export chat conversations to PDF format
- Downloadable consultation reports
- Complete data export in JSON format

### 🎨 Modern UI/UX
- Clean, minimal design with Tailwind CSS
- Responsive layout for all devices
- Smooth animations and transitions
- Accessible interface components

### 🛡️ Privacy & Security
- Local browser storage only
- No server-side data persistence
- User-controlled data management
- GDPR-compliant data handling

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **PDF Generation**: jsPDF with html2canvas
- **Date Handling**: date-fns
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hrdc
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Demo Account

For testing purposes, you can use the following demo credentials:
- **Email**: demo@hrdc.com
- **Password**: demo123

## Deployment

This application is configured for deployment on Netlify:

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy!

The `netlify.toml` file contains all necessary configuration for proper deployment.

## AI Integration

The platform integrates with n8n through a webhook endpoint:
- **Webhook URL**: `https://agents.customcx.com/webhook/HDRC`
- **Method**: POST
- **Payload**: Includes user message, profile, and conversation context

## Supported Consultation Areas

- **GDPR & Data Protection**: Compliance requirements, privacy policies, data handling
- **Employment Law**: Contracts, workplace rights, legal requirements
- **AI Systems**: Governance, ethical implementation, compliance
- **Data Security**: Best practices, breach protocols, security frameworks
- **HR Policies**: Workplace guidelines, procedures, policy development

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions about the HR Digital Consulting platform, please contact the development team or create an issue in the repository.
