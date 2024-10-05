const mongoose = require('mongoose');

/*Definindo um Schema de signup*/

const signupanaliseSchema = new mongoose.Schema({
    personalName: { type: String, required: true, },
    rg: { type: Number, required: true},
})

/*Exportar a maneiro como ele sera chamo, depois o nome do Schema*/
module.exports = mongoose.model('userdocs', signupanaliseSchema);