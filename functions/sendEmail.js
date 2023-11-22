require('dotenv').config();
const nodemailer = require('nodemailer');

function createMailClient() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      type: 'OAuth2',
      user: process.env.MAIL_USER,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      refreshToken: process.env.AUTH_REFRESH_TOKEN,
      accessToken: process.env.AUTH_ACCESS_TOKEN,
    },
  });
}

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        satusCode: 405, //Method not allowed
        body: JSON.stringify({ error: "Method Not Allowed"}),
      };
    }

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST",
    };

    const json = JSON.parse(event.body);
    const gmailResponse = await mailClient.sendMail({
      from: json.name,
      to: process.env.MAIL_USER,
      subject: 'Contact Form Submission - Portfolio',
      html: `<p>Name: ${json.name}</p>
             <p>Email: ${json.email}</p>
             <p>Subject: ${json.subject}</p>
             <p>Message: ${json.message}</p>`,
    });
    
    return {
      statusCode: 200,
      headers,
      body: "Message sent!" + gmailResponse.messageId,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};