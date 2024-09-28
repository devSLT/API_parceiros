require('dotenv').config();

const express = require('express');
const app = express();
const signup = require('./routes/signup/signup.js')
const mongoose = require('mongoose');
const PORT = 8080;

/*Conection DB*/

const db_user = process.env.DB_USER;
const db_pass = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${db_user}:${db_pass}@tempfreelas.q2wtn.mongodb.net/?retryWrites=true&w=majority&appName=tempfreelas`);

const db = mongoose.connection;

db.on("error", (err)=>{console.log(`Houve um erro ao conectar com DB: ${err}`)}); /*Caso ocorra um erro ele avisa*/
db.once("open", ()=>{console.log(`Banco de dados carregado`)}); 

/*Express JS*/

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/signup', signup)

app.listen(PORT, (err) => {
    if (err) {
        return console.log(`Ocorreu um erro ao iniciar o servidor:${err}`)
    }
    console.log(`Servidor rodando na porta: ${PORT}`)
})