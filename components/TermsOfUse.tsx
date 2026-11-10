import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-700 dark:text-slate-300">
      <div className="max-w-4xl mx-auto p-6 sm:p-12">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">Terms of Use</h1>
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
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using the <strong>Diary</strong> application ("Service"), operated by the Diary Application Team (AkLabx), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of these terms, you may not access or use the Service.
          </p>

          <h2>2. Age Requirement & Eligibility</h2>
          <p>
            You must be at least 18 years old to create an account or use this Service. By using the Service, you represent and warrant that you are of legal age to form a binding contract. If you are under 18, you may only use the Service with the explicit consent and supervision of a parent or legal guardian.
          </p>

          <h2>3. Zero-Knowledge Cryptography & Password Responsibility</h2>
          <p>
            The Service operates under a strict <strong>Zero-Knowledge end-to-end encryption architecture</strong>. 
            All diary titles, contents, and multimedia are encrypted client-side using AES-GCM (256-bit). 
            Your master password is used to derive your client-side cryptographic key.
          </p>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <strong>CRITICAL NOTICE:</strong> We do not store your master password or encryption keys. 
            There are NO administrative backdoors, password reset options, or recovery keys held by our team. 
            If you lose or forget your master password and have not saved your Recovery Kit, your encrypted data 
            cannot be decrypted by anyone, including our support team or engineers.
          </div>

          <h2>4. User Content Ownership & License</h2>
          <p>
            You retain 100% intellectual property ownership of all diary entries, photos, audio notes, and attachments that you create ("User Content"). We claim zero ownership, copyright, or commercial rights over your User Content. Because your content is encrypted before leaving your device, we do not access, analyze, index, or use your private data for machine learning, advertising, or profiling.
          </p>

          <h2>5. Acceptable Use Policy</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Engage in illegal, harmful, threatening, or fraudulent activities under applicable law.</li>
            <li>Store or transmit malware, viruses, malicious scripts, or attempt to bypass security policies or Row Level Security (RLS) barriers.</li>
            <li>Attempt reverse engineering, denial-of-service (DoS) attacks, or automated scraping of our backend APIs.</li>
          </ul>

          <h2>6. Account Termination & Data Erasure</h2>
          <p>
            You may terminate your account at any time. When you initiate account deletion via the in-app <em>Profile & Settings</em> or our public <Link to="/delete-account" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">#/delete-account</Link> portal, all associated database records, authentication credentials, and cloud storage objects are permanently and irreversibly purged from our servers.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Diary, its developers, affiliates, and suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of encryption keys, or unauthorized access resulting from compromised user devices or weak master passwords. The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.
          </p>

          <h2>8. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of Karnataka, India, without regard to conflict of law principles. Any dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
          </p>

          <h2>9. Contact & Support</h2>
          <p>
            For legal inquiries, dispute notifications, or support, please contact:
          </p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Diary Application Team (AkLabx)<br />
            Email: <a href="mailto:support@diaryapp.com" className="text-indigo-600 dark:text-indigo-400 underline">support@diaryapp.com</a> / <a href="mailto:dpo@diaryapp.com" className="text-indigo-600 dark:text-indigo-400 underline">dpo@diaryapp.com</a><br />
            Address: Bengaluru, Karnataka, India
          </p>
        </article>
      </div>
    </div>
  );
};

export default TermsOfUse;
