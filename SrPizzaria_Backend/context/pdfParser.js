const fs = require("fs");
const path = require("path");

const loadContext = async () => {
  const filePath = path.resolve(__dirname, "../context/context.txt");

  try {
    console.log("Carregando contexto de:", filePath);
    const content = fs.readFileSync(filePath, "utf-8");

    if (!content.trim()) {
      throw new Error("Arquivo de contexto está vazio");
    }

    console.log("Contexto carregado com sucesso!");
    return content;
  } catch (err) {
    console.error("Erro ao carregar contexto:", {
      path: filePath,
      error: err.message,
    });

    return `
      Nome do Estabelecimento: Sr.Pizzaria
      [CARDÁPIO]
      - Pizza Calabresa: R$30,00
      - Pizza Margherita: R$32,00
      - Coca-Cola: R$5,00
      
      [ENTREGAS]
      - Taxa: R$5 (grátis acima de R$80)
      - Tempo: 30-45 minutos
      
      (Modo fallback ativado)
    `;
  }
};

module.exports = { loadContext };
