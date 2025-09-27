import { Link, router, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, StyleSheet, TextInput, ImageBackground, Image, Pressable, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base do seu servidor - substitua pelo seu IP ou domínio
const API_URL = 'http://192.168.1.7:3000';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState(''); 
    const [emailError, setEmailError] = useState('');
    const [senhaError, setSenhaError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validarEmail = (email:string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleLogin = async (event: any) => {
        event.preventDefault();
        
        // Limpar erros anteriores
        setEmailError('');
        setSenhaError('');
        
        let isValid = true;
        
        // Validação do email
        if (!email) {
            setEmailError('O campo de email é obrigatório');
            isValid = false;
        } else if (!validarEmail(email)) {
            setEmailError('Email inválido. Digite um email correto');
            isValid = false;
        }
        
        // Validação da senha
        if (!senha) {
            setSenhaError('O campo de senha é obrigatório');
            isValid = false;
        } 
        
        // Se passar na validação, faz a requisição ao servidor
        if (isValid) {
            setIsLoading(true);
            
            try {
                const response = await fetch(`${API_URL}/signin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, senha }),
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erro na autenticação');
                }
                
                // Armazena o token e os dados do usuário
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userData', JSON.stringify({
                    name: data.name,
                    email: data.email,
                    CPF: data.CPF,
                    id: data.id
                }));
                
                // Redireciona para a página de pedidos após login bem-sucedido
                router.replace('/pedidos');
                
            } catch (error) {
                console.error('Erro de login:', error);
                Alert.alert(
                    "Falha no login", 
                    "Usuário ou senha inválidos. Verifique suas credenciais."
                );
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    return (
        <ImageBackground
            source={require('../assets/images/fundo.jpeg')}
            style={styles.container}
        >
            <View style={styles.overlay}>
                <Image
                    style={styles.logo}
                    source={require('../assets/images/logotipo.png')}
                />
                <Text style={styles.title}>Login</Text>
                
                <TextInput 
                    style={styles.textInput} 
                    placeholder="email"
                    keyboardType="email-address"
                    onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                    }}
                    value={email}
                />
                {emailError ? <Text style={styles.textSaida}>{emailError}</Text> : null}

                <TextInput
                    style={styles.textInput}
                    placeholder="senha"
                    keyboardType="default"
                    secureTextEntry
                    onChangeText={(text) => {
                        setSenha(text);
                        if (senhaError) setSenhaError('');
                    }}
                    value={senha}
                />
                {senhaError ? <Text style={styles.textSaida}>{senhaError}</Text> : null}

                <View style={styles.btncontainer}>
                    <Link href="/cadastro" style={styles.buttons}>
                        <Text style={styles.buttonsText}>Cadastrar</Text>
                    </Link>

                    <Pressable 
                        style={[styles.buttons, isLoading && { opacity: 0.7 }]} 
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonsText}>
                            {isLoading ? 'Processando...' : 'Entrar'}
                        </Text>
                    </Pressable>
                </View>
            </View>
            <Pressable style={styles.botaoSair}>
                <Link href="/(tabs)">
                    <Text style={{ color: 'white' }}>Sair</Text>
                </Link>
            </Pressable>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 5,
    },
    overlay: {
        backgroundColor: 'rgba(32, 4, 4, 0.7)', 
        padding: 20,
        borderRadius: 10,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        fontSize: 18,
        color: "black",
        padding: 10,
        paddingHorizontal: 20,
        fontWeight: "bold",
        backgroundColor: "white",
        borderRadius: 15,
        height: 50,
        width: '100%',
        marginVertical: 10,
    },
    textSaida: {
        fontSize: 14,
        color: "white",
        marginTop: -5,
        marginBottom: 5,
        alignSelf: 'flex-start',
    },
    title: {
        fontSize: 40,
        color: "white",
        fontWeight: "bold",
        marginBottom: 25,
    },
    buttons: {
        backgroundColor: "white",
        padding: 10,
        borderRadius: 5,
        marginVertical: 10,
        flex: 1,
        alignItems: 'center', 
    },
    buttonsText: {
        fontSize: 18,
        color: "black",
        fontWeight: "bold",
        textAlign: 'center',
    },
    btncontainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
        justifyContent: 'center', 
    },
    botaoSair: {
        backgroundColor: "red",
        fontSize: 18,
        borderRadius: 10,
        marginVertical: 20,
        padding: 15,
        textAlign: 'center',
    },
});