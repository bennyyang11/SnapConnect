# SnapConnect 📱
## Share Moments. Disappear. Discover More.

A RAG-powered Snapchat clone built specifically for **fitness influencers**. SnapConnect leverages cutting-edge AI to revolutionize content creation and personalization in the fitness social media space.

## 🚀 Features

### Core Snapchat Functionality
- 📸 Photo/Video capture with disappearing messages
- 📱 Stories and ephemeral content sharing
- 👥 User authentication and friend management
- 💬 Real-time messaging

### 🤖 RAG-Powered AI Features
- **Smart Workout Captions**: AI generates personalized captions based on workout type, user history, and personal brand
- **Motivational Content**: Context-aware motivational posts that align with user's fitness journey
- **Workout Plan Generation**: Personalized workout routines based on experience level and goals
- **Fitness Challenges**: Community-engaging challenges tailored to user interests
- **Trend-Aware Suggestions**: Content recommendations based on current fitness trends

### 🎯 Target User: Fitness Influencers
- Content creators building personal brands in fitness
- AI-assisted content that matches personal tone and focus areas
- Engagement optimization through data-driven suggestions
- Seamless integration of fitness knowledge base

## 🛠 Tech Stack

### Frontend
- **React Native** with Expo for cross-platform development
- **TypeScript** for type safety
- **NativeWind** (TailwindCSS) for styling
- **React Navigation** for navigation
- **Zustand** for state management

### Backend & AI
- **Firebase** for authentication, database, and storage
- **OpenAI GPT-4** for RAG-powered content generation
- **Firestore** for user data and content storage
- **Firebase Storage** for media files

## 📋 Prerequisites

- Node.js 18+ (current version has compatibility issues with Node 16)
- iOS Simulator (for iOS development)
- Android Emulator (for Android development)
- Firebase account
- OpenAI API key

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd SnapConnect
npm install
```

### 2. Configure Firebase
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Enable Storage
5. Copy your Firebase configuration
6. Update `src/services/firebase.ts` with your Firebase config

### 3. Configure OpenAI
1. Get your OpenAI API key from https://platform.openai.com
2. Update `src/services/openai.ts` with your API key

### 4. Run the App
```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## 🏗 Project Structure

```
SnapConnect/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   └── main/           # Main app screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # External service integrations
│   │   ├── firebase.ts     # Firebase configuration
│   │   └── openai.ts       # OpenAI RAG service
│   ├── store/              # State management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Static assets
└── docs/                   # Documentation
```

## 🎯 RAG Implementation

Our RAG (Retrieval-Augmented Generation) system works by:

1. **Context Building**: Gathering user's fitness profile, workout history, and social interactions
2. **Knowledge Retrieval**: Accessing fitness-specific knowledge base and trending topics
3. **Personalized Generation**: Using OpenAI GPT-4 to create content that matches user's:
   - Personal brand tone (motivational, educational, casual, professional)
   - Focus areas (strength, nutrition, mindset)
   - Recent activity and workout history
   - Audience engagement patterns

### RAG Features Demonstrated

#### 1. Smart Workout Caption Generation
```typescript
// Generates captions like:
"Just crushed another leg day! 💪 Remember, progress isn't always visible in the mirror, but your body is getting stronger with every rep. Today's focus: building that mind-muscle connection and pushing past comfort zones. What's your favorite way to challenge yourself in the gym? #LegDay #StrengthTraining #FitnessMotivation #GymLife #ProgressNotPerfection"
```

#### 2. Motivational Content Creation
```typescript
// Creates personalized motivation based on user journey:
"We all have those days when the gym feels impossible, when motivation is nowhere to be found. But here's the truth: discipline beats motivation every time. Your body doesn't know you're tired - it only knows what you teach it. Every workout completed is proof that you're stronger than your excuses. Keep showing up, even when you don't feel like it. That's where real transformation happens. #Motivation #FitnessJourney #DisciplineOverMotivation"
```

#### 3. Workout Plan Suggestions
```typescript
// Generates structured workout plans:
"Muscle Building - Intermediate Level
1. Barbell Squats: 4 sets x 8-10 reps
2. Romanian Deadlifts: 3 sets x 10-12 reps  
3. Bulgarian Split Squats: 3 sets x 12 reps each leg
4. Hip Thrusts: 3 sets x 15 reps
5. Walking Lunges: 3 sets x 20 steps
6. Calf Raises: 4 sets x 15-20 reps
💡 Focus on controlled movement and mind-muscle connection
🔄 Rest 60-90 seconds between sets"
```

## 📊 Success Metrics

### Core Functionality
- ✅ Complete authentication flow
- ✅ Navigation between main screens
- ✅ RAG-powered content generation
- ✅ State management with Zustand
- ✅ Firebase integration ready

