const moment = require('moment');

module.exports = app => {
    const getPedidos = (req, res) => {
        const date = req.query.date ? req.query.date
            : moment().endOf('day').toDate();

        app.db('pedidos')
            .where({ userid: req.user.id })
            .where('data_pedido ', '<=', date)
            .orderBy('data_pedido ')
            .then(pedidos => res.json(pedidos))
            .catch(err => res.status(400).json(err))


    }
    const save = (req, res) => {
        if (!req.body.item) {
            return res.status(400).send('Item não informado');
        }
        if (!req.body.valor || isNaN(req.body.valor)) {
            return res.status(400).send('Valor não informado ou inválido');
        }
        if (!req.body.quantidade) {
            return res.status(400).send('Quantidade não informada');
        }

        // Exibe os dados que serão inseridos
        console.log('Dados do Pedido:', req.body);

        req.body.valor = parseFloat(req.body.valor).toFixed(2);
        req.body.userid = req.user.id;

        app.db('pedidos')
            .insert({ userid: req.user.id, item: req.body.item, valor: req.body.valor, quantidade: req.body.quantidade })
            .then(_ => res.status(204).send())
            .catch(err => {
                console.error('Erro na Inserção:', err);
                res.status(400).json(err);
            });
    };



    const remove = (req, res) => {
        app.db('pedidos')
            .where({ id: req.params.id, userid: req.user.id })
            .del()
            .then(rowsDeleted => {
                if (rowsDeleted > 0) {
                    res.status(204).send()
                } else {
                    const msg = `Não foi possível deletar o pedido com id ${req.params.id}`
                    res.status(400).send(msg)
                }
            })
            .catch(err => res.status(400).json(err))
    }

    const updatePedidosDoneAt = (req, res, doneAt) => {
        app.db('pedidos')
            .where({ id: req.params.id, userid: req.user.id })
            .update({ doneAt })
            .then(_ => res.status(204).send())
            .catch(err => res.status(400).json(err))

    }

    const togglePedidos = (req, res) => {
        app.db('pedidos')
            .where({ id: req.params.id, userid: req.user.id })
            .first()
            .then(pedido => {
                if (!pedido) {
                    const msg = `Pedido com id ${req.params.id} não encontrado.`
                    return res.status(400).send(msg)
                }
                const doneAt = pedido.doneAt ? null : new Date()
                updatePedidosDoneAt(req, res, doneAt)
            })
            .catch(err => res.status(400).json(err))
    }

    return { getPedidos, save, remove, togglePedidos }
}