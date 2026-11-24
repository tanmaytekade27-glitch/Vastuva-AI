import React, { useState } from 'react';
import { Send, CheckCircle2, Trash2, MapPin, Mail } from 'lucide-react';
import { ContactMessage } from '../types/vastuva';

interface ContactPageProps {
  messages: ContactMessage[];
  onSubmitMessage: (msg: Omit<ContactMessage, 'id' | 'submittedAt'>) => void;
  onDeleteMessage: (id: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  messages,
  onSubmitMessage,
  onDeleteMessage,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedNotice(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 5) {
      setError('Please write a message of at least 5 characters.');
      return;
    }

    setError(null);
    onSubmitMessage({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    setName('');
    setEmail('');
    setMessage('');
    setSubmittedNotice(
      'Your message has been saved locally in this browser. Thank you for reaching out to The Tech Titans.'
    );
  };

  return (
    <div className="bg-[#FAF7F2] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Info Column */}
          <div className="lg:col-span-5">
            <p className="text-sm font-medium text-[#9F7840]">Contact</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#172B36]">
              Connect With The Tech Titans
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#172B36]/80">
              Have feedback on a floor plan algorithm, 3D model feature, or budget assumption? Send a note below. Since VASTUVA AI runs completely offline without any paid backend or email API, inquiries are stored locally in your browser.
            </p>

            <div className="mt-8 space-y-4 rounded-xl border border-[#172B36]/12 bg-white p-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C49A60]" />
                <div>
                  <p className="font-semibold text-[#172B36]">MITS Gwalior</p>
                  <p className="text-xs text-[#667C70]">
                    Madhav Institute of Technology and Science, Gwalior, Madhya Pradesh
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#C49A60]" />
                <div>
                  <p className="font-semibold text-[#172B36]">Department</p>
                  <p className="text-xs text-[#667C70]">Computer Science and Design (CSD)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-xl border border-[#172B36]/12 bg-white p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl font-bold text-[#172B36]">
                Send a Message
              </h2>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-red-700/25 bg-red-50 px-4 py-3 text-sm text-red-900"
                >
                  {error}
                </div>
              )}

              {submittedNotice && (
                <div
                  role="status"
                  className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#667C70]/40 bg-[#E6ECE8]/70 px-4 py-3 text-sm text-[#172B36]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#667C70]" />
                  <span>{submittedNotice}</span>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-[#172B36]">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-[#172B36]">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-[#172B36]">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your plot requirements, questions, or project feedback..."
                    className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#172B36] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F1E26]"
                >
                  <Send className="h-4 w-4 text-[#C49A60]" />
                  Submit Message
                </button>
              </div>
            </form>

            {/* Locally Stored Inquiries List */}
            {messages.length > 0 && (
              <div className="mt-6 rounded-xl border border-[#172B36]/12 bg-white p-6">
                <h3 className="text-sm font-semibold text-[#172B36]">
                  Saved Local Inquiries ({messages.length})
                </h3>
                <div className="mt-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-[#172B36]/10 bg-[#FAF7F2] p-3.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#172B36]">
                          {m.name} · <span className="font-normal text-[#667C70]">{m.email}</span>
                        </p>
                        <p className="mt-1 text-[#172B36]/85">{m.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(m.id)}
                        aria-label={`Delete message from ${m.name}`}
                        className="shrink-0 rounded p-1.5 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
