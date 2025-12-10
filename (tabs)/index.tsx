import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";

import { AppState, Button, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type SessionSummary = {
  category: string;
  duration: string;
  distractions: number;
};

export default function HomeScreen() {
  //states
  const [seconds, setSeconds] = useState<number>(25 * 60); // Default 25 dk
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Ders Çalışma");
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [hasStartedBefore, setHasStartedBefore] = useState<boolean>(false);
  const [distractionCount, setDistractionCount] = useState<number>(0);


  // Sayaç akışı
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    }

    if (seconds === 0 && isRunning) {
      finishSession();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
    
      // Uygulama arka plana giderse
      if (nextState === "background" && isRunning) {
        setIsRunning(false);               // Sayaç duraklasın
        setDistractionCount((prev) => prev + 1);   // Dikkat dağınıklığı +1
     }

      // Kullanıcı uygulamaya geri döndü (active)
      if (nextState === "active") {
        // Burada popup sorabiliriz: "Devam etmek ister misin?"
        // Şimdilik sadece duraklamış şekilde bekliyoruz.
      }
    });

    return () => subscription.remove();
  }, [isRunning]);




  // Seans bitince özet oluştur
  const finishSession = () => {
    setIsRunning(false);

    const summary: SessionSummary = {
    category: selectedCategory,
    duration: formatTime(25 * 60 - seconds),
    distractions: distractionCount,
  };

    setSessionSummary(summary);
  };

  // Başlat
  const handleStart = () => {
    setHasStartedBefore(true);
    setIsRunning(true);
  }

  // Duraklat
  const handlePause = () => {
    setIsRunning(false);

    const summary: SessionSummary = {
      category: selectedCategory,
      duration: formatTime(25 * 60 - seconds),
      distractions: 0,
    };

    setSessionSummary(summary);
  };

  // Sıfırla
  const handleReset = () => {
    setIsRunning(false);
    setHasStartedBefore(false);
    setSeconds(25 * 60);
    setDistractionCount(0);
  };

  // Süre formatı
  const formatTime = (totalSeconds: number): string => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  return (
    <View style={styles.container}>
      {/* Kategori Seçici */}
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value)}
        style={{ width: 200 }}
      >
        <Picker.Item label="Ders Çalışma" value="Ders Çalışma" />
        <Picker.Item label="Kodlama" value="Kodlama" />
        <Picker.Item label="Proje" value="Proje" />
        <Picker.Item label="Kitap Okuma" value="Kitap Okuma" />
      </Picker>

      {/* Sayaç */}
      <Text style={styles.timer}>{formatTime(seconds)}</Text>

      {/* Butonlar */}
      <View style={styles.buttonRow}>
        <Button
          title={hasStartedBefore ? "Devam Et" : "Başlat"}
          onPress={handleStart}
        />
        <Button title="Duraklat" onPress={handlePause} />
        <Button title="Sıfırla" onPress={handleReset} />
      </View>

      {/* Modal: Seans Özeti */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Seans Özeti</Text>

          <Text>Kategori: {sessionSummary?.category}</Text>
          <Text>Süre: {sessionSummary?.duration}</Text>
          <Text>Dikkat Dağınıklığı: {sessionSummary?.distractions}</Text>

          <Pressable
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: "#fff" }}>Kapat</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// 📌 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: "bold",
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  modalView: {
    marginTop: "50%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignSelf: "center",
    width: "80%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
