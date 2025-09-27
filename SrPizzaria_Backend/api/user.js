const bcrypt = require('bcrypt-nodejs');

module.exports = app => {
    const obterHash = (senha, callback) => {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(senha, salt, null, (err, hash) => { 
                if (err) return callback(null);
                callback(hash); 
            });
        })
    }
    
    const save = (req, res) => {
        // Validação básica
        const { nome, email, CPF, senha } = req.body;
        
        if (!nome || !email || !CPF || !senha) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
        }
        
        // Verificar se email já existe
        app.db('users')
            .where({ email })
            .first()
            .then(user => {
                if (user) {
                    return res.status(400).json({ mensagem: 'Email já cadastrado' });
                }
                
                // Verificar se CPF já existe
                return app.db('users')
                    .where({ CPF })
                    .first()
                    .then(cpfUser => {
                        if (cpfUser) {
                            return res.status(400).json({ mensagem: 'CPF já cadastrado' });
                        }
                        
                        // Continuar com o cadastro
                        obterHash(senha, hash => {
                            if (!hash) {
                                return res.status(500).json({ mensagem: 'Erro ao processar a senha' });
                            }
                            
                            app.db('users')
                                .insert({ 
                                    nome, 
                                    email, 
                                    CPF, 
                                    senha: hash 
                                })
                                .then(_ => res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' }))
                                .catch(err => {
                                    console.error('Erro ao salvar usuário:', err);
                                    res.status(500).json({ mensagem: 'Erro interno ao cadastrar usuário' });
                                });
                        });
                    });
            })
            .catch(err => {
                console.error('Erro na consulta:', err);
                res.status(500).json({ mensagem: 'Erro ao verificar usuário existente' });
            });
    }
    
    return { save };
}