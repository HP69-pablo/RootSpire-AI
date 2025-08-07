# Plant Care App

## Overview

This is a premium mobile-first plant care application built with a full-stack architecture featuring React frontend, Express backend, and Firebase integration. The app provides intelligent plant monitoring, care guidance, and growth tracking with a modern, cinematic UI inspired by Apple apps, Spotify, and Duolingo. The application emphasizes emotional connection to plants through rewarding interactions and high-end design quality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool for fast development and optimized production builds
- **TailwindCSS** with custom design system featuring light/dark modes and premium animations
- **Framer Motion** for smooth, cinematic animations and micro-interactions
- **Radix UI** components for accessible, customizable UI primitives
- **React Query** for efficient data fetching, caching, and synchronization
- **Wouter** for lightweight client-side routing

### UI/UX Design System
- **Dual Theme Support**: Light mode with soft greens, beiges, and pastels; Dark mode with deep greens and black backgrounds
- **Mobile-First Design**: Responsive components optimized for touch interactions
- **Floating Navigation**: Bottom navigation bar with bounce animations and swipe gestures
- **Glassmorphism Effects**: Backdrop blur and transparency for modern visual depth
- **Component Architecture**: Modular design with reusable UI components and consistent spacing

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints and middleware
- **Drizzle ORM** with PostgreSQL for type-safe database operations
- **In-memory storage** with interface-based design allowing easy database swapping
- **RESTful API** design with proper error handling and validation
- **Static file serving** for production builds

### Data Storage Solutions
- **PostgreSQL** as the primary database via Drizzle ORM
- **Firebase Realtime Database** for real-time sensor data and plant monitoring
- **Firebase Storage** for plant photos and growth images
- **Local Storage** for user preferences and dashboard widget arrangements

### Authentication and Authorization
- **Firebase Authentication** with multiple sign-in methods:
  - Google OAuth integration
  - Email/password authentication
  - Password reset functionality
- **User profiles** with expertise levels (beginner, intermediate, advanced, expert)
- **Role-based access** to plant care features and recommendations

### Real-time Features
- **Live sensor monitoring** with temperature, humidity, and light sensors
- **Automated data collection** every 5 seconds for high-resolution graphs
- **Real-time plant health alerts** and watering reminders
- **Growth event tracking** with photo uploads and measurements

### AI Integration
- **Google Gemini AI** for plant identification, care advice, and photo analysis
- **Contextual chat assistance** with plant care expertise
- **Environment optimization** recommendations based on plant types
- **Plant photo analysis** for health assessment and species identification

## External Dependencies

### Core Services
- **Firebase** (Authentication, Realtime Database, Storage)
- **Google Gemini AI** for plant care assistance and photo analysis
- **Neon Database** for PostgreSQL hosting
- **SendGrid** for email notifications

### Development Tools
- **Drizzle Kit** for database migrations and schema management
- **ESBuild** for server-side bundling
- **PostCSS** with Autoprefixer for CSS processing

### UI Libraries
- **Radix UI** component library for accessible primitives
- **Recharts** for data visualization and growth tracking
- **React Hook Form** with Zod validation for form handling
- **Lucide React** for consistent iconography

### Monitoring and Analytics
- **Real-time sensor data collection** with automatic logging
- **Growth timeline tracking** with photo evidence
- **Environmental condition monitoring** with threshold alerts
- **Plant health metrics** and care history

### Third-party Integrations
- **Anthropic SDK** for additional AI capabilities
- **React Beautiful DND** for dashboard widget customization
- **CMDK** for command palette functionality
- **Class Variance Authority** for component styling patterns