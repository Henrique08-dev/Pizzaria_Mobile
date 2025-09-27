import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// API URL
const API_URL = 'http://192.168.1.7:3000';

// Imagens de perfil
const IMAGENS_PERFIL = {
  usuario: require('../assets/images/logotipo.png'),
  ia: require('../assets/images/logotipo.png')
};

// Interface da mensagem
interface Mensagem {
  id: string;
  texto: string;
  remetente: 'usuario' | 'ia';
  timestamp: number;
  nomeRemetente: string;
  imagemPerfil: any;
}

// Interface do produto
interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  descricao: string;
}

// Interface do pedido
interface Pedido {
  id: number;
  item: string;
  valor: number;
  quantidade: number;
  data_pedido: string;
}

export default function TelaChatPizzaria() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [mensagemEntrada, setMensagemEntrada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemEditando, setMensagemEditando] = useState<Mensagem | null>(null);
  const [mensagemSelecionada, setMensagemSelecionada] = useState<Mensagem | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Lista de comandos disponíveis
  const COMANDOS = {
    VISUALIZAR_PEDIDOS: ['meus pedidos', 'ver pedidos', 'pedidos', '1', 'visualizar pedidos'],
    VISUALIZAR_CARDAPIO: ['cardápio', 'ver cardápio', 'menu', '2', 'visualizar cardapio'],
    FAZER_PEDIDO: ['fazer pedido', 'pedir', 'novo pedido', '3', 'fazer um pedido'],
    SUGESTAO_DIA: ['sugestão', 'sugestão do dia', 'recomendação', '4', 'sugestão do dia']
  };

  // Produtos categorizados
  const PRODUTOS_POR_CATEGORIA = {
    pizzas: [
      { id: 1, nome: 'Calabresa', preco: 30.0, categoria: 'pizzas', descricao: 'Queijo, calabresa e cebola' },
      { id: 2, nome: 'Portuguesa', preco: 35.0, categoria: 'pizzas', descricao: 'Presunto, queijo, ervilha e ovos' },
      { id: 5, nome: 'Margherita', preco: 32.0, categoria: 'pizzas', descricao: 'Queijo, tomate e manjericão' }
    ],
    bebidas: [
      { id: 3, nome: 'Coca-Cola', preco: 5.0, categoria: 'bebidas', descricao: 'Refrigerante 350ml' },
      { id: 4, nome: 'Guaraná', preco: 5.0, categoria: 'bebidas', descricao: 'Refrigerante 350ml' },
      { id: 6, nome: 'Suco Natural', preco: 7.0, categoria: 'bebidas', descricao: 'Suco de laranja 300ml' }
    ],
    sobremesas: [
      { id: 7, nome: 'Pudim', preco: 8.0, categoria: 'sobremesas', descricao: 'Pudim de leite condensado' },
      { id: 8, nome: 'Sorvete', preco: 6.0, categoria: 'sobremesas', descricao: 'Bola de sorvete de chocolate' }
    ]
  };

  // Inicializa o chat e carrega os dados
  useEffect(() => {
    carregarDadosUsuario();
    carregarProdutos();
  }, []);

  // Rola o chat para baixo quando mensagens mudam
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [mensagens]);

  // Carrega dados do usuário do AsyncStorage
  const carregarDadosUsuario = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (token) {
        setUserToken(token);
      } else {
        Alert.alert('Sessão expirada', 'Por favor, faça login novamente.');
        router.replace('/login');
        return;
      }
      
      if (userDataStr) {
        const parsedUserData = JSON.parse(userDataStr);
        setUserData(parsedUserData);
        
        // Envia mensagem de saudação com o nome do usuário
        const saudacaoInicial: Mensagem = {
          id: Date.now().toString(),
          texto: `Olá ${parsedUserData.name}! Bem-vindo ao chat da pizzaria. Como posso ajudar você hoje?\n\n1 - Visualizar seus pedidos\n2 - Visualizar o cardápio\n3 - Fazer um pedido\n4 - Sugestão do dia`,
          remetente: 'ia',
          timestamp: Date.now(),
          nomeRemetente: 'Assistente de Pedidos',
          imagemPerfil: IMAGENS_PERFIL.ia
        };
        setMensagens([saudacaoInicial]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados.');
    }
  };

  // Carrega produtos da API ou usa os produtos predefinidos
  const carregarProdutos = async () => {
    // Combinar todos os produtos de diferentes categorias
    const todosProdutos = [
      ...PRODUTOS_POR_CATEGORIA.pizzas,
      ...PRODUTOS_POR_CATEGORIA.bebidas,
      ...PRODUTOS_POR_CATEGORIA.sobremesas
    ];
    setProdutos(todosProdutos);
  };

  // Busca pedidos do usuário da API
  const buscarPedidos = async () => {
    if (!userToken) {
      enviarMensagemIA('Você precisa estar logado para ver seus pedidos.');
      return null;
    }
  
    setCarregandoDados(true);
    try {
      // Log para verificar se o token está sendo enviado
      console.log('Token de usuário:', userToken);
  
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}` // Envia o token no cabeçalho da requisição
        }
      });
  
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos');
      }
  
      // Log para verificar a resposta da API
      const data = await response.json();
      console.log('Pedidos recebidos:', data);
  
      setPedidos(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return null;
    } finally {
      setCarregandoDados(false);
    }
  };
  
  // Envia uma mensagem como IA
  const enviarMensagemIA = (texto: string) => {
    const mensagemIA: Mensagem = {
      id: Date.now().toString(),
      texto,
      remetente: 'ia',
      timestamp: Date.now(),
      nomeRemetente: 'Assistente de Pedidos',
      imagemPerfil: IMAGENS_PERFIL.ia
    };

    setMensagens(mensagensAnteriores => [...mensagensAnteriores, mensagemIA]);
  };

  // Função principal para processar as entradas do usuário
  const processarEntradaUsuario = async (entrada: string) => {
    const entradaMinuscula = entrada.toLowerCase().trim();
    if (COMANDOS.VISUALIZAR_PEDIDOS.some(cmd => entradaMinuscula.includes(cmd))) {
      const pedidosUsuario = await buscarPedidos();
      
      // Verificar se pedidos foram recebidos corretamente
      if (!pedidosUsuario || pedidosUsuario.length === 0) {
        enviarMensagemIA('Você ainda não fez nenhum pedido.');
        return;
      }
    
      let resposta = 'Aqui estão seus pedidos:\n\n';
      pedidosUsuario.forEach((pedido: Pedido, index: number) => {
        const data: string = new Date(pedido.data_pedido).toLocaleDateString('pt-BR');
        resposta += `Pedido #${pedido.id} (${data}):\n`;
        resposta += `Item: ${pedido.item}\n`;
        resposta += `Quantidade: ${pedido.quantidade}\n`;
        resposta += `Valor: R$ ${Number(pedido.valor).toFixed(2)}\n`; // Certifique-se de formatar o valor corretamente
        
        
        if (index < pedidosUsuario.length - 1) {
          resposta += '\n------------------\n\n';
        }
      });
    
      enviarMensagemIA(resposta);
    }
    // Visualizar cardápio
    else if (COMANDOS.VISUALIZAR_CARDAPIO.some(cmd => entradaMinuscula.includes(cmd))) {
      let resposta = 'Aqui está nosso cardápio:\n\n';
      
      // Pizzas
      resposta += '🍕 PIZZAS:\n';
      PRODUTOS_POR_CATEGORIA.pizzas.forEach(pizza => {
        resposta += `• ${pizza.nome} - R$ ${pizza.preco.toFixed(2)}\n  ${pizza.descricao}\n`;
      });
      
      resposta += '\n🥤 BEBIDAS:\n';
      PRODUTOS_POR_CATEGORIA.bebidas.forEach(bebida => {
        resposta += `• ${bebida.nome} - R$ ${bebida.preco.toFixed(2)}\n  ${bebida.descricao}\n`;
      });
      
      resposta += '\n🍮 SOBREMESAS:\n';
      PRODUTOS_POR_CATEGORIA.sobremesas.forEach(sobremesa => {
        resposta += `• ${sobremesa.nome} - R$ ${sobremesa.preco.toFixed(2)}\n  ${sobremesa.descricao}\n`;
      });
      
      resposta += '\nPara fazer um pedido, digite "fazer pedido" seguido do nome do item e quantidade.';
      
      enviarMensagemIA(resposta);
    }
    // Sugestão do dia
    else if (COMANDOS.SUGESTAO_DIA.some(cmd => entradaMinuscula.includes(cmd))) {
      const diaDaSemana = new Date().getDay();
      let sugestao = '';
      
      // Sugestões baseadas no dia da semana
      switch (diaDaSemana) {
        case 0: // Domingo
          sugestao = 'Portuguesa com borda recheada de catupiry e uma Coca-Cola gelada!';
          break;
        case 1: // Segunda
          sugestao = 'Margherita com uma taça de suco natural para começar bem a semana!';
          break;
        case 2: // Terça
          sugestao = 'Calabresa com cebola e uma Guaraná gelada!';
          break;
        case 3: // Quarta
          sugestao = 'Metade Portuguesa e metade Calabresa com uma sobremesa de Pudim!';
          break;
        case 4: // Quinta
          sugestao = 'Pizza de Frango com Catupiry e uma sobremesa de Sorvete!';
          break;
        case 5: // Sexta
          sugestao = 'Pepperoni com borda recheada e uma Coca-Cola para celebrar o fim de semana!';
          break;
        case 6: // Sábado
          sugestao = 'Combo familiar: Pizza grande Portuguesa, refrigerantes e sobremesa!';
          break;
      }
      
      enviarMensagemIA(`A sugestão de hoje é: ${sugestao}\n\nDeseja fazer este pedido? Digite "pedir sugestão do dia".`);
    }
    // Fazer pedido
    else if (COMANDOS.FAZER_PEDIDO.some(cmd => entradaMinuscula.includes(cmd)) || 
             entradaMinuscula.includes('pedir') || 
             entradaMinuscula.includes('quero')) {
      
      // Verifica se está pedindo a sugestão do dia
      if (entradaMinuscula.includes('sugestão do dia')) {
        const diaDaSemana = new Date().getDay();
        let itemPedido, valorPedido;
        
        // Define o item baseado no dia
        switch (diaDaSemana) {
          case 0: // Domingo
            itemPedido = 'Pizza Portuguesa com borda de catupiry + Coca-Cola';
            valorPedido = 42.0;
            break;
          case 1: // Segunda
            itemPedido = 'Pizza Margherita + Suco Natural';
            valorPedido = 39.0;
            break;
          case 2: // Terça
            itemPedido = 'Pizza Calabresa + Guaraná';
            valorPedido = 43.0;
            break;
          case 3: // Quarta
            itemPedido = 'Pizza meio Portuguesa meio Calabresa + Pudim';
            valorPedido = 48.0;
            break;
          case 4: // Quinta
            itemPedido = 'Pizza de Frango com Catupiry + Sorvete';
            valorPedido = 46.0;
            break;
          case 5: // Sexta
            itemPedido = 'Pizza de Pepperoni com borda recheada + Coca-Cola';
            valorPedido = 47.0;
            break;
          case 6: // Sábado
            itemPedido = 'Combo familiar: Pizza grande Portuguesa + refrigerantes + sobremesa';
            valorPedido = 65.0;
            break;
        }
        
        if (itemPedido && valorPedido !== undefined) {
          await fazerPedido(itemPedido, valorPedido, 1);
        } else {
          enviarMensagemIA('Desculpe, ocorreu um erro ao processar o pedido. Tente novamente.');
        }
        return;
      }
      
      // Processa o pedido normal
      // Extrai nome do item (após "pedir" ou "quero")
      let nomeItem = '';
      let quantidade = 1;
      
      if (entradaMinuscula.includes('pedir ')) {
        nomeItem = entrada.substring(entrada.toLowerCase().indexOf('pedir ') + 6).trim();
      } else if (entradaMinuscula.includes('quero ')) {
        nomeItem = entrada.substring(entrada.toLowerCase().indexOf('quero ') + 6).trim();
      } else if (COMANDOS.FAZER_PEDIDO.some(cmd => entradaMinuscula.includes(cmd))) {
        enviarMensagemIA('O que você gostaria de pedir? Digite o nome do item (ex: "pedir pizza calabresa")');
        return;
      }
      
      // Verifica quantidade
      const numeros = nomeItem.match(/\d+/g);
      if (numeros && numeros.length > 0) {
        // Extrai o primeiro número como quantidade
        quantidade = parseInt(numeros[0]);
        // Remove o número da string do item
        nomeItem = nomeItem.replace(/\d+/g, '').trim();
      }
      
      // Procura o item no cardápio
      let itemEncontrado = null;
      for (const categoria in PRODUTOS_POR_CATEGORIA) {
        const itemLista = PRODUTOS_POR_CATEGORIA[categoria as keyof typeof PRODUTOS_POR_CATEGORIA].find(
          item => item.nome.toLowerCase().includes(nomeItem.toLowerCase())
        );
        if (itemLista) {
          itemEncontrado = itemLista;
          break;
        }
      }
      
      if (itemEncontrado) {
        await fazerPedido(itemEncontrado.nome, itemEncontrado.preco, quantidade);
      } else {
        enviarMensagemIA(`Desculpe, não encontrei "${nomeItem}" no nosso cardápio. Digite "cardápio" para ver as opções disponíveis.`);
      }
    }
    // Ajuda ou comandos desconhecidos
    else {
      enviarMensagemIA(
        'Como posso ajudar? Você pode escolher uma das opções:\n\n' +
        '1 - Visualizar seus pedidos\n' +
        '2 - Visualizar o cardápio\n' +
        '3 - Fazer um pedido\n' +
        '4 - Sugestão do dia\n\n' +
        'Para fazer um pedido, você pode digitar, por exemplo: "pedir pizza calabresa" ou "quero 2 coca-cola".'
      );
    }
  };

  // Faz um pedido através da API
  const fazerPedido = async (item: string, valor: number, quantidade: number) => {
    if (!userToken) {
      enviarMensagemIA('Você precisa estar logado para fazer um pedido.');
      return;
    }

    setCarregandoDados(true);
    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          item,
          valor,
          quantidade
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar pedido');
      }

      enviarMensagemIA(
        `✅ Pedido realizado com sucesso!\n\n` +
        `Item: ${item}\n` +
        `Quantidade: ${quantidade}\n` +
        `Valor total: R$ ${(valor * quantidade).toFixed(2)}\n\n` +
        `Seu pedido está sendo preparado. Obrigado pela preferência!`
      );
    } catch (error) {
      console.error('Erro ao fazer pedido:', error);
      enviarMensagemIA('Desculpe, não foi possível realizar seu pedido. Por favor, tente novamente mais tarde.');
    } finally {
      setCarregandoDados(false);
    }
  };

  // Função para lidar com pressionamento longo em uma mensagem
  const lidarComPressionamentoLongo = (mensagem: Mensagem) => {
    if (mensagem.remetente === 'usuario') {
      setMensagemSelecionada(mensagem);
    }
  };

  // Iniciar edição de mensagem
  const iniciarEdicaoMensagem = () => {
    if (mensagemSelecionada) {
      setMensagemEditando(mensagemSelecionada);
      setMensagemEntrada(mensagemSelecionada.texto);
      setMensagemSelecionada(null);
    }
  };

  // Remover mensagem selecionada
  const removerMensagemSelecionada = () => {
    if (mensagemSelecionada) {
      Alert.alert(
        'Remover Mensagem',
        'Tem certeza que deseja remover esta mensagem?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setMensagemSelecionada(null)
          },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: () => {
              const mensagensFiltradas = mensagens.filter(msg => msg.id !== mensagemSelecionada.id);
              setMensagens(mensagensFiltradas);
              setMensagemSelecionada(null);
            }
          }
        ]
      );
    }
  };

  // Salvar mensagem editada
  const salvarMensagemEditada = () => {
    if (mensagemEditando && mensagemEntrada.trim()) {
      const mensagensAtualizadas = mensagens.map(msg =>
        msg.id === mensagemEditando.id
          ? { ...msg, texto: mensagemEntrada.trim() }
          : msg
      );
      setMensagens(mensagensAtualizadas);
      setMensagemEditando(null);
      setMensagemEntrada('');
    }
  };

  // Enviar mensagem
  const enviarMensagem = () => {
    if (!mensagemEntrada.trim()) return;

    if (mensagemEditando) {
      salvarMensagemEditada();
    } else {
      const mensagemUsuario: Mensagem = {
        id: Date.now().toString(),
        texto: mensagemEntrada,
        remetente: 'usuario',
        timestamp: Date.now(),
        nomeRemetente: userData?.name || 'Cliente',
        imagemPerfil: IMAGENS_PERFIL.usuario
      };

      setMensagens(mensagensAnteriores => [...mensagensAnteriores, mensagemUsuario]);
      setMensagemEntrada('');
      setCarregando(true);

      // Atraso para simular processamento
      setTimeout(async () => {
        await processarEntradaUsuario(mensagemUsuario.texto);
        setCarregando(false);
      }, 500);
    }
  };

  // Renderizar mensagem
  const renderizarMensagem = ({ item }: { item: Mensagem }) => {
    const mensagemUsuario = item.remetente === 'usuario';
    const mensagemSelecionadaAtual = mensagemSelecionada && mensagemSelecionada.id === item.id;

    return (
      <TouchableWithoutFeedback
        onLongPress={() => lidarComPressionamentoLongo(item)}
      >
        <View style={[
          estilos.wrapperMensagem,
          mensagemUsuario ? estilos.wrapperMensagemUsuario : estilos.wrapperMensagemIA
        ]}>
          <Image
            source={item.imagemPerfil}
            style={estilos.imagemPerfil}
          />
          <View style={[
            estilos.containerMensagem,
            mensagemUsuario ? estilos.containerMensagemUsuario : estilos.containerMensagemIA
          ]}>
            <Text style={estilos.nomeRemetente}>{item.nomeRemetente}</Text>
            <Text style={[
              estilos.textoMensagem,
              mensagemUsuario ? estilos.textoMensagemUsuario : estilos.textoMensagemIA
            ]}>
              {item.texto}
            </Text>
            {mensagemUsuario && mensagemSelecionadaAtual && (
              <View style={estilos.acoesMensagem}>
                <TouchableOpacity onPress={iniciarEdicaoMensagem}>
                  <Text style={estilos.textoAcao}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={removerMensagemSelecionada}>
                  <Text style={estilos.textoAcao}>Remover</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Voltar para a tela de pedidos
  const voltarParaPedidos = () => {
    router.back();
  };

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.containerCabecalho}>
        <TouchableOpacity onPress={voltarParaPedidos} style={estilos.botaoVoltar}>
          <Text style={estilos.textoBotaoVoltar}>←</Text>
        </TouchableOpacity>
        <Text style={estilos.tituloCabecalho}>Chat da Pizzaria</Text>
        <TouchableOpacity onPress={() => setMensagens([])}>
          <Text style={estilos.botaoLimpar}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {carregandoDados && (
        <View style={estilos.carregandoContainer}>
          <ActivityIndicator size="large" color="rgba(212, 2, 2, 0.96)" />
          <Text style={estilos.carregandoTexto}>Carregando...</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={estilos.containerMensagens}
        contentContainerStyle={estilos.containerConteudoMensagens}
      >
        <FlatList
          data={mensagens}
          renderItem={renderizarMensagem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.containerInput}
      >
        {mensagemEditando && (
          <View style={estilos.bandeiraEdicao}>
            <Text style={estilos.textoEdicao}>Editando mensagem</Text>
            <TouchableOpacity onPress={() => setMensagemEditando(null)}>
              <Text style={estilos.textoCancelarEdicao}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={estilos.input}
          value={mensagemEntrada}
          onChangeText={setMensagemEntrada}
          placeholder={mensagemEditando ? 'Editar mensagem...' : 'Digite sua mensagem...'}
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity 
          style={estilos.botaoEnviar}
          onPress={enviarMensagem}
          disabled={carregando}
        >
          <Text style={estilos.textoBotaoEnviar}>
            {mensagemEditando ? 'Salvar' : (carregando ? 'Enviando...' : 'Enviar')}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#D40000',  // Usar um tom mais suave de vermelho
    borderBottomWidth: 2,
    borderBottomColor: '#B30000',
  },
  botaoVoltar: {
    padding: 5,
  },
  textoBotaoVoltar: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tituloCabecalho: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',  // Peso de fonte moderado
  },
  botaoLimpar: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  carregandoContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  carregandoTexto: {
    marginTop: 10,
    color: '#D40000',  // Usando a cor principal
    fontWeight: 'bold',
    fontSize: 16,
  },
  containerMensagens: {
    flex: 1,
  },
  containerConteudoMensagens: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  wrapperMensagem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 10,
  },
  wrapperMensagemUsuario: {
    flexDirection: 'row-reverse',
  },
  wrapperMensagemIA: {
    flexDirection: 'row',
  },
  imagemPerfil: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  containerMensagem: {
    maxWidth: '75%',  // Ajuste do máximo para maior fluidez
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#ffffff',  // Cor neutra para a caixa de mensagem
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  nomeRemetente: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: 'white',
  },
  containerMensagemUsuario: {
    backgroundColor: '#D40000',  // Mensagem do usuário com cor vermelha
  },
  containerMensagemIA: {
    backgroundColor: 'rgba(73, 58, 58, 0.9)',  // Mensagem da IA com fundo branco suave
  },
  textoMensagem: {
    fontSize: 16,
    lineHeight: 24,  // Aumentar o espaçamento entre linhas para legibilidade
  },
  textoMensagemUsuario: {
    color: 'white',
  },
  textoMensagemIA: {
    color: 'white',
  },
  containerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,  // Tornar os cantos mais arredondados
    paddingHorizontal: 15,
    marginRight: 15,
    fontSize: 16,
    color: '#333',  // Cor de texto mais suave
  },
  botaoEnviar: {
    backgroundColor: '#D40000',  // Cor de fundo ajustada para vermelho suave
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotaoEnviar: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  acoesMensagem: {
    flexDirection: 'row',
    marginTop: 6,
  },
  textoAcao: {
    color: '#007AFF',  // Cor de link em azul
    marginRight: 12,
    fontSize: 14,
  },
  bandeiraEdicao: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  textoEdicao: {
    fontWeight: 'bold',
    color: '#D40000',  // Cor vermelha para destacar
  },
  textoCancelarEdicao: {
    color: '#007AFF',  // Azul para links
  },
});

