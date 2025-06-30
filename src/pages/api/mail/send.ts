import { NextApiRequest, NextApiResponse } from 'next';
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: "smtp.zeptomail.in",
    port: 587,
    auth: {
        user: "emailapikey",
        pass: "PHtE6r0ORui43jYq9kcF4KK7FsL1Nol/qbtkJFJDs4tGWfQFGE1SqY9/lmK3qUojUfkTQKOcm9k65LiYsb6HcW7vYzwfWmqyqK3sx/VYSPOZsbq6x00ftF8ffkXZV4Htd9Rs0iPVs9rTNA==",
    },
});

type EmailBody = {
    email: string;
    subject: string;
    message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: "error", error: "Method not allowed" });
    }

    try {
        const body: EmailBody = req.body;

        // Simple validation
        if (!body.email || !body.subject || !body.message) {
            return res.status(400).json({ status: "error", error: "Missing required fields." });
        }

        const mailOptions = {
            from: '"Python Eval" <noreply@wecofy.com>',
            to: body.email,
            subject: body.subject,
            html: body.message,
        };

        await transport.sendMail(mailOptions);
        console.log("Mail sent successfully to", body.email);

        return res.status(200).json({ status: "success" });
    } catch (error: any) {
        console.error("Error sending mail:", error);
        return res.status(500).json({ 
            status: "error", 
            error: error.message || "Internal Server Error" 
        });
    }
}
