const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const emAnalise = require('../../models/tabelaEmAnaliseModel.js'); // Importar model dos em analise
const aceitados = require('../../models/tabelaAceitadosModel.js'); // Importar model dos aceitados
const negados = require('../../models/tabelaNegadosModel.js'); //  Importar model dos negados
const docs = require('../../models/tabelaDocsModel.js'); //  Importar model dos negados
const { generateVerificationCode, sendVerificationEmail, } = require('../../models/verificationEmail.js')

router.get('/dashboard', async (req, res) => {
    try {
        // Get counts of each collection
        const [usersCount, userDeniedsCount, userDocsCount, userAnalisesCount] = await Promise.all([
            aceitados.countDocuments({}),
            negados.countDocuments({}),
            docs.countDocuments({}),
            emAnalise.countDocuments({})
        ]);

        // Total count of users, denieds, and analises
        const total = usersCount + userDeniedsCount + userAnalisesCount;

        // Send the response with required data
        res.status(200).json({
            total: total,
            users: usersCount,
            userDenieds: userDeniedsCount,
            userAnalises: userAnalisesCount,
            userDocs: userDocsCount,
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// pegar lista completa de contas em analise
router.get('/emAnalise', async (req, res) => {
    try {
        const documents = await emAnalise.find({ admin: false });
        // formatação da data
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        // transformação das informações pra o que é necessário da tabela do painel do admin
        const transformedDocuments = documents.map(doc => {
            return {
                id: doc._id,
                name: doc.businessName,
                staticString: "Em Análise",
                type: doc.businessType,
                dateOfCreation: formatDate(new Date(new mongoose.Types.ObjectId(doc._id).getTimestamp()).toISOString())
            };
        });
        res.status(200).json(transformedDocuments);
    } catch (error) {
        console.error('Erro recebendo informações:', error);
        res.status(500).json({ message: 'Erro recebendo informações' });
    }
});

// pegar lista completa de contas aceitadas
router.get('/aceitados', async (req, res) => {
    try {
        const documents = await aceitados.find({ admin: false });
        // formatação da data
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        // transformação das informações pra o que é necessário da tabela do painel do admin
        const transformedDocuments = documents.map(doc => {
            return {
                id: doc._id,
                name: doc.businessName,
                staticString: "Ativado",
                type: doc.businessType,
                dateOfCreation: formatDate(new Date(new mongoose.Types.ObjectId(doc._id).getTimestamp()).toISOString())
            };
        });
        res.status(200).json(transformedDocuments);
    } catch (error) {
        console.error('Erro recebendo informações:', error);
        res.status(500).json({ message: 'Erro recebendo informações' });
    }
});

// pegar lista completa de contas negadas
router.get('/negados', async (req, res) => {
    try {
        const documents = await negados.find({ admin: false });
        // formatação da data
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        // transformação das informações pra o que é necessário da tabela do painel do admin
        const transformedDocuments = documents.map(doc => {
            return {
                id: doc._id,
                name: doc.businessName,
                staticString: "Desativado",
                type: doc.businessType,
                dateOfCreation: formatDate(new Date(new mongoose.Types.ObjectId(doc._id).getTimestamp()).toISOString()) // Correct 'new' usage
            };
        });
        res.status(200).json(transformedDocuments); // Send the documents as JSON
    } catch (error) {
        console.error('Erro recebendo informações:', error);
        res.status(500).json({ message: 'Erro recebendo informações' });
    }
});

// pegar lista completa de TODAS as contas
router.get('/', async (req, res) => {
    try {
        // pegar dados de todas as listas separadamente
        const [emAnaliseDocs, aceitadosDocs, negadosDocs] = await Promise.all([
            emAnalise.find({ admin: false }),
            aceitados.find({ admin: false }),
            negados.find({ admin: false })
        ]);
        // formatação da data
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // transformação das informações pra o que é necessário da tabela do painel do admin separadamente
        const emAnaliseTransformed = emAnaliseDocs.map(doc => ({
            id: doc._id,
            name: doc.businessName,
            staticString: "Em Análise",
            type: doc.businessType,
            dateOfCreation: formatDate(new mongoose.Types.ObjectId(doc._id).getTimestamp())
        }));

        // transformação das informações pra o que é necessário da tabela do painel do admin separadamente
        const aceitadosTransformed = aceitadosDocs.map(doc => ({
            id: doc._id,
            name: doc.businessName,
            staticString: "Ativado",
            type: doc.businessType,
            dateOfCreation: formatDate(new mongoose.Types.ObjectId(doc._id).getTimestamp())
        }));

        // transformação das informações pra o que é necessário da tabela do painel do admin separadamente
        const negadosTransformed = negadosDocs.map(doc => ({
            id: doc._id,
            name: doc.businessName,
            staticString: "Desativado",
            type: doc.businessType,
            dateOfCreation: formatDate(new mongoose.Types.ObjectId(doc._id).getTimestamp())
        }));

        // juntando listas transformadas
        const allDocuments = [
            ...emAnaliseTransformed,
            ...aceitadosTransformed,
            ...negadosTransformed
        ];

        res.status(200).json(allDocuments);
    } catch (error) {
        console.error('Erro recebendo informações:', error);
        res.status(500).json({ message: 'Erro recebendo informações' });
    }
});



// ativação de conta pelo admin
router.delete('/adminAccept', async (req, res) => {
    try {
        const { id } = req.body;

        // validação do MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        const documentToDelete = await emAnalise.findById(id);

        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // criação de copia do usuario
        const newUser = new aceitados({
            _id: documentToDelete._id, // explicitamente o mesmo id de usuario
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            admin: documentToDelete.admin,
        });

        // mandar pra outra coleção a copia
        await newUser.save();

        // apagar o original
        await emAnalise.findByIdAndDelete(id);

        const email = documentToDelete.email
        sendVerificationEmail(email,
            `<div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">Aprovação no site Parceiros NeedFarma</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #333;">Olá,</h2>
                    <p style="color: #555;">Seja Bem Vindo Ao Grupo Parceiros Needfarma. Agora você pode fazer login e acessar sua conta.</p>
                    <p style="color: #555;">Clique no link abaixo para fazer login:</p>
                    <p style="text-align: center;">
                        <a href="https:/www.parceiros-need-farma.vercel.app/pages/site/login.html" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Fazer Login</a>
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                    <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                </div>
            </div>`
        )

        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

// negação de conta pelo admin
router.delete('/adminDeny', async (req, res) => {
    try {
        const { id } = req.body;

        // validação do MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Inválido' });
        }

        const documentToDelete = await emAnalise.findById(id);

        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // criação de copia do usuario
        const newUser = new negados({
            _id: documentToDelete._id, // explicitamente o mesmo id de usuario
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            admin: documentToDelete.admin,
        });

        // mandar pra outra coleção a copia
        await newUser.save();

        // apagar o original
        await emAnalise.findByIdAndDelete(id);

        const email = documentToDelete.email
        sendVerificationEmail(email,
            `<div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">Negado no Site Parceiros NeedFarma</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #333;">Olá,</h2>
                    <p style="color: #555;">Infelizmente você foi reprovado e não vai poder fazer parte do nosso grupo Parceiros NeedFarma.</p>
                    <p style="color: #555;">Clique no link abaixo para entrar em contato com o suporte:</p>
                    <p style="text-align: center;">
                        <a href="mailto:suporte@parceiros.needfarma.com.br" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Entrar em contato com suporte</a>
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                    <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                </div>
            </div>`
        )

        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

// desnegação de conta pelo admin (mandar contas negadas para a lista de aceitadas)
router.delete('/adminUndeny', async (req, res) => {
    try {
        const { id } = req.body;

        // validação do MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        const documentToDelete = await negados.findById(id);

        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // criação de copia do usuario
        const newUser = new aceitados({
            _id: documentToDelete._id, // explicitamente o mesmo id de usuario
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            admin: documentToDelete.admin,
        });

        // mandar pra outra coleção a copia
        await newUser.save();

        // apagar o original
        await negados.findByIdAndDelete(id);

        const email = documentToDelete.email
        sendVerificationEmail(email,
            `<div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">Reaceitação no Site Parceiros NeedFarma</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #333;">Olá,</h2>
                    <p style="color: #555;">Você foi aceito no site da NeedFarma. Agora você pode fazer login e acessar sua conta.</p>
                    <p style="color: #555;">Clique no link abaixo para fazer login:</p>
                    <p style="text-align: center;">
                        <a href="https:/www.parceiros-need-farma.vercel.app/pages/site/login.html" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Fazer Login</a>
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                    <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                </div>
            </div>`
        )

        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

// desvalidação de conta pelo admin (mandar contas aceitadas para a lista de negados)
router.delete('/adminUnaccept', async (req, res) => {
    try {
        const { id } = req.body;

        // validação do MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        const documentToDelete = await aceitados.findById(id);

        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // criação de copia do usuario
        const newUser = new negados({
            _id: documentToDelete._id, // explicitamente o mesmo id de usuario
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            admin: documentToDelete.admin,
        });

        // mandar pra outra coleção a copia
        await newUser.save();

        // apagar o original
        await aceitados.findByIdAndDelete(id);

        const email = documentToDelete.email
        sendVerificationEmail(email,
            `<div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">Negado no Site Parceiros NeedFarma</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #333;">Olá,</h2>
                    <p style="color: #555;">Infelizmente você não foi aprovado para fazer parte do nosso grupo Parceiros NeedFarma.</p>
                    <p style="color: #555;">Clique no link abaixo para entrar em contato com o suporte:</p>
                    <p style="text-align: center;">
                        <a href="mailto:suporte@parceiros.needfarma.com.br" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Entrar em contato com suporte</a>
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                    <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                </div>
            </div>`
        )

        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

module.exports = router;