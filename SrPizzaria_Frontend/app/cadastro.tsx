import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, TextInput, ImageBackground, Image,
    Pressable, ActivityIndicator, Alert
} from "react-native";
const API_URL = 'http://192.168.1.7:3000';
export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [CPF, setCPF] = useState('');
    const [nomeError, setNomeError] = useState('');
    const [CPFError, setCPFError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [senhaError, setSenhaError] = useState('');
    const [confirmarSenhaError, setConfirmarSenhaError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validarEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validarCPF = (cpf: string) => {
        // Remove não-dígitos
        const cpfLimpo = cpf.replace(/\D/g, '');

        // Verifica se tem 11 dígitos
        if (cpfLimpo.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

        // Algoritmo de validação do CPF
        let soma = 0;
        let resto;

        for (let i = 1; i <= 9; i++) {
            soma = soma + parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma = soma + parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
        }

        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

        return true;
    };

    // Função para formatar o CPF enquanto o usuário digita
    const formatarCPF = (cpf: string) => {
        const cpfLimpo = cpf.replace(/\D/g, '');

        let cpfFormatado = cpfLimpo;
        if (cpfLimpo.length > 3) {
            cpfFormatado = cpfLimpo.substring(0, 3) + '.' + cpfLimpo.substring(3);
        }
        if (cpfLimpo.length > 6) {
            cpfFormatado = cpfFormatado.substring(0, 7) + '.' + cpfLimpo.substring(6);
        }
        if (cpfLimpo.length > 9) {
            cpfFormatado = cpfFormatado.substring(0, 11) + '-' + cpfLimpo.substring(9, 11);
        }

        return cpfFormatado;
    };

    const handleCPFChange = (text: string) => {
        // Limita a 14 caracteres (formato: 000.000.000-00)
        if (text.length <= 14) {
            setCPF(formatarCPF(text));
        }
    };

    const handleCadastrar = async () => {
        setNomeError('');
        setCPFError('');
        setEmailError('');
        setSenhaError('');
        setConfirmarSenhaError('');

        let isValid = true;

        // Validação de Nome
        if (!nome) {
            setNomeError('O campo de nome é obrigatório');
            isValid = false;
        } else if (nome.length < 3) {
            setNomeError('O nome deve ter pelo menos 3 caracteres');
            isValid = false;
        }

        // Validação de Email
        if (!email) {
            setEmailError('O campo de email é obrigatório');
            isValid = false;
        } else if (!validarEmail(email)) {
            setEmailError('Email inválido. Digite um email correto');
            isValid = false;
        }

        // Validação de CPF
        const cpfLimpo = CPF.replace(/\D/g, '');
        if (!CPF) {
            setCPFError('O campo de CPF é obrigatório');
            isValid = false;
        } else if (!validarCPF(CPF)) {
            setCPFError('CPF inválido');
            isValid = false;
        }

        // Validação de Senha
        if (!senha) {
            setSenhaError('O campo de senha é obrigatório');
            isValid = false;
        } else if (senha.length < 6) {
            setSenhaError('A senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        // Validação de Confirmar Senha
        if (!confirmarSenha) {
            setConfirmarSenhaError('Por favor, repita a senha');
            isValid = false;
        } else if (confirmarSenha !== senha) {
            setConfirmarSenhaError('As senhas não coincidem');
            isValid = false;
        }

        // Se todas as validações passarem, envia o cadastro
        if (isValid) {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nome,
                        email,
                        senha,
                        CPF: cpfLimpo // Envia CPF sem formatação 
                    }),
                });

                // Garantir que estamos processando a resposta corretamente
                if (response.status === 204) {
                    // Status 204 não tem corpo, então redirecionamos diretamente
                    Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
                    router.replace('/login');
                } else {
                    // Para outros códigos, tentamos obter o JSON
                    const data = await response.json();
                    if (response.ok) {
                        Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
                        router.replace('/login');
                    } else {
                        Alert.alert("Erro", data.mensagem || "Erro ao fazer cadastro");
                    }
                }
            } catch (error) {
                Alert.alert(
                    "Erro de conexão",
                    "Não foi possível conectar ao servidor. Verifique sua conexão."
                );
                console.error('Erro ao fazer cadastro', error);
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
                <Text style={styles.title}>Cadastre-se</Text>

                <TextInput
                    placeholderTextColor='gray'
                    style={styles.textInput}
                    placeholder="Nome"
                    value={nome}
                    onChangeText={setNome}
                />
                {nomeError ? <Text style={styles.error}>{nomeError}</Text> : null}

                <TextInput
                    placeholderTextColor='gray'
                    style={styles.textInput}
                    placeholder="E-mail"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

                <TextInput
                    placeholderTextColor='gray'
                    style={styles.textInput}
                    placeholder="CPF (000.000.000-00)"
                    keyboardType="numeric"
                    value={CPF}
                    onChangeText={handleCPFChange}
                    maxLength={14}
                />
                {CPFError ? <Text style={styles.error}>{CPFError}</Text> : null}

                <TextInput
                    placeholderTextColor='gray'
                    style={styles.textInput}
                    placeholder="Senha"
                    secureTextEntry
                    value={senha}
                    onChangeText={setSenha}
                />
                {senhaError ? <Text style={styles.error}>{senhaError}</Text> : null}

                <TextInput
                    placeholderTextColor='gray'
                    style={styles.textInput}
                    placeholder="Repetir Senha"
                    secureTextEntry
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                />
                {confirmarSenhaError ? <Text style={styles.error}>{confirmarSenhaError}</Text> : null}

                <View style={styles.btncontainer}>
                    <Link href="/" style={styles.buttons}>
                        <Text style={styles.buttonsText}>Voltar</Text>
                    </Link>

                    <Pressable
                        style={[styles.buttons, isLoading && styles.buttonsDisabled]}
                        onPress={handleCadastrar}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text style={styles.buttonsText}>Cadastrar</Text>
                        )}
                    </Pressable>
                </View>
            </View>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        backgroundColor: 'rgba(32, 4, 4, 0.7)', // Sobreposição semitransparente
        padding: 20,
        borderRadius: 10,
        width: '80%', // Ajuste a largura para não ficar muito largo
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonsDisabled: {
        backgroundColor: "#cccccc",
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
        textAlign: 'center',
    },
    error: {
        color: 'white',
        fontSize: 12,
        marginTop: -5,
        marginBottom: 10,
    },
});