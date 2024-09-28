const express = require('express');
const router = express.Router();
//model
const SignUpAnalise = require('../../models/SignUpModelAnalise.js');
//validacoes
const bcrypt = require('bcrypt');
const validator = require('validator');

router.get('/', (req, res) => {
    res.status(200).json({ msg: "Tudo certo!" })
})

router.post('/cadastro', async (req, res) => {

    //Verificacoes Regex && Validator
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

    //Pega os dados do body
    const { businessName, email, phone, personalPhone, cnpj, cep, adress, password } = req.body;

    //Validacoes
    if (!businessName || !email || !phone || !personalPhone || !cnpj || !cep || !adress || !password) {
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

    // Monta os dados no Schema
    const signupanalise = new SignUpAnalise({ businessName, email, phone, personalPhone, cnpj, cep, adress, password: hashedPassword })

    try {

        //Separa os principais identificadores para verificar se sao unicos
        const verEmail = await SignUpAnalise.findOne({ email });
        const verPhone = await SignUpAnalise.findOne({ phone });
        const verCnpj = await SignUpAnalise.findOne({ cnpj });

        // Se forem unicos autoriza a criacao
        if (verEmail || verPhone || verCnpj) {
            return res.status(409).json({ msg: "Os dados inseridos já estão sendo usados." })
        }

        const createSignUpAnalise = await signupanalise.save();
        res.status(201).json(createSignUpAnalise);

    } catch (err) {
        res.status(400).json({ msg: err.message })
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