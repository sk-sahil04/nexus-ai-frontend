const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'

interface ApiOptions {
  method?: string
  body?: any
  token?: string
}

class ApiService {
  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
    }

    if (options.body) {
      config.body = JSON.stringify(options.body)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    if (response.headers.get('content-type')?.includes('text/plain')) {
      return response.body as any
    }

    return response.json()
  }

  async signup(email: string, password: string, name: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: { email, password, name },
    })
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  }

  async refresh(refreshToken: string) {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
  }

  async logout(userId: string, refreshToken: string) {
    return this.request('/api/auth/logout', {
      method: 'POST',
      body: { userId, refreshToken },
    })
  }

  async getMe(token: string) {
    return this.request('/api/user/me', { token })
  }

  async getChats(token: string) {
    return this.request('/api/chats', { token })
  }

  async createChat(token: string, title?: string) {
    return this.request('/api/chats', {
      method: 'POST',
      token,
      body: { title },
    })
  }

  async getChat(token: string, chatId: string) {
    return this.request(`/api/chats/${chatId}`, { token })
  }

  async renameChat(token: string, chatId: string, title: string) {
    return this.request(`/api/chats/${chatId}`, {
      method: 'PATCH',
      token,
      body: { title },
    })
  }

  async deleteChat(token: string, chatId: string) {
    return this.request(`/api/chats/${chatId}`, {
      method: 'DELETE',
      token,
    })
  }

  async sendMessage(token: string, message: string, chatId?: string) {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, chatId }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to send message' }))
      throw new Error(error.error)
    }

    return response.body
  }
}

export const api = new ApiService()
