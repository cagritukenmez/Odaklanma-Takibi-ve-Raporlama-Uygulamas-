import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type SessionSummary = {
  category: string;
  duration: string; // elapsed "mm:ss"
  distractions: number;
};

const DEFAULT_SECONDS = 25 * 60;
const STORAGE_KEY = "sessions";

export default function HomeScreen() {
  // states
  const [seconds, setSeconds] = useState<number>(DEFAULT_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Ders Çalışma");
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [hasStartedBefore, setHasStartedBefore] = useState<boolean>(false);
  const [distractionCount, setDistractionCount] = useState<number>(0);

  // refs (background’ta güncel değerler için)
  const distractionCountRef = useRef(distractionCount);
  const secondsRef = useRef(seconds);
  const selectedCategoryRef = useRef(selectedCategory);

  useEffect(() => {
    distractionCountRef.current = distractionCount;
    secondsRef.current = seconds;
    selectedCategoryRef.current = selectedCategory;
  }, [distractionCount, seconds, selectedCategory]);

  const formatTime = (totalSeconds: number): string => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  const saveSession = async (summary: SessionSummary) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const sessions = stored ? JSON.parse(stored) : [];
      sessions.push({ ...summary, date: new Date().toISOString() });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.log("Seans kaydedilirken hata:", error);
    }
  };

  const showSummary = (summary: SessionSummary) => {
    setSessionSummary(summary);
    setModalVisible(true);
  };

  const buildSummaryFromCurrent = (overrideDistractions?: number): SessionSummary => {
    const d = overrideDistractions ?? distractionCountRef.current;
    const elapsed = DEFAULT_SECONDS - secondsRef.current;
    return {
      category: selectedCategoryRef.current,
      duration: formatTime(elapsed < 0 ? 0 : elapsed),
      distractions: d,
    };
  };

  const finishSession = async () => {
    setIsRunning(false);

    const summary = buildSummaryFromCurrent();
    await saveSession(summary);
    showSummary(summary);

    // yeni seans için resetle
    setHasStartedBefore(false);
    setSeconds(DEFAULT_SECONDS);
    setDistractionCount(0);
  };

  const handleStart = () => {
    setHasStartedBefore(true);
    setIsRunning(true);
  };

  const handlePause = async () => {
    // “durdurulduğunda özet” isteniyor
    setIsRunning(false);

    const summary: SessionSummary = {
      category: selectedCategory,
      duration: formatTime(DEFAULT_SECONDS - seconds),
      distractions: distractionCount,
    };

    await saveSession(summary);
    showSummary(summary);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStartedBefore(false);
    setSeconds(DEFAULT_SECONDS);
    setDistractionCount(0);
  };

  // timer akışı
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

  // dikkat dağınıklığı (background)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" && hasStartedBefore) {
        const newDistractions = distractionCountRef.current + 1;
        setDistractionCount(newDistractions);
        setIsRunning(false);

        (async () => {
          const summary = buildSummaryFromCurrent(newDistractions);
          await saveSession(summary);
          showSummary(summary);
        })();
      }
    });

    return () => sub.remove();
  }, [hasStartedBefore]);

  const primaryLabel = hasStartedBefore ? "Devam Et" : "Başlat";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.hTitle}>Odak Seansı</Text>
          <Text style={styles.hSubtitle}>Dikkatini koru, ilerlemeni takip et.</Text>
        </View>

        {/* Category Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Kategori</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value)}
              style={styles.picker}
              dropdownIconColor="#9CA3AF"
            >
              <Picker.Item label="Ders Çalışma" value="Ders Çalışma" />
              <Picker.Item label="Kodlama" value="Kodlama" />
              <Picker.Item label="Proje" value="Proje" />
              <Picker.Item label="Kitap Okuma" value="Kitap Okuma" />
            </Picker>
          </View>
        </View>

        {/* Timer Card */}
        <View style={[styles.card, styles.timerCard]}>
          <View style={styles.timerRing}>
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            <Text style={styles.timerHint}>
              {isRunning ? "Çalışıyor" : hasStartedBefore ? "Duraklatıldı" : "Hazır"}
            </Text>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Kategori</Text>
              <Text style={styles.chipValue}>{selectedCategory}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Dikkat</Text>
              <Text style={styles.chipValue}>{distractionCount}</Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={handleStart}
            disabled={isRunning}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              isRunning && styles.btnDisabled,
              pressed && !isRunning && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnPrimaryText}>{primaryLabel}</Text>
          </Pressable>

          <View style={styles.controlsRow}>
            <Pressable
              onPress={handlePause}
              style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnSecondaryText}>Duraklat</Text>
            </Pressable>

            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.btnPressed]}
            >
              <Text style={styles.btnGhostText}>Sıfırla</Text>
            </Pressable>
          </View>
        </View>

        {/* Summary Overlay (web dahil her yerde görünür) */}
        {modalVisible && (
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Seans Özeti</Text>

              <View style={styles.modalRow}>
                <Text style={styles.modalKey}>Kategori</Text>
                <Text style={styles.modalVal}>{sessionSummary?.category ?? "-"}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalKey}>Süre</Text>
                <Text style={styles.modalVal}>{sessionSummary?.duration ?? "-"}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalKey}>Dikkat Dağınıklığı</Text>
                <Text style={styles.modalVal}>{sessionSummary?.distractions ?? 0}</Text>
              </View>

              <Pressable
                onPress={() => setModalVisible(false)}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnPrimaryText}>Kapat</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B1220" },
  screen: { flex: 1, padding: 16, gap: 12 },

  header: { paddingTop: 6, paddingBottom: 4 },
  hTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  hSubtitle: { marginTop: 4, fontSize: 13, color: "#9CA3AF" },

  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 8 },

  pickerWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  picker: { color: "#E5E7EB" },

  timerCard: { alignItems: "center" },
  timerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: { fontSize: 52, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1 },
  timerHint: { marginTop: 6, fontSize: 12, color: "#9CA3AF" },

  chipsRow: { flexDirection: "row", gap: 10, marginTop: 12, width: "100%" },
  chip: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  chipLabel: { fontSize: 11, color: "#9CA3AF" },
  chipValue: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#E5E7EB" },

  controls: { gap: 10 },
  controlsRow: { flexDirection: "row", gap: 10 },

  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: { transform: [{ scale: 0.98 }] },

  btnPrimary: { backgroundColor: "#0A84FF" },
  btnPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  btnSecondary: { flex: 1, backgroundColor: "#1F2937" },
  btnSecondaryText: { color: "#E5E7EB", fontSize: 15, fontWeight: "800" },

  btnGhost: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  btnGhostText: { color: "#E5E7EB", fontSize: 15, fontWeight: "800" },

  btnDisabled: { opacity: 0.55 },

  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  modalRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modalKey: { color: "#9CA3AF", fontSize: 13 },
  modalVal: { color: "#E5E7EB", fontSize: 13, fontWeight: "800" },
});
