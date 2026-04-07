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
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 backdrop-blur-sm z-40 md:hidden ${
                isDark ? 'bg-black/50' : 'bg-black/30'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 h-screen inset-y-0 left-0 z-50 w-80 flex flex-col backdrop-blur-xl border-r transition-colors duration-300 ${
                isDark 
                  ? 'bg-[#12121a]/95 border-white/10' 
                  : 'bg-white/95 border-gray-200'
              }`}
            >
              {/* Sidebar Header */}
              <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="font-bold text-lg">Sahilion AI</h1>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Premium Assistant</p>
                    </div>
                  </div>
                  <button
                    className={`md:hidden p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">New Chat</span>
                </motion.button>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <p className={`text-xs uppercase tracking-wider px-2 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Recent Chats</p>
                
                {isLoadingChats ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-12 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                ) : chats.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Start a new chat to begin</p>
                  </div>
                ) : (
                  chats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        currentChat?.id === chat.id
                          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <MessageSquare className={`w-4 h-4 shrink-0 ${
                        currentChat?.id === chat.id ? 'text-indigo-400' : 'text-gray-500'
                      }`} />
                      <span className="flex-1 truncate text-sm">{chat.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} rounded-lg`}
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                      >
                        <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>

              {/* User Profile */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-medium">{user.name?.charAt(0) || user.email?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'md:pl-80' : ''}`}>
        {/* Top Bar */}
        <header className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark ? 'bg-[#0a0a0f]/95 border-white/10' : 'bg-white/80 border-gray-200'
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
          <div className="max-w-4xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[60vh]"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  Welcome to Sahilion AI
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-500 text-center max-w-md mb-8"
                >
                  Your premium AI assistant powered by advanced language models. 
                  Ask me anything and experience the future of conversation.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl"
                >
                  {[
                    'Write a Python function to sort a list',
                    'Explain quantum computing simply',
                    'Help me debug this code',
                    'Write a creative short story'
                  ].map((suggestion, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      onClick={() => setInput(suggestion)}
                      className={`p-4 rounded-xl border text-left text-sm transition-all ${
                        isDark 
                          ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50' 
                          : 'border-gray-200 bg-gray-100 hover:bg-gray-200 hover:border-indigo-500/50'
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

                    <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-2xl text-left ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : isDark
                            ? 'bg-white/5 border border-white/10'
                            : 'bg-gray-100 border border-gray-200'
                      }`}>
                        <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {message.content}
                          {isStreaming && index === messages.length - 1 && message.role === 'assistant' && !message.content && (
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="inline-block w-2 h-4 ml-1 bg-indigo-500"
                            />
                          )}
                          {isStreaming && index === messages.length - 1 && message.role === 'assistant' && message.content && (
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="inline-block w-2 h-4 ml-1 bg-indigo-500"
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

        {/* Input Area - Fixed at bottom */}
        <div className={`sticky bottom-0 p-4 border-t transition-colors duration-300 ${
          isDark ? 'border-white/10 bg-[#0a0a0f]/95' : 'border-gray-200 bg-white/95'
        } backdrop-blur-xl`}>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-300 ${
                isDark
                  ? isStreaming 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-white/5 border-white/10 focus-within:border-indigo-500/50 focus-within:bg-white/10'
                  : isStreaming
                    ? 'bg-gray-100 border-gray-200'
                    : 'bg-gray-100 border-gray-200 focus-within:border-indigo-500/50'
              }`}
            >
              <div className="flex items-end gap-2 p-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Sahilion AI..."
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
              Sahilion AI can make mistakes. Consider checking important information.
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
