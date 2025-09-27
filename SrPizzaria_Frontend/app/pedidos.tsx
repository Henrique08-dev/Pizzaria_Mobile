import { View, Text, StyleSheet, ImageBackground, Image, FlatList, Pressable, TextInput, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

// lembrar de mudar o IP na hora da apresentação
const API_URL = 'http://192.168.1.7:3000';

export default function Pedidos() {
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("tudo");
  const [itensFiltrados, setItensFiltrados] = useState<any[]>([]);
  const [contadores, setContadores] = useState<{ [key: number]: number }>({});
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  const [produtosPorCategoria, setProdutosPorCategoria] = useState<{ [key: string]: any[] }>({
    pizzas: [],
    bebidas: [],
    sobremesas: []
  });

  const categorias = [
    { id: "tudo", nome: "Tudo" },
    { id: "pizzas", nome: "Pizzas" },
    { id: "bebidas", nome: "Bebidas" },
    { id: "sobremesas", nome: "Sobremesas" }
  ];

  // Carrega o token e dados do usuário ao iniciar o componente
  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token) {
          setUserToken(token);
        } else {
          // Se não tiver token, redireciona para o login
          Alert.alert('Sessão expirada', 'Por favor, faça login novamente.');
          router.replace('/login');
        }

        if (userData) {
          setUserData(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    carregarDadosUsuario();
  }, []);

  // Carrega os produtos do banco de dados
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoadingProdutos(true);
        const response = await fetch(`${API_URL}/produtos`, {
          method: 'GET',

        });

        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }

        const data = await response.json();

        // Organizando produtos por categoria
        const produtosPorCat: { [key: string]: any[] } = {
          pizzas: [],
          bebidas: [],
          sobremesas: []
        };

        data.forEach((produto: any) => {
          if (produtosPorCat[produto.categoria]) {
            produtosPorCat[produto.categoria].push(produto);
          }
        });

        setProdutosPorCategoria(produtosPorCat);
        setTodosProdutos(data);
        setItensFiltrados(data); // Inicialmente mostrar todos os produtos
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        Alert.alert('Erro', 'Não foi possível carregar os produtos. Tente novamente.');
      } finally {
        setLoadingProdutos(false);
      }
    };

    carregarProdutos();
  }, []);

  useEffect(() => {
    filtrarItens();
  }, [pesquisa, categoriaSelecionada, todosProdutos]);

  const filtrarItens = () => {
    let itensFiltrados = [...todosProdutos];

    if (categoriaSelecionada !== "tudo") {
      itensFiltrados = itensFiltrados.filter(item => item.categoria === categoriaSelecionada);
    }

    if (pesquisa.trim() !== "") {
      itensFiltrados = itensFiltrados.filter(item =>
        item.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        item.descricao.toLowerCase().includes(pesquisa.toLowerCase())
      );
    }

    setItensFiltrados(itensFiltrados);
  };

  const adicionarAoCarrinho = (item: any) => {
    setCarrinho((prevCarrinho) => [...prevCarrinho, item]);

    setContadores(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
  };

  const calcularTotalCarrinho = () => {
    return carrinho.reduce((total, item) => total + parseFloat(item.preco), 0).toFixed(2);
  };

  // Função para enviar o pedido para o servidor
  const finalizarCompra = async () => {
    if (carrinho.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens ao carrinho para finalizar a compra.');
      return;
    }

    if (!userToken) {
      Alert.alert('Erro', 'Você precisa estar logado para finalizar a compra.');
      router.replace('/login');
      return;
    }

    setIsLoading(true);

    try {
      // Agrupar itens iguais e contar quantidades
      const itensAgrupados = carrinho.reduce((acc: any[], item) => {
        const itemExistente = acc.find((i) => i.id === item.id);
        if (itemExistente) {
          itemExistente.quantidade += 1;
          itemExistente.valorTotal = itemExistente.quantidade * parseFloat(itemExistente.preco);
        } else {
          acc.push({
            ...item,
            quantidade: 1,
            valorTotal: parseFloat(item.preco)
          });
        }
        return acc;
      }, []);

      // Calcular o valor total de todo o pedido
      const valorTotalPedido = parseFloat(calcularTotalCarrinho());

      // Enviar cada item como um pedido separado
      for (const item of itensAgrupados) {
        await enviarPedido(item);
      }

      Alert.alert(
        'Compra finalizada',
        'Seu pedido foi enviado com sucesso!',
        [{
          text: 'OK', onPress: () => {
            setCarrinho([]);
            setContadores({});
            setModalVisible(false);
          }
        }]
      );
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      Alert.alert('Erro', 'Não foi possível finalizar sua compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar um item do pedido para o servidor
  const enviarPedido = async (item: any) => {
    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          item: item.nome,
          valor: item.valorTotal, // Usando o valor total do item (preço x quantidade)
          quantidade: item.quantidade
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar pedido');
      }

      return await response;
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      throw error;
    }
  };

  const removerDoCarrinho = (index: number) => {
    const novoCarrinho = [...carrinho];
    const itemRemovido = novoCarrinho.splice(index, 1)[0];

    setCarrinho(novoCarrinho);

    // Atualiza o contador do item removido
    setContadores(prev => {
      const novosContadores = { ...prev };
      if (novosContadores[itemRemovido.id] > 1) {
        novosContadores[itemRemovido.id] -= 1;
      } else {
        delete novosContadores[itemRemovido.id];
      }
      return novosContadores;
    });
  };

  const sair = async () => {
    try {
      // Limpa os dados do usuário do AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    }
  };

  // Renderiza o componente do carrinho
  const renderCarrinho = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seu Carrinho</Text>

            {carrinho.length === 0 ? (
              <View style={styles.carrinhoVazio}>
                <Text style={styles.carrinhoVazioTexto}>Seu carrinho está vazio</Text>
                <Text style={styles.carrinhoVazioSubTexto}>Adicione itens para continuar</Text>
              </View>
            ) : (
              <FlatList
                data={carrinho}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.itemCarrinho}>
                    <Image
                      source={{ uri: item.imagem }} // Usar a URL direta do JSON
                      style={styles.image}
                      defaultSource={require('../assets/images/logotipo.png')}
                    />
                    <View style={styles.itemCarrinhoInfo}>
                      <Text style={styles.itemCarrinhoNome}>{item.nome}</Text>
                      <Text style={styles.itemCarrinhoPreco}>R${parseFloat(item.preco).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.botaoRemover}
                      onPress={() => removerDoCarrinho(index)}
                    >
                      <Text style={styles.botaoRemoverTexto}>X</Text>
                    </TouchableOpacity>
                  </View>
                )}
                style={{ maxHeight: 300 }}
              />
            )}

            <View style={styles.totalContainer}>
              <Text style={styles.totalTexto}>Total:</Text>
              <Text style={styles.totalValor}>R${calcularTotalCarrinho()}</Text>
            </View>

            <View style={styles.botoesModal}>
              <TouchableOpacity
                style={styles.botaoFecharModal}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.botaoTexto, { color: 'white' }]}>Fechar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botaoFinalizarCompra,
                  (carrinho.length === 0 || isLoading) && styles.botaoDesabilitado
                ]}
                onPress={finalizarCompra}
                disabled={carrinho.length === 0 || isLoading}
              >
                <Text style={[styles.botaoTexto, { color: 'white' }]}>
                  {isLoading ? 'Processando...' : 'Finalizar Compra'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/images/fundo.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require('../assets/images/logotipo.png')}
        />
        {userData && (
          <Text style={styles.welcomeText}>Olá, {userData.name}</Text>
        )}
      </View>

      <View style={styles.pesquisaContainer}>
        <TextInput
          style={styles.inputPesquisa}
          placeholder="Buscar..."
          value={pesquisa}
          onChangeText={setPesquisa}
          placeholderTextColor="gray"
        />
      </View>

      <FlatList
        horizontal
        data={categorias}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoriaItem, categoriaSelecionada === item.id ? styles.categoriaSelecionada : null]}
            onPress={() => setCategoriaSelecionada(item.id)}
          >
            <Text style={[styles.categoriaTexto, categoriaSelecionada === item.id ? styles.categoriaTextoSelecionado : null]}>
              {item.nome}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        style={styles.categoriasList}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.contentContainer}>
        {loadingProdutos ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4500" />
            <Text style={styles.loadingText}>Carregando produtos...</Text>
          </View>
        ) : (
          <FlatList
            data={itensFiltrados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => adicionarAoCarrinho(item)}
              >
                <Image
                  source={{ uri: item.imagem }}
                  style={styles.image}
                  defaultSource={require('../assets/images/logotipo.png')}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.nome}>{item.nome}</Text>
                  <Text style={styles.descricao}>{item.descricao}</Text>
                  <Text style={styles.preco}>R${parseFloat(item.preco).toFixed(2)}</Text>
                </View>
                {contadores[item.id] > 0 && (
                  <View style={styles.contadorContainer}>
                    <Text style={styles.contadorTexto}>{contadores[item.id]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListHeaderComponent={() => (
              <Text style={styles.title}>Cardápio</Text>
            )}
            style={styles.itemPedido}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
              </View>
            )}
          />
        )}
      </View>

      <Pressable
        style={styles.botaoCarrinho}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.botaoTexto}>Ver Carrinho ({carrinho.length})</Text>
      </Pressable>

      {/* Botão para abrir o chat */}
      <Pressable
        style={styles.botaoCarrinho}
        onPress={() => router.push({
          pathname: '/chat',
          params: { token: userToken }
        })}
      >
        <Text style={styles.botaoTexto}>Iniciar Chat</Text>
      </Pressable>
      <Pressable
        style={styles.botaoCarrinho}
        onPress={() => router.push({
          pathname: '/batepapo',
          params: { token: userToken }
        })}
      >
        <Text style={styles.botaoTexto}>Iniciar Chat com IA</Text>
      </Pressable>

      <Pressable style={styles.botaoSair} onPress={sair}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Sair</Text>
      </Pressable>

      {/* Modal do carrinho */}
      {renderCarrinho()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  logoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  pesquisaContainer: {
    width: '90%',
    marginHorizontal: '5%',
    marginVertical: 10,
  },
  inputPesquisa: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  categoriasList: {
    maxHeight: 50,
    marginBottom: 10,
  },
  categoriaItem: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    minWidth: 80,
    alignItems: 'center',
  },
  categoriaSelecionada: {
    backgroundColor: '#FF4500',
  },
  categoriaTexto: {
    fontWeight: 'bold',
    color: '#333',
  },
  categoriaTextoSelecionado: {
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10,
  },
  itemPedido: {
    backgroundColor: 'rgba(34, 1, 1, 0.8)',
    borderRadius: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  nome: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  descricao: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 5,
  },
  preco: {
    fontSize: 16,
    color: '#FF4500',
    fontWeight: 'bold',
    marginTop: 5,
  },
  contadorContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF4500',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  botaoCarrinho: {
    backgroundColor: '#FF4500',
    padding: 15,
    borderRadius: 25,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  botaoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  carrinhoVazio: {
    alignItems: 'center',
    padding: 30,
  },
  carrinhoVazioTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  carrinhoVazioSubTexto: {
    fontSize: 14,
    color: 'gray',
  },
  itemCarrinho: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageCarrinho: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemCarrinhoInfo: {
    flex: 1,
    marginLeft: 10,
  },
  itemCarrinhoNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemCarrinhoPreco: {
    fontSize: 14,
    color: '#FF4500',
    marginTop: 5,
  },
  botaoRemover: {
    backgroundColor: '#f0f0f0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoRemoverTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalTexto: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  botoesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  botaoFecharModal: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  botaoFinalizarCompra: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  botaoDesabilitado: {
    backgroundColor: '#95c9a0',
  },
  botaoSair: {
    backgroundColor: "red",
    borderRadius: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 15,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 1, 1, 0.8)',
    borderRadius: 10,
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
  }
});