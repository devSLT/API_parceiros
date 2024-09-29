const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const emAnalise = require('../../models/tabelaEmAnaliseModel.js'); // Import the model
const aceitados = require('../../models/tabelaAceitadosModel.js'); // Import the model
const negados = require('../../models/tabelaNegadosModel.js'); // Import the model

// Fetch entire collection and return as JSON
router.get('/emAnalise', async (req, res) => {
    try {
        const documents = await emAnalise.find({}); // Fetch all documents from the collection
        // Transform documents into the desired format
        // Helper function to format date as DD/MM/YYYY
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0'); // Add leading 0 if necessary
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const transformedDocuments = documents.map(doc => {
            return {
                id: doc._id, // Use the MongoDB ObjectId as 'id'
                name: doc.businessName, // Use 'businessName' as 'name'
                staticString: "Em Análise", // Static string 1
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

router.get('/aceitados', async (req, res) => {
    try {
        const documents = await aceitados.find({}); // Fetch all documents from the collection
        // Transform documents into the desired format
        // Helper function to format date as DD/MM/YYYY
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0'); // Add leading 0 if necessary
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const transformedDocuments = documents.map(doc => {
            return {
                id: doc._id, // Use the MongoDB ObjectId as 'id'
                name: doc.businessName, // Use 'businessName' as 'name'
                staticString: "Ativado", // Static string 1
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

router.get('/negados', async (req, res) => {
    try {
        const documents = await negados.find({}); // Fetch all documents from the collection
        // Transform documents into the desired format
        // Helper function to format date as DD/MM/YYYY
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0'); // Add leading 0 if necessary
            const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const transformedDocuments = documents.map(doc => {
            return {
                id: doc._id, // Use the MongoDB ObjectId as 'id'
                name: doc.businessName, // Use 'businessName' as 'name'
                staticString: "Desativado", // Static string 1
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

module.exports = router;