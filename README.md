# Nexus AI - Production Backend API

A production-ready backend API for an AI SaaS application with authentication, chat management, and AI integration.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **AI**: Groq / OpenAI API
- **Validation**: Zod
- **Rate Limiting**: Custom middleware

## API Endpoints

### Authentication

#### POST `/api/signup`
Create a new user account.

```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"  // optional
}

Response (201):
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "Account created successfully"
}
```

#### POST `/api/login`
Authenticate user.

```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890
  }
}
```

#### POST `/api/logout`
Sign out user.

```json
Response (200):
{
  "success": true,
  "message": "Signed out successfully"
}
```

#### GET `/api/session`
Check current session.

```json
Response (200):
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Chat Management

#### GET `/api/chats`
Get all chats for authenticated user.

```json
Response (200):
{
  "success": true,
  "chats": [
    {
      "id": "uuid",
      "title": "Chat title",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/chats`
Create a new chat.

```json
Request:
{
  "title": "New Chat"  // optional
}

Response (201):
{
  "success": true,
  "chat": {
    "id": "uuid",
    "title": "New Chat",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/chats/:id`
Get chat with messages.

```json
Response (200):
{
  "success": true,
  "chat": { ... },
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello!",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### PATCH `/api/chats/:id`
Update chat title.

```json
Request:
{
  "title": "Updated Title"
}

Response (200):
{
  "success": true,
  "chat": { ... }
}
```

#### DELETE `/api/chats/:id`
Delete chat and its messages.

```json
Response (200):
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

### AI Chat

#### POST `/api/chat`
Send message and get AI streaming response.

```json
Request:
{
  "chatId": "uuid",  // optional - creates new chat if not provided
  "message": "Hello AI!"
}

Response: Streaming text/plain
```

### Messages

#### GET `/api/messages?chatId=uuid`
Get messages for a chat.

```json
Response (200):
{
  "success": true,
  "messages": [ ... ]
}
```

## Database Schema

```sql
-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats
CREATE TABLE public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can manage own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI (Groq or OpenAI)
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
AI_PROVIDER=groq  # or 'openai'
```

## Rate Limiting

| Route | Limit |
|-------|-------|
| Auth (signup/login) | 5 requests/minute |
| Chat | 20 requests/minute |
| General API | 60 requests/minute |

## Security Features

- Input validation with Zod
- Rate limiting middleware
- JWT session handling
- Row Level Security (RLS)
- Protected API routes
- CORS configuration

## Folder Structure

```
lib/
├── ai.ts              # AI integration
├── rate-limit.ts      # Rate limiting
├── supabase-server.ts # Server auth helpers
├── supabase-admin.ts  # Admin operations
└── validations.ts     # Zod schemas

app/api/
├── signup/route.ts    # POST /api/signup
├── login/route.ts     # POST /api/login
├── logout/route.ts    # POST /api/logout
├── session/route.ts   # GET /api/session
├── chat/route.ts      # POST /api/chat
├── chats/
│   ├── route.ts       # GET, POST /api/chats
│   └── [id]/route.ts  # GET, PATCH, DELETE /api/chats/:id
└── messages/route.ts  # GET /api/messages
```

## Running Locally

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run database migration in Supabase

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

## Production Deployment

### Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Environment Variables on Vercel

Add all required environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `DEMO_MODE` (optional)
