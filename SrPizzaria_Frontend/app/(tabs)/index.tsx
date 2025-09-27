import React from 'react';
import { Text, View, StyleSheet, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';  

export default function Index() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/fundo.jpeg')}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <Image 
            style={styles.logo}
            source={require('../../assets/images/logotipo.png')} 
           
          />
          <Text style={{color: 'white', fontSize: 24, marginBottom: 20}}>Bem-vindo ao App</Text>
          <Text style={{color: 'white', fontSize: 16, marginBottom: 20}}>Escolha uma opção abaixo:</Text>
          
          <View style={styles.cardsContainer}>
           
            <Link href="/login" style={styles.card}>
              <Image 
                style={styles.cardImage} 
                source={require('../../assets/images/fazer pedido.jpg')} 
              />
              <Text style={styles.cardText}>Faça seu Pedido</Text>
            </Link>

            
            <Link href="/cadastro" style={styles.card}>
              <Image 
                style={styles.cardImage} 
                source={require('../../assets/images/icons8-contatos-50.png')} 
              />
              <Text style={styles.cardText}>Cadastre-se</Text>
            </Link>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(32, 4, 4, 0.7)',
    padding: 20,
    borderRadius: 10,
    width: '90%', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    width: '100%', 
    paddingTop: 20,
  },
  card: {
    backgroundColor: 'rgba(202, 8, 8, 0.96)',
    margin: 10, 
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '43%', 
    maxWidth: 150, 
  },
  cardImage: {
    width: 130,
    height: 130,
    borderRadius: 5,
    marginBottom: 5,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
