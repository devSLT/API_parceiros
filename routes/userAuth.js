const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
    const token = req.header('autorization-token');
    if (!token) {
        return res.status(401).send('Acess Denied');
    }
    
    try {
        const userVerified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = userVerified;

        next()

    } catch (error) {
        return res.status(401).json({msg:"Autorizado", sucess:true});
    }
}