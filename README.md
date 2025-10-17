# Repacked - Modern Marketplace

A beautiful, modern resale marketplace built with Next.js, Supabase, and a stunning frosted glass UI design.

## Features

- 🎨 **Frosted Glass UI**: Beautiful semi-transparent glass morphism design
- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📝 **Post Creation**: Create and manage resale posts with rich metadata
- 🏷️ **Tagging System**: Organize posts with customizable tags
- 🔍 **Search & Filter**: Advanced search and filtering capabilities
- 🛒 **Shopping Cart**: Add items to basket and manage purchases
- 👤 **User Management**: My Posts page for managing your listings
- 📱 **Responsive Design**: Works perfectly on all devices
- ⚡ **Real-time Updates**: Live data synchronization with Supabase

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom frosted glass components
- **Backend**: Supabase (Database, Auth, Real-time)
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, pnpm or bun
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd repacked
npm install
```

### 2. Environment Setup

**IMPORTANT**: Create a `.env` file in the root directory and paste the environment variables that were shared in Discord. This file contains your Supabase credentials and should never be committed to version control.

```bash
# Create the environment file
Create .env
or
touch .env
```

Then paste the environment variables from the Discord message into this file.

### 3. Set up Database

The database schema is already configured. The project includes:

- `profiles` table for user profiles
- `posts` table for resale posts  
- `tags` table for post tags
- `post_tags` junction table
- `storage.buckets` for image uploads
- Row Level Security policies
- Triggers for user signup

### 4. Configure Authentication

Authentication is already configured, but you may need to update the site URL in your Supabase dashboard:

1. Go to Authentication > Settings
2. Add your domain to "Site URL" (e.g., `http://localhost:3000` for development)
3. Add redirect URLs for authentication if needed

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── upload/       # Image upload endpoints
│   ├── my-posts/         # User's posts management page
│   ├── post/[id]/        # Individual post page
│   ├── search/           # Search page
│   ├── globals.css       # Global styles with frosted glass theme
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── auth/             # Authentication components
│   │   ├── AuthModal.tsx # Sign in/up modal
│   │   └── UserMenu.tsx  # User dropdown menu
│   ├── basket/           # Shopping cart components
│   │   └── BasketModal.tsx # Cart modal
│   ├── layout/           # Layout components
│   │   └── Header.tsx    # Main header
│   ├── posts/            # Post-related components
│   │   ├── CreatePostModal.tsx # Post creation form
│   │   ├── EditPostModal.tsx   # Post editing modal
│   │   ├── PostCard.tsx        # Individual post display
│   │   ├── PostList.tsx        # Posts listing with search/filter
│   │   └── SearchPostList.tsx  # Search results
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
│       ├── GlassButton.tsx    # Frosted glass button
│       ├── GlassCard.tsx      # Frosted glass card
│       ├── GlassInput.tsx     # Frosted glass input
│       ├── GlassTextarea.tsx  # Frosted glass textarea
│       ├── ImageUpload.tsx    # Image upload component
│       └── ThemeSelector.tsx   # Theme switcher
├── contexts/             # React contexts
│   ├── BasketContext.tsx     # Shopping cart state
│   ├── SearchContext.tsx     # Search state
│   └── ThemeContext.tsx      # Theme state
└── lib/                  # Utility libraries
    ├── supabase.ts           # Supabase client
    ├── supabase-client.ts    # Browser client
    ├── supabase-server.ts    # Server client
    └── supabase-storage.ts   # Storage utilities
```

## Key Features Explained

### Frosted Glass Design

The app uses a custom frosted glass design system with:
- Semi-transparent backgrounds with backdrop blur
- Subtle borders and shadows
- Smooth hover animations
- Consistent color scheme

### Authentication Flow

1. Users can sign up with email/password
2. Profile is automatically created on signup
3. User menu provides access to account features
4. Secure session management with Supabase

### Post Management

- Rich post creation with title, description, price, condition, location
- Tagging system with predefined categories
- Image upload and management with Supabase Storage
- Edit and delete posts from "My Posts" page
- Search and filtering capabilities
- Real-time updates
- Shopping cart functionality

### Database Schema

The database includes:
- User profiles with username and full name
- Posts with comprehensive metadata (title, description, price, condition, category, location, images)
- Tags with custom colors
- Many-to-many relationship between posts and tags
- Supabase Storage bucket for image uploads
- Row Level Security for data protection
- Shopping cart functionality (client-side state)

## Customization

### Adding New Tags

Tags are managed in the database. You can add new tags by inserting into the `tags` table:

```sql
INSERT INTO tags (name, color) VALUES ('New Category', '#FF6B6B');
```

### Styling Customization

The frosted glass effect can be customized in `src/app/globals.css`:

```css
/* Adjust blur intensity */
backdrop-blur-md /* or backdrop-blur-sm, backdrop-blur-lg */

/* Adjust transparency */
bg-white/10 /* 10% opacity */
bg-white/20 /* 20% opacity */
```

### Adding New Post Fields

1. Update the database schema in Supabase dashboard
2. Modify the `CreatePostModal.tsx` and `EditPostModal.tsx` components
3. Update the `PostCard.tsx` display component
4. Adjust the `PostList.tsx` query
5. Update TypeScript interfaces

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own marketplace!

## Support

If you encounter any issues:
1. **Check your `.env` file** - Make sure you've created it with the environment variables from Discord
2. Check the Supabase dashboard for database/auth issues
3. Verify your environment variables are correct
4. Check the browser console for errors
5. Open an issue on GitHub

## Quick Start Checklist

- [ ] Clone the repository
- [ ] Run `npm install`
- [ ] **Create `.env` file with environment variables from Discord**
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`
- [ ] Sign up for an account
- [ ] Create your first post!

---

Built with ❤️ using Next.js and Supabase