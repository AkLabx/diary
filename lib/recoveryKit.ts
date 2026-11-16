import { jsPDF } from "jspdf";

export interface RecoveryKitData {
  email: string;
  salt: string;
  rawKey: string;
}

export interface RecoveryKitOptions {
  pdfPassword?: string;
}

/**
 * Formats a raw Base64 encryption key into human-readable 4-character tokens.
 * E.g., "ABCD-EFGH-IJKL-..."
 */
export function formatRecoveryKeyTokens(rawKey: string): string {
  if (!rawKey) return '';
  const cleaned = rawKey.replace(/\s+/g, '');
  return cleaned.match(/.{1,4}/g)?.join('-') || cleaned;
}

/**
 * Generates and downloads the Diary Emergency Recovery Sheet as a PDF document.
 * Plaintext master password is never stored or written to disk.
 */
export const generateRecoveryKit = (data: RecoveryKitData, options?: RecoveryKitOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // --- Styles ---
  const primaryColor = "#4F46E5"; // Indigo 600
  const textColor = "#334155"; // Slate 700
  const codeColor = "#0F172A"; // Slate 900
  
  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text("Diary Emergency Recovery Sheet", margin, 30);
  
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 38);

  // --- Warning Box ---
  doc.setDrawColor(239, 68, 68); // Red 500
  doc.setLineWidth(0.5);
  doc.rect(margin, 48, pageWidth - (margin * 2), 26);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // Red 600
  doc.text("⚠️ EXTREMELY SENSITIVE DOCUMENT", margin + 5, 57);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor);
  doc.text("This document contains your Vault Encryption Keys and Cryptographic Salt.", margin + 5, 64);
  doc.text("Keep it safe. If you lose your password, this is the ONLY way to mathematically restore your encrypted data.", margin + 5, 70);

  // --- Account Info Section ---
  let yPos = 88;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(codeColor);
  doc.text("1. Account Identification", margin, yPos);
  
  yPos += 9;
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text("Email Address:", margin, yPos);
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(codeColor);
  doc.text(data.email, margin + 35, yPos);

  yPos += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#64748B");
  doc.text("Cryptographic Salt:", margin, yPos);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(codeColor);
  doc.text(data.salt, margin, yPos + 6);

  // --- Emergency Key Section ---
  yPos += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(codeColor);
  doc.text("2. Emergency Recovery Key Tokens", margin, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor);
  doc.text("These formatted key tokens represent your raw 256-bit AES-GCM master vault key.", margin, yPos);
  doc.text("They allow direct client-side decryption even if the password is lost or verification fails.", margin, yPos + 5);

  const formattedTokens = formatRecoveryKeyTokens(data.rawKey);

  // Key Tokens Box
  yPos += 12;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(margin, yPos, pageWidth - (margin * 2), 22, 'F');
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(codeColor);
  const lines = doc.splitTextToSize(formattedTokens, pageWidth - (margin * 2) - 10);
  doc.text(lines, margin + 5, yPos + 9);

  // Raw Key String
  yPos += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#64748B");
  doc.text("Raw Base64 Key:", margin, yPos);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(codeColor);
  doc.text(data.rawKey, margin, yPos + 6);

  // --- Footer ---
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor("#94A3B8");
  doc.text("Diary App - Zero Knowledge Architecture (No Cleartext Passwords Stored)", pageWidth / 2, 280, { align: "center" });

  // Optional PDF encryption if supported
  if (options?.pdfPassword && typeof (doc as any).setEncryption === 'function') {
    try {
      (doc as any).setEncryption({
        userPassword: options.pdfPassword,
        ownerPassword: options.pdfPassword,
        userPermissions: ['print']
      });
    } catch {
      /* ignore encryption error */
    }
  }

  doc.save("Diary-Emergency-Recovery-Sheet.pdf");
};
