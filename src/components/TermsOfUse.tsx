import React from 'react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-serif text-slate-700 dark:text-slate-300">
      <div className="max-w-4xl mx-auto p-8 sm:p-12">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">Terms of Use</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: October 26, 2024</p>

        <article className="prose prose-lg dark:prose-invert mt-8 max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using the Diary application ("Service"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of the terms, then you may not access the Service.</p>

            <h2>2. User Accounts and Security</h2>
            <p>To use the Service, you must create an account. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
            <p><strong>Crucially, our service is end-to-end encrypted. Your password is your key. We do not store your password and have no way to recover it. If you lose your password, you will permanently lose access to all of your data.</strong> You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

            <h2>3. User Content</h2>
            <p>You retain full ownership of all the content, including text and metadata, that you create in your diary ("User Content"). We claim no ownership rights over your User Content.</p>
            <p>You are solely responsible for the User Content that you post on or through the Service. You represent and warrant that the posting of your User Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person.</p>

            <h2>4. Prohibited Conduct</h2>
            <p>You agree not to use the Service for any unlawful purpose or to engage in any activity that is illegal, harmful, or otherwise objectionable. You may not use the Service to store or transmit any content that is infringing, libelous, or otherwise unlawful or tortious, or to store or transmit material in violation of third-party privacy rights.</p>
            
            <h2>5. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may do so by signing out and deleting your account, which will result in the permanent deletion of your data.</p>
            
            <h2>6. Disclaimers</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>

            <h2>7. Limitation of Liability</h2>
            <p>In no event shall Diary, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>
            
            <h2>8. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
            
            <h2>Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us.</p>
        </article>
      </div>
    </div>
  );
};

export default TermsOfUse;