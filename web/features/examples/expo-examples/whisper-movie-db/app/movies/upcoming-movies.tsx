import FloatingBackButton from "@/components/FloatingBackButton";
import {
  fallbackMoviePoster,
  fetchUpcomingMovies,
  image500,
} from "@/TMDB/config";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width } = Dimensions.get("window");
const numColumns = 3;
const gap = 12;
const padding = 16;
const availableWidth = width - padding * 2 - gap * (numColumns - 1);
const itemWidth = availableWidth / numColumns;

const SKELETON_ITEMS = Array.from({ length: 12 });

const SkeletonItem = () => (
  <View style={{ width: itemWidth, marginBottom: 16 }}>
    <View className="h-[180px] bg-gray-800 animate-pulse rounded-xl mb-2" />
    <View className="h-4 w-3/4 bg-gray-800 rounded mb-1 animate-pulse" />
    <View className="h-3 w-1/2 bg-gray-800 rounded animate-pulse" />
  </View>
);

export default function UpcomingMovies() {
  const [movies, setMovies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const loadMovies = useCallback(
    async (pageNumber: number, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNumber === 1) {
          setLoading(true);
        } else {
          setIsFetchingMore(true);
        }

        const res = await fetchUpcomingMovies(pageNumber);

        if (res.results.length === 0) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        if (pageNumber === 1) {
          setMovies(res.results || []);
        } else {
          setMovies((prev) => [...prev, ...(res.results || [])]);
        }

        setPage(pageNumber);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsFetchingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMovies(1);
  }, [loadMovies]);

  const onRefresh = () => {
    setHasMore(true);
    loadMovies(1, true);
  };

  const onEndReached = () => {
    if (!isFetchingMore && hasMore && !refreshing) {
      loadMovies(page + 1);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(200)}
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
            uri: image500(item.poster_path) || fallbackMoviePoster,
          }}
          style={{
            width: itemWidth,
            height: itemWidth * 1.5,
            borderRadius: 12,
            backgroundColor: isDark ? "#1f1f1f" : "#e5e5e5",
          }}
          resizeMode="cover"
        />
        <View className="mt-2">
          <Text
            className="text-white text-xs font-bold"
            style={{ color: isDark ? "#fff" : "#000" }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-gray-400 text-[10px]">
            {item.release_date?.split("-")[0] || "N/A"}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View
      className="flex-1 pt-4"
      style={{ backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <FloatingBackButton />

      {loading && !refreshing ? (
        <View className="px-4 mt-20">
          <Text
            className="text-2xl font-bold mb-6"
            style={{ color: isDark ? "#fff" : "#000" }}
          >
            Upcoming Movies
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {SKELETON_ITEMS.map((_, index) => (
              <SkeletonItem key={index} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={numColumns}
          renderItem={renderItem}
          columnWrapperStyle={{
            justifyContent: "space-between",
            paddingHorizontal: padding,
          }}
          contentContainerStyle={{ paddingBottom: 50, paddingTop: 80 }}
          ListHeaderComponent={
            <Text
              className="text-2xl font-bold mb-6 px-4"
              style={{ color: isDark ? "#fff" : "#000" }}
            >
              Upcoming Movies
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#fff" : "#000"}
              colors={["#ef4444"]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={2.0}
          ListFooterComponent={
            isFetchingMore ? (
              <View className="py-6">
                <ActivityIndicator size="small" color="#ef4444" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
