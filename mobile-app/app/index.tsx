import { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogClose 
} from "../components/Modal";

export default function Index() {
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Saúde Feminina</Text>
      <Text style={styles.subtitle}>Exemplo de Modal</Text>
      
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogTrigger>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Abrir Modal de Exemplo</Text>
          </View>
        </DialogTrigger>
        
        <DialogContent>
          <DialogTitle>Título do Modal</DialogTitle>
          
          <View>
            <Text>
              Este é um exemplo de modal convertido do Radix UI para React Native.
              Você pode adicionar qualquer conteúdo aqui!
            </Text>
            <Text>
              ✨ Funcionalidades:
            </Text>
            <Text>• Overlay com fundo escuro</Text>
            <Text>• Botão de fechar no canto</Text>
            <Text>• Animação de entrada</Text>
            <Text>• API similar ao Radix</Text>
          </View>
          
          <DialogFooter>
            <DialogClose>
              <TouchableOpacity 
                style={[styles.button, styles.buttonOutline]} 
                onPress={() => console.log('Cancelado')}
              >
                <Text style={styles.buttonTextOutline}>Cancelar</Text>
              </TouchableOpacity>
            </DialogClose>
            <DialogClose>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => console.log('Confirmado')}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fce7f3",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#831843",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9f1239",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#ec4899",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ec4899",
  },
  buttonTextOutline: {
    color: "#ec4899",
    fontSize: 16,
    fontWeight: "600",
  },
});

