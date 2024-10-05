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
router.put('/changePass', userController.changePassword);

//Reenvia link para alteracao de senha
router.put('/resendPass', userController.resendPassword);


/*Mudacas para adm*/
//Rota GET para pegar informacoes tela config usuarios
router.get('/getInfos', userController.getInfos);

//Mudar informacoes ja exitentes apos verificar o token na pagina
router.put('/changeEmail', userController.changeEmail);

//Mudar phone
router.put('/changePhone', userController.changePhone);

//changePersonalPhone
router.put('/changePersonalPhone', userController.changePersonalPhone);

//change CNPJ
router.put('/changeCnpj', userController.changeCnpj);

//change cep
router.put('/changeCep', userController.changeCep);

//change address
router.put('/changeAddress', userController.changeAddress);

//Completar informacoes cadastro
router.post('/completeReg', userController.completeReg)

//Pega as informacoes bancarias e salva em UserDocs
router.post('/bankData', userController.bankData)

//Rota verificar se ja exite conta bancaria no ID
router.get('/verifyBankData', userController.verifyBankData)

//Rota POST add dados bancarios
router.post('/bankData', userController.bankData)

//Rota PUT atualizar dados bancarios
router.put('/changeBankData', userController.changeBankData)

module.exports = router