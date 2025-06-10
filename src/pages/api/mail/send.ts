export const dynamic = "force-dynamic"; // For Next.js route behavior

import { NextRequest } from "next/server";
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

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const body: EmailBody = await request.json();

        // Simple validation
        if (!body.email || !body.subject || !body.message) {
            return new Response(
                JSON.stringify({ status: "error", error: "Missing required fields." }),
                { status: 400 }
            );
        }

        const mailOptions = {
            from: '"Python Eval" <noreply@wecofy.com>',
            to: body.email,
            subject: body.subject,
            html: body.message,
        };

        await transport.sendMail(mailOptions);
        console.log("Mail sent successfully to", body.email);

        return new Response(JSON.stringify({ status: "success" }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Error sending mail:", error);
        return new Response(
            JSON.stringify({ status: "error", error: error.message || "Internal Server Error" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}
