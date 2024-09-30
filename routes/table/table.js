const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const emAnalise = require('../../models/tabelaEmAnaliseModel.js'); // Importar model dos em analise
const aceitados = require('../../models/tabelaAceitadosModel.js'); // Importar model dos aceitados
const negados = require('../../models/tabelaNegadosModel.js'); //  Importar model dos negados

// pegar lista completa de contas em analise
router.get('/emAnalise', async (req, res) => {
    try {
        const documents = await emAnalise.find({});
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
        const documents = await aceitados.find({});
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
        const documents = await negados.find({});
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
            emAnalise.find({}),
            aceitados.find({}),
            negados.find({})
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
            return res.status(400).json({ message: 'ObjectId Invalido' });
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

        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

module.exports = router;