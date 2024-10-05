//validacoes
const validator = require('validator');

const inputValidacoes = {
    // Prepara Verificacoes Regex && Validator
    validateFullName: function (name) {
        // Verifica se o nome possui ao menos duas palavras e que cada palavra tenha pelo menos 2 letras
        const nameRegex = /^[a-zA-Z]{2,}(?: [a-zA-Z]{2,})+$/;
        return nameRegex.test(name.trim());
    },

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

    validateDocument: function (document) {
        // Remove qualquer caractere não numérico
        const cleanedDocument = document.replace(/\D/g, '');

        // Validação para RG (7 a 9 dígitos)
        if (/^\d{7,9}$/.test(cleanedDocument)) {
            return { isValid: true, type: 'RG' };
        }

        // Validação para CNH (exatamente 11 dígitos)
        if (/^\d{11}$/.test(cleanedDocument)) {
            return { isValid: validateCNH(cleanedDocument), type: 'CNH' };
        }

        // Caso não seja RG nem CNH
        return { isValid: false, type: null };
    },
}

module.exports = inputValidacoes;