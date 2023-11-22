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
      expires: process.env.TOKEN_EXPIRY_TIME,
    },
  });
}


async function refreshAccessToken(mailClient) {
  const { user, clientId, clientSecret, refreshToken } = mailClient.transporter.options.auth;
  const oauth2Client = createOAuth2Client(clientId, clientSecret);
  const newTokens = await oauth2Client.refreshAccessToken(refreshToken);
  mailClient.transporter.options.auth.accessToken = newTokens.credentials.access_token;
  mailClient.transporter.options.auth.expires = newTokens.credentials.expiry_date;
}

function createOAuth2Client(clientId, clientSecret) {
  const { OAuth2 } = require('google-auth-library');
  return new OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
}

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Content-Type": "application/json",
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({}),
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" }),
        
      };

    }

    const json = JSON.parse(event.body);
    const mailClient = createMailClient();
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (mailClient.transporter.options.auth.expires < currentTimestamp) {
      await refreshAccessToken(mailClient);
    }


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
      body: JSON.stringify({ message: "Message sent!", messageId: gmailResponse.messageId }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.toString() }),
    };
  }
};