### RAG Quality Metrics
- **Relevance Score**: Generated content relevance to user interests (0-1)
- **Engagement Estimation**: Predicted engagement based on content analysis
- **Brand Alignment**: How well content matches user's personal brand tone
- **Trend Integration**: Incorporation of current fitness trends

## 🔧 Configuration Files

### Key Files to Configure:
1. `src/services/firebase.ts` - Add your Firebase config
2. `src/services/openai.ts` - Add your OpenAI API key
3. `app.json` - Update app metadata as needed

## 🎨 Design System

### Color Palette
- **Primary**: `#FFDD3A` (Snapchat Yellow)
- **Dark Background**: `#0D0D0F`
- **Secondary Dark**: `#161618`
- **Accent**: `#424242`
- **Text**: `#FFFFFF` / `#9E9E9E`

### Typography
- Headers: Bold, high contrast
- Body: Regular weight, good readability
- Captions: Light weight, muted colors

## 🚀 Deployment

The app is ready for deployment to:
- **Expo**: `expo publish`
- **iOS App Store**: Build with EAS
- **Google Play Store**: Build with EAS
- **Web**: `npm run web`

## 🤖 AI Integration Details

### OpenAI Configuration
- Model: GPT-4 for high-quality content generation
- Temperature: Varies by content type (0.6-0.8)
- Max Tokens: 150-300 depending on content type
- System prompts optimized for fitness content

### Knowledge Base
- Workout types and exercises
- Fitness motivational phrases
- Trending hashtags and topics
- Nutrition tips and advice

## 🔄 Next Steps

1. **Camera Integration**: Implement actual camera functionality with expo-camera
2. **Real-time Features**: Add Firebase Realtime Database for messaging
3. **AR Filters**: Integrate workout-specific AR effects
4. **Push Notifications**: Implement engagement notifications
5. **Analytics**: Add user behavior tracking
6. **Content Moderation**: Implement AI-powered content filtering

## 📈 Growth Strategy

- Target fitness influencers with 1K-100K followers
- Focus on content quality and engagement improvement
- Leverage AI features as key differentiator
- Build community around fitness challenges

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your feature
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for the fitness community**

*Revolutionizing fitness content creation through AI-powered personalization*

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# OpenAI API Key (required for AI features)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Remove.bg API Key (optional - for automatic background removal of AI stickers)
EXPO_PUBLIC_REMOVEBG_API_KEY=your_removebg_api_key_here
```

### Setting up Remove.bg API (Optional)

To enable automatic background removal for AI-generated stickers:

1. Sign up at [Remove.bg](https://www.remove.bg/api)
2. Get your free API key (50 free API calls per month)
3. Add it to your `.env` file as `EXPO_PUBLIC_REMOVEBG_API_KEY`

**Benefits:**
- Eliminates checkered background patterns on AI stickers
- Creates clean, transparent stickers automatically
- Better integration with photo editing

**Note:** If you don't set up Remove.bg, the app will still work but AI stickers may have solid backgrounds instead of transparent ones.

## 🎨 Enhanced AI Image Generation

SnapConnect now features **Advanced AI Sticker Generation** with multiple model support and sophisticated prompt engineering:

### **🤖 Multiple AI Models**
- **DALL-E 3** - Latest OpenAI model with best prompt understanding
- **DALL-E 2** - Reliable model with fast generation  
- **Stable Diffusion XL** - Open-source model with artistic styles (coming soon)

### **🧠 Advanced Prompt Engineering**
- **Context-Aware Prompts** - Automatically analyzes your photo context
- **Fitness-Themed Enhancements** - Optimized for fitness content
- **Technical Specifications** - Professional camera terms and lighting
- **Style Optimization** - Trending artistic styles and compositions

### **✨ Key Features**
- **Smart Fallback System** - Automatically tries alternative models if primary fails
- **Background Removal** - Automatic transparency using Remove.bg API
- **Image Upscaling** - Optional quality enhancement (configurable)
- **Model Selection UI** - Choose your preferred AI model
- **Real-time Feedback** - See which model generated your sticker

### **🔧 Technical Enhancements**
- **HD Quality** - DALL-E 3 generates 1024x1024 HD images
- **Vivid Style** - More dynamic and colorful results
- **Professional Lighting** - Studio-quality lighting specifications
- **Clean Edges** - Optimized for perfect sticker cutouts

### **🎯 Prompt Engineering Features**
- **Contextual Analysis** - Detects objects, characters, and abstract elements
- **Dynamic Enhancement** - Adds appropriate technical specifications
- **Fitness Context** - Incorporates gym/workout environment awareness
- **Artistic Flair** - "Trending on ArtStation" style improvements 