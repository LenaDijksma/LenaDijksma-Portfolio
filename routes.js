const express = require('express');
const path = require('path');
const { Resend } = require('resend');

const router = express.Router();

const resend =
    new Resend(process.env.RESEND_API_KEY);

// =========================
// PAGES
// =========================

router.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );
});

router.get('/autonote', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'autonote.html')
    );
});

router.get('/placeholder', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'placeholder.html')
    );
});

// =========================
// SEND EMAIL
// =========================

router.post('/send-email', async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message,
            company
        } = req.body;

        // HONEYPOT SPAM CHECK

        if (company) {
            return res
                .status(400)
                .json({
                    error: 'Spam detected'
                });
        }

        const data =
            await resend.emails.send({

                from:
                    'Portfolio Contact <onboarding@resend.dev>',

                to:
                    'lenadijksma08@gmail.com',

                subject:
                    `[Portfolio] ${subject}`,

                html: `
                    <h2>New Portfolio Contact</h2>

                    <p>
                        <strong>Name:</strong>
                        ${name}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${email}
                    </p>

                    <p>
                        <strong>Subject:</strong>
                        ${subject}
                    </p>

                    <p>
                        <strong>Message:</strong>
                    </p>

                    <p>
                        ${message}
                    </p>
                `
            });

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Failed to send email'
        });
    }
});

module.exports = router;