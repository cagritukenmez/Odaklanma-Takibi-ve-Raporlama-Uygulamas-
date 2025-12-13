import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

type StoredSession = {
  category: string;
  duration: string; // "mm:ss"
  distractions: number;
  date: string; // ISO
};

const STORAGE_KEY = "sessions";

type Stats = {
  todayMinutes: number;
  totalMinutes: number;
  totalDistractions: number;
};

const PALETTE = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
];

export default function ReportsScreen() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayMinutes: 0,
    totalMinutes: 0,
    totalDistractions: 0,
  });

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = Math.max(320, screenWidth - 32);

  const durationToMinutes = (duration: string): number => {
    const parts = duration.split(":");
    const min = Number(parts[0] ?? 0);
    const sec = Number(parts[1] ?? 0);
    return min + sec / 60;
  };

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  // Son 7 günü (bugün dahil) date listesi olarak üret
  const last7Days = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: StoredSession[] = stored ? JSON.parse(stored) : [];
      setSessions(parsed);

      // Genel istatistikler
      const today = new Date();
      let todayMinutes = 0;
      let totalMinutes = 0;
      let totalDistractions = 0;

      for (const s of parsed) {
        const mins = durationToMinutes(s.duration);
        totalMinutes += mins;
        totalDistractions += s.distractions;

        const sd = new Date(s.date);
        if (isSameDay(sd, today)) todayMinutes += mins;
      }

      setStats({ todayMinutes, totalMinutes, totalDistractions });
    } catch (err) {
      console.log("loadAll error:", err);
    }
  }, []);

  // Raporlar tabına her gelişte güncelle
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  // --- BAR CHART: Son 7 gün odaklanma dakikaları ---
  const barData = useMemo(() => {
    const totalsByDay = new Map<string, number>();
    for (const d of last7Days) totalsByDay.set(d.toDateString(), 0);

    for (const s of sessions) {
      const key = new Date(s.date).toDateString();
      if (!totalsByDay.has(key)) continue;
      totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + durationToMinutes(s.duration));
    }

    const labels = last7Days.map((d) =>
      d.toLocaleDateString("tr-TR", { weekday: "short" })
    );
    const data = last7Days.map((d) =>
      Number((totalsByDay.get(d.toDateString()) ?? 0).toFixed(1))
    );

    return { labels, data };
  }, [last7Days, sessions]);

  // --- PIE CHART: Kategorilere göre dağılım (TÜM ZAMANLAR) ---
  const pieData = useMemo(() => {
    const totals = new Map<string, number>();

    for (const s of sessions) {
      const mins = durationToMinutes(s.duration);
      totals.set(s.category, (totals.get(s.category) ?? 0) + mins);
    }

    const entries = Array.from(totals.entries())
      .map(([category, minutes]) => ({ category, minutes }))
      .sort((a, b) => b.minutes - a.minutes);

    return entries.map((e, idx) => ({
      name: e.category,
      population: Number(e.minutes.toFixed(1)), // chart-kit "population" bekliyor
      color: PALETTE[idx % PALETTE.length],
      legendFontColor: "#444",
      legendFontSize: 12,
    }));
  }, [sessions]);

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`,
    propsForBackgroundLines: { stroke: "#e6e6e6" },
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Raporlar</Text>

      {/* Genel İstatistikler */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bugün Toplam Odaklanma</Text>
          <Text style={styles.cardValue}>{stats.todayMinutes.toFixed(1)} dk</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tüm Zamanlar Odaklanma</Text>
          <Text style={styles.cardValue}>{stats.totalMinutes.toFixed(1)} dk</Text>
        </View>
      </View>

      <View style={styles.cardWide}>
        <Text style={styles.cardTitle}>Toplam Dikkat Dağınıklığı</Text>
        <Text style={styles.cardValue}>{stats.totalDistractions}</Text>
      </View>

      {/* Bar Chart */}
      <Text style={styles.sectionTitle}>Son 7 Gün Odaklanma Süresi (dk)</Text>
      {sessions.length === 0 ? (
        <Text style={styles.empty}>Henüz kayıt yok.</Text>
      ) : (
        <BarChart
  data={{
    labels: barData.labels,
    datasets: [{ data: barData.data }],
  }}
  width={chartWidth}
  height={240}
  fromZero
  yAxisLabel=""          // ✅ ekle
  yAxisSuffix=" dk"      // ✅ ekle (istersen boş bırakabilirsin)
  chartConfig={chartConfig}
  style={styles.chart}
  showValuesOnTopOfBars
/>

      )}

      {/* Pie Chart */}
      <Text style={styles.sectionTitle}>Kategori Dağılımı (Tüm Zamanlar)</Text>
      {pieData.length === 0 ? (
        <Text style={styles.empty}>Henüz kayıt yok.</Text>
      ) : (
        <PieChart
          data={pieData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="8"
          absolute
          style={styles.chart}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 16, textAlign: "center" },

  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
  },
  cardWide: {
    marginTop: 12,
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
  },

  cardTitle: { fontSize: 14, color: "#555" },
  cardValue: { fontSize: 24, fontWeight: "bold", marginTop: 6 },

  sectionTitle: { marginTop: 18, marginBottom: 8, fontSize: 16, fontWeight: "bold" },
  chart: { borderRadius: 12 },

  empty: { color: "#666", marginTop: 6 },
});
