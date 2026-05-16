import React, { useEffect, useRef, useState } from 'react';
import { Send, UserRound, PlusCircle, Calendar, Wand2, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import AppointmentCard from '../components/AppointmentCard';
import BookAppointmentModal from '../components/BookAppointmentModal';
import CancelAppointmentModal from '../components/CancelAppointmentModal';
import RescheduleAppointmentModal from '../components/RescheduleAppointmentModal';


const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [patientId, setPatientId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize session and patient ID
    startNewSession();
    const storedPatientId = localStorage.getItem('patientId');
    if (storedPatientId) {
      setPatientId(storedPatientId);
    }
    
    // Check for prefilled message
    const prefill = localStorage.getItem('prefillMessage');
    if (prefill) {
      setInput(prefill);
      localStorage.removeItem('prefillMessage');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNewSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([{ role: 'agent', content: 'Hello! I am your dental appointment assistant. How can I help you today?' }]);
  };

  const handlePatientIdChange = (e) => {
    const val = e.target.value;
    setPatientId(val);
    localStorage.setItem('patientId', val);
  };

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/api/chat', {
        message: userMessage,
        session_id: sessionId
      });
      
      setMessages(prev => [...prev, { role: 'agent', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', content: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chips = [
    { text: "Show available slots", type: 'navigate_doctors' },
    { text: "Book appointment", type: 'open_book' },
    { text: "Cancel appointment", type: 'open_cancel' },
    { text: "My appointments", type: 'navigate_appointments' },
    { text: "Reschedule", type: 'open_reschedule' },
  ];


  const [bookOpen, setBookOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const handleChipClick = (chip) => {
    switch (chip.type) {
      case 'navigate_doctors':
        window.location.href = '/doctors';
        return;
      case 'navigate_appointments':
        window.location.href = '/appointments';
        return;
      case 'open_book':
        setBookOpen(true);
        return;
      case 'open_cancel':
        setCancelOpen(true);
        return;
      case 'open_reschedule':
        setRescheduleOpen(true);
        return;
      default:
        setInput(chip.text);
    }
  };

  const handlePrefillFromModal = (text) => {
    setInput(text);
    // also keep legacy prefill behavior for any flows that rely on it
    localStorage.setItem('prefillMessage', text);
  };


  const parseAppointmentFromText = (text) => {
    // Simple heuristic to extract appointment details if present for AppointmentCard rendering
    // Looking for formats like "patient_id on YYYY-MM-DD HH:MM with doctor_name"
    // Since it's raw LLM output, it might be varied. 
    // If we can't reliably parse it, return null.
    // E.g., check if text contains "successfully booked"
    if (text.toLowerCase().includes('successfully booked') && text.match(/\d{4}-\d{2}-\d{2}/) && text.match(/\d{1,2}:\d{2}/)) {
        // Attempt a rough extraction or just return a dummy structured mock
        // Since LLM text is varied, we will just return a basic parsed form or null
        return null; // Opting for safety: don't render a broken card. The text is enough.
    }
    return null;
  };

  return (
    <div className="flex h-full w-full bg-background">
      {/* Left Column */}
      <div className="w-[300px] border-r border-border p-6 flex flex-col bg-surface/30">
        <button 
          onClick={startNewSession}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <PlusCircle size={20} />
          New Chat
        </button>

        <div className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-300">Patient ID</label>
          <input 
            type="text" 
            value={patientId}
            onChange={handlePatientIdChange}
            placeholder="e.g. PAT-1234"
            className="w-full bg-slate-900 border border-border rounded-lg p-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
          />
        </div>

        <div className="mt-auto">
          <div className="text-xs text-slate-500 font-medium mb-3 uppercase tracking-wider">Conversation Starters</div>
          <div className="flex flex-col gap-2">
            {['I need a general checkup', 'Do you have slots today?', 'Cancel my next visit'].map((starter, i) => (
              <button 
                key={i}
                onClick={() => setInput(starter)}
                className="text-left px-3 py-2 rounded-lg bg-slate-800/50 text-slate-300 text-sm hover:bg-slate-800 hover:text-primary transition-colors"
              >
                "{starter}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">

        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl shadow-md ${
                  msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-slate-800 border border-border'
                }`}>
                  {msg.role === 'user' ? <UserRound size={20} /> : '🦷'}
                </div>
                
                <div className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-surface border border-border text-slate-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[80%] flex-row">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl shadow-md bg-slate-800 border border-border">
                  🦷
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-border text-slate-200 rounded-tl-none flex items-center gap-1.5 h-[56px]">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-background border-t border-border">
          <div className="flex flex-wrap gap-2 mb-4">

            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 rounded-full border border-border bg-surface text-slate-300 text-xs font-medium hover:border-primary hover:text-primary transition-all duration-200"
              >
                {chip.text}
              </button>
            ))}

          </div>
          
          <form onSubmit={sendMessage} className="relative flex items-end gap-3 bg-surface border border-border rounded-xl p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none text-white placeholder-slate-500 p-2 text-sm leading-relaxed"
              rows={1}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* Modals */}
        <BookAppointmentModal
          open={bookOpen}
          patientId={patientId}
          onClose={() => setBookOpen(false)}
          onPrefill={handlePrefillFromModal}
        />
        <CancelAppointmentModal
          open={cancelOpen}
          patientId={patientId}
          onClose={() => setCancelOpen(false)}
          onPrefill={handlePrefillFromModal}
        />
        <RescheduleAppointmentModal
          open={rescheduleOpen}
          patientId={patientId}
          onClose={() => setRescheduleOpen(false)}
          onPrefill={handlePrefillFromModal}
        />
      </div>
    </div>
  );
};

export default ChatPage;

