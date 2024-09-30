const express = require('express');
const router = express.Router();
//model
const SignUpAnalise = require('../../models/SignUpModelAnalise.js');
const UserAceito = require('../../models/tabelaAceitadosModel.js');
const UserNegados = require('../../models/tabelaNegadosModel.js');
//validacoes
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken')

//const SECRET = 'soueudenovo_orj' //passar para .env



// Prepara Verificacoes Regex && Validator
const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && validator.isEmail(email);
};

const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password) && validator.isLength(password, { min: 8 });
};

/*function verifyJWT(req, res, next) {
    const token = req.headers['x-access-token'];
    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(401).end();

        req.userId = decoded.userId;
        next();
    })
}*/

router.post('/login', async (req, res) => {

    console.log(req.userId + 'Fez está chamada')

    const { email, password } = req.body;

    if (!validateEmail(email)) {
        return res.status(400).json({ msg: "Insira um E-mail válido." });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ msg: "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
    }

    try {

        const userAnalise = await SignUpAnalise.findOne({ email });

        if (userAnalise) {
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

            const token = jwt.sign({ id: userAceito._id }, SECRET, { expiresIn: 300 });


            res.status(200).json({ sucess: true, msg: "Login Realizado com sucesso", token })
        }

        res.status(401).end()

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Erro ao tentar fazer login.' });
    }

})

module.exports = router;