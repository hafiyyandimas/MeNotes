import { useState } from 'react';
import { Check, Copy, GraduationCap, Hash, Users } from 'lucide-react';
import { studentProfile } from '../data/studentProfile';

export default function AboutPage() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyNim() {
    try {
      await navigator.clipboard.writeText(studentProfile.nim);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2500);
    }
  }

  return (
    <section className="page about-page">
      <div className="page-heading">
        <div><p className="eyebrow">THE PERSON BEHIND THE NOTES</p><h1>A little about me<span className="heading-period">.</span></h1></div>
      </div>
      <div className="profile-card">
        <div className="profile-cover"><span className="cover-orbit orbit-one" /><span className="cover-orbit orbit-two" /><span className="avatar">HW</span></div>
        <div className="profile-content">
          <p className="eyebrow">STUDENT PROFILE</p>
          <h2>{studentProfile.name}</h2>
          <div className="profile-facts">
            <div className="profile-fact"><span className="fact-icon"><Hash size={16} /></span><span><small>NIM</small><strong>{studentProfile.nim}</strong></span><button type="button" className="copy-button" onClick={copyNim} aria-label="Copy student number">{copied ? <Check size={15} /> : <Copy size={15} />}</button></div>
            <div className="profile-fact"><span className="fact-icon"><Users size={16} /></span><span><small>Kelompok</small><strong>{studentProfile.group}</strong></span></div>
            <div className="profile-fact"><span className="fact-icon"><GraduationCap size={16} /></span><span><small>Shift</small><strong>{studentProfile.shift}</strong></span></div>
          </div>
          {(copied || copyError) && <span className="copy-feedback" role="status">{copied ? 'NIM copied' : 'Clipboard unavailable'}</span>}
        </div>
      </div>
      <div className="about-app-card">
        <div className="about-app-icon">i</div>
        <div><p className="eyebrow">ABOUT THIS APP</p><h2>Personal notes</h2><p>MeNotes adalah aplikasi note personal untuk tugas responsi PPB Modul 5.</p></div>
      </div>
    </section>
  );
}
