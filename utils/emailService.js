import nodemailer from 'nodemailer';
import config from '../config/env.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Send confirmation email to user
export const sendUserConfirmationEmail = async (submission) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"NTCOG Kenya" <${config.email.user}>`,
      to: submission.email,
      subject: 'Submission Received - NTCOG Kenya',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #1E4E9A; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #1E4E9A; padding: 30px 20px; text-align: center;">
            <img src="https://i.postimg.cc/Fzw0M9yc/FIDEL-CHURCH.png" alt="NTCOG Kenya Logo" style="width: 120px; height: auto; margin-bottom: 15px; background: white; padding: 10px; border-radius: 10px;" onerror="this.style.display='none'"/>
            <h1 style="color: white; margin: 0; font-size: 24px;">New Testament Church of God Kenya</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #1E4E9A;">Submission Received Successfully!</h2>
            <p>Dear ${submission.fullName},</p>
            <p>Thank you for your submission. We have received your documents and they are now being processed by our team.</p>
            
            <div style="background-color: white; padding: 20px; border-left: 4px solid #E02020; margin: 20px 0;">
              <h3 style="color: #E02020; margin-top: 0;">Submission Details:</h3>
              <p><strong>Submission ID:</strong> <span style="color: #1E4E9A; font-size: 18px;">${submission.submissionId}</span></p>
              <p><strong>Type:</strong> ${submission.submissionType}</p>
              <p><strong>Subject:</strong> ${submission.subject}</p>
              <p><strong>Branch:</strong> ${submission.branch}</p>
              <p><strong>Region:</strong> ${submission.regionDisplay}</p>
              <p><strong>Priority:</strong> ${submission.urgencyDisplay}</p>
              <p><strong>Files Attached:</strong> ${submission.files.length} file(s)</p>
              <p><strong>Submitted:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
            </div>
            
            <div style="background-color: #E8F4F8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📋 Please save your Submission ID for tracking purposes.</strong></p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul style="color: #666;">
              <li>Your submission will be reviewed by the National Office within 3-5 business days</li>
              <li>You will receive an email notification once your submission has been reviewed</li>
              <li>For urgent matters, please call us at <strong>+254 759 120 222</strong></li>
            </ul>
            
            <p style="margin-top: 30px;">God bless you,<br>
            <strong>NTCOG Kenya National Office</strong></p>
          </div>
          
          <div style="background-color: #1E4E9A; padding: 20px; text-align: center; color: white; font-size: 12px;">
            <img src="https://i.postimg.cc/Fzw0M9yc/FIDEL-CHURCH.png" alt="NTCOG Kenya" style="width: 80px; height: auto; margin-bottom: 10px; background: white; padding: 5px; border-radius: 5px;" onerror="this.style.display='none'"/>
            <p style="margin: 5px 0; font-weight: bold;">New Testament Church of God Kenya</p>
            <p style="margin: 5px 0;">P.O. Box 75, 00502 Karen, Nairobi, Kenya</p>
            <p style="margin: 5px 0;">Phone: +254 759 120 222</p>
            <p style="margin: 5px 0;">Email: info@ntcogk.org</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Confirmation email sent to user:', submission.email);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('✗ Error sending confirmation email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send notification email to admin
export const sendAdminNotificationEmail = async (submission) => {
  try {
    const transporter = createTransporter();
    
    // Admin email - you can add this to .env file
    const adminEmail = process.env.ADMIN_EMAIL || 'info@ntcogk.org';
    
    const mailOptions = {
      from: `"NTCOG Submissions" <${config.email.user}>`,
      to: adminEmail,
      subject: `New Submission - ${submission.submissionType} [${submission.urgencyDisplay}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #E02020; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #E02020; padding: 30px 20px; text-align: center;">
            <img src="https://i.postimg.cc/Fzw0M9yc/FIDEL-CHURCH.png" alt="NTCOG Kenya Logo" style="width: 120px; height: auto; margin-bottom: 15px; background: white; padding: 10px; border-radius: 10px;" onerror="this.style.display='none'"/>
            <h1 style="color: white; margin: 0; font-size: 24px;">New Document Submission</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <div style="background-color: ${submission.urgency === 'urgent' ? '#FEE' : submission.urgency === 'high' ? '#FFF3E0' : '#E8F4F8'}; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
              <h2 style="margin: 0; color: ${submission.urgency === 'urgent' ? '#D32F2F' : submission.urgency === 'high' ? '#F57C00' : '#1976D2'};">
                ${submission.urgencyDisplay} Submission
              </h2>
            </div>
            
            <h3 style="color: #1E4E9A;">Submission Information:</h3>
            <div style="background-color: white; padding: 20px; margin: 20px 0;">
              <p><strong>Submission ID:</strong> <span style="color: #E02020; font-size: 18px;">${submission.submissionId}</span></p>
              <p><strong>Type:</strong> ${submission.submissionType}</p>
              <p><strong>Subject:</strong> ${submission.subject}</p>
              <p><strong>Status:</strong> ${submission.status}</p>
              <p><strong>Submitted:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
            </div>
            
            <h3 style="color: #1E4E9A;">Submitter Details:</h3>
            <div style="background-color: white; padding: 20px; margin: 20px 0;">
              <p><strong>Name:</strong> ${submission.fullName}</p>
              <p><strong>Position:</strong> ${submission.position}</p>
              <p><strong>Email:</strong> <a href="mailto:${submission.email}">${submission.email}</a></p>
              <p><strong>Phone:</strong> ${submission.phone}</p>
              <p><strong>Branch:</strong> ${submission.branch}</p>
              <p><strong>Region:</strong> ${submission.regionDisplay}</p>
            </div>
            
            <h3 style="color: #1E4E9A;">Description:</h3>
            <div style="background-color: white; padding: 20px; border-left: 4px solid #1E4E9A; margin: 20px 0;">
              <p style="color: #333; white-space: pre-wrap;">${submission.description}</p>
            </div>
            
            <div style="background-color: white; padding: 20px; margin: 20px 0;">
              <p><strong>Files Attached:</strong> ${submission.files.length} file(s)</p>
              ${submission.files.map(file => `
                <p style="margin: 5px 0; padding: 5px; background: #f5f5f5;">
                  📎 ${file.fileName} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB)
                </p>
              `).join('')}
            </div>
            
            <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; font-size: 12px;">
              <p><strong>IP Address:</strong> ${submission.ipAddress}</p>
              <p><strong>User Agent:</strong> ${submission.userAgent}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666;">Please review this submission in the admin dashboard.</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Admin notification email sent');
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('✗ Error sending admin notification:', error.message);
    return { success: false, error: error.message };
  }
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✓ Email configuration verified successfully');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('✗ Email configuration verification failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendUserConfirmationEmail,
  sendAdminNotificationEmail,
  verifyEmailConfig,
};
