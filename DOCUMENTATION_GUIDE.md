# Code Documentation Guide

This guide outlines the commenting standards used throughout the Repacked codebase.

## Comment Patterns

### File-Level Documentation

Every component file should start with a comprehensive header comment:

```typescript
/**
 * ComponentName Component
 * 
 * Brief description of what the component does and its purpose.
 * 
 * Features:
 * - Feature 1 description
 * - Feature 2 description
 * - Feature 3 description
 * 
 * Usage:
 * How to use this component (if applicable)
 * 
 * Props:
 * @param prop1 - Description of prop1
 * @param prop2 - Description of prop2
 */
```

### Function Documentation

All significant functions should have JSDoc comments:

```typescript
/**
 * Function description
 * Explains what the function does, why it exists, and any important behavior
 * 
 * @param param1 - Description of parameter
 * @param param2 - Description of parameter
 * @returns Description of return value
 */
```

### Inline Comments

Use inline comments to explain:
- Complex logic
- Non-obvious code behavior
- Important implementation details
- Workarounds or special cases

```typescript
// State to track if modal is open
const [isOpen, setIsOpen] = useState(false)

// Only add event listener when modal is open
if (isOpen) {
  document.addEventListener('click', handleClickOutside)
}
```

### JSX Comments

Comment JSX sections to explain purpose:

```jsx
{/* Section description */}
<div className="...">
  {/* Item description */}
  <div>...</div>
</div>
```

## Files Already Documented

✅ **Components:**
- `src/components/ui/GlassSelect.tsx` - Custom dropdown component
- `src/components/layout/Header.tsx` - Main navigation header
- `src/components/posts/PostCard.tsx` - Post listing card

✅ **Contexts:**
- `src/contexts/BasketContext.tsx` - Shopping basket state management
- `src/contexts/SearchContext.tsx` - Search state management

## Files Needing Documentation

The following files should follow the same commenting patterns:

### Context Files
- `src/contexts/CreatePostContext.tsx` - Manage create post modal state
- `src/contexts/ThemeContext.tsx` - Theme switching functionality

### UI Components
- `src/components/ui/GlassButton.tsx` - Reusable button component
- `src/components/ui/GlassCard.tsx` - Card container component
- `src/components/ui/GlassInput.tsx` - Input field component
- `src/components/ui/GlassTextarea.tsx` - Textarea component
- `src/components/ui/ImageUpload.tsx` - Image upload component
- `src/components/ui/ThemeSelector.tsx` - Theme selector component

### Post Components
- `src/components/posts/PostList.tsx` - List of posts with filters
- `src/components/posts/SearchPostList.tsx` - Search results component
- `src/components/posts/RecentPosts.tsx` - Recent posts component
- `src/components/posts/CreatePostModal.tsx` - Create post modal
- `src/components/posts/EditPostModal.tsx` - Edit post modal
- `src/components/posts/UniversalCreatePostModal.tsx` - Universal create modal

### Auth Components
- `src/components/auth/AuthModal.tsx` - Authentication modal
- `src/components/auth/UserMenu.tsx` - User menu dropdown

### Other Components
- `src/components/basket/BasketModal.tsx` - Shopping basket modal

### Page Files
- `src/app/page.tsx` - Home page
- `src/app/search/page.tsx` - Search page
- `src/app/my-posts/page.tsx` - User's posts page
- `src/app/post/[id]/page.tsx` - Post detail page

### Utility Files
- `src/lib/supabase-client.ts` - Supabase client configuration
- `src/lib/supabase-server.ts` - Server-side Supabase utilities
- `src/lib/supabase-storage.ts` - File storage utilities

## Commenting Standards

### What to Comment

1. **Component Purpose** - What it does and why it exists
2. **Props/Parameters** - What each prop/param is for
3. **State Variables** - What state is being tracked
4. **Complex Logic** - Algorithms, calculations, or business rules
5. **Effects** - What side effects are happening and why
6. **JSX Sections** - What each major section renders
7. **Edge Cases** - Special handling or important conditions

### What NOT to Comment

1. **Obvious Code** - Variable assignments like `const x = 5`
2. **Standard Patterns** - Common React patterns like `useState`
3. **Self-Documenting Code** - Well-named functions that explain themselves

## Example: Fully Documented Component

```typescript
'use client'

/**
 * ExampleComponent
 * 
 * Brief description of what this component does.
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 */

import { useState, useEffect } from 'react'

interface ExampleProps {
  title: string
  count: number
}

export default function ExampleComponent({ title, count }: ExampleProps) {
  // State to track loading status
  const [isLoading, setIsLoading] = useState(false)
  
  /**
   * Effect to fetch data on mount
   * Fetches initial data when component mounts
   */
  useEffect(() => {
    fetchData()
  }, [])
  
  /**
   * Fetch data from API
   * Handles API call and error states
   */
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // API call logic
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      {/* Header section */}
      <h1>{title}</h1>
      
      {/* Content section */}
      <p>Count: {count}</p>
    </div>
  )
}
```

## Maintenance

When adding new files or modifying existing ones:
1. Add comprehensive file-level comments
2. Document all functions and complex logic
3. Add inline comments for non-obvious code
4. Comment JSX sections for clarity
5. Update this guide if patterns change

