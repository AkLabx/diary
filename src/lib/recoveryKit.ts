import { jsPDF } from "jspdf";

interface RecoveryKitData {
    email: string;
    password: string;
    salt: string;
    rawKey: string;
}

export const generateRecoveryKit = (data: RecoveryKitData) => {
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
    doc.text("Diary Recovery Kit", margin, 30);
    
    doc.setFontSize(10);
    doc.setTextColor("#64748B");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 38);

    // --- Warning Box ---
    doc.setDrawColor(239, 68, 68); // Red 500
    doc.setLineWidth(0.5);
    doc.rect(margin, 50, pageWidth - (margin * 2), 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38); // Red 600
    doc.text("⚠️ EXTREMELY SENSITIVE DOCUMENT", margin + 5, 60);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text("This document contains your Master Password and Encryption Keys.", margin + 5, 68);
    doc.text("Keep it safe. If you lose your password, this is the ONLY way to restore your data.", margin + 5, 73);

    // --- Credentials Section ---
    let yPos = 95;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(codeColor);
    doc.text("1. Login Credentials", margin, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor("#64748B"); // Label color
    doc.text("Email Address:", margin, yPos);
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.setTextColor(codeColor);
    doc.text(data.email, margin + 40, yPos);

    yPos += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#64748B");
    doc.text("Master Password:", margin, yPos);
    
    // Password Box
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(margin, yPos + 5, pageWidth - (margin * 2), 15, 'F');
    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.setTextColor(codeColor);
    doc.text(data.password, margin + 5, yPos + 14);

    // --- Technical Section ---
    yPos += 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(codeColor);
    doc.text("2. Emergency Technical Keys", margin, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(textColor);
    doc.text("If the password mechanism ever changes or fails, these raw keys can mathematically", margin, yPos);
    doc.text("decrypt your data using standard AES-GCM algorithms.", margin, yPos + 5);

    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor("#64748B");
    doc.text("Encryption Salt:", margin, yPos);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(codeColor);
    doc.text(data.salt, margin, yPos + 6);
    
    yPos += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#64748B");
    doc.text("Raw Encryption Key (AES-GCM):", margin, yPos);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(codeColor);
    // Split long key text if needed, though Base64 256bit key is usually short enough for one line
    doc.text(data.rawKey, margin, yPos + 6);

    // --- Footer ---
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor("#94A3B8");
    doc.text("Diary App - Zero Knowledge Architecture", pageWidth / 2, 280, { align: "center" });

    doc.save("Diary-Recovery-Kit.pdf");
};
