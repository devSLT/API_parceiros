//validacoes
const validator = require('validator');

function validateCNH(cnh) {
    if (cnh.length !== 11) return false;

    // Verifica se todos os dígitos são iguais, o que não é permitido
    if (/^(\d)\1{10}$/.test(cnh)) return false;

    let sum = 0;
    let dsc = 0;

    // Primeiro dígito verificador
    for (let i = 0, j = 9; i < 9; ++i, --j) {
        sum += cnh.charAt(i) * j;
    }

    let firstDigit = sum % 11;
    if (firstDigit >= 10) {
        firstDigit = 0;
        dsc = 2;
    }

    sum = 0;

    // Segundo dígito verificador
    for (let i = 0, j = 1; i < 9; ++i, ++j) {
        sum += cnh.charAt(i) * j;
    }

    let secondDigit = (sum % 11) - dsc;
    if (secondDigit < 0) {
        secondDigit += 11;
    }
    if (secondDigit >= 10) {
        secondDigit = 0;
    }

    return firstDigit == cnh.charAt(9) && secondDigit == cnh.charAt(10);
}

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

    validateAgency: (agency) => {
        const agencyRegex = /^\d{4,5}-?\d?$/;
        return agencyRegex.test(agency);
    },

    validateBankAccount: (bankAccount) => {
        const accountRegex = /^\d{6,10}-?\d?$/;
        return accountRegex.test(bankAccount);
    },

}

module.exports = inputValidacoes;