const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Attempt to send the email
    let info = await transporter.sendMail({
      from: `Team - JOBSPHERE ${process.env.MAIL_USER}`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email sent:", info);  // Log success response from nodemailer
    return info;
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    // Log more error details to pinpoint what failed
    if (error.response) {
      console.error("Error Response:", error.response);
    }
  }
};

module.exports = mailSender;