require('dotenv').config();
const express = require("express");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");
const serverless = require("serverless-http");
const indexRouter = require('../api/index');
// Server used for sending emails
const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router);

const whitelist = [
    '*'
];

app.use((req, res, next ) => {
    const origin = req.get('referer');
    const isWhitelisted = whitelist.find((w) => origin && origin.includes(w));
    if (isWhitelisted) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
        res.setHeader('Access-Control-Allow-Credentials', true);
  } if (req.method === 'OPTIONS') res.sendStatus(200);
    else next();
})

const contactEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: "mortenlokkemoen@gmail.com",
        pass: process.env.MAIL_PASS,
        clientId: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        refreshToken: process.env.AUTH_REFRESH_TOKEN,
        accessToken: process.env.AUTH_ACCESS_TOKEN,
    },
});

contactEmail.verify((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready to Send");
    }
});

router.use("/api/contact", (req, res, next) => {
    contactEmail.verify((error) => {
        if (error) {
            console.log(error);
            res.status(500).json({ error: "Email verification failed" });
        } else {
            next();
        }
    });
});

router.post("/api/contact", (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;
    const mail = {
        from: name,
        to: "mortenlokkemoen@gmail.com",
        subject: "Contact Form Submission - Portfolio",
        html: `<p>Name: ${name}</p>
               <p>Email: ${email}</p>
               <p>Subject: ${subject}</p>
               <p>Message: ${message}</p>`,
    };

    contactEmail.sendMail(mail, (error) => {
        if (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json({ code: 200, status: "Message sent" });
        }
    });
});

module.exports = app;
module.exports.handler = serverless(app);
