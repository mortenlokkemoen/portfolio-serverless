require('dotenv').config();
const nodemailer = require('nodemailer');

function createMailClient() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'mortenlokkemoen@gmail.com',
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      refreshToken: process.env.AUTH_REFRESH_TOKEN,
      accessToken: process.env.AUTH_ACCESS_TOKEN,
    },
  });
}

exports.handler = async function (event, context) {
  try {
    const json = JSON.parse(event.body);
    const contactEmail = createMailClient();
    
    const mail = {
      from: json.name,
      to: 'mortenlokkemoen@gmail.com',
      subject: 'Contact Form Submission - Portfolio',
      html: `<p>Name: ${json.name}</p>
             <p>Email: ${json.email}</p>
             <p>Subject: ${json.subject}</p>
             <p>Message: ${json.message}</p>`,
    };

    await contactEmail.sendMail(mail);

    return {
      statusCode: 200,
      body: JSON.stringify({ code: 200, status: 'Message sent' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};