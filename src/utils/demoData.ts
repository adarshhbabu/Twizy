import { Contact, StudentPreferences, TwizyEvent } from '../types';

export function getIndiaTodayString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

export function getIndiaTimeString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date());
  } catch (e) {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

export const INITIAL_PREFERENCES: StudentPreferences = {
  transit_buffer_minutes: 10,
  default_tone: 'casual',
  sleep_start: '00:30',
  wake_up: '08:00',
  auto_gap_finding: true,
};

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Coach Rahul',
    relationship: 'Basketball Coach',
    phone: '+919876543210',
    email: 'rahul.coach@college.edu',
    defaultTone: 'casual',
  },
  {
    id: 'c2',
    name: 'Prof. Sharma',
    relationship: 'Data Structures Professor',
    phone: '+919811223344',
    email: 'sharma.ds@university.ac.in',
    defaultTone: 'formal',
  },
  {
    id: 'c3',
    name: 'Club group',
    relationship: 'Robotics Team Leads',
    phone: '+919800011122',
    email: 'club-leads@college.edu',
    defaultTone: 'casual',
  },
  {
    id: 'c4',
    name: 'Mom',
    relationship: 'Family',
    phone: '+919988776655',
    email: 'mom@home.net',
    defaultTone: 'casual',
  },
];

export function getInitialSchedule(): TwizyEvent[] {
  const today = getIndiaTodayString();
  return [
    {
      id: 'evt-1',
      title: 'Data Structures Lecture (Room 302)',
      date: today,
      start_time: '09:00',
      duration_minutes: 75,
      type: 'class',
      priority: 3,
      must_attend: false,
      source: 'Timetable',
      location: 'Lecture Hall 302',
    },
    {
      id: 'evt-2',
      title: 'DS Graded Lab & Viva Exam',
      date: today,
      start_time: '10:30',
      duration_minutes: 120,
      type: 'graded',
      priority: 5,
      must_attend: true,
      source: 'Course Syllabus',
      location: 'Lab 4B - Systems Wing',
    },
    {
      id: 'evt-3',
      title: 'Quick Canteen Lunch w/ Aryan',
      date: today,
      start_time: '13:00',
      duration_minutes: 45,
      type: 'personal',
      priority: 2,
      must_attend: false,
      source: 'Self',
      location: 'Student Center Canteen',
    },
    {
      id: 'evt-4',
      title: 'Algorithms & Complexity',
      date: today,
      start_time: '14:00',
      duration_minutes: 90,
      type: 'class',
      priority: 4,
      must_attend: false,
      source: 'Timetable',
      location: 'Room 204',
    },
    {
      id: 'evt-5',
      title: 'Varsity Basketball Practice',
      date: today,
      start_time: '16:00',
      duration_minutes: 90,
      type: 'club',
      priority: 3,
      must_attend: false,
      source: 'Coach Rahul',
      location: 'Main Sports Complex Court 2',
    },
    {
      id: 'evt-6',
      title: 'Robotics Club Hackathon Sprint',
      date: today,
      start_time: '18:00',
      duration_minutes: 60,
      type: 'club',
      priority: 3,
      must_attend: false,
      source: 'Club Group',
      location: 'Makerspace Lab',
    },
    {
      id: 'evt-7',
      title: 'OS Assignment 2 LMS Due',
      date: today,
      start_time: '21:00',
      duration_minutes: 15,
      type: 'deadline',
      priority: 5,
      must_attend: true,
      source: 'LMS Portal',
      location: 'Online Portal',
    },
    {
      id: 'evt-8',
      title: 'Work Block: Finish OS Assignment',
      date: today,
      start_time: '21:30',
      duration_minutes: 90,
      type: 'personal',
      priority: 4,
      must_attend: true,
      source: 'Twizy Gap Finder',
      location: 'Hostel Desk',
    },
  ];
}

export const INITIAL_CHANGE_LOG: string[] = [
  '08:15 IST: Locked Graded DS Lab (10:30) into schedule. Auto-declined conflicting informal study group.',
  '08:16 IST: Enforced 10-minute transit buffer between Room 302 and Systems Lab.',
  '08:20 IST: Detected 21:00 OS submission deadline; reserved 90-min uninterrupted work block at 21:30 before sleep.',
];
