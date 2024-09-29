const mongoose = require('mongoose');

const aceitadosSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('users', aceitadosSchema);