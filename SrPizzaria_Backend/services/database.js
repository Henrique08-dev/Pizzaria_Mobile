const getUserData = async (userId, db) => {
  try {
    const pedidos = await db("pedidos")
      .where({ user_id: userId }) // (snake_case)
      .select("item", "valor", "quantidade", "data_pedido");

    const totalGasto = pedidos.reduce(
      (acc, pedido) => acc + pedido.valor * pedido.quantidade,
      0
    );

    return {
      pedidos,
      totalGasto,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw new Error("Erro ao buscar dados do usuário");
  }
};

module.exports = getUserData;
