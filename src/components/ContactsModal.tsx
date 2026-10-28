import React, { useState } from 'react';
import { Contact, Tone } from '../types';
import { X, UserPlus, Phone, Mail, Trash2, Edit3, Save, Users } from 'lucide-react';

interface ContactsModalProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSaveContacts: (contacts: Contact[]) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  contacts,
  isOpen,
  onClose,
  onSaveContacts,
}) => {
  const [list, setList] = useState<Contact[]>(contacts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    defaultTone: 'casual',
  });
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = (id: string, field: keyof Contact, value: string) => {
    setList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDelete = (id: string) => {
    const updated = list.filter((c) => c.id !== id);
    setList(updated);
    onSaveContacts(updated);
  };

  const handleSaveNew = () => {
    if (!newContact.name) return;
    const created: Contact = {
      id: 'c-' + Date.now(),
      name: newContact.name || 'Contact',
      phone: newContact.phone || '919900000000',
      email: newContact.email || 'contact@example.com',
      relationship: newContact.relationship || 'Peer',
      defaultTone: (newContact.defaultTone as Tone) || 'casual',
    };
    const updated = [...list, created];
    setList(updated);
    onSaveContacts(updated);
    setIsAdding(false);
    setNewContact({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      defaultTone: 'casual',
    });
  };

  const handleCommitList = () => {
    onSaveContacts(list);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Student Contacts Directory</h2>
              <p className="text-xs text-neutral-400">Used by Twizy to draft delay notices & apologies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {list.map((c) => {
            const isEdit = editingId === c.id;
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 hover:border-neutral-600 transition-colors"
              >
                {isEdit ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleUpdate(c.id, 'name', e.target.value)}
                        placeholder="Name"
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                      />
                      <input
                        type="text"
                        value={c.relationship}
                        onChange={(e) => handleUpdate(c.id, 'relationship', e.target.value)}
                        placeholder="Role / Context"
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={c.phone}
                        onChange={(e) => handleUpdate(c.id, 'phone', e.target.value)}
                        placeholder="Phone / WhatsApp"
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                      />
                      <input
                        type="email"
                        value={c.email}
                        onChange={(e) => handleUpdate(c.id, 'email', e.target.value)}
                        placeholder="Email"
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400">Tone:</span>
                        <select
                          value={c.defaultTone}
                          onChange={(e) => handleUpdate(c.id, 'defaultTone', e.target.value)}
                          className="text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-neutral-200"
                        >
                          <option value="casual">Casual</option>
                          <option value="polite">Polite</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                      <button
                        onClick={handleCommitList}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-200">{c.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-700/80 text-neutral-300">
                          {c.relationship}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                          {c.defaultTone}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          {c.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-500" />
                          {c.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(c.id)}
                        className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Contact"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isAdding && (
            <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-emerald-500/40 space-y-2 mt-3">
              <div className="text-xs font-semibold text-emerald-400">Add New Contact</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. TA, Coach, Friend)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Phone (+91...)"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">Default Tone:</span>
                  <select
                    value={newContact.defaultTone}
                    onChange={(e) => setNewContact({ ...newContact, defaultTone: e.target.value as Tone })}
                    className="text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-neutral-200"
                  >
                    <option value="casual">Casual</option>
                    <option value="polite">Polite</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNew}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium cursor-pointer"
                  >
                    Save Contact
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add New Contact</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
