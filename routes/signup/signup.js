const express = require('express');
const router = express.Router();
const SignUp = require('../../models/SignUpModel.js');

router.get('/', (req, res) => {
    res.status(200).json({ msg: "Tudo certo!" })
})

router.post('/cadastro', async (req, res) => {

    //Pega os dados do body
    const { businessName, email, phone, personalPhone, cnpj, cep, adress, password } = req.body;

    // Monta os dados no Schema
    const signup = new SignUp({ businessName, email, phone, personalPhone, cnpj, cep, adress, password })

    try {

        //Separa os principais identificadores para verificar se sao unicos
        const verEmail = await SignUp.findOne({ email });
        const verPhone = await SignUp.findOne({ phone });
        const verCnpj = await SignUp.findOne({ cnpj });

        // Se forem unicos autoriza a criacao
        if (verEmail || verPhone || verCnpj) {
            return res.status(409).json({ msg: "Os dados inseridos já estão sendo usados." })
        }

        const createSignUp = await signup.save();
        res.status(201).json(createSignUp);

    } catch (err) {
        res.status(400).json({ msg: err.message })
    }
});


//Faz uma vistoria completa em todos os cadastrados
router.get('/cadastrados', async (req, res) => {
    try {
        const cadastrados = await SignUp.find();
        res.status(200).json(cadastrados);
    } catch (err) {
        res.status(500).json({ msg: `Houve um erro: ${err}` })
    }
})

module.exports = router