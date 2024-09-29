const nodemailer = require('nodemailer');
const crypto = require('crypto');

const generateVerificationCode = () => {
    return crypto.randomBytes(3).toString('hex'); // Gera um código de 6 caracteres
};

const EMAIL = process.env.EMAIL
const EMAIL_PASS = process.env.EMAIL_PASS

// Função para enviar e-mail
const sendVerificationEmail = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // ou outro serviço de e-mail
        auth: {
            user: `${EMAIL}`,
            pass: `${EMAIL_PASS}`,
        },
    });

    const mailOptions = {
        from: `${EMAIL}`,
        to: email,
        subject: 'Verificação de E-mail NeedFarma Parceiros',
        html: code,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail de verificação enviado com sucesso.');
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw new Error('Erro ao enviar e-mail de verificação');
    }
};

module.exports = {
    generateVerificationCode,
    sendVerificationEmail,
}