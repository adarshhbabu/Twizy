import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Contact, TwizyEvent } from '../types';
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Sparkles,
  PhoneCall,
  Check,
  X,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import { DraftMessageCard } from './DraftMessageCard';

interface ChatAreaProps {
  messages: ChatMessage[];
  contacts: Contact[];
  isLoading: boolean;
  onSendMessage: (text: string, imageBase64?: string, imageMime?: string) => void;
  onApplyChanges: (msgId: string, eventsToAdd: TwizyEvent[], eventsToUpdate: TwizyEvent[], eventsToRemove: string[], changeLog: string[]) => void;
  onRejectChanges: (msgId: string) => void;
  onSimulateCall: () => void;
  onLoadSampleWhatsApp: () => void;
  onOpenContacts: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  contacts,
  isLoading,
  onSendMessage,
  onApplyChanges,
  onRejectChanges,
  onSimulateCall,
  onLoadSampleWhatsApp,
  onOpenContacts,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English / Global English

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        base64,
        mime: file.type || 'image/png',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;
    onSendMessage(inputText.trim(), selectedImage?.base64, selectedImage?.mime);
    setInputText('');
    setSelectedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden relative">
      {/* Top Demo Shortcut Strip */}
      <div className="px-4 py-2 bg-neutral-900/70 border-b border-neutral-800 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Demo Tools:
          </span>
          <button
            onClick={onLoadSampleWhatsApp}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Inject: DS class moved to 3 PM, assignment due Friday 5 PM"
          >
            <FileText className="w-3 h-3" />
            <span>Load sample WhatsApp message</span>
          </button>
          <button
            onClick={onSimulateCall}
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Simulate incoming must-attend call instantly"
          >
            <PhoneCall className="w-3 h-3 text-rose-400" />
            <span>Simulate call (Demo)</span>
          </button>
        </div>

        <button
          onClick={onOpenContacts}
          className="text-neutral-400 hover:text-neutral-200 text-xs underline cursor-pointer"
        >
          Manage Contacts ({contacts.length})
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isTwizy = msg.sender === 'twizy';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isTwizy ? 'items-start' : 'items-end'} animate-in fade-in duration-150`}
            >
              <div className="flex items-end gap-2.5 max-w-[90%] md:max-w-[80%]">
                {isTwizy && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0">
                    TZ
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                    isTwizy
                      ? 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-sm'
                      : 'bg-emerald-600 text-white rounded-br-sm'
                  }`}
                >
                  {/* Attached user image if any */}
                  {msg.image && (
                    <div className="mb-2 rounded-xl overflow-hidden max-h-48 border border-neutral-700 bg-neutral-950">
                      <img
                        src={msg.image}
                        alt="Uploaded timetable or chat snippet"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Ask User Clarification Callout */}
                  {msg.askUser && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{msg.askUser}</span>
                    </div>
                  )}

                  {/* Confirmation Card: "Got it: ___, right?" */}
                  {msg.pendingConfirmation && (
                    <div className="mt-3 p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/40 text-neutral-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Confirmation Required</span>
                      </div>
                      <p className="text-neutral-300">
                        {msg.pendingConfirmation.summary}
                      </p>

                      <div className="bg-neutral-900/80 p-2 rounded-lg space-y-1 text-[11px] text-neutral-400">
                        {msg.pendingConfirmation.eventsToAdd.length > 0 && (
                          <div className="text-emerald-300">
                            + Add {msg.pendingConfirmation.eventsToAdd.length} event(s):{' '}
                            {msg.pendingConfirmation.eventsToAdd.map((e) => e.title).join(', ')}
                          </div>
                        )}
                        {msg.pendingConfirmation.eventsToUpdate.length > 0 && (
                          <div className="text-amber-300">
                            ~ Reschedule {msg.pendingConfirmation.eventsToUpdate.length} event(s):{' '}
                            {msg.pendingConfirmation.eventsToUpdate
                              .map((e) => `${e.title} -> ${e.start_time}`)
                              .join(', ')}
                          </div>
                        )}
                        {msg.pendingConfirmation.eventsToRemove.length > 0 && (
                          <div className="text-rose-400">
                            - Drop {msg.pendingConfirmation.eventsToRemove.length} event(s)
                          </div>
                        )}
                      </div>

                      {msg.applied ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-1">
                          <Check className="w-4 h-4" />
                          <span>Applied to schedule & logged to timeline.</span>
                        </div>
                      ) : msg.rejected ? (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium pt-1">
                          <X className="w-4 h-4" />
                          <span>Changes discarded.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() =>
                              onApplyChanges(
                                msg.id,
                                msg.pendingConfirmation!.eventsToAdd,
                                msg.pendingConfirmation!.eventsToUpdate,
                                msg.pendingConfirmation!.eventsToRemove,
                                msg.pendingConfirmation!.changeLog
                              )
                            }
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm & Apply</span>
                          </button>
                          <button
                            onClick={() => onRejectChanges(msg.id)}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            Cancel / Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Draft Message Card */}
                  {msg.draftMessage && (
                    <DraftMessageCard
                      initialDraft={msg.draftMessage}
                      contacts={contacts}
                    />
                  )}

                  <div className="text-[10px] text-neutral-500 mt-1.5 text-right font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-end gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
              TZ
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Twizy is assessing your schedule and constraints...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Row */}
      <div className="px-4 py-2 border-t border-neutral-800/80 bg-neutral-950 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-neutral-500 font-mono shrink-0">Quick ask:</span>
        {[
          "I'm running 20 mins late for class",
          "I'm completely exhausted, what can I drop?",
          "Can I squeeze in gym today without missing graded work?",
          "Where are my free study gaps today?",
        ].map((quickText, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(quickText);
            }}
            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs whitespace-nowrap transition-colors cursor-pointer"
          >
            {quickText}
          </button>
        ))}
      </div>

      {/* Selected Image Thumbnail preview */}
      {selectedImage && (
        <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={selectedImage.base64}
              alt="Preview"
              className="w-10 h-10 object-cover rounded-lg border border-neutral-700"
            />
            <div className="text-xs">
              <div className="font-semibold text-neutral-200 truncate max-w-xs">{selectedImage.name}</div>
              <div className="text-[10px] text-emerald-400">Ready to extract events with Gemini OCR</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Box Bottom Bar */}
      <div className="p-4 bg-neutral-900/95 border-t border-neutral-800">
        <div className="relative flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-2xl p-2 focus-within:border-emerald-500/80 transition-all">
          {/* Image Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-neutral-400 hover:text-emerald-400 hover:bg-neutral-850 transition-colors cursor-pointer shrink-0"
            title="Upload timetable photo or WhatsApp screenshot"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Voice Input Button */}
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'text-neutral-400 hover:text-emerald-400 hover:bg-neutral-850'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Speak message (Web Speech API)'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your voice...'
                : 'Tell Twizy what happened, paste an update, or upload screenshot...'
            }
            rows={1}
            className="flex-1 bg-transparent border-0 text-xs md:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none resize-none py-1.5 max-h-24 font-sans"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all cursor-pointer shadow-md shadow-emerald-900/30 shrink-0"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 px-1">
          <span>Voice & Screenshot OCR enabled</span>
          <span className="font-mono">Timezone: Asia/Calcutta</span>
        </div>
      </div>
    </div>
  );
};
