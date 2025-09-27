const moment = require('moment')

module.exports = app => {

    const save = (req, res) => {
        if (!req.body.nome) {
            return res.status(400).send('nome não informado')
        }
        if (!req.body.preco || isNaN(req.body.preco)) {
            return res.status(400).send('preço não informado ou inválido')
        }
        if (!req.body.categoria) {
            return res.status(400).send('Categoria não informada')
        }
        if (!req.body.descricao) {
            return res.status(400).send('Descrição não informada')
        }
        if (!req.body.imagem) {
            return res.status(400).send('Imagem não informada')
        }

        // Exibe os dados que serão inseridos
        console.log('Dados do Produto:', req.body)

        req.body.preco = parseFloat(req.body.preco).toFixed(2)

        app.db('produtos')
            .insert({ nome: req.body.nome, preco: req.body.preco, categoria: req.body.categoria, descricao: req.body.descricao, imagem: req.body.imagem })
            .then(_ => res.status(204).send())
            .catch(err => {
                console.error('Erro na Inserção:', err)
                res.status(400).json(err)
            })
    }
    const remove = async (req, res) => {
        try {
            const rowsDeleted = await app.db('produtos')
                .where({ id: req.params.id })
                .del()

            existsOrError(rowsDeleted, 'Produto não encontrado')

            res.status(204).send()
        } catch (msg) {
            res.status(400).send(msg)
        }
    }

    const getProdutos = async (req, res) => {
        try {
            // Buscar todos os produtos no banco de dados
            const produtos = await app.db('produtos')
                .select('*')
                .orderBy('nome')

            return res.json(produtos)
        } catch (err) {
            console.error(err)
            return res.status(500).send(err)
        }
    }

    const getProdutoById = async (req, res) => {
        try {
            const produto = await app.db('produtos')
                .where({ id: req.params.id })
                .first()

            existsOrError(produto, 'Produto não encontrado')

            return res.json(produto)
        } catch (msg) {
            return res.status(400).send(msg)
        }
    }

    const getProdutosByCategoria = async (req, res) => {
        try {
            const produtos = await app.db('produtos')
                .where({ categoria: req.params.categoria })
                .select('*')
                .orderBy('nome')

            return res.json(produtos)
        } catch (err) {
            return res.status(500).send(err)
        }
    }

    return { save, remove, getProdutos, getProdutoById, getProdutosByCategoria }

}