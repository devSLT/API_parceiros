const mongoose = require('mongoose');

/*Definindo um Schema de signup*/

const bankData = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    bank: {type: String, required:true},
    agency: {type:String, required:true},
    bankAccount: {type:String, required:true},
})

/*Exportar a maneiro como ele sera chamo, depois o nome do Schema*/
module.exports = mongoose.model('userBankData', bankData);