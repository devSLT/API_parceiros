const mongoose = require('mongoose')

//Definicao Schema

const codeemailSchema = new mongoose.Schema({
    email: {type: String, required:true, unique:true,},
    code: {type: String, required:true,},
    expiresAt: {type:Date, required:true,},
})

//Exclusao do codigo assim que expirado
codeemailSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const codeemail = mongoose.model('CodeEmail', codeemailSchema )

module.exports = codeemail;