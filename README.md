# Frosted Resale - Modern Marketplace

A beautiful, modern resale marketplace built with Next.js, Supabase, and a stunning frosted glass UI design.

## Features

- 🎨 **Frosted Glass UI**: Beautiful semi-transparent glass morphism design
- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 📝 **Post Creation**: Create and manage resale posts with rich metadata
- 🏷️ **Tagging System**: Organize posts with customizable tags
- 🔍 **Search & Filter**: Advanced search and filtering capabilities
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
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd frosted-resale
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update the Supabase configuration in `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'your_supabase_project_url'
const supabaseAnonKey = 'your_supabase_anon_key'
```

### 3. Set up Database

Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor. This will create:

- `profiles` table for user profiles
- `posts` table for resale posts
- `tags` table for post tags
- `post_tags` junction table
- Row Level Security policies
- Triggers for user signup

### 4. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Add your domain to "Site URL" (e.g., `http://localhost:3000` for development)
3. Add redirect URLs for authentication

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with frosted glass theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── auth/              # Authentication components
│   │   ├── AuthModal.tsx  # Sign in/up modal
│   │   └── UserMenu.tsx   # User dropdown menu
│   ├── layout/            # Layout components
│   │   └── Header.tsx     # Main header
│   ├── posts/             # Post-related components
│   │   ├── CreatePostModal.tsx # Post creation form
│   │   ├── PostCard.tsx   # Individual post display
│   │   └── PostList.tsx   # Posts listing with search/filter
│   └── ui/                # Reusable UI components
│       ├── GlassButton.tsx    # Frosted glass button
│       ├── GlassCard.tsx      # Frosted glass card
│       ├── GlassInput.tsx     # Frosted glass input
│       └── GlassTextarea.tsx  # Frosted glass textarea
└── lib/                   # Utility libraries
    ├── supabase.ts        # Supabase client
    ├── supabase-client.ts # Browser client
    └── supabase-server.ts # Server client
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

- Rich post creation with title, description, price, condition
- Tagging system with predefined categories
- Image support (ready for implementation)
- Search and filtering capabilities
- Real-time updates

### Database Schema

The database includes:
- User profiles with username and full name
- Posts with comprehensive metadata
- Tags with custom colors
- Many-to-many relationship between posts and tags
- Row Level Security for data protection

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

1. Update the database schema in `supabase/migrations/`
2. Modify the `CreatePostModal.tsx` component
3. Update the `PostCard.tsx` display component
4. Adjust the `PostList.tsx` query

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
1. Check the Supabase dashboard for database/auth issues
2. Verify your environment variables
3. Check the browser console for errors
4. Open an issue on GitHub

---

Built with ❤️ using Next.js and Supabase