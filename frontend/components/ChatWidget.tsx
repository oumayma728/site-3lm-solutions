'use client';

import { useEffect, useRef, useState } from 'react';
import { postChatMessage } from '@/lib/chat';
import { useLang } from '@/components/site/LangProvider';
import type { Translations } from '@/lib/i18n';
import './ChatWidget.css';

const SESSION_STORAGE_KEY = 'chat_session_id';

// The assistant itself answers in the visitor's language (see backend chat prompt)
const fr = {
  greeting:
    "Bonjour, je suis l'assistant de 3LM Solutions. Je peux répondre à vos questions, présenter nos services ou vous orienter vers un rendez-vous.",
  quickReplies: ['Quels sont vos services ?', 'Je veux un rendez-vous', "Parlez-moi de l'IA"],
  unavailable:
    'Désolé, le service de chat ne répond pas pour le moment. Vous pouvez contacter 3LM Solutions au +216 56 566 533 ou à contact@3lmsolutions.net.',
  open: 'Ouvrir le chat',
  close: 'Fermer le chat',
  online: 'En ligne',
  title: 'Assistant 3LM Solutions',
  typing: "Assistant en train d'écrire",
  suggestions: 'Suggestions',
  placeholder: 'Écrivez votre message...',
  send: 'Envoyer',
};
const T: Translations<typeof fr> = {
  fr,
  en: {
    greeting:
      "Hello, I'm the 3LM Solutions assistant. I can answer your questions, present our services or help you book a call.",
    quickReplies: ['What are your services?', 'I want to book a call', 'Tell me about AI'],
    unavailable:
      'Sorry, the chat service is not responding right now. You can reach 3LM Solutions at +216 56 566 533 or contact@3lmsolutions.net.',
    open: 'Open chat',
    close: 'Close chat',
    online: 'Online',
    title: '3LM Solutions Assistant',
    typing: 'Assistant is typing',
    suggestions: 'Suggestions',
    placeholder: 'Type your message...',
    send: 'Send',
  },
};

interface ChatMessage {
  sender: 'user' | 'bot';
  content: string;
}

function uuidv4(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatWidget() {
  const t = T[useLang()];
  const [isOpen, setIsOpen] = useState(false);
  // The greeting is not stored: it is shown first, in the current language
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getOrCreateSessionId = () => {
    let storedSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      window.localStorage.setItem(SESSION_STORAGE_KEY, storedSessionId);
    }
    return storedSessionId;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen((current) => !current);

  const sendMessage = async (text: string) => {
    const userInput = text.trim();
    if (!userInput || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', content: userInput }]);
    setIsLoading(true);
    setDraft('');

    try {
      const currentSessionId = sessionId || getOrCreateSessionId();
      setSessionId(currentSessionId);
      const response = await postChatMessage(userInput, currentSessionId);
      setMessages((prev) => [...prev, { sender: 'bot', content: response.assistant_message.content }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, { sender: 'bot', content: t.unavailable }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(draft);
  };

  const shown: ChatMessage[] = [{ sender: 'bot', content: t.greeting }, ...messages];

  return (
    <>
      {/* Phone only (see CSS): dims the page behind the chat sheet, tap to close */}
      {isOpen && <div className="chat-backdrop" onClick={toggleChat} aria-hidden="true" />}

      <button
        className={`chat-toggle-button${isOpen ? ' is-open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? t.close : t.open}
      >
        <span aria-hidden="true">{isOpen ? '×' : 'AI'}</span>
      </button>

      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <div className="chat-avatar" aria-hidden="true">3L</div>
            <div className="chat-heading">
              <span className="chat-status">{t.online}</span>
              <h3>{t.title}</h3>
            </div>
            <button className="chat-close-button" onClick={toggleChat} aria-label={t.close}>×</button>
          </div>

          <div className="chat-messages">
            {shown.map((msg, index) => (
              <div key={`${msg.sender}-${index}`} className={`message ${msg.sender}`}>
                <span>{msg.content}</span>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="typing-indicator" aria-label={t.typing}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-quick-replies" aria-label={t.suggestions}>
            {t.quickReplies.map((reply) => (
              <button key={reply} type="button" onClick={() => sendMessage(reply)} disabled={isLoading}>
                {reply}
              </button>
            ))}
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              name="message"
              placeholder={t.placeholder}
              autoComplete="off"
              disabled={isLoading}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" disabled={isLoading || !draft.trim()}>{t.send}</button>
          </form>
        </div>
      )}
    </>
  );
}
