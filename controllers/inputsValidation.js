//validacoes
const validator = require('validator');

const inputValidacoes = {
    // Prepara Verificacoes Regex && Validator
    validateEmail: function (email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email) && validator.isEmail(email);
    },

    validatePassword: function (password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password) && validator.isLength(password, { min: 8 });
    },

    validateCNPJ: function (cnpj) {
        const regex = /^\d{14}$/; // Formato: Somente numeros
        return regex.test(cnpj) && !validator.isEmpty(cnpj);
    },

    validatePhone: function (phone) {
        const regex = /^\d{10,11}$/; // Formato: Somente numeros
        return regex.test(phone) && validator.isLength(phone, { min: 10, max: 11 });
    },

    validateCEP: function (cep) {
        const regex = /^\d{8}$/; // Formato: XXXXX-XXX
        return regex.test(cep) && !validator.isEmpty(cep);
    },
}

module.exports = inputValidacoes;