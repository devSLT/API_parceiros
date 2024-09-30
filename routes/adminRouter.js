const express = require('express');
const router = express.Router();

//JWT
const auth = require('../routes/userAuth')

router.get('/painel',auth, (req,res)=>{

    if(!req.user.admin){
       return res.send('Você precisa ser admin para ter acesso')
    }

    //autoriza a rota
    res.status(200).json({msg:"Autorizado", sucess:true})

})

module.exports = router;