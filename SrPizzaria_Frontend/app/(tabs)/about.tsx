import { Text, View, StyleSheet, Image, ScrollView, Linking, TouchableOpacity, ImageBackground } from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // Expo vem com pacote de ícones integrado

export default function AboutScreen() {
  // Função para abrir o WhatsApp
  const openWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=5511987654321');
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <ImageBackground source={require('../../assets/images/fundo 3.jpg')} style={styles.back}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Image style={styles.logo}source={require('../../assets/images/logotipo.png')} />
          <Text style={styles.title}>Sr Pizzaria</Text>
          <Text style={styles.subtitle}>A melhor pizza da cidade!</Text>
        </View>

        {/* Imagem principal */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/26/4a/82/50/baggio-pizzaria-moema.jpg?w=600&h=-1&s=1' }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imageCaption}>
            <Text style={styles.captionText}>Ambiente Aconchegante</Text>
          </View>
        </View>

        {/* Seção Sobre Nós */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre Nós</Text>
          <Text style={styles.text}>
            A Pizzaria Sr.Pizzaria nasceu em 2015 com a missão de oferecer as melhores pizzas artesanais da região.
            Utilizamos ingredientes frescos e de qualidade, com massas fermentadas por 48 horas para garantir
            sabor e leveza incomparáveis.
          </Text>
        </View>

        {/* Seção Promoções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promoções</Text>
          <View style={styles.promoItem}>
            <FontAwesome name="star" size={18} color="#ffcc00" style={styles.icon} />
            <Text style={styles.text}><Text style={styles.bold}>Terça de Calabresa:</Text> Pizza grande de calabresa por apenas R$ 49,90</Text>
          </View>
          <View style={styles.promoItem}>
            <FontAwesome name="star" size={18} color="#ffcc00" style={styles.icon} />
            <Text style={styles.text}><Text style={styles.bold}>Quinta em Família:</Text> Compre uma pizza grande e ganhe uma pequena</Text>
          </View>
          <View style={styles.promoItem}>
            <FontAwesome name="star" size={18} color="#ffcc00" style={styles.icon} />
            <Text style={styles.text}><Text style={styles.bold}>Fim de Semana:</Text> Peça 2 pizzas grandes e ganhe 1 refrigerante 2L</Text>
          </View>
        </View>

        {/* Seção Localização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossa Localização</Text>
          <View style={styles.locationItem}>
            <FontAwesome name="map-marker" size={18} color="#a30000" style={styles.icon} />
            <Text style={styles.text}>Avenida das Pizzas, 1234</Text>
          </View>
          <View style={styles.locationItem}>
            <FontAwesome name="map" size={18} color="#a30000" style={styles.icon} />
            <Text style={styles.text}>Bairro Italiano - São Paulo/SP</Text>
          </View>
          <Text style={[styles.text, styles.marginTop]}>
            <Text style={styles.bold}>Horário de Funcionamento:</Text>
          </Text>
          <Text style={styles.text}>Segunda a Domingo: 18h às 23h</Text>
        </View>

        {/* Seção Contatos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contatos</Text>
          <TouchableOpacity onPress={openWhatsApp} style={styles.contactItem}>
            <FontAwesome name="whatsapp" size={22} color="#25D366" style={styles.icon} />
            <Text style={styles.text}>(11) 98765-4321</Text>
          </TouchableOpacity>
          <View style={styles.contactItem}>
            <FontAwesome name="phone" size={18} color="#a30000" style={styles.icon} />
            <Text style={styles.text}>(11) 3456-7890</Text>
          </View>
          <View style={styles.contactItem}>
            <FontAwesome name="envelope" size={18} color="#a30000" style={styles.icon} />
            <Text style={styles.text}>contato@pizzariadelicia.com.br</Text>
          </View>
        </View>

        {/* Botão para contato direto */}
        <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
          <FontAwesome name="whatsapp" size={24} color="#ffffff" />
          <Text style={styles.buttonText}>Contato via WhatsApp</Text>
        </TouchableOpacity>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Pizzaria Delícia - Todos os direitos reservados</Text>
        </View>
      </View>
      </ImageBackground>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: 'rgba(58, 56, 54, 0.66)',
  },

  back:{

    flex: 1,
    height: '100%',
    width: '100%',
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',

  },
  container: {
    flex: 1,
    padding: 16,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    fontStyle: 'italic',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  imageCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  captionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#2d3339',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#ffcc00',
  },
  marginTop: {
    marginTop: 12,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
    width: 22,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
});