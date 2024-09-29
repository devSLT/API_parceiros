const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const emAnalise = require('../../models/tabelaEmAnaliseModel.js'); // Import the model
const aceitados = require('../../models/tabelaAceitadosModel.js'); // Import the model
const negados = require('../../models/tabelaNegadosModel.js'); // Import the model

// Fetch entire collection and return as JSON
router.delete('/adminAccept', async (req, res) => {
    try {
        const { id } = req.body; // Get the ObjectId from the request body

        // Check if the provided id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        // Find the document in the signupanalises collection
        const documentToDelete = await emAnalise.findById(id);

        // If no document found with the given ObjectId
        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Create a copy of the document in the users collection
        const newUser = new aceitados({
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            // Add other fields as needed
        });

        // Save the new user to the users collection
        await newUser.save();

        // Delete the document from the signupanalises collection
        await emAnalise.findByIdAndDelete(id);

        // Return success response
        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

router.delete('/adminDeny', async (req, res) => {
    try {
        const { id } = req.body; // Get the ObjectId from the request body

        // Check if the provided id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        // Find the document in the signupanalises collection
        const documentToDelete = await emAnalise.findById(id);

        // If no document found with the given ObjectId
        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Create a copy of the document in the users collection
        const newUser = new negados({
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            // Add other fields as needed
        });

        // Save the new user to the users collection
        await newUser.save();

        // Delete the document from the signupanalises collection
        await emAnalise.findByIdAndDelete(id);

        // Return success response
        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

router.delete('/adminUndeny', async (req, res) => {
    try {
        const { id } = req.body; // Get the ObjectId from the request body

        // Check if the provided id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        // Find the document in the signupanalises collection
        const documentToDelete = await negados.findById(id);

        // If no document found with the given ObjectId
        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Create a copy of the document in the users collection
        const newUser = new aceitados({
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            // Add other fields as needed
        });

        // Save the new user to the users collection
        await newUser.save();

        // Delete the document from the signupanalises collection
        await negados.findByIdAndDelete(id);

        // Return success response
        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

router.delete('/adminUnaccept', async (req, res) => {
    try {
        const { id } = req.body; // Get the ObjectId from the request body

        // Check if the provided id is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ObjectId Invalido' });
        }

        // Find the document in the signupanalises collection
        const documentToDelete = await aceitados.findById(id);

        // If no document found with the given ObjectId
        if (!documentToDelete) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Create a copy of the document in the users collection
        const newUser = new negados({
            businessName: documentToDelete.businessName,
            email: documentToDelete.email,
            phone: documentToDelete.phone,
            personalPhone: documentToDelete.personalPhone,
            cnpj: documentToDelete.cnpj,
            businessType: documentToDelete.businessType,
            cep: documentToDelete.cep,
            address: documentToDelete.address,
            password: documentToDelete.password,
            // Add other fields as needed
        });

        // Save the new user to the users collection
        await newUser.save();

        // Delete the document from the signupanalises collection
        await aceitados.findByIdAndDelete(id);

        // Return success response
        res.status(200).json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
        console.error('Erro processando ativação:', error);
        res.status(500).json({ message: 'Erro processando ativação' });
    }
});

module.exports = router;