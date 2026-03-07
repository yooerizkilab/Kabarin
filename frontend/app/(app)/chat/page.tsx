'use client';

import { useEffect, useState, useRef } from 'react';
import { chatAPI, messageAPI } from '@/services/api';
import { useDeviceStore } from '@/store/deviceStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { devices } = useDeviceStore();
  const { user } = useAuthStore();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      loadChats();
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId && selectedChat) {
      loadHistory();
    } else {
      setMessages([]);
    }
  }, [selectedChat, selectedDeviceId]);

  useEffect(() => {
    const handleNewMessage = (e: any) => {
      const { deviceId, from, direction, text } = e.detail;
      
      // Update chat list
      setChats(prev => {
        const remotePhone = direction === 'INCOMING' ? from : (e.detail.to || '');
        const existingIdx = prev.findIndex(c => (c.from === remotePhone || c.to === remotePhone));
        
        const updatedChat = { 
          deviceId, 
          from: direction === 'INCOMING' ? from : '', 
          to: direction === 'OUTGOING' ? from : '', 
          content: text,
          direction,
          createdAt: new Date().toISOString()
        };

        if (existingIdx > -1) {
          const newArr = [...prev];
          newArr.splice(existingIdx, 1);
          return [updatedChat, ...newArr];
        }
        return [updatedChat, ...prev];
      });

      // Update message history if same chat open
      if (deviceId === selectedDeviceId && (from === selectedChat || e.detail.to === selectedChat)) {
        setMessages(prev => [...prev, {
          direction,
          content: text,
          createdAt: new Date().toISOString(),
          status: 'SENT'
        }]);
      }
    };

    window.addEventListener('new_message', handleNewMessage);
    return () => window.removeEventListener('new_message', handleNewMessage);
  }, [selectedDeviceId, selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChats = async () => {
    setLoading(true);
    try {
      const res = await chatAPI.getList(selectedDeviceId);
      setChats(res.data.data);
    } catch {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedChat) return;
    try {
      const res = await chatAPI.getHistory(selectedDeviceId, selectedChat);
      setMessages(res.data.data);
    } catch {
      toast.error('Failed to load history');
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedChat || sending || !selectedDeviceId) return;

    setSending(true);
    try {
      await messageAPI.send({
        deviceId: selectedDeviceId,
        to: selectedChat,
        content: inputText
      });
      
      // Optimistic state handled by WebSocket event usually, 
      // but we add it manually if events are slow or direction is known
      setInputText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Live Chat Inbox</h1>
        <select 
          className="input max-w-xs"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          {devices.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.phoneNumber || 'Unlinked'})</option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <input type="text" placeholder="Search chats..." className="input text-sm w-full" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No conversations found.</div>
            ) : (
              chats.map((chat, idx) => {
                const phone = chat.direction === 'OUTGOING' ? chat.to : chat.from;
                const active = selectedChat === phone;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedChat(phone)}
                    className={`w-full p-4 flex items-start gap-3 transition-colors text-left border-b border-gray-800/50 ${
                      active ? 'bg-brand-600/20 border-r-4 border-r-brand-500' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center font-bold">
                      {phone[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium text-white text-sm truncate">{phone}</span>
                        <span className="text-[10px] text-gray-500">{new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{chat.content}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-[#0b141a]">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-3 px-6 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                    {selectedChat[0]}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{selectedChat}</h3>
                    <p className="text-[10px] text-brand-400">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative"
              >
                {/* Background Pattern Overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                  style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
                />
                <div className="relative z-10 space-y-4">
                  {messages.map((msg, idx) => {
                    const isMe = msg.direction === 'OUTGOING';
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-xl px-4 py-2 text-sm shadow-sm ${
                          isMe ? 'bg-brand-700 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'
                        }`}>
                          <p>{msg.content}</p>
                          <div className={`text-[10px] mt-1 flex justify-end gap-1 ${isMe ? 'text-brand-200' : 'text-gray-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <span>✓✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 bg-gray-800/50 border-t border-gray-800 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border-none rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-brand-500 transition-all"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                />
                <button 
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <span className="text-xl rotate-45 -mt-1 -ml-1">✈️</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <span className="text-6xl mb-4">💬</span>
              <p className="text-lg font-medium">Select a chat to start messaging</p>
              <p className="text-sm opacity-50">Choose a contact from the left sidebar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
