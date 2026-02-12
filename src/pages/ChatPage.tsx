import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers'
import { useToast } from '@/hooks/useToast'
import { Avatar } from '@/components/ui/Avatar'
import { Send, Loader2, MessageCircle, Sparkles } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import clsx from 'clsx'

export function ChatPage() {
  const { profile } = useAuth()
  const { messages, loading, sendMessage, assistantTyping, markAssistantRead } = useMessages()
  const { members } = useHouseholdMembers()
  const toast = useToast()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, assistantTyping])

  // Mark assistant messages as read when the page is active
  useEffect(() => {
    markAssistantRead()
  }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!input.trim() || sending) return
    const content = input
    setInput('')
    setSending(true)

    const result = await sendMessage(content)
    if (result.error) {
      toast.error(result.error)
      setInput(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getMember(userId: string | null) {
    if (!userId) return null
    return members.find((m) => m.id === userId)
  }

  function formatDateSeparator(date: Date): string {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-400" size={28} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={40} className="text-warm-200 mb-3" />
            <p className="text-sm font-medium text-warm-500">No messages yet</p>
            <p className="text-xs text-warm-400 mt-1">
              Chat with your household or ask Indi for help with tasks!
            </p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-1">
            {messages.map((msg, i) => {
              const msgDate = new Date(msg.created_at)
              const prevMsg = i > 0 ? messages[i - 1] : null
              const prevDate = prevMsg ? new Date(prevMsg.created_at) : null
              const showDateSep = !prevDate || !isSameDay(msgDate, prevDate)

              const isAssistant = msg.role === 'assistant'
              const isOwnMessage = !isAssistant && msg.user_id === profile?.id
              const member = getMember(msg.user_id)

              // Show avatar on last message in a consecutive sequence from same sender
              const nextMsg = i < messages.length - 1 ? messages[i + 1] : null
              const showAvatar =
                !isOwnMessage &&
                (!nextMsg ||
                  (isAssistant ? nextMsg.role !== 'assistant' : nextMsg.user_id !== msg.user_id))

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] font-medium text-warm-400 bg-warm-100 dark:bg-warm-800 dark:text-warm-500 px-3 py-1 rounded-full">
                        {formatDateSeparator(msgDate)}
                      </span>
                    </div>
                  )}

                  {/* Assistant message */}
                  {isAssistant ? (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="w-7 shrink-0">
                        {showAvatar && (
                          <div className="w-6 h-6 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center">
                            <Sparkles size={12} className="text-sage-600 dark:text-sage-300" />
                          </div>
                        )}
                      </div>
                      <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-md text-sm bg-sage-50 dark:bg-sage-900/50 border border-sage-200 dark:border-sage-700 text-warm-800 dark:text-warm-100">
                        {showAvatar && (
                          <p className="text-[10px] font-semibold text-sage-600 dark:text-sage-400 mb-0.5">
                            Indi
                          </p>
                        )}
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        <p className="text-[9px] mt-1 text-warm-300 dark:text-warm-500">
                          {format(msgDate, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* User messages (own + partner) */
                    <div
                      className={clsx(
                        'flex items-end gap-2',
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isOwnMessage && (
                        <div className="w-7 shrink-0">
                          {showAvatar && member && (
                            <Avatar
                              name={member.display_name}
                              color={member.avatar_color}
                              size="sm"
                            />
                          )}
                        </div>
                      )}

                      <div
                        className={clsx(
                          'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                          isOwnMessage
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-warm-800 border border-warm-100 dark:border-warm-700 text-warm-800 dark:text-warm-100 rounded-bl-md'
                        )}
                      >
                        {!isOwnMessage && showAvatar && member && (
                          <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mb-0.5">
                            {member.display_name}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={clsx(
                            'text-[9px] mt-1',
                            isOwnMessage ? 'text-white/60' : 'text-warm-300 dark:text-warm-500'
                          )}
                        >
                          {format(msgDate, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Typing indicator */}
            {assistantTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center">
                    <Sparkles size={12} className="text-sage-600 dark:text-sage-300" />
                  </div>
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-sage-50 dark:bg-sage-900/50 border border-sage-200 dark:border-sage-700">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-sage-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-warm-100 dark:border-warm-700 bg-white dark:bg-warm-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your household or @indi..."
            className="flex-1 px-4 py-2.5 rounded-full border border-warm-200 dark:border-warm-600 bg-warm-50 dark:bg-warm-700 text-sm text-warm-900 dark:text-warm-100 placeholder-warm-400 dark:placeholder-warm-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={clsx(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              input.trim()
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-warm-100 dark:bg-warm-700 text-warm-300 dark:text-warm-500'
            )}
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
