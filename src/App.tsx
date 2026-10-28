/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  Contact,
  StudentPreferences,
  TwizyEvent,
  TwizyResponse,
} from './types';
import {
  getIndiaTodayString,
  getIndiaTimeString,
  getInitialSchedule,
  INITIAL_CHANGE_LOG,
  INITIAL_CONTACTS,
  INITIAL_PREFERENCES,
} from './utils/demoData';
import { applyScheduleChanges, getUpcomingMustAttendEvent, timeToMinutes } from './utils/scheduleRules';
import { TopNav } from './components/TopNav';
import { ChatArea } from './components/ChatArea';
import { TimelinePanel } from './components/TimelinePanel';
import { FakeCallModal } from './components/FakeCallModal';
import { ContactsModal } from './components/ContactsModal';
import { PreferencesModal } from './components/PreferencesModal';

export default function App() {
  // App State: Session memory with localStorage persistence
  const [schedule, setSchedule] = useState<TwizyEvent[]>(() => {
    try {
      const saved = localStorage.getItem('twizy_schedule');
      return saved ? JSON.parse(saved) : getInitialSchedule();
    } catch (e) {
      return getInitialSchedule();
    }
  });

  const [changeLog, setChangeLog] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('twizy_change_log');
      return saved ? JSON.parse(saved) : INITIAL_CHANGE_LOG;
    } catch (e) {
      return INITIAL_CHANGE_LOG;
    }
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('twizy_contacts');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch (e) {
      return INITIAL_CONTACTS;
    }
  });

  const [preferences, setPreferences] = useState<StudentPreferences>(() => {
    try {
      const saved = localStorage.getItem('twizy_preferences');
      return saved ? JSON.parse(saved) : INITIAL_PREFERENCES;
    } catch (e) {
      return INITIAL_PREFERENCES;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      sender: 'twizy',
      text: "I'm Twizy. Your calendar remembers, I react. I see a graded DS lab at 10:30 and an OS assignment deadline tonight. Don't slack. What's changed?",
      timestamp: getIndiaTimeString(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline'>('chat');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Modals state
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Fake Call Feature state
  const [activeCallEvent, setActiveCallEvent] = useState<TwizyEvent | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const calledEventIdsRef = useRef<Set<string>>(new Set());

  // Current Date in Asia/Calcutta
  const currentDate = getIndiaTodayString();

  // Persist to session / local cache
  useEffect(() => {
    try {
      localStorage.setItem('twizy_schedule', JSON.stringify(schedule));
      localStorage.setItem('twizy_change_log', JSON.stringify(changeLog));
      localStorage.setItem('twizy_contacts', JSON.stringify(contacts));
      localStorage.setItem('twizy_preferences', JSON.stringify(preferences));
    } catch (e) {
      // ignore
    }
  }, [schedule, changeLog, contacts, preferences]);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 30-second interval check for must-attend upcoming events within 20 mins
  useEffect(() => {
    const checkUpcomingMustAttend = () => {
      const nowTimeStr = getIndiaTimeString();
      const nowMins = timeToMinutes(nowTimeStr);
      const todayStr = getIndiaTodayString();

      const candidate = getUpcomingMustAttendEvent(
        schedule,
        todayStr,
        nowMins,
        calledEventIdsRef.current
      );

      if (candidate) {
        calledEventIdsRef.current.add(candidate.id);
        setActiveCallEvent(candidate);
        setIsCallOpen(true);
      }
    };

    // Run check immediately and every 30 seconds
    checkUpcomingMustAttend();
    const interval = setInterval(checkUpcomingMustAttend, 30000);
    return () => clearInterval(interval);
  }, [schedule]);

  // Handle stage trigger / manual simulate call
  const handleSimulateCall = (customEvent?: TwizyEvent) => {
    const target =
      customEvent ||
      schedule.find((e) => e.must_attend) ||
      schedule[0] || {
        id: 'sim-' + Date.now(),
        title: 'DS Graded Lab & Viva Exam',
        date: currentDate,
        start_time: '10:30',
        duration_minutes: 120,
        type: 'graded',
        priority: 5,
        must_attend: true,
        source: 'Simulated Demo',
        location: 'Lab 4B - Systems Wing',
      };

    setActiveCallEvent(target);
    setIsCallOpen(true);
  };

  // Append to change log with timestamp
  const handleAddChangeLog = (entry: string) => {
    const time = getIndiaTimeString();
    setChangeLog((prev) => [`${time} IST: ${entry}`, ...prev]);
  };

  // Send message to Gemini server API
  const handleSendMessage = async (text: string, imageBase64?: string, imageMime?: string) => {
    const userMsgId = 'u-' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || (imageBase64 ? 'Extracted image details:' : ''),
      image: imageBase64,
      timestamp: getIndiaTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          schedule,
          preferences,
          currentDate,
          currentTime: getIndiaTimeString(),
          timezone: 'Asia/Calcutta',
          imageBase64,
          imageMimeType: imageMime,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TwizyResponse = await response.json();

      const twizyMsgId = 'tz-' + Date.now();
      const responseText = data.error ? `${data.reply}\n\nError: ${data.error}` : data.reply;
      const hasPendingChanges =
        (data.events_to_add && data.events_to_add.length > 0) ||
        (data.events_to_update && data.events_to_update.length > 0) ||
        (data.events_to_remove && data.events_to_remove.length > 0);

      // Check if needs confirmation
      if (data.needs_confirmation && hasPendingChanges) {
        const summaryItems: string[] = [];
        if (data.events_to_add?.length) {
          summaryItems.push(`add ${data.events_to_add.map((e) => e.title).join(', ')}`);
        }
        if (data.events_to_update?.length) {
          summaryItems.push(
            `reschedule ${data.events_to_update.map((e) => `${e.title} to ${e.start_time}`).join(', ')}`
          );
        }
        if (data.events_to_remove?.length) {
          summaryItems.push(`drop ${data.events_to_remove.length} event(s)`);
        }

        const summaryText = `Got it: ${summaryItems.join('; ')}, right?`;

        setMessages((prev) => [
          ...prev,
          {
            id: twizyMsgId,
            sender: 'twizy',
            text: responseText,
            timestamp: getIndiaTimeString(),
            pendingConfirmation: {
              eventsToAdd: data.events_to_add || [],
              eventsToUpdate: data.events_to_update || [],
              eventsToRemove: data.events_to_remove || [],
              changeLog: data.change_log || [],
              summary: summaryText,
            },
            draftMessage: data.draft_message || undefined,
            askUser: data.ask_user || undefined,
          },
        ]);
      } else {
        // Direct apply if no confirmation needed
        if (hasPendingChanges) {
          applyScheduleUpdates(
            data.events_to_add || [],
            data.events_to_update || [],
            data.events_to_remove || []
          );
        }
        if (data.change_log && data.change_log.length > 0) {
          data.change_log.forEach((log) => handleAddChangeLog(log));
        }

        setMessages((prev) => [
          ...prev,
          {
            id: twizyMsgId,
            sender: 'twizy',
            text: responseText,
            timestamp: getIndiaTimeString(),
            draftMessage: data.draft_message || undefined,
            askUser: data.ask_user || undefined,
          },
        ]);
      }

      // Update preferences if provided
      if (data.preferences_update) {
        setPreferences((prev) => ({
          ...prev,
          ...data.preferences_update,
        }));
      }
    } catch (err) {
      console.error('Twizy Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'twizy',
          text: "Campus network hiccup. Your fixed classes and graded blocks remain locked. Try again or check the schedule.",
          timestamp: getIndiaTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyScheduleUpdates = (
    toAdd: TwizyEvent[],
    toUpdate: TwizyEvent[],
    toRemove: string[]
  ) => {
    setSchedule((prev) => applyScheduleChanges(prev, toAdd, toUpdate, toRemove));
  };

  const handleApplyPendingChanges = (
    msgId: string,
    toAdd: TwizyEvent[],
    toUpdate: TwizyEvent[],
    toRemove: string[],
    newLogs: string[]
  ) => {
    applyScheduleUpdates(toAdd, toUpdate, toRemove);
    newLogs.forEach((l) => handleAddChangeLog(l));

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  const handleRejectPendingChanges = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, rejected: true } : m))
    );
    handleAddChangeLog('User declined proposed schedule modifications.');
  };

  const handleLoadSampleWhatsApp = () => {
    handleSendMessage('DS class tomorrow moved to 3 PM, assignment submission now Friday 5 PM.');
  };

  const todayEventsCount = schedule.filter((e) => e.date === currentDate).length;

  return (
    <div className={`h-screen w-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden ${
      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
    }`}>
      {/* Top Bar */}
      <TopNav
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenContacts={() => setIsContactsOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onSimulateCall={() => handleSimulateCall()}
        todayEventCount={todayEventsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Chat Area (Left/Center) */}
        <section
          className={`flex-1 h-full min-h-0 ${
            activeTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          <ChatArea
            messages={messages}
            contacts={contacts}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onApplyChanges={handleApplyPendingChanges}
            onRejectChanges={handleRejectPendingChanges}
            onSimulateCall={() => handleSimulateCall()}
            onLoadSampleWhatsApp={handleLoadSampleWhatsApp}
            onOpenContacts={() => setIsContactsOpen(true)}
          />
        </section>

        {/* Right Panel: Today Timeline & What Changed Log */}
        <section
          className={`w-full md:w-[420px] lg:w-[480px] h-full min-h-0 shrink-0 ${
            activeTab === 'timeline' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          <TimelinePanel
            schedule={schedule}
            changeLog={changeLog}
            currentDate={currentDate}
            onUpdateSchedule={setSchedule}
            onAddChangeLog={handleAddChangeLog}
            onTriggerFakeCall={(evt) => handleSimulateCall(evt)}
          />
        </section>
      </main>

      {/* Full-Screen Simulated Fake Call Modal */}
      <FakeCallModal
        event={activeCallEvent}
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
      />

      {/* Contacts Modal */}
      <ContactsModal
        contacts={contacts}
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        onSaveContacts={setContacts}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        preferences={preferences}
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        onSavePreferences={setPreferences}
      />
    </div>
  );
}
