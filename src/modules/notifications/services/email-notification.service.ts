import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Initialized SMTP Email Transporter for ${host}:${port}`);
    } else {
      this.logger.warn(
        'SMTP Environment variables missing. Email notification fallback mode active.',
      );
    }
  }

  /**
   * Universal branded HTML email wrapper.
   */
  private buildBrandedHtml(
    title: string,
    contentHtml: string,
    actionButton?: { text: string; url: string },
    badgeColor: string = '#2e7d32',
  ): string {
    const buttonHtml = actionButton
      ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionButton.url}" target="_blank" style="background-color: ${badgeColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ${actionButton.text}
        </a>
      </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
          .header { background: ${badgeColor}; padding: 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px; color: #333333; line-height: 1.6; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>♻️ Waste Management AI</h1>
            <div style="font-size: 16px; margin-top: 8px; opacity: 0.9;">${title}</div>
          </div>
          <div class="content">
            ${contentHtml}
            ${buttonHtml}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Waste Management Platform. All rights reserved.</p>
            <p>This is an automated system email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Waste Management AI" <noreply@wastemanagement.ai>',
          to,
          subject,
          html: htmlContent,
        });
        this.logger.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    this.logger.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return { success: true, mock: true };
  }

  /**
   * Custom Template 1: Branded Monthly Invoice Email
   */
  async sendInvoiceEmail(
    to: string,
    invoiceData: {
      invoiceNumber: string;
      billingPeriod: string;
      totalAmount: number;
      dueDate: string;
      paymentUrl?: string;
    },
  ) {
    const title = `Monthly Waste Services Invoice #${invoiceData.invoiceNumber}`;
    const contentHtml = `
      <p>Dear Valued Resident / Customer,</p>
      <p>Your waste services invoice for <strong>${invoiceData.billingPeriod}</strong> is now available.</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Billing Period:</strong> ${invoiceData.billingPeriod}</p>
        <p style="margin: 5px 0;"><strong>Total Amount Due:</strong> <span style="font-size: 18px; color: #2e7d32; font-weight: bold;">₹${invoiceData.totalAmount.toFixed(2)}</span></p>
        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
      </div>

      <p>Please pay your invoice before the due date to avoid service interruption or late payment charges.</p>
    `;

    const html = this.buildBrandedHtml(
      title,
      contentHtml,
      invoiceData.paymentUrl
        ? { text: 'Pay Invoice Online', url: invoiceData.paymentUrl }
        : undefined,
      '#2e7d32',
    );

    return this.sendEmail(to, title, html);
  }

  /**
   * Custom Template 2: Red Alert Compliance Expiry Warning Email
   */
  async sendComplianceExpiryWarningEmail(
    to: string,
    documentData: {
      documentType: string;
      policyOrDocNumber: string;
      targetEntity: string; // Vehicle Registration or Driver Name
      expiryDate: string;
      renewUrl?: string;
    },
  ) {
    const title = `🚨 URGENT: Compliance Document Expired / Expiring Soon`;
    const contentHtml = `
      <p>Attention Fleet Manager / Operations Team,</p>
      <p>The following compliance document requires immediate renewal attention:</p>
      
      <div style="background: #fff5f5; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Document Type:</strong> ${documentData.documentType}</p>
        <p style="margin: 5px 0;"><strong>Document / Policy #:</strong> ${documentData.policyOrDocNumber}</p>
        <p style="margin: 5px 0;"><strong>Assigned Entity:</strong> ${documentData.targetEntity}</p>
        <p style="margin: 5px 0;"><strong>Expiration Date:</strong> <span style="color: #dc3545; font-weight: bold;">${documentData.expiryDate}</span></p>
      </div>

      <p style="color: #dc3545;"><strong>Note:</strong> Non-compliant vehicles and drivers are automatically blocked from shift assignment by the Smart Compliance Guard.</p>
    `;

    const html = this.buildBrandedHtml(
      title,
      contentHtml,
      documentData.renewUrl
        ? { text: 'Upload Renewal Document', url: documentData.renewUrl }
        : undefined,
      '#dc3545',
    );

    return this.sendEmail(to, title, html);
  }
}
