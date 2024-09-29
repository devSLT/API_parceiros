const mongoose = require('mongoose');

/*Definindo um Schema de signup*/

const signupanaliseSchema = new mongoose.Schema({
    businessName: { type: String, required: true, },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: Number, required: true, unique: true, },
    personalPhone: { type: Number, required: true, unique: true, },
    cnpj: { type: Number, required: true, unique: true, },
    businessType: { type: String, required: true,},
    cep: { type: Number, required: true,},
    address: { type: String, required: true, },
    password: { type: String, required: true, },
})

/*Exportar a maneiro como ele sera chamo, depois o nome do Schema*/
module.exports = mongoose.model('usersdenieds', signupanaliseSchema);