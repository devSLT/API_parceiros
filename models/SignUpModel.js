const mongoose = require('mongoose');

/*Definindo um Schema de signup*/

const signupSchema = new mongoose.Schema({
    businessName: String,
    email:String,
    phone: Number,
    personalPhone: Number,
    cnpj: Number,
    cep: Number,
    adress: String,
    password: String,
})

/*Exportar a maneiro como ele sera chamo, depois o nome do Schema*/
module.exports = mongoose.model('SignUp', signupSchema);