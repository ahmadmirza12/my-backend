import nodemailer from 'nodemailer'

let transporter
export function getMailer() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return {
      sendMail: async (opts) => {
        console.log('MAILER_NOT_CONFIGURED', opts)
        return { messageId: 'dev-log' }
      }
    }
  }
  transporter = nodemailer.createTransport({ host, port, auth: { user, pass } })
  return transporter
}

export async function sendOtpMail(to, code) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com'
  const mailer = getMailer()
  const info = await mailer.sendMail({ from, to, subject: 'Your verification code', text: `Your OTP code is ${code}. It expires in 10 minutes.` })
  return info
}