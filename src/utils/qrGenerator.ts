import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Guest, QRData } from '../types';

/**
 * Generate QR code as data URL for a guest
 */
export const generateQRCode = async (guest: Guest): Promise<string> => {
  const qrData: QRData = {
    id: guest.id,
    name: guest.name,
  };

  return await QRCode.toDataURL(JSON.stringify(qrData), {
    width: 300,
    margin: 2,
    color: {
      dark: '#0D0D0D',
      light: '#F5F5F5',
    },
    errorCorrectionLevel: 'H',
  });
};

/**
 * Generate QR code as data URL with gold accent
 */
export const generateQRCodeGold = async (guest: Guest): Promise<string> => {
  const qrData: QRData = {
    id: guest.id,
    name: guest.name,
  };

  return await QRCode.toDataURL(JSON.stringify(qrData), {
    width: 300,
    margin: 2,
    color: {
      dark: '#D4AF37',
      light: '#0D0D0D',
    },
    errorCorrectionLevel: 'H',
  });
};

/**
 * Download a single QR code as PNG
 */
export const downloadQRCode = async (guest: Guest, gold = false): Promise<void> => {
  try {
    const dataUrl = gold ? await generateQRCodeGold(guest) : await generateQRCode(guest);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `guest_${guest.id}_${guest.name.replace(/\s+/g, '_')}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};

/**
 * Generate and download all QR codes as a PDF
 */
export const generateQRPdf = async (guests: Guest[]): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const cardWidth = (pageWidth - margin * 3) / 2;
  const cardHeight = 60;
  let x = margin;
  let y = margin;
  let count = 0;

  for (const guest of guests) {
    // Add new page if needed
    if (y + cardHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      x = margin;
    }

    // Card background
    const isVIP = guest.category === 'VIP';
    pdf.setFillColor(isVIP ? 0.83 : 0.1, isVIP ? 0.87 : 0.1, isVIP ? 0.22 : 0.1);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

    // White content area
    pdf.setFillColor(1, 1, 1);
    pdf.roundedRect(x + 2, y + 2, cardWidth - 4, cardHeight - 4, 2, 2, 'F');

    // Category badge
    if (isVIP) {
      pdf.setFillColor(0.83, 0.87, 0.22);
      pdf.roundedRect(x + cardWidth - 20, y + 4, 18, 8, 2, 2, 'F');
      pdf.setTextColor(0.1, 0.1, 0.1);
      pdf.setFontSize(7);
      pdf.text('VIP', x + cardWidth - 11, y + 10, { align: 'center' });
    }

    // Generate QR code
    const qrDataUrl = await generateQRCode(guest);

    // Add QR code
    const qrSize = 35;
    pdf.addImage(qrDataUrl, 'PNG', x + 6, y + 10, qrSize, qrSize);

    // Guest name
    pdf.setTextColor(0.1, 0.1, 0.1);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(guest.name, cardWidth - qrSize - 20);
    pdf.text(nameLines, x + qrSize + 10, y + 22);

    // Category text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(guest.category, x + qrSize + 10, y + 32);

    // Guest ID
    pdf.setFontSize(8);
    pdf.setTextColor(0.5, 0.5, 0.5);
    pdf.text(`#${guest.id}`, x + qrSize + 10, y + 40);

    // Event name
    pdf.setFontSize(7);
    pdf.setTextColor(0.7, 0.7, 0.7);
    pdf.text('SASIENALA x WARDAH', x + cardWidth / 2, y + cardHeight - 5, { align: 'center' });

    // Position for next card
    if (x + cardWidth * 2 + margin > pageWidth) {
      x = margin;
      y += cardHeight + margin;
    } else {
      x += cardWidth + margin;
    }

    count++;
  }

  pdf.save('sasie_qr_codes.pdf');
};

/**
 * Parse QR code data
 */
export const parseQRData = (data: string): QRData | null => {
  try {
    const parsed = JSON.parse(data);
    if ('id' in parsed && 'name' in parsed) {
      return parsed as QRData;
    }
  } catch {
    // Try to parse as simple string
    const match = data.match(/id[:\s]+(\d+)/i);
    if (match) {
      return { id: parseInt(match[1]), name: '' };
    }
  }
  return null;
};
