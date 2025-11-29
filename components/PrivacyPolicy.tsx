import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-serif text-slate-700 dark:text-slate-300">
      <div className="max-w-4xl mx-auto p-8 sm:p-12">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: October 26, 2024</p>

        <article className="prose prose-lg dark:prose-invert mt-8 max-w-none">
            <p>Welcome to Diary. Your privacy is critically important to us. This Privacy Policy outlines how your personal information is handled in our application.</p>
            
            <h2>The Core Principle: End-to-End Encryption</h2>
            <p>The single most important thing to know about your privacy in this application is that <strong>we cannot read your diary entries.</strong> All your entries are end-to-end encrypted on your device before they are sent to our servers for storage. This means:</p>
            <ul>
                <li>Your diary entries (titles and content) are encrypted using a key derived from a password only you know.</li>
                <li>This password is never sent to our servers or stored anywhere.</li>
                <li>The encryption and decryption happens exclusively on your device (in your browser).</li>
                <li>Because we do not have your key, we cannot decrypt your data, and therefore cannot read it, share it, or provide it to any third party.</li>
            </ul>

            <h2>Information We Collect</h2>
            <p>We collect the absolute minimum information required to provide the service:</p>
            <ul>
                <li><strong>Account Information:</strong> We store your email address for authentication purposes, provided by you or through a third-party OAuth provider like Google.</li>
                <li><strong>Encryption Materials:</strong> We store your salt and a key-check value. These are used to verify your password during login but cannot be used to derive your password or encryption key.</li>
                <li><strong>Encrypted Diary Data:</strong> Your diary entries are stored on our servers in an encrypted, unreadable format. We also store the associated Initialization Vector (IV), which is necessary for decryption but does not compromise security.</li>
                <li><strong>Metadata:</strong> To provide features like the calendar view and search, we store non-sensitive metadata such as entry creation dates, tags, and moods in an unencrypted format.</li>
            </ul>

            <h2>How We Use Your Information ?</h2>
            <p>The information we collect is used solely to:</p>
            <ul>
                <li>Provide, operate, and maintain the Diary service.</li>
                <li>Authenticate your access to your account.</li>
                <li>Securely store and retrieve your encrypted data.</li>
            </ul>
            <p>We do not analyze, profile, or sell your data. We cannot read it, so we cannot use it for advertising or any other purpose.</p>

            <h2>Third-Party Services</h2>
            <ul>
                <li><strong>Supabase:</strong> We use Supabase for our backend, which includes database storage and authentication. All data stored in the database is subject to the security principles described above.</li>
                <li><strong>OpenWeatherMap:</strong> If you grant location access, we use your coordinates to fetch weather data from OpenWeatherMap. Your precise location is not stored by us.</li>
            </ul>

            <h2>Your Rights</h2>
            <p>You have full control over your data.</p>
            <ul>
                <li><strong>Data Export:</strong> You can export all of your diary entries in a human-readable JSON format at any time from the Profile & Settings page.</li>
                <li><strong>Data Deletion:</strong> You can delete individual entries or your entire account. Deleting your account will permanently remove all associated data from our servers.</li>
            </ul>

            <h2>Data Security</h2>
            <p>We implement industry-standard security measures, including robust Row Level Security policies on our database, to prevent unauthorized access to your account metadata and encrypted data. However, the ultimate security of your diary rests on the strength and secrecy of your password. <strong>If you lose your password, your data is irrecoverable, as we have no way to decrypt it for you.</strong></p>

            <h2>Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us.</p>
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;