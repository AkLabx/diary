import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-700 dark:text-slate-300">
      <div className="max-w-4xl mx-auto p-6 sm:p-12">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">Privacy Policy</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Last Updated: November 10, 2026 | Effective Date: November 10, 2026
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Back to App
          </Link>
        </div>

        <article className="prose prose-slate dark:prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed">
          <p>
            Welcome to <strong>Diary</strong> ("we", "us", or "our"), operated by the Diary Application Team (AkLabx). 
            Your personal privacy and the absolute sanctity of your private thoughts are our primary mission. 
            This Privacy Policy explains how our Zero-Knowledge architecture safeguards your data, details our legal 
            compliance with the <strong>EU General Data Protection Regulation (GDPR)</strong>, the 
            <strong>Indian Digital Personal Data Protection Act 2023 (DPDP Act)</strong>, the 
            <strong>California Consumer Privacy Act (CCPA)</strong>, and outlines our policies under 
            <strong>Google Play Developer Policies</strong>.
          </p>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-lg">
            <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-300 m-0 mb-2">
              The Core Commitment: Zero-Knowledge End-to-End Encryption
            </h3>
            <p className="m-0 text-xs sm:text-sm text-indigo-800 dark:text-indigo-200">
              <strong>We cannot read your diary entries, titles, voice notes, or uploaded photos.</strong> 
              All diary contents and multimedia are encrypted client-side on your device using AES-GCM (256-bit) before transmission. 
              The encryption key is derived directly from your master password using PBKDF2 with SHA-256 (600,000 iterations). 
              Your master password and raw encryption keys never touch our servers or persistent network logs.
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            1. Information We Collect and Process
          </h2>
          <p>We adhere to strict data minimization principles under GDPR Article 5(1)(c) and collect only what is strictly required to deliver the service:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account Identifier:</strong> Your email address, used solely to authenticate your session via Supabase Auth.</li>
            <li><strong>Cryptographic Verification Material:</strong> A random cryptographic salt, a key check value, and its initialization vector (IV) stored in your user profile. These allow your browser to confirm password correctness without our backend ever knowing the password.</li>
            <li><strong>Encrypted Diary Content:</strong> Encrypted ciphertexts (titles, text, journal classification, mood, tags) and IVs stored in database table <code>public.diaries</code>.</li>
            <li><strong>Encrypted Multimedia:</strong> Private encrypted binaries of uploaded photos and voice recordings stored in non-public Supabase storage buckets (<code>diary-images</code>, <code>diary-audio</code>).</li>
            <li><strong>Ephemeral Diagnostics:</strong> Anonymized application crash logs and service worker lifecycle events, strictly stripped of IP addresses, cookies, or personal identifiers.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            2. Lawful Basis for Processing (GDPR Article 6 & 9)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Contractual Necessity (GDPR Art. 6(1)(b)):</strong> Processing your account email and encrypted blobs is necessary to provide the service according to our Terms of Use.</li>
            <li><strong>Explicit Consent (GDPR Art. 6(1)(a) & Art. 9(2)(a)):</strong> If you record reflections touching on personal health, philosophical beliefs, or emotional states, you explicitly consent to the client-side encryption and storage of such data. Because our servers only hold encrypted ciphertext with zero decryption keys, we act strictly as a zero-knowledge data host.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            3. Compliance with the Indian DPDP Act 2023
          </h2>
          <p>For users located in India, we operate in full compliance with the Digital Personal Data Protection Act, 2023:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Consent Withdrawal (Section 6):</strong> You may withdraw consent at any time by deleting your account or clearing local data.</li>
            <li><strong>Right to Grievance Redressal (Section 13):</strong> You may file a grievance with our designated Grievance Officer (contact below). We commit to acknowledging receipt within 48 hours and resolving grievances within 30 days.</li>
            <li><strong>Processing of Children’s Data (Section 9):</strong> The service is not directed to individuals under 18 years of age. We do not track, profile, or target advertisements to minors. If an underage user creates an account without verified parental consent, we will permanently purge the account upon notification.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            4. Self-Service Account Deletion & Right to Erasure (Google Play & GDPR Art. 17)
          </h2>
          <p>
            You have the absolute right to permanently delete your account and all associated data at any time:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>In-App Self-Service:</strong> Navigate to <em>Profile & Settings → Danger Zone → Delete Account & All Data</em>. Confirming deletion immediately executes an atomic cascade that purges your user profile, all database records, and all storage files.</li>
            <li><strong>Public Web Deletion Portal:</strong> Per Google Play policies, you do not need the mobile app installed to request deletion. You can access our public web portal at <Link to="/delete-account" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">#/delete-account</Link> to delete your account or submit a deletion request.</li>
            <li><strong>Zero Data Retention:</strong> Once deleted, zero encrypted files, backups, or account credentials remain on our servers.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            5. Complete Data Portability (GDPR Article 20)
          </h2>
          <p>
            You own 100% of your data. You may download a complete archive of your diary at any time from <em>Profile & Settings → Export Data</em>. 
            The export generates a standard ZIP archive containing human-readable monthly JSON files along with all decrypted photos (WebP) and audio notes (WebM).
          </p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            6. Subprocessors and Third-Party Infrastructure
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase Inc.:</strong> Cloud database, storage, and authentication provider. Governed by enterprise Data Processing Agreements (DPA) and SOC2 Type II compliance.</li>
            <li><strong>Weather Providers (OpenWeatherMap / Open-Meteo):</strong> Used ephemerally to fetch weather conditions if location permissions are granted. IP addresses and GPS coordinates are never retained or linked to your user identity.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8">
            7. Designated Data Protection Officer (DPO) & Grievance Contact
          </h2>
          <p>
            If you have questions, data subject requests, or grievances under GDPR, CCPA, or DPDP Act 2023, contact our designated officer:
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
            <p className="font-semibold text-slate-800 dark:text-slate-100 m-0">Data Protection & Grievance Officer</p>
            <p className="m-0 mt-1">Name: Aalok (AkLabx Legal & Privacy)</p>
            <p className="m-0 mt-1">Email: <a href="mailto:dpo@diaryapp.com" className="text-indigo-600 dark:text-indigo-400 underline">dpo@diaryapp.com</a></p>
            <p className="m-0 mt-1">Support Inquiries: <a href="mailto:privacy@diaryapp.com" className="text-indigo-600 dark:text-indigo-400 underline">privacy@diaryapp.com</a></p>
            <p className="m-0 mt-1">Address: Bengaluru, Karnataka, India</p>
            <p className="m-0 mt-1">Response Commitment: Acknowledgement within 48 hours; resolution within 30 days.</p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
