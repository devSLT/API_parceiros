const express = require('express');
const router = express.Router();

//Controllers
const userController = require('../controllers/userController.js')

//EMAIL=thiago368orjorge@gmail.com
//EMAIL_PASS=ypoz cnub bpyc rqec

//Registrar conta
router.post('/register', userController.register);

//Rota reenviar codigo
router.put('/resendCode', userController.resendCode);

//Rota que ira verificar o codigo enviado pelo email
router.post('/verify', userController.verify);

//Logar conta
router.post('/login', userController.login)

//Check Token
router.post('/check', userController.check)

//send code to change password
router.post('/forgotPass', userController.forgotPassword);

//Rota GET enviada pelo email para alteracao de senha
router.get('/resetPass', userController.resetPassword);

//Change Password
router.put('/changePass', userController.changePassword)

//Reenvia link para alteracao de senha
router.put('/resendPass', userController.resendPassword)

module.exports = router