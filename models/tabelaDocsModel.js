const mongoose = require('mongoose');

/*Definindo um Schema de signup*/

const signupanaliseSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    personalName: { type: String, required: true, },
    rgCnh: { type: Number, required: true},
})

/*Exportar a maneiro como ele sera chamo, depois o nome do Schema*/
module.exports = mongoose.model('userdocs', signupanaliseSchema);