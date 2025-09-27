// Importações
import React, { useState, useEffect, useRef } from "react";
import { Socket } from 'socket.io-client';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

// Substitua com seu endereço IPV4
const API_URL = 'http://192.168.1.7:3000';

export default function Chat() {
  interface Message {
    id: number;
    user_id: number;
    user_name: string;
    message: string;
    created_at: string;
    is_edited?: boolean;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userToken, setUserToken] = useState<string | null>(null);

  interface UserData {
    id: number;
    name: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionsId, setShowActionsId] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const flatListRef = useRef<FlatList<any>>(null);

  // Carrega dados do usuário e conecta o socket
  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');

        if (!token) {
          Alert.alert('Sessão expirada', 'Por favor, faça login novamente.');
          router.replace('/login');
          return;
        }

        setUserToken(token);

        if (userDataStr) {
          const parsedUserData = JSON.parse(userDataStr);
          setUserData(parsedUserData);
        }

        console.log(`Conectando socket a ${API_URL} com autenticação`);
        const novoSocket = io(API_URL, {
          transports: ['websocket'],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        novoSocket.on('connect', () => {
          console.log('Socket conectado com sucesso:', novoSocket.id);
        });

        novoSocket.on('connect_error', (erro) => {
          console.error('Erro de conexão no socket:', erro);
        });

        setSocket(novoSocket);

        buscarMensagens(token);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
      }
    };

    carregarDadosUsuario();

    return () => {
      if (socket) {
        console.log('Desconectando socket');
        socket.disconnect();
      }
    };
  }, []);

  // Configura os ouvintes do socket
  useEffect(() => {
    if (!socket) return;

    console.log('Configurando ouvintes do socket');

    socket.on('new_message', (mensagem) => {
      console.log('Nova mensagem recebida:', mensagem);
      setMessages(prev => [...prev, mensagem]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    socket.on('update_message', (mensagemAtualizada) => {
      console.log('Mensagem atualizada recebida:', mensagemAtualizada);
      setMessages(prev =>
        prev.map(m => m.id === mensagemAtualizada.id ? mensagemAtualizada : m)
      );
    });

    socket.on('delete_message', (dados) => {
      console.log('Evento de exclusão recebido:', dados);

      if (!dados || dados.id == null) {
        console.error('Dados inválidos para deletar:', dados);
        return;
      }

      const messageId = typeof dados.id === 'string' ? parseInt(dados.id, 10) : dados.id;

      setMessages(prev => {
        return prev.filter(msg => msg.id !== messageId);
      });
    });

    return () => {
      console.log('Removendo ouvintes do socket');
      socket.off('new_message');
      socket.off('update_message');
      socket.off('delete_message');
    };
  }, [socket]);

  // Buscar mensagens
  async function buscarMensagens(token: string) {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/chat`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error(`Erro ao buscar mensagens: ${response.statusText}`);

      const data = await response.json();
      setMessages(data);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      Alert.alert('Erro', 'Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Enviar mensagem
  const enviarMensagem = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      if (!userToken) throw new Error('Token de autenticação não disponível.');

      if (editingId !== null) {
        await atualizarMensagem();
      } else {
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ message: newMessage })
        });

        if (!response.ok) {
          const erroTexto = await response.text();
          throw new Error(`Erro ao enviar: ${erroTexto}`);
        }

        setNewMessage('');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
      setEditingId(null);
    }
  };

  // Atualizar mensagem
  const atualizarMensagem = async () => {
    if (!editingId || !newMessage.trim() || !userToken) return;

    try {
      const response = await fetch(`${API_URL}/chat/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (!response.ok) {
        const erroTexto = await response.text();
        throw new Error(`Erro ao atualizar: ${erroTexto}`);
      }

      setNewMessage('');
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a mensagem.');
    }
  };

  // Excluir mensagem
  const excluirMensagem = async (messageId: number) => {
    try {
      if (!userToken) throw new Error('Token ausente.');

      const response = await fetch(`${API_URL}/chat/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      if (!response.ok) {
        const erroTexto = await response.text();
        throw new Error(`Erro ao excluir: ${erroTexto}`);
      }

      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }, 2000);

      setShowActionsId(null);
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      Alert.alert('Erro', 'Não foi possível excluir a mensagem.');
    }
  };

  // Começar a editar
  const iniciarEdicao = (mensagem: Message) => {
    setNewMessage(mensagem.message);
    setEditingId(mensagem.id);
    setShowActionsId(null);
  };

  // Alternar menu de ações
  const alternarAcoes = (id: number) => {
    setShowActionsId(prev => (prev === id ? null : id));
  };

  // Formatar data
  const formatarData = (str: string) => {
    const data = new Date(str);
    return `${data.toLocaleDateString()} ${data.toLocaleTimeString()}`;
  };

  // Renderizar mensagens
  // Renderizar mensagens
  // Renderizar mensagens
  const renderizarMensagem = ({ item }: { item: Message }) => {
    const propriaMensagem = userData && userData.id === item.user_id;
    const mostrandoAcoes = showActionsId === item.id;

    return (
      <View style={styles.messageContainer}>
        {propriaMensagem && mostrandoAcoes && (
          <View style={[
            styles.actionsContainer,
            propriaMensagem ? { right: 0 } : { left: 0 }
          ]}>
            <TouchableOpacity
              onPress={() => iniciarEdicao(item)}
              style={[styles.actionButton, styles.editButton]}
            >
              <Ionicons name="pencil" size={20} color="white" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Excluir mensagem',
                  'Tem certeza que deseja excluir esta mensagem?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: () => excluirMensagem(item.id) },
                  ]
                )
              }
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.actionButtonText}>Excluir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowActionsId(null)}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Ionicons name="close" size={18} color="white" />
              <Text style={styles.actionButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[
          styles.messageBubble,
          propriaMensagem ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageUserName}>{item.user_name}</Text>

            {propriaMensagem && (
              <TouchableOpacity
                onPress={() => alternarAcoes(item.id)}
                style={styles.smallOptionsButton}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="#555" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.messageText}>{item.message}</Text>

          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {formatarData(item.created_at)}{item.is_edited && ' (editado)'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const atualizarMensagens = () => {
    setRefreshing(true);
    if (userToken) buscarMensagens(userToken);
  };

  return (
    <ImageBackground
      source={require('../assets/images/fundo.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.chatContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF4500" />
            <Text style={styles.loadingText}>Carregando mensagens...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderizarMensagem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            refreshing={refreshing}
            onRefresh={atualizarMensagens}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptySubText}>Seja o primeiro a enviar uma mensagem!</Text>
              </View>
            }
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.disabledButton]}
            onPress={enviarMensagem}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name={editingId ? "checkmark" : "send"} size={24} color="white" />
            )}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={() => {
                setEditingId(null);
                setNewMessage('');
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}


// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    backgroundColor: 'rgba(40, 10, 10, 0.95)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 69, 0, 0.5)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  messageContainer: {
    marginVertical: 8,
    width: '100%',
    position: 'relative', // Importante para posicionamento absoluto do menu
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '82%',
    minWidth: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: 'rgba(255, 150, 70, 0.95)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 18,
  },
  otherMessageBubble: {
    backgroundColor: 'rgba(245, 245, 245, 0.95)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 18,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  messageUserName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
    color: '#555',
    fontStyle: 'italic',
  },
  optionsButton: {
    padding: 4,
    marginLeft: 6,
  },
  smallOptionsButton: {
    backgroundColor: 'transparent',
    padding: 4,
    marginLeft: 4,
    borderRadius: 12,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    bottom: '100%', // Posiciona acima da mensagem
    backgroundColor: 'rgba(50, 50, 50, 0.95)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row', // Alterado para horizontal
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'column', // Mudado para coluna
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  actionButtonText: {
    color: 'white',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  editButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  cancelButton: {
    backgroundColor: 'rgba(153, 153, 153, 0.9)',
  },
  cancelEditButton: {
    backgroundColor: '#777',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(40, 10, 10, 0.9)',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 69, 0, 0.3)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#FF4500',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#aaa',
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    height: 400,
  },
  emptyText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptySubText: {
    color: '#ddd',
    marginTop: 15,
    textAlign: 'center',
    fontSize: 16,
  }
});