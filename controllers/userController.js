require('dotenv').config();
//Models DB
const userAnalise = require('../models/UserAnalise.js');
const UserTemp = require('../models/UserTemp.js');
const UserAceito = require('../models/tabelaAceitadosModel.js');
const UserNegados = require('../models/tabelaNegadosModel.js');
//Functions Gerar e Enviar
const { generateVerificationCode, sendVerificationEmail } = require('../models/verificationEmail.js');

//validacoes
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const inpValidacoes = require('./inputsValidation.js');
const inputValidacoes = require('./inputsValidation.js');

const userController = {

    /*/////////Criacao de contas/////////*/

    register: async function (req, res) {
        //Pega os dados do body
        const { businessName, email, phone, personalPhone, cnpj, businessType, cep, address, password } = req.body;

        //Validacoes de input
        if (!businessName || !email || !phone || !personalPhone || !cnpj || !cep || !address || !password) {
            return res.status(400).json({ msg: "Todos os campos devem ser preenchidos." })
        }

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        if (!inpValidacoes.validatePassword(password)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        if (!inpValidacoes.validateCNPJ(cnpj)) {
            return res.status(400).json({ msg: "Insira um CNPJ válido, utilize somente números." });
        }

        if (!businessType) {
            return res.status(400).json({ msg: "O tipo de negócio é obrigatório" });
        }

        if (!inpValidacoes.validatePhone(phone)) {
            return res.status(400).json({ msg: "Insira um Telefone válido, utilizando somente números." });
        }

        if (!inpValidacoes.validateCEP(cep)) {
            return res.status(400).json({ msg: "Insira um CEP válido, utilizando somente números." });
        }

        //BCRYPT
        const saltsRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltsRound);

        //Verification Code Email
        const verificationCode = generateVerificationCode();

        // Monta os dados temporarios no Schema
        const userTemp = new UserTemp({
            businessName,
            email,
            phone,
            personalPhone,
            cnpj,
            businessType,
            cep,
            address,
            password: hashedPassword,
            verificationcode: verificationCode,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
        });

        try {

            //Separa os principais identificadores para verificar se sao unicos
            const verEmail = await UserTemp.findOne({ email });
            const verPhone = await UserTemp.findOne({ phone });
            const verCnpj = await UserTemp.findOne({ cnpj });

            // Se forem unicos autoriza a criacao
            if (verEmail || verPhone || verCnpj) {
                return res.status(409).json({ msg: "Os dados inseridos já estão sendo usados." })
            }

            //Salva o usuario temporario
            await userTemp.save();

            //Envia o codigo para confirmacao do e-mail
            sendVerificationEmail(email, `<h3>Seu código de verificação é: ${verificationCode}</h3>`)
            res.status(201).json({ msg: 'Código de verificação enviado.' });

        } catch (error) {
            // Captura erros ao salvar ou enviar o e-mail
            console.error('Erro ao salvar o usuário temporário:', error);
            res.status(400).json({ msg: 'Erro ao processar o cadastro.' });
        }
    },

    resendCode: async function (req, res) {
        const { email } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        //gera um novo codigo
        const newCode = generateVerificationCode();

        UserTemp.findOneAndUpdate(
            { email },
            { verificationcode: newCode },
            { new: true },
        )
            .then(user => {

                if (!user) {
                    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
                }

                sendVerificationEmail(email, `<h3>Seu novo código de verificação é: ${newCode}</h3>`)

                res.json({ success: true, message: 'Código atualizado e enviado com sucesso!' });

            })
            .catch(err => {
                res.status(500).json({ success: false, message: 'Erro ao atualizar o código', error: err });
            });
    },

    verify: async function (req, res) {
        //Pega os dados do body
        const { email, verificationCode } = req.body;

        try {

            // Tenta encontrar o usuario temporario
            const userTemp = await UserTemp.findOne({ email, verificationcode: verificationCode });
            if (!userTemp) {
                console.log('Usuário temporário não encontrado.');
                return res.status(400).json({ msg: "Código inválido ou expirado." });
            }

            // Cria um novo user apos a verificacao do email 
            const useranalise = new userAnalise({
                businessName: userTemp.businessName,
                email: userTemp.email,
                phone: userTemp.phone,
                personalPhone: userTemp.personalPhone,
                cnpj: userTemp.cnpj,
                businessType: userTemp.businessType,
                cep: userTemp.cep,
                address: userTemp.address,
                password: userTemp.password,
            });

            // Salva o novo usuário
            await useranalise.save();

            // Exclui o usuario temporário após a verificação
            await UserTemp.deleteOne({ email });

            res.status(201).json({ msg: 'Sua conta foi enviada para análise, enviaremos um email assim que ela for aceita.' });
        } catch (error) {
            console.error('Erro ao processar a verificação:', error);
            res.status(500).json({ msg: 'Erro ao processar a verificação.' });
        }
    },

    login: async function (req, res) {
        console.log(req.userId + 'Fez está chamada')

        const { email, password } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        if (!inpValidacoes.validatePassword(password)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        try {

            const useranalise = await userAnalise.findOne({ email });

            if (useranalise) {
                return res.status(401).json({ sucess: false, msg: "Sua conta ainda está em análise" });
            }

            const userRejeitado = await UserNegados.findOne({ email });

            if (userRejeitado) {
                return res.status(401).json({ sucess: false, msg: "Sua conta não foi aceita" });
            }

            const userAceito = await UserAceito.findOne({ email });
            if (userAceito) {

                // Compare a senha fornecida com a senha armazenada
                const isMatch = await bcrypt.compare(password, userAceito.password);

                if (!isMatch) {
                    return res.status(401).json({ msg: 'Senha inválida.' });
                }

                const token = jwt.sign({ id: userAceito._id, admin: userAceito.admin}, process.env.TOKEN_SECRET, /*{ expiresIn: 300 }*/);

                res.header('authorization-token', token)

                res.status(200).json({ sucess: true, msg: "Login Realizado com sucesso"})
            }

            res.status(401).end()

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Erro ao tentar fazer login.' });
        }
    },

    forgotPassword: async function (req, res) {
        const { email } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        try {

            const user = await UserAceito.findOne({ email })

            if (!user) {
                return res.status(500).json({ sucess: false, msg: "Usuário não encontrado" });
            }

            // Gera um token randômico para redefinição de senha
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = Date.now() + 20 * 60 * 1000; // Token expira em 20 minutos

            await UserAceito.findOne(
                { email },
                { resetToken, resetTokenExpires }
            )

            const resetUrl = `http://127.0.0.1:5500/pages/site/changePass.html?token=${resetToken}`;


            sendVerificationEmail(email, `<h3>Link para alteração de senha NeedFarma: <a href="${resetUrl}">Alterar Senha</a></h3>`);

            res.json({ msg: 'Link de redefinição de senha enviado ao seu E-mail.' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Erro ao solicitar redefinição de senha.' });
        }
    },

    resetPassword: async function (req, res) {
        const { token } = req.query; // Use req.query para acessar o token

        try {
            const user = await UserAceito.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });

            if (!user) {
                return res.status(400).json({ msg: 'Token inválido ou expirado.' });
            }

            // Redirect to change password page
            res.redirect(`http://localhost:5500/reset-password?token=${token}`); // Redireciona para a URL da página de alteração de senha
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Erro ao verificar o token.' });
        }
    },

    changePassword: async function (req, res) {
        const { email, password, confirmPassword } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        if (!inpValidacoes.validatePassword(password)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        if (!inpValidacoes.validatePassword(confirmPassword)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        if (password !== confirmPassword) {
            return res.status(409).json({ msg: "As senhas não coincidem" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {

            const updatedUser = await UserAceito.findOneAndUpdate(
                { email },
                { password: hashedPassword, resetToken: null, resetTokenExpires: null },
                { new: true },
            )

            if (!updatedUser) {
                s
                console.log(updatedUser)
                return res.status(404).json({ sucess: false, msg: 'Usuário não encontrado para atualização.' });
            }

            res.status(201).json({ sucess: true, msg: `Senha alterada com sucesso!` });

        } catch (err) {
            res.send(500).json({ sucess: false, msg: `Ocorreu um erro ao tentar atualizar senha` });
            throw new Error(err);
        }
    },

    resendPassword: async function (req, res) {
        const { email } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        // Gera um token randômico para redefinição de senha
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 20 * 60 * 1000; // Token expira em 20 minutos

        try {
            const findUser = await UserAceito.findOneAndUpdate(
                { email },
                { resetToken, resetTokenExpires },
                { new: true, },
            )

            if (!findUser) {
                return res.status(500).json({ sucess: false, msg: "O usuário não foi encontrado" });
            }

            const resetUrl = `http://127.0.0.1:5500/pages/site/changePass.html?token=${resetToken}`;

            sendVerificationEmail(email, `<h3>Link para alteração de senha NeedFarma: <a href="${resetUrl}">Alterar Senha</a></h3>`);

            res.json({ success: true, message: 'Novo link para alteração de senha foi enviado' });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar um novo link', error: err });
        }
    },
}

module.exports = userController;
