import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type StoredSession = {
  category: string;
  duration: string; // "mm:ss"
  distractions: number;
  date: string;     // ISO string
};
export default function ReportsScreen() {
  const [todayFocusMinutes, setTodayFocusMinutes] = useState<number>(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(0);
  const [totalDistractions, setTotalDistractions] = useState<number>(0);
  useFocusEffect(
  useCallback(() => {
      loadStatistics(); // AsyncStorage’dan tekrar oku ve state’i güncelle
    }, [])
  );
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    const stored = await AsyncStorage.getItem("sessions");
    if (!stored) return;

    const sessions: StoredSession[] = JSON.parse(stored);

    let todayMinutes = 0;
    let totalMinutes = 0;
    let distractions = 0;

    const today = new Date().toDateString();

    sessions.forEach((session) => {
      const minutes = durationToMinutes(session.duration);
      totalMinutes += minutes;
      distractions += session.distractions;

      const sessionDate = new Date(session.date).toDateString();
      if (sessionDate === today) {
        todayMinutes += minutes;
      }
    });

    setTodayFocusMinutes(todayMinutes);
    setTotalFocusMinutes(totalMinutes);
    setTotalDistractions(distractions);
  };

  // "mm:ss" → dakika (float)
  const durationToMinutes = (duration: string): number => {
    const [min, sec] = duration.split(":").map(Number);
    return min + sec / 60;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Raporlar</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bugün Toplam Odaklanma Süresi</Text>
        <Text style={styles.cardValue}>
          {todayFocusMinutes.toFixed(1)} dk
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tüm Zamanların Toplam Odaklanma Süresi</Text>
        <Text style={styles.cardValue}>
          {totalFocusMinutes.toFixed(1)} dk
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Toplam Dikkat Dağınıklığı</Text>
        <Text style={styles.cardValue}>{totalDistractions}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    color: "#555",
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },
});
