require('dotenv').config();
//Models DB
const userAnalise = require('../models/UserAnalise.js');
const UserTemp = require('../models/UserTemp.js');
const UserAceito = require('../models/tabelaAceitadosModel.js');
const UserNegados = require('../models/tabelaNegadosModel.js');
//Functions Gerar e Enviar
const { generateVerificationCode, sendVerificationEmail } = require('../models/verificationEmail.js');

//validacoes
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const inpValidacoes = require('./inputsValidation.js');
const inputValidacoes = require('./inputsValidation.js');

const userController = {

    /*/////////Criacao de contas/////////*/

    register: async function (req, res) {
        //Pega os dados do body
        const { businessName, email, phone, personalPhone, cnpj, businessType, cep, address, password } = req.body;

        //Validacoes de input
        if (!businessName || !email || !phone || !personalPhone || !cnpj || !cep || !address || !password) {
            return res.status(400).json({ msg: "Todos os campos devem ser preenchidos." })
        }

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        if (!inpValidacoes.validatePassword(password)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        if (!inpValidacoes.validateCNPJ(cnpj)) {
            return res.status(400).json({ msg: "Insira um CNPJ válido, utilize somente números." });
        }

        if (!businessType) {
            return res.status(400).json({ msg: "O tipo de negócio é obrigatório" });
        }

        if (!inpValidacoes.validatePhone(phone)) {
            return res.status(400).json({ msg: "Insira um Telefone válido, utilize somente números." });
        }

        if (!inpValidacoes.validateCEP(cep)) {
            return res.status(400).json({ msg: "Insira um CEP válido, utilize somente números." });
        }

        //BCRYPT
        const saltsRound = 10;
        const hashedPassword = await bcrypt.hash(password, saltsRound);

        //Verification Code Email
        const verificationCode = generateVerificationCode();

        // Monta os dados temporarios no Schema
        const userTemp = new UserTemp({
            businessName,
            email,
            phone,
            personalPhone,
            cnpj,
            businessType,
            cep,
            address,
            password: hashedPassword,
            verificationcode: verificationCode,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
            expiresAfter: Date.now() + 180 * 60 * 1000
        });

        try {

            //Faz todas as verificacoes simultaneas utilizando a promisse
            const verificarExistencia = async () => {
                const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                    UserAceito.findOne({ $or: [{ businessName }, { email }, { phone }, { personalPhone }, { cnpj }] }),
                    UserNegados.findOne({ $or: [{ businessName }, { email }, { phone }, { personalPhone }, { cnpj }] }),
                    UserTemp.findOne({ $or: [{ businessName }, { email }, { phone }, { personalPhone }, { cnpj }] }),
                    userAnalise.findOne({ $or: [{ businessName }, { email }, { phone }, { personalPhone }, { cnpj }] })
                ]);

                //O uso do !! retorna boolean
                return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
            };

            const existeUsuario = await verificarExistencia();

            if (existeUsuario) {
                return res.status(409).json({ msg: "Os dados inseridos já estão sendo usados." });
            }

            //Salva o usuario temporario
            await userTemp.save();

            //Envia o codigo para confirmacao do e-mail
            sendVerificationEmail(email,
                `<div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px;">
                    <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white;">
                        <h1 style="margin: 0;">Verificação de Email</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2 style="color: #333;">Olá, você está recebendo um E-mail de verificação</h2>
                        <p style="color: #555;">Obrigado por se registrar! Por favor, use o código abaixo para verificar seu e-mail:</p>
                        <div id="code-container" style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 5px; text-align: center; cursor: pointer;">
                            <h3 style="color: #4CAF50; font-size: 24px; margin: 0;" id="verificationCode">${verificationCode}</h3>
                        </div>
                        <p style="color: #555;">Se você não se registrou, ignore este e-mail.</p>
                    </div>
                    <div style="padding: 20px; text-align: center; background-color: #f4f4f4;>
                        <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                    </div>
                </div>`
            )
            res.status(201).json({ msg: 'Código de verificação enviado.' });

        } catch (error) {
            // Captura erros ao salvar ou enviar o e-mail
            console.error('Erro ao salvar o usuário temporário:', error);
            res.status(400).json({ msg: 'Erro ao processar o cadastro.' });
        }
    },

    resendCode: async function (req, res) {
        const { email } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        //gera um novo codigo
        const newCode = generateVerificationCode();

        UserTemp.findOneAndUpdate(
            { email },
            { verificationcode: newCode },
            { new: true },
        )
            .then(user => {

                if (!user) {
                    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
                }

                sendVerificationEmail(email,
                    ` <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">Reenvio de código de verificação de Email</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #333;">Olá, somos da NeedFarma, você está recebendo um E-mail e verificação</h2>
                    <p style="color: #555;">Obrigado por se registrar! Por favor, use o código abaixo para verificar seu e-mail:</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 5px; text-align: center;">
                        <h3 style="color: #4CAF50; font-size: 24px; margin: 0;">${newCode}</h3>
                    </div>
                    <p style="color: #555;">Se você não se registrou, ignore este e-mail.</p>
                </div>
                <div style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                    <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                </div>
            </div>`)

                res.json({ success: true, message: 'Código atualizado e enviado com sucesso!' });

            })
            .catch(err => {
                res.status(500).json({ success: false, message: 'Erro ao atualizar o código', error: err });
            });
    },

    verify: async function (req, res) {
        //Pega os dados do body
        const { email, verificationCode } = req.body;

        try {

            // Tenta encontrar o usuario temporario
            const userTemp = await UserTemp.findOne({ email, verificationcode: verificationCode });
            if (!userTemp) {
                console.log('Usuário temporário não encontrado.');
                return res.status(400).json({ msg: "Código inválido ou expirado." });
            }

            // Cria um novo user apos a verificacao do email 
            const useranalise = new userAnalise({
                businessName: userTemp.businessName,
                email: userTemp.email,
                phone: userTemp.phone,
                personalPhone: userTemp.personalPhone,
                cnpj: userTemp.cnpj,
                businessType: userTemp.businessType,
                cep: userTemp.cep,
                address: userTemp.address,
                password: userTemp.password,
                admin: userTemp.admin,
            });

            // Salva o novo usuário
            await useranalise.save();

            sendVerificationEmail(email,
                ` <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="padding: 20px; text-align: center; background-color: #4CAF50; color: white; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0;">Sua conta está em análise</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2 style="color: #333;">Olá, somos do grupo Parceiros NeedFarma, sua conta está em análise</h2>
                        <p style="color: #555;">Obrigado por se registrar!</p>
                        <p style="color: #555;">Se você não se registrou, ignore este e-mail.</p>
                    </div>
                    <div style="padding: 20px; text-align: center; background-color: #f4f4f4; border-radius: 0 0 8px 8px;">
                        <p style="color: #777; font-size: 14px;">&copy; 2024 Parceiros NeedFarma. Todos os direitos reservados.</p>
                    </div>
                </div>`
            )

            // Exclui o usuario temporário após a verificação
            await UserTemp.deleteOne({ email });

            res.status(201).json({ msg: 'Sua conta foi enviada para análise, enviaremos um email assim que ela for aceita.' });
        } catch (error) {
            console.error('Erro ao processar a verificação:', error);
            res.status(500).json({ msg: 'Erro ao processar a verificação.' });
        }
    },

    // ############ LOGIN ####################

    login: async function (req, res) {

        const { email, password } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        if (!inpValidacoes.validatePassword(password)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        try {

            const useranalise = await userAnalise.findOne({ email });

            if (useranalise) {
                return res.status(401).json({ sucess: false, msg: "Sua conta ainda está em análise" });
            }

            const userRejeitado = await UserNegados.findOne({ email });

            if (userRejeitado) {
                return res.status(401).json({ sucess: false, msg: "Sua conta não foi aceita" });
            }

            const userAceito = await UserAceito.findOne({ email });

            if (userAceito) {

                // Compare a senha fornecida com a senha armazenada
                const isMatch = await bcrypt.compare(password, userAceito.password);

                if (!isMatch) {
                    return res.status(401).json({ msg: 'Senha inválida.' });
                }

                const SECRET = process.env.TOKEN_SECRET

                const token = jwt.sign({

                    id: userAceito._id,
                    admin: userAceito.admin,

                },
                    SECRET,
                    { expiresIn: '1d' }
                );


                return res.status(200).json({ sucess: true, msg: "Login Realizado com sucesso", token })
            }

            res.status(401).json({ sucess: false, msg: "Não foi possível realizar o login" })

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Erro ao tentar fazer login.' });
        }
    },

    // ############ CHECK TOKEN ####################

    check: function async(req, res) {

        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];
        const token = authToken.replace(/^Bearer\s+/i, '');

        if (!token) {
            res.status(401).json({ sucess: false, msg: "Acesso Negado" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(token, SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", sucess: false });
            } else {
                return res.status(200).json({ msg: "Token válido!", sucess: true, user: decoded });
            }
        })

    },

    forgotPassword: async function (req, res) {
        const { email } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        try {

            const user = await UserAceito.findOne({ email })

            if (!user) {
                return res.status(500).json({ sucess: false, msg: "Usuário não encontrado" });
            }

            // Gera um token randômico para redefinição de senha
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = Date.now() + 20 * 60 * 1000; // Token expira em 20 minutos

            await UserAceito.findOne(
                { email },
                { resetToken, resetTokenExpires }
            )

            const resetUrl = `https://parceiros-need-farma.vercel.app/pages/site/changePass.html?token=${resetToken}`;


            sendVerificationEmail(email, `<h3>Link para alteração de senha NeedFarma: <a href="${resetUrl}">Alterar Senha</a></h3>`);

            res.json({ msg: 'Link de redefinição de senha enviado ao seu E-mail.' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: 'Erro ao solicitar redefinição de senha.' });
        }
    },

    resetPassword: async function (req, res) {
        const { token } = req.query; // Use req.query para acessar o token

        try {
            const user = await UserAceito.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });

            if (!user) {
                return res.status(400).json({ msg: 'Token inválido ou expirado.' });
            }

            // Redirect to change password page
            res.redirect(`http://localhost:5500/reset-password?token=${token}`); // Redireciona para a URL da página de alteração de senha
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: 'Erro ao verificar o token.' });
        }
    },

    changePassword: async function (req, res) {
        const { email, password, confirmPassword } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        if (!inpValidacoes.validatePassword(password)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        if (!inpValidacoes.validatePassword(confirmPassword)) {
            return res.status(400).json({ "msg": "A senha deve conter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@$!%*?&)." });
        }

        if (password !== confirmPassword) {
            return res.status(409).json({ msg: "As senhas não coincidem" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {

            const updatedUser = await UserAceito.findOneAndUpdate(
                { email },
                { password: hashedPassword, resetToken: null, resetTokenExpires: null },
                { new: true },
            )

            if (!updatedUser) {
                s
                console.log(updatedUser)
                return res.status(404).json({ sucess: false, msg: 'Usuário não encontrado para atualização.' });
            }

            res.status(201).json({ sucess: true, msg: `Senha alterada com sucesso!` });

        } catch (err) {
            res.send(500).json({ sucess: false, msg: `Ocorreu um erro ao tentar atualizar senha` });
            throw new Error(err);
        }
    },

    resendPassword: async function (req, res) {
        const { email } = req.body;

        if (!inputValidacoes.validateEmail(email)) {
            return res.status(400).json({ msg: "Insira um E-mail válido." });
        }

        // Gera um token randômico para redefinição de senha
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 20 * 60 * 1000; // Token expira em 20 minutos

        try {
            const findUser = await UserAceito.findOneAndUpdate(
                { email },
                { resetToken, resetTokenExpires },
                { new: true, },
            )

            if (!findUser) {
                return res.status(500).json({ sucess: false, msg: "O usuário não foi encontrado" });
            }

            const resetUrl = `https://parceiros-need-farma.vercel.app/pages/site/changePass.html?token=${resetToken}`;

            sendVerificationEmail(email, `<h3>Link para alteração de senha NeedFarma: <a href="${resetUrl}">Alterar Senha</a></h3>`);

            res.json({ success: true, message: 'Novo link para alteração de senha foi enviado' });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar um novo link', error: err });
        }
    },

    // Rota GET para pegar informações 
    getInfos: async function (req, res) {
        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!authToken) {
            return res.status(401).json({ success: false, msg: "Token inválido ou expirado" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {
                    // Use findById para buscar o usuário pelo ID decodificado
                    const user = await UserAceito.findById(decoded.id); // Aqui estava o erro

                    if (!user) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    // Retornar informações do usuário no corpo da resposta
                    return res.status(200).json({
                        success: true,
                        msg: "Token válido!",
                        user: {
                            id: user._id,
                            email: user.email,
                            phone: user.phone,
                            personalPhone: user.personalPhone,
                            cnpj: user.cnpj,
                            cep: user.cep,
                            address: user.address,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao buscar usuário.", error: error.message });
                }
            }
        });
    },

    changeEmail: async function (req, res) {

        const { newEmail } = req.body

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!authToken) {
            return res.status(401).json({ success: false, msg: "Token inválido ou expirado, faça login novamente" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!inputValidacoes.validateEmail(newEmail)) {
                        return res.status(400).json({ msg: "Insira um E-mail válido." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ email: newEmail }), // Correção: use "newEmail" em vez de "email"
                            UserNegados.findOne({ email: newEmail }),
                            UserTemp.findOne({ email: newEmail }),
                            userAnalise.findOne({ email: newEmail }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeEmail = await verificarExistencia();

                    if (existeEmail) {
                        return res.status(409).json({ msg: "O E-mail já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { email: newEmail }, // Atualiza apenas o email
                        { new: true } // Retorna o documento atualizado
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "Email atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            email: updatedUser.email,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o email.", error: error.message });
                }
            }
        });

    },

    changePhone: async (req, res) => {

        const { newPhone } = req.body

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!authToken) {
            return res.status(401).json({ success: false, msg: "Token inválido ou expirado, faça login novamente" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!inpValidacoes.validatePhone(newPhone)) {
                        return res.status(400).json({ msg: "Insira um Telefone válido, utilize somente números." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ phone: newPhone }), // Correção: use "newEmail" em vez de "email"
                            UserNegados.findOne({ phone: newPhone }),
                            UserTemp.findOne({ phone: newPhone }),
                            userAnalise.findOne({ phone: newPhone }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeEmail = await verificarExistencia();

                    if (existeEmail) {
                        return res.status(409).json({ msg: "O telefone já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { phone: newPhone }, // Atualiza apenas o phone
                        { new: true } // Retorna o documento atualizado
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "Telefone atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            phone: updatedUser.phone,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o telefone.", error: error.message });
                }
            }
        });
    },

    changePersonalPhone: async (req, res) => {

        const { newPersonalPhone } = req.body

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!authToken) {
            return res.status(401).json({ success: false, msg: "Token inválido ou expirado, faça login novamente" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!inpValidacoes.validatePhone(newPersonalPhone)) {
                        return res.status(400).json({ msg: "Insira um Telefone válido, utilize somente números." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ personalPhone: newPersonalPhone }), // Correção: use "newEmail" em vez de "email"
                            UserNegados.findOne({ personalPhone: newPersonalPhone }),
                            UserTemp.findOne({ personalPhone: newPersonalPhone }),
                            userAnalise.findOne({ personalPhone: newPersonalPhone }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeEmail = await verificarExistencia();

                    if (existeEmail) {
                        return res.status(409).json({ msg: "Esse telefone pessoal já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { personalPhone: newPersonalPhone }, // Atualiza apenas o phone
                        { new: true } // Retorna o documento atualizado
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "Telefone pessoal atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            personalPhone: updatedUser.personalPhone,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o telefone pessoal.", error: error.message });
                }
            }
        });
    },

    changeCnpj: async (req, res) => {

        const { newCnpj } = req.body

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!authToken) {
            return res.status(401).json({ success: false, msg: "Token inválido ou expirado, faça login novamente" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!inpValidacoes.validateCNPJ(newCnpj)) {
                        return res.status(400).json({ msg: "Insira um CNPJ válido, utilize somente números." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ cnpj: newCnpj }),
                            UserNegados.findOne({ cnpj: newCnpj }),
                            UserTemp.findOne({ cnpj: newCnpj }),
                            userAnalise.findOne({ cnpj: newCnpj }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeCnpj = await verificarExistencia();

                    if (existeCnpj) {
                        return res.status(409).json({ msg: "Esse CNPJ já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { cnpj: newCnpj }, // Atualiza apenas o phone
                        { new: true } // Retorna o documento atualizado
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "CNPJ atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            cnpj: updatedUser.cnpj,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o CNPJ.", error: error.message });
                }
            }
        });
    },

    changeCep: async (req, res) => {

        const { newCep } = req.body

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!inpValidacoes.validateCEP(newCep)) {
            return res.status(400).json({ msg: "Insira um CEP válido, utilize somente números." });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!inpValidacoes.validateCNPJ(newCnpj)) {
                        return res.status(400).json({ msg: "Insira um CEP válido, utilize somente números." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ cep: newCep }),
                            UserNegados.findOne({ cep: newCep }),
                            UserTemp.findOne({ cep: newCep }),
                            userAnalise.findOne({ cep: newCep }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeCEP = await verificarExistencia();

                    if (existeCEP) {
                        return res.status(409).json({ msg: "Esse CEP já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { cep: newCep },
                        { new: true },
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "CEP atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            cep: updatedUser.cep,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o CEP.", error: error.message });
                }
            }
        });
    },

    changeAddress: async (req, res) => {

        const { newAddress } = req.body

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!inpValidacoes.validateCEP(newAddress)) {
            return res.status(400).json({ msg: "Insira um Endereço válido" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!newAddress) {
                        return res.status(400).json({ msg: "Adicione mais informações." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ address: newAddress }),
                            UserNegados.findOne({ address: newAddress }),
                            UserTemp.findOne({ address: newAddress }),
                            userAnalise.findOne({ address: newAddress }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeCEP = await verificarExistencia();

                    if (existeCEP) {
                        return res.status(409).json({ msg: "Esse endereço já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { address: newAddress },
                        { new: true },
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "Endereço atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            cep: updatedUser.cep,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o endereço.", error: error.message });
                }
            }
        });
    },

    completeReg: async (req, res) => {

        const { fullName, RgCnh } = req.body;

        // Validação do TOKEN
        const authHeader = req.headers['authorization'];
        const authToken = authHeader && authHeader.split(" ")[1];

        if (!inpValidacoes.validateCEP(newAddress)) {
            return res.status(400).json({ msg: "Insira um Endereço válido" });
        }

        const SECRET = process.env.TOKEN_SECRET;

        jwt.verify(authToken, SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ msg: "Token inválido!", success: false });
            } else {
                try {

                    if (!newAddress) {
                        return res.status(400).json({ msg: "Adicione mais informações." });
                    }

                    //Faz todas as verificacoes simultaneas utilizando a promisse
                    const verificarExistencia = async () => {
                        const [verificarAceitos, verificarNegados, verificaTemp, verificarAnalises] = await Promise.all([
                            UserAceito.findOne({ address: newAddress }),
                            UserNegados.findOne({ address: newAddress }),
                            UserTemp.findOne({ address: newAddress }),
                            userAnalise.findOne({ address: newAddress }),
                        ]);

                        //O uso do !! retorna boolean
                        return !!(verificarAceitos || verificarNegados || verificaTemp || verificarAnalises);
                    };

                    const existeCEP = await verificarExistencia();

                    if (existeCEP) {
                        return res.status(409).json({ msg: "Esse endereço já está em uso" });
                    }


                    // Atualiza o email do usuário pelo ID decodificado
                    const updatedUser = await UserAceito.findByIdAndUpdate(
                        decoded.id,
                        { address: newAddress },
                        { new: true },
                    );

                    if (!updatedUser) {
                        return res.status(404).json({ success: false, msg: "Usuário não encontrado." });
                    }

                    return res.status(200).json({
                        success: true,
                        msg: "Endereço atualizado com sucesso!",
                        user: {
                            id: updatedUser._id,
                            cep: updatedUser.cep,
                        },
                    });
                } catch (error) {
                    return res.status(500).json({ success: false, msg: "Erro ao atualizar o endereço.", error: error.message });
                }
            }
        });

    }

}

module.exports = userController;
