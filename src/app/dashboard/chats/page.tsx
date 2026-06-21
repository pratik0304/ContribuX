"use client";

import { Send, Loader2, MessageSquare, ChevronLeft } from "lucide-react";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  role: "creator" | "supporter" | "admin";
  category: string;
  initial: string;
  gradient: string;
  profilePicture: string;
  lastMessage: string;
  time: string;
  isSubscribed?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  isMe: boolean;
  text: string;
  time: string;
}

function ChatsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryContactId = searchParams.get("contactId");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async (selectFirst = false) => {
    try {
      const res = await fetch("/api/messages/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        if (selectFirst && data.length > 0 && !selectedContact) {
          const match = queryContactId ? data.find((c: any) => c.id === queryContactId) : null;
          setSelectedContact(match || data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  }, [selectedContact, queryContactId]);

  const fetchMessages = useCallback(async (contactId: string) => {
    try {
      const res = await fetch(`/api/messages?contactId=${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts(true);
  }, [fetchContacts]);

  // Handle URL contactId query param to auto-select contact
  useEffect(() => {
    if (queryContactId && contacts.length > 0) {
      const match = contacts.find((c) => c.id === queryContactId);
      if (match) {
        setSelectedContact(match);
      }
    }
  }, [queryContactId, contacts]);

  // Fetch messages when selected contact changes
  useEffect(() => {
    if (selectedContact) {
      setLoadingMessages(true);
      fetchMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact, fetchMessages]);

  // Polling for new messages and contact list updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts(false);
      if (selectedContact) {
        fetchMessages(selectedContact.id);
      }
    }, 5000); // Poll every 5s for dynamic real-time messaging

    return () => clearInterval(interval);
  }, [selectedContact, fetchContacts, fetchMessages]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          text: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages((prev) => [...prev, sentMsg]);
        setNewMessage("");
        
        // Update contact list preview immediately
        setContacts((prev) =>
          prev.map((c) =>
            c.id === selectedContact.id
              ? { ...c, lastMessage: sentMsg.text, time: sentMsg.time }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Contact List */}
      <div className={`w-full md:w-80 border-r border-white/10 flex-col bg-black/20 ${selectedContact ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs">Loading chats...</span>
            </div>
          ) : contacts.length > 0 ? (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 ${
                  selectedContact?.id === contact.id ? "bg-white/10" : ""
                }`}
              >
                {contact.profilePicture ? (
                  <img
                    src={contact.profilePicture}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${contact.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md`}>
                    {contact.initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium text-sm truncate">{contact.name}</p>
                    <span className="text-xs text-gray-500 font-mono">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-gray-400 text-xs truncate">{contact.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-20 px-4 text-gray-500">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-40 text-gray-400" />
              <p className="text-sm font-semibold">No chats found</p>
              <p className="text-xs text-gray-600 mt-1">
                {session?.user && (session.user as any).role === "creator"
                  ? "When supporters subscribe to your tiers, you can message them here."
                  : "Subscribe to creator tiers to unlock direct messaging links."}
              </p>
            </div>
          )}
        </div>
      </div>
 
      {/* Chat Area */}
      <div className={`flex-1 flex-col bg-black/10 ${selectedContact ? "flex" : "hidden md:flex"}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.01]">
              <button
                onClick={() => setSelectedContact(null)}
                className="md:hidden mr-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              {selectedContact.profilePicture ? (
                <img
                  src={selectedContact.profilePicture}
                  alt={selectedContact.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${selectedContact.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                  {selectedContact.initial}
                </div>
              )}
              <div>
                <p className="text-white font-medium text-sm">{selectedContact.name}</p>
                <p className="text-xs text-gray-400 capitalize">{selectedContact.category}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-md ${
                        msg.isMe
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white/10 text-gray-200 rounded-bl-none border border-white/5"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      <p className={`text-[10px] mt-1.5 text-right ${msg.isMe ? "text-indigo-200" : "text-gray-500"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-sm font-semibold">Start the conversation</p>
                  <p className="text-xs text-gray-600 mt-1">Send a message to start chatting with {selectedContact.name}.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/[0.01]">
              {selectedContact.isSubscribed === false ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center md:text-left">
                  <div>
                    <p className="text-sm font-semibold text-white">Subscription Required</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {session?.user && (session.user as any).role === "creator"
                        ? "This supporter is no longer subscribed to your tiers."
                        : "You must be subscribed to this creator to send them a message."}
                    </p>
                  </div>
                  {session?.user && (session.user as any).role !== "creator" && (
                    <Link
                      href={`/creator/${selectedContact.id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-md shadow-indigo-600/15"
                    >
                      Subscribe Now
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    disabled={sending}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare size={48} className="mb-4 opacity-30 text-gray-400" />
            <h3 className="text-lg font-bold text-white mb-1">Your Inbox</h3>
            <p className="text-sm text-gray-600">Select a contact from the left list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-40 bg-[#050510]">
          <Loader2 className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin text-indigo-500" />
        </div>
      }
    >
      <ChatsContent />
    </Suspense>
  );
}
