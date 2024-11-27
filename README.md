# Metta Voice 🌿

A modern meditation app combining traditional Buddhist suttas with accessibility-focused features. Built and maintained by [Betmig](https://github.com/betmig) from [MettaBit](https://mettabit.io).

## Features

### 📖 Sutta Reader
- Authentic Buddhist teachings from dhammatalks.org
- Natural text-to-speech with synchronized highlighting
- Smart phrase detection for natural reading flow
- Random sutta selection from curated collection
- Auto-scrolling text follows the reading
- Full mobile support with native voice synthesis

### ⏲️ Meditation Timer
- Customizable duration with hours, minutes, and seconds
- Multiple bell sound options:
  - Tibetan Bowl
  - Zen Bell
  - Meditation Bell
  - Temple Bell
- Configurable start/end meditation bells
- Auto-start option after sutta reading
- Volume control for bell sounds

### 🎯 Accessibility First
- High contrast theme options (Light/Dark)
- Adjustable text highlighting
- Customizable display settings:
  - Brightness (0-100%)
  - Contrast (0-100%)
  - Sepia (0-100%)
  - Grayscale (0-100%)
- OpenDyslexic font support
- Screen reader friendly
- Responsive design for all devices

### 🗣️ Text-to-Speech Options
- Browser-native TTS with voice selection
- Mobile-optimized voice synthesis
- Multiple TTS providers support:
  - Browser native TTS
  - Eleven Labs
  - OpenAI TTS
  - Microsoft Azure
  - Amazon Polly
  - WellSaid Labs

## Quick Start

```bash
# Clone the repository
git clone https://github.com/betmig/metta-voice.git

# Install dependencies
cd metta-voice
npm install

# Build the project
npx vite build

# Start development server
npm run dev

# Build for production
npm run build
```

## Retrieve API Keys

- **ElevenLabs:**
  - Sign up or log in at [elevenlabs.io](https://beta.elevenlabs.io/).
  - Go to Profile > API Keys to generate or view your key.

- **Amazon Polly:**
  - Sign into AWS, navigate to IAM > Users > Create User with Polly permissions.
  - View or create Access Keys for API access.

- **Azure Voice:**
  - Create a Speech resource in Azure.
  - Go to Keys and Endpoint to retrieve your API keys.

- **OpenAI Voice:**
  - Check [openai.com](https://www.openai.com/) for voice API availability.
  - If available, follow their documentation for key retrieval.

- **WellSaid Voices:**
  - Sign up or log in at [wellsaidlabs.com](https://wellsaidlabs.com/).
  - Navigate to Account Settings for your API key.

**Warning:** 🚨 **Do not share your API keys with anyone.** 🚨 Keep them secret and secure.

**Note:** Use environment variables or secure storage methods for key management. Always check the latest documentation for changes in API access or usage guidelines.

## Technology Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Vite as build tool
- Web Speech API
- Multiple TTS provider integrations

## Configuration

### Text-to-Speech

1. Navigate to Settings
2. Select your preferred TTS provider
3. Enter API credentials if using premium providers
4. Choose your preferred voice
5. Test with preview feature

### Display Settings

- Choose between light/dark theme
- Adjust brightness, contrast, sepia, and grayscale
- Customize text highlight color and opacity
- Changes apply in real-time

### Meditation Settings

- Set custom meditation duration
- Choose preferred bell sounds
- Configure bell timing (start/end)
- Enable/disable auto-start after sutta reading

## Privacy

Metta Voice respects your privacy:
- All data stored locally in browser storage
- No analytics or tracking
- No personal information collected
- TTS API keys stored securely in local storage
- No server-side data collection

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). This means:

- You can freely use, modify, and distribute this software
- Modified versions must:
  - Use the same license
  - Make source code available
  - Preserve copyright notices

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Buddhist texts sourced from dhammatalks.org
- Bell sounds recorded at various temples
- Icons provided by Lucide React
- UI components styled with Tailwind CSS
- TTS capabilities powered by various providers

## Recent Updates

- Added mobile-optimized voice synthesis
- Improved text chunking for natural reading
- Enhanced synchronized highlighting
- Added auto-scrolling during reading
- Improved accessibility settings
- Added support for multiple bell sounds
- Implemented in-memory sutta database

---

Made with ❤️ by [betmig](https://github.com/betmig)