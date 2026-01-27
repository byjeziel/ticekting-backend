import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export interface QRCodeData {
  ticketId: string;
  bookingReference: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  quantity: number;
  customerEmail: string;
  secret: string;
}

export class QRCodeUtil {
  static async generateQRCode(data: QRCodeData): Promise<{ qrCode: string; secret: string }> {
    const secret = randomBytes(32).toString('hex');
    
    const qrData = {
      ...data,
      secret,
      timestamp: new Date().toISOString(),
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    
    return { qrCode, secret };
  }

  static async verifyQRCode(qrDataString: string): Promise<QRCodeData | null> {
    try {
      const qrData = JSON.parse(qrDataString);
      
      // Basic validation
      if (!qrData.ticketId || !qrData.bookingReference || !qrData.secret) {
        return null;
      }

      return qrData as QRCodeData;
    } catch (error) {
      return null;
    }
  }

  static generateEmailVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }
}
