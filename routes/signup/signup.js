const express = require('express');
const router = express.Router();
//model
const SignUpAnalise = require('../../models/SignUpModelAnalise.js');
const { generateVerificationCode, sendVerificationEmail } = require('../../models/verificationEmail.js');
const UserTemp = require('../../models/UserTemp.js')
const UserAceito = require('../../models/tabelaAceitadosModel.js')
//validacoes
const bcrypt = require('bcrypt');
const validator = require('validator');
const crypto = require('crypto');



// Prepara Verificacoes Regex && Validator
const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && validator.isEmail(email);
};

const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password) && validator.isLength(password, { min: 8 });
};

const validateCNPJ = (cnpj) => {
    const regex = /^\d{14}$/; // Formato: Somente numeros
    return regex.test(cnpj) && !validator.isEmpty(cnpj);
};

const validatePhone = (phone) => {
    const regex = /^\d{10,11}$/; // Formato: Somente numeros
    return regex.test(phone) && validator.isLength(phone, { min: 10, max: 11 });
};

const validateCEP = (cep) => {
    const regex = /^\d{8}$/; // Formato: XXXXX-XXX
    return regex.test(cep) && !validator.isEmpty(cep);
};


//Faz uma vistoria completa em todos os cadastrados
router.get('/', async (req, res) => {
    try {
        const cadastrados = await SignUpAnalise.find();
        res.status(200).json(cadastrados);
    } catch (err) {
        res.status(500).json({ msg: `Houve um erro: ${err}` })
    }
})



router.post('/signup', async (req, res) => {

    //Pega os dados do body
    const { businessName, email, phone, personalPhone, cnpj, businessType, cep, address, password } = req.body;

    //Validacoes de input
    if (!businessName || !email || !phone || !personalPhone || !cnpj || !cep || !address || !password) {
        return res.status(400).json({ msg: "Todos os campos devem ser preenchidos." })
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ msg: "Insira um E-mail válido." });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
    }

    if (!validateCNPJ(cnpj)) {
        return res.status(400).json({ msg: "Insira um CNPJ válido, utilize somente números." });
    }

    if (!businessType) {
        return res.status(400).json({ msg: "O tipo de negócio é obrigatório" });
    }

    if (!validatePhone(phone)) {
        return res.status(400).json({ msg: "Insira um Telefone válido, utilizando somente números." });
    }

    if (!validateCEP(cep)) {
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
    })

    try {

        //Separa os principais identificadores para verificar se sao unicos
        const verEmail = await SignUpAnalise.findOne({ email });
        const verPhone = await SignUpAnalise.findOne({ phone });
        const verCnpj = await SignUpAnalise.findOne({ cnpj });

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

})

//Rota reenviar codigo
router.put('/resendCode', async (req, res) => {

    const { email } = req.body

    if (!validateEmail(email)) {
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

})

//Rota que ira verificar o codigo
router.post('/verify', async (req, res) => {

    //Pega os dados do body
    const { email, verificationCode } = req.body;

    try {
        // Tenta encontrar o usuário temporário
        const userTemp = await UserTemp.findOne({ email, verificationcode: verificationCode }); // Verifique a correspondência exata do campo

        if (!userTemp) {
            console.log('Usuário temporário não encontrado.');
            return res.status(400).json({ msg: "Código inválido ou expirado." });
        }

        // Se encontrado, cria um novo usuário
        const signupanalise = new SignUpAnalise({
            businessName: userTemp.businessName,
            email: userTemp.email,
            phone: userTemp.phone,
            personalPhone: userTemp.personalPhone,
            cnpj: userTemp.cnpj,
            businessType: userTemp.businessType,
            cep: userTemp.cep,
            address: userTemp.address, // Corrigido o nome do campo para "address"
            password: userTemp.password,
        });

        // Salva o novo usuário
        await signupanalise.save();

        // Exclui o usuário temporário após a verificação
        await UserTemp.deleteOne({ email });

        res.status(201).json({ msg: 'Sua conta foi enviada para análise, enviaremos um email assim que ela for aceita.' });
    } catch (error) {
        console.error('Erro ao processar a verificação:', error);
        res.status(500).json({ msg: 'Erro ao processar a verificação.' });
    }

});

//send code to change password
router.post('/forgotPass', async (req, res) => {

    const { email } = req.body;

    if (!validateEmail(email)) {
        return res.status(400).json({ msg: "Insira um E-mail válido." });
    }

    try {

        const user = await UserAceito.findOne({ email })

        if (!user) {
            return res.status(500).json({ sucess: false, msg: "Usuário não encontrado" })
        }

        //Se encontrar
        // Gera um token randômico para redefinição de senha
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 20 * 60 * 1000; // Token expira em 20 minutos

        await UserAceito.findOne(
            { email },
            { resetToken, resetTokenExpires }
        )

        const resetUrl = `http://127.0.0.1:5500/pages/site/changePass.html?token=${resetToken}`;


        sendVerificationEmail(email, `<h3>Link para alteração de senha NeedFarma: <a href="${resetUrl}">Alterar Senha</a></h3>`)

        res.json({ msg: 'Link de redefinição de senha enviado ao seu E-mail.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Erro ao solicitar redefinição de senha.' });
    }

})

router.get('/resetPassword', async (req, res) => {

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
})

//Change Password
router.put('/changePass', async (req, res) => {

    const { email, password, confirmPassword } = req.body

    if (!validateEmail(email)) {
        return res.status(400).json({ msg: "Insira um E-mail válido." });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
    }

    if (!validatePassword(confirmPassword)) {
        return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
    }

    if (password !== confirmPassword) {
        return res.status(409).json({ msg: "As senhas não coincidem" })
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

        res.status(201).json({ sucess: true, msg: `Senha alterada com sucesso!` })

    } catch (err) {
        res.send(500).json({ sucess: false, msg: `Ocorreu um erro ao tentar atualizar senha` })
        throw new Error(err)
    }

})

router.put('/resendPass', async (req, res) => {

    const { email } = req.body

    if (!validateEmail(email)) {
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
            return res.status(500).json({ sucess: false, msg: "O usuário não foi encontrado" })
        }

        const resetUrl = `http://127.0.0.1:5500/pages/site/changePass.html?token=${resetToken}`;

        sendVerificationEmail(email, `<h3>Link para alteração de senha NeedFarma: <a href="${resetUrl}">Alterar Senha</a></h3>`);

        res.json({ success: true, message: 'Novo link para alteração de senha foi enviado' });
    } catch(err){
        res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar um novo link', error: err });
    }


})

/*
    
    //Rota reenviar codigo
router.put('/resendCode', async (req, res) => {

    const { email } = req.body

    if (!validateEmail(email)) {
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

})
        
*/

module.exports = router