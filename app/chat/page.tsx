'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { 
  Send, 
  Menu, 
  X, 
  Trash2, 
  Plus, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  ChevronLeft,
  User,
  Bot,
  Loader2,
  LogOut as LogOutIcon,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { api } from '../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
}

interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export default function PremiumChatApp() {
  const router = useRouter()
  const { user, token, isLoading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  // Auth check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Load chats
  useEffect(() => {
    if (user && token) {
      loadChats()
    }
  }, [user, token])

  // Particles background
  useEffect(() => {
    if (typeof window !== 'undefined' && isDark) {
      initParticles()
    }
  }, [isDark])

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'dark'
      const isLightMode = savedTheme === 'light'
      setIsDark(!isLightMode)
      if (isLightMode) {
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
      }
    }
  }, [])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1
      })
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    cursorX.set(e.clientX)
    cursorY.set(e.clientY)
  }

  const loadChats = async () => {
    if (!token) return
    
    setIsLoadingChats(true)
    try {
      const response = await api.getChats(token) as any
      setChats(response.chats || [])
    } catch (err: any) {
      console.error('Failed to load chats:', err)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const loadChat = async (chatId: string) => {
    if (!token) return

    try {
      const response = await api.getChat(token, chatId) as any
      setCurrentChat(response.chat)
      setMessages(response.chat.messages.map((m: any) => ({
        id: m._id || crypto.randomUUID(),
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt)
      })))
    } catch (err: any) {
      console.error('Failed to load chat:', err)
      setError('Failed to load chat')
    }
  }

  const handleNewChat = async () => {
    if (!token) return

    try {
      const response = await api.createChat(token) as any
      const newChat = response.chat
      setChats(prev => [{ ...newChat, createdAt: newChat.createdAt, updatedAt: newChat.updatedAt }, ...prev])
      setCurrentChat(newChat)
      setMessages([])
      setError('')
    } catch (err: any) {
      console.error('Failed to create chat:', err)
      setError('Failed to create chat')
    }
  }

  const handleSelectChat = async (chat: Chat) => {
    setCurrentChat(chat)
    await loadChat(chat.id)
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!token) return

    try {
      await api.deleteChat(token, chatId)
      setChats(prev => prev.filter(c => c.id !== chatId))
      if (currentChat?.id === chatId) {
        setCurrentChat(null)
        setMessages([])
      }
    } catch (err: any) {
      console.error('Failed to delete chat:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming || !token) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)
    setError('')

    const assistantMessageId = crypto.randomUUID()
    let fullResponse = ''

    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date()
    }])

    try {
      const response = await api.sendMessage(token, userMessage.content, currentChat?.id)

      if (response && 'getReader' in response) {
        const reader = (response as ReadableStream<Uint8Array>).getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { ...m, content: fullResponse }
              : m
          ))
        }
      }

      // Reload chats to get updated list
      loadChats()

    } catch (err: any) {
      console.error('Send message error:', err)
      
      let userFriendlyMessage = 'Something went wrong. Please try again.'
      
      if (err.message?.toLowerCase().includes('image') || 
          err.message?.toLowerCase().includes('vision') ||
          err.message?.toLowerCase().includes('image.png')) {
        userFriendlyMessage = 'Image input is not supported. Please send text only.'
      } else if (err.message) {
        userFriendlyMessage = err.message
      }
      
      setError(userFriendlyMessage)
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: '' }
          : m
      ))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div 
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* Particle Canvas - Dark mode only */}
      {isDark && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none opacity-50"
        />
      )}

      {/* Cursor Glow */}
      <motion.div
        className="fixed w-64 h-64 rounded-full pointer-events-none hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          translateX: '-50%',
          translateY: '-50%'
        }}
      />

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className={`fixed inset-0 backdrop-blur-sm z-40 md:hidden ${
            isDark ? 'bg-black/50' : 'bg-black/30'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-[100dvh] w-80 flex flex-col border-r transition-colors duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:h-screen ${
          isDark 
            ? 'bg-[#202123] border-white/5' 
            : 'bg-white border-gray-200'
        }`}
      >
              {/* Sidebar Header */}
              <div className={`p-3 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                {/* Mobile Logo */}
                <div className="flex items-center justify-between mb-3 md:hidden">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold">Nexus AI</span>
                  </div>
                  <button
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleNewChat}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/15 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">New Chat</span>
                </button>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingChats ? (
                  <div className="p-3 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-11 rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                ) : chats.length === 0 ? (
                  <div className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-sm">No conversations</p>
                  </div>
                ) : (
                  <div className="p-2">
                    <p className={`text-xs px-3 py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Today</p>
                    {chats.map((chat, index) => (
                      <motion.button
                        key={chat.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleSelectChat(chat)}
                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1 ${
                          currentChat?.id === chat.id
                            ? isDark
                              ? 'bg-white/10 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDark
                              ? 'text-gray-300 hover:bg-white/5'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span className="flex-1 truncate text-sm">{chat.title}</span>
                        <button
                          className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'
                          }`}
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`} />
                        </button>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-white/5' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <LogOutIcon className="w-4 h-4" />
                  <span className="text-sm">{user.name || 'Sign out'}</span>
                </button>
              </div>
            </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'md:pl-80' : ''}`}>
        {/* Top Bar */}
        <header className={`flex items-center justify-between px-4 py-2 border-b transition-colors duration-300 ${
          isDark ? 'bg-[#323233] border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <AnimatePresence mode="wait">
              {currentChat && (
                <motion.h2
                  key={currentChat.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="font-medium"
                >
                  {currentChat.title}
                </motion.h2>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newIsDark = !isDark
                setIsDark(newIsDark)
                localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
                if (newIsDark) {
                  document.documentElement.classList.remove('light')
                } else {
                  document.documentElement.classList.add('light')
                }
              }}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transition-transform hover:scale-105`}
              >
                <span className="text-sm font-medium text-white">{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 ${
                      isDark 
                        ? 'bg-[#1a1a24] border-white/10' 
                        : 'bg-white border-gray-200 shadow-lg'
                    }`}
                  >
                    <div className={`p-3 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</p>
                      <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                    </div>
                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
                    <button
                      onClick={() => {
                        setIsProfileOpen(false)
                        handleLogout()
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                        isDark 
                          ? 'hover:bg-white/5 text-gray-300 hover:text-red-400' 
                          : 'hover:bg-gray-50 text-gray-700 hover:text-red-600'
                      }`}
                    >
                      <LogOutIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Log out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-4 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setError('')}
              >
                Dismiss
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col items-center justify-center h-full min-h-[60vh] ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  How can I help you today?
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-4"
                >
                  {[
                    'Explain quantum computing',
                    'Write Python code',
                    'Help me brainstorm',
                    'Summarize this text'
                  ].map((suggestion, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => setInput(suggestion)}
                      className={`p-4 rounded-xl border text-left text-sm transition-all ${
                        isDark 
                          ? 'bg-[#40414f] border-white/10 hover:border-white/20' 
                          : 'bg-gray-100 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 py-6 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </motion.div>

                    <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-2xl text-left ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : isDark
                            ? 'bg-[#1e1e2e] border border-white/10'
                            : 'bg-gray-100 border border-gray-200'
                      }`}>
                        <p className={`whitespace-pre-wrap leading-relaxed text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                          {message.content}
                          {isStreaming && index === messages.length - 1 && message.role === 'assistant' && !message.content && (
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="inline-block w-2 h-5 ml-1 bg-indigo-400"
                            />
                          )}
                          {isStreaming && index === messages.length - 1 && message.role === 'assistant' && message.content && (
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="inline-block w-2 h-5 ml-1 bg-indigo-400"
                            />
                          )}
                        </p>
                      </div>

                      {message.role === 'assistant' && message.content && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-3 border-t transition-colors duration-300 ${
          isDark ? 'border-white/5 bg-[#323233]' : 'border-gray-200 bg-white'
        }`}>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
                isDark
                  ? isStreaming 
                    ? 'bg-[#40414f] border-white/10' 
                    : 'bg-[#40414f] border-white/10 focus-within:border-indigo-500/30'
                  : isStreaming
                    ? 'bg-gray-100 border-gray-200'
                    : 'bg-gray-100 border-gray-200 focus-within:border-indigo-500/30'
              }`}
            >
              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Nexus AI..."
                  rows={1}
                  className={`flex-1 resize-none bg-transparent border-0 outline-none text-sm placeholder:text-gray-500 min-h-[24px] max-h-[200px] disabled:opacity-50 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                  disabled={isStreaming}
                />
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isStreaming}
                    className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center ${
                      input.trim() && !isStreaming 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50' 
                        : isDark ? 'bg-white/10' : 'bg-gray-200'
                    }`}
                  >
                    {isStreaming ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </motion.div>
              </div>
            </motion.div>

            <p className="text-center text-xs text-gray-500 mt-3">
              Nexus AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Button({ 
  children, 
  onClick, 
  variant = 'ghost', 
  size = 'default',
  className = '',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  variant?: 'ghost' | 'default' | 'destructive'
  size?: 'default' | 'icon' | 'sm'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
