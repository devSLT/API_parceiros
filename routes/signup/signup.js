const express = require('express');
const router = express.Router();
//model
const SignUpAnalise = require('../../models/SignUpModelAnalise.js');
const { generateVerificationCode, sendVerificationEmail } = require('../../models/verificationEmail.js');
const CodeEmail = require('../../models/codeVerification.js');
const UserTemp = require('../../models/UserTemp.js')
//validacoes
const bcrypt = require('bcrypt');
const validator = require('validator');


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

router.get('/', (req, res) => {
    res.status(200).json({ msg: "Hello World" })
})


router.post('/signup', async (req, res) => {

    //Pega os dados do body
    const { businessName, email, phone, personalPhone, cnpj, cep, address, password } = req.body;

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
        sendVerificationEmail(email, verificationCode)
        res.status(201).json({ msg: 'Código de verificação enviado.' });

    } catch (error) {
        // Captura erros ao salvar ou enviar o e-mail
        console.error('Erro ao salvar o usuário temporário:', error);
        res.status(400).json({ msg: 'Erro ao processar o cadastro.' });
    }

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
            cep: userTemp.cep,
            address: userTemp.address, // Corrigido o nome do campo para "address"
            password: userTemp.password,
        });

        // Salva o novo usuário
        await signupanalise.save();

        // Exclui o usuário temporário após a verificação
        await UserTemp.deleteOne({ email });

        res.status(201).json({ msg: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar a verificação:', error);
        res.status(500).json({ msg: 'Erro ao processar a verificação.' });
    }

});


//Faz uma vistoria completa em todos os cadastrados
router.get('/cadastrados', async (req, res) => {
    try {
        const cadastrados = await SignUpAnalise.find();
        res.status(200).json(cadastrados);
    } catch (err) {
        res.status(500).json({ msg: `Houve um erro: ${err}` })
    }
})

module.exports = router