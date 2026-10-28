import React, { useState, useEffect } from 'react';
import { X, UserCheck, CreditCard, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Member } from '../../types';
import { useHomeGuard } from '../../context/HomeGuardContext';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: Member | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
}) => {
  const { addMember, updateMember } = useHomeGuard();

  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('Resident');
  const [isAllowed, setIsAllowed] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setUid(memberToEdit.uid);
      setRole(memberToEdit.role);
      setIsAllowed(memberToEdit.isAllowed);
      setNotes(memberToEdit.notes || '');
    } else {
      setName('');
      setUid('');
      setRole('Resident');
      setIsAllowed(true);
      setNotes('');
    }
    setError(null);
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Member name is required.');
      return;
    }
    if (!uid.trim()) {
      setError('RFID UID Hex is required (e.g. E2:7B:44:90).');
      return;
    }

    // Clean up UID format: capitalize, keep valid hex and colons
    const formattedUid = uid.trim().toUpperCase();

    if (memberToEdit) {
      updateMember({
        ...memberToEdit,
        name: name.trim(),
        uid: formattedUid,
        role: role.trim(),
        isAllowed,
        notes: notes.trim(),
      });
    } else {
      addMember({
        name: name.trim(),
        uid: formattedUid,
        role: role.trim(),
        isAllowed,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-charcoal-850">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {memberToEdit ? 'Edit Member Profile' : 'Register New Member'}
              </h3>
              <p className="text-xs text-slate-400">
                Assign human name and RFID card UID for door access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Human-Readable Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Rivera or Member 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-charcoal-900 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              RFID Card UID (Hex string from RC522)
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="e.g. E2:7B:44:90 or 93 F1 82 1C"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-charcoal-900 border border-surface-border rounded-xl text-xs font-mono text-teal-300 placeholder-slate-500 focus:outline-none focus:border-teal-500 uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Matches against raw UID emitted by the STM32 RC522 SPI scanner.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Role / Designation</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-charcoal-900 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="Primary Resident">Primary Resident</option>
                <option value="Family Member">Family Member</option>
                <option value="Guest">Guest</option>
                <option value="Project Evaluator">Project Evaluator</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Access Authorization</label>
              <button
                type="button"
                onClick={() => setIsAllowed(!isAllowed)}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center space-x-2 transition-colors ${
                  isAllowed
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                    : 'bg-red-500/15 border-red-500/40 text-red-300'
                }`}
              >
                {isAllowed ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="font-semibold">{isAllowed ? 'Authorized' : 'Blocked'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Optional Notes</label>
            <input
              type="text"
              placeholder="e.g. Master blue token fob, dorm qualifier tag..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-charcoal-900 border border-surface-border rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Form buttons */}
          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors shadow-sm"
            >
              {memberToEdit ? 'Save Changes' : 'Register Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
