import { useSearchHistory } from "@/context";
import { searchMovies } from "@/TMDB/config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const numColumns = 3;
const gap = 12;
const padding = 16;
const availableWidth = width - padding * 2 - gap * (numColumns - 1);
const itemWidth = availableWidth / numColumns;

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { history, addToHistory, removeFromHistory, clearHistory } =
    useSearchHistory();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryId = useRef<number>(0);

  const isDark = colorScheme === "dark";
  const theme = {
    bg: isDark ? "#000000" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    textSecondary: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#1C1C1E" : "#F2F2F7",
    primary: "#ef4444",
    border: isDark ? "#2C2C2E" : "#E5E5EA",
  };

  const performSearch = async (text: string, pageNum = 1) => {
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setPage(1);
      return;
    }

    const queryId = Date.now();
    latestQueryId.current = queryId;

    if (pageNum === 1) {
      setLoading(true);
      setSearched(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await searchMovies({ query: text, page: pageNum });
      if (latestQueryId.current === queryId) {
        if (pageNum === 1) {
          setResults(res.results || []);
          if (res.results?.length > 0) {
            addToHistory(text);
          }
        } else {
          setResults((prev) => [...prev, ...(res.results || [])]);
        }
        setHasMore(pageNum < (res.total_pages || 0));
        setPage(pageNum);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (latestQueryId.current === queryId) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const renderItem = ({ item, index }: { item: Movie; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(200)} // Removed heavy spring/delay logic
      style={{ width: itemWidth, marginBottom: 16 }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/movie/[id]",
            params: { id: item.id.toString() },
          })
        }
      >
        <Image
          source={{
            uri: item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : "https://via.placeholder.com/300x450",
          }}
          style={{
            width: itemWidth,
            height: itemWidth * 1.5,
            borderRadius: 12,
            backgroundColor: theme.inputBg,
          }}
          resizeMode="cover"
        />
        <Text
          numberOfLines={1}
          className="mt-2 text-xs font-bold"
          style={{ color: theme.text }}
        >
          {item.title}
        </Text>
        <Text className="text-[10px]" style={{ color: theme.textSecondary }}>
          {item.release_date?.split("-")[0] || "N/A"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
    >
      <View className="px-4 pb-4">
        <Text
          className="text-3xl font-bold mb-4 mt-2"
          style={{ color: theme.text }}
        >
          Search
        </Text>
        <View
          className="flex-row items-center h-12 rounded-xl px-3"
          style={{ backgroundColor: theme.inputBg }}
        >
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            ref={inputRef}
            className="flex-1 ml-2 font-medium"
            style={{ color: theme.text, fontSize: 16 }}
            placeholder="Search for movies, TV shows..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            selectionColor={theme.primary}
            onSubmitEditing={() => performSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : query.trim() !== "" ? (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          numColumns={numColumns}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: padding,
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && searched ? (
              <View className="mt-20 items-center px-8">
                <Ionicons
                  name="film-outline"
                  size={64}
                  color={theme.textSecondary}
                />
                <Text
                  className="mt-4 text-center text-lg font-semibold"
                  style={{ color: theme.text }}
                >
                  No movies found for "{query}"
                </Text>
                <Text
                  className="mt-2 text-center text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  Try searching for another movie title.
                </Text>
              </View>
            ) : null
          }
          keyboardDismissMode="on-drag"
          onEndReached={() => {
            if (!loading && !loadingMore && hasMore) {
              performSearch(query, page + 1);
            }
          }}
          onEndReachedThreshold={2.0} // Trigger load much earlier (when 2 screen heights away)
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
        />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {history.length > 0 ? (
            <Animated.View entering={FadeIn.duration(400)}>
              <View className="flex-row justify-between items-center mb-4 mt-2">
                <Text
                  className="text-base font-bold"
                  style={{ color: theme.text }}
                >
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={clearHistory}>
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>
              {history.map((term, index) => (
                <TouchableOpacity
                  key={`${term}-${index}`}
                  onPress={() => setQuery(term)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                      {term}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromHistory(term)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : (
            <View className="mt-32 items-center opacity-50">
              <Ionicons name="search" size={64} color={theme.textSecondary} />
              <Text
                className="mt-4 text-base font-medium"
                style={{ color: theme.textSecondary }}
              >
                Search for your favorite movies
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
