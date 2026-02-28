/**
 * Shared Email Utility — uses SMTP credentials from .env
 * Sends HTML emails for: attendance marking, class join notifications,
 * at-risk alerts, and registration welcome emails.
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const FROM = `"SmartClass" <${process.env.SMTP_USER}>`;

/**
 * Send attendance status email to a student
 */
const sendAttendanceEmail = async ({ to, name, className, status, date }) => {
    const isPresent = status === 'present';
    const subject = isPresent
        ? `✅ Attendance Marked: Present — ${className}`
        : `❌ Attendance Marked: Absent — ${className}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: ${isPresent ? '#10b981' : '#ef4444'}; border-radius: 8px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">${isPresent ? '✅ Present' : '❌ Absent'}</h1>
      </div>
      <p style="color: #374151; font-size: 15px;">Hi <strong>${name}</strong>,</p>
      <p style="color: #374151; font-size: 15px;">Your attendance for <strong>${className}</strong> on <strong>${date}</strong> has been marked as <strong style="color: ${isPresent ? '#10b981' : '#ef4444'}">${isPresent ? 'Present' : 'Absent'}</strong>.</p>
      ${!isPresent ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 13px;">⚠️ Please ensure your attendance stays above 75% to avoid academic penalties.</p>
      </div>` : ''}
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— SmartClass Attendance System</p>
    </div>`;

    await transporter.sendMail({ from: FROM, to, subject, html });
};

/**
 * Send welcome email on registration
 */
const sendWelcomeEmail = async ({ to, name, role }) => {
    const roleLabel = role === 'professor' ? 'Professor' : role === 'admin' ? 'Admin' : 'Student';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">Welcome to SmartClass 🎓</h1>
      </div>
      <p style="color: #374151; font-size: 15px;">Hi <strong>${name}</strong>,</p>
      <p style="color: #374151; font-size: 15px;">Your <strong>${roleLabel}</strong> account has been created successfully. You can now log in to your dashboard and start using SmartClass.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— SmartClass Team</p>
    </div>`;

    await transporter.sendMail({ from: FROM, to, subject: '🎓 Welcome to SmartClass!', html });
};

/**
 * Send class-joined notification to student and professor
 */
const sendClassJoinEmail = async ({ studentEmail, studentName, professorEmail, className }) => {
    // Email to student
    const studentHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #6366f1; border-radius: 8px; padding: 16px 24px; margin-bottom: 20px;">
        <h2 style="color: #fff; margin: 0;">📚 Class Joined Successfully</h2>
      </div>
      <p style="color: #374151;">Hi <strong>${studentName}</strong>, you have successfully joined <strong>${className}</strong>. Your attendance will now be tracked for this class.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— SmartClass</p>
    </div>`;

    // Email to professor
    const professorHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #6366f1; border-radius: 8px; padding: 16px 24px; margin-bottom: 20px;">
        <h2 style="color: #fff; margin: 0;">👋 New Student Joined</h2>
      </div>
      <p style="color: #374151;"><strong>${studentName}</strong> has joined your class <strong>${className}</strong>.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— SmartClass</p>
    </div>`;

    await Promise.allSettled([
        transporter.sendMail({ from: FROM, to: studentEmail, subject: `✅ Joined ${className}`, html: studentHtml }),
        professorEmail && transporter.sendMail({ from: FROM, to: professorEmail, subject: `New student joined ${className}`, html: professorHtml })
    ]);
};

/**
 * Send at-risk low attendance warning email to a student
 */
const sendAtRiskEmail = async ({ to, name, className, attendanceRate }) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
      <div style="background: #f59e0b; border-radius: 8px; padding: 16px 24px; margin-bottom: 20px;">
        <h2 style="color: #fff; margin: 0;">⚠️ Low Attendance Warning</h2>
      </div>
      <p style="color: #374151;">Hi <strong>${name}</strong>,</p>
      <p style="color: #374151;">Your current attendance in <strong>${className}</strong> is <strong style="color: #ef4444;">${attendanceRate.toFixed(1)}%</strong>, which is below the required 75%.</p>
      <p style="color: #374151;">Please attend upcoming classes to avoid academic penalties or de-registration.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— SmartClass Attendance System</p>
    </div>`;

    await transporter.sendMail({ from: FROM, to, subject: `⚠️ Low Attendance Alert — ${className}`, html });
};

module.exports = { sendAttendanceEmail, sendWelcomeEmail, sendClassJoinEmail, sendAtRiskEmail };
