import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendTicketEmail(
    to: string,
    ticketData: {
      bookingReference: string;
      eventTitle: string;
      eventDate: string;
      eventTime: string;
      quantity: number;
      totalPrice: number;
      currency: string;
      qrCode: string;
      emailVerificationToken: string;
    }
  ) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${ticketData.emailVerificationToken}`;
    
    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to,
      subject: `Your Tickets for ${ticketData.eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Event Tickets</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Event Details</h3>
            <p><strong>Event:</strong> ${ticketData.eventTitle}</p>
            <p><strong>Date:</strong> ${new Date(ticketData.eventDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${ticketData.eventTime}</p>
            <p><strong>Quantity:</strong> ${ticketData.quantity} ticket(s)</p>
            <p><strong>Total Paid:</strong> ${ticketData.currency} ${ticketData.totalPrice}</p>
            <p><strong>Booking Reference:</strong> ${ticketData.bookingReference}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #333;">Your QR Code</h3>
            <p style="color: #666;">Please present this QR code at the event entrance</p>
            <img src="${ticketData.qrCode}" alt="Event QR Code" style="max-width: 200px; border: 2px solid #ddd; border-radius: 8px;">
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Important: Email Verification Required</h4>
            <p style="color: #856404; margin-bottom: 15px;">
              Before you can access your tickets, you must verify your email address. 
              This ensures you have access to your ticket information.
            </p>
            <a href="${verificationUrl}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't purchase these tickets, please contact our support team immediately.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendEmailVerification(
    to: string,
    verificationToken: string,
    eventName: string
  ) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to,
      subject: 'Verify Your Email for Event Tickets',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          
          <p>Thank you for purchasing tickets for <strong>${eventName}</strong>.</p>
          
          <p>To ensure you have access to your ticket information, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666;">This link will expire in 24 hours.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}
