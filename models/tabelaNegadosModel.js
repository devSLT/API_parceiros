const mongoose = require('mongoose');

const negadosSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('usersDENIED', negadosSchema);