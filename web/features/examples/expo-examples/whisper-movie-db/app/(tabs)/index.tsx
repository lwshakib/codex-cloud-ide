import {
  fallbackMoviePoster,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchUpcomingMovies,
  image500,
} from "@/TMDB/config";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// Define the Movie type
interface Movie {
  backdrop_path: string;
  poster_path: string;
  title: string;
  release_date: string;
  overview: string;
  id: number;
}

// Modern Section Header
const SectionHeader: React.FC<{ title: string; onExploreAll: () => void }> = ({
  title,
  onExploreAll,
}) => (
  <View className="flex-row justify-between items-center px-4 mt-8 mb-4">
    <View className="flex-row items-center">
      <View className="w-1.5 h-6 bg-red-600 rounded-full mr-3" />
      <Text className="text-black dark:text-white text-2xl font-black tracking-tight">
        {title}
      </Text>
    </View>
    <TouchableOpacity
      onPress={onExploreAll}
      className="bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-full"
      activeOpacity={0.7}
    >
      <Text className="text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-widest">
        See All
      </Text>
    </TouchableOpacity>
  </View>
);

export default function Tab() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const initializedRef = useRef(false);

  const [heroData, setHeroData] = useState<Movie[]>([]);

  const loadData = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);

    try {
      // 1. Fetch Trending Movies first
      const trendingRes = await fetchTrendingMovies();
      setTrendingMovies(trendingRes.results);

      // Prepare infinite data
      if (trendingRes.results.length > 0) {
        const base = trendingRes.results.slice(0, 5);
        const looped = [];
        for (let i = 0; i < 100; i++) {
          looped.push(...base);
        }
        setHeroData(looped);
      }

      if (!isRefreshing) setLoading(false);

      // 2. Fetch Top Rated
      const topRatedRes = await fetchTopRatedMovies();
      setTopRatedMovies(topRatedRes.results);

      // 3. Fetch Upcoming
      const upcomingRes = await fetchUpcomingMovies();
      setUpcomingMovies(upcomingRes.results);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      if (!isRefreshing) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize scroll position when data is ready
  useEffect(() => {
    if (heroData.length > 0 && !initializedRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 250, animated: false });
        setActiveIndex(250);
        initializedRef.current = true;
      }, 100);
    }
  }, [heroData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  useEffect(() => {
    if (heroData.length > 0 && !loading && initializedRef.current) {
      const interval = setInterval(() => {
        const nextIndex = activeIndex + 1;
        if (nextIndex >= heroData.length) {
          flatListRef.current?.scrollToIndex({ index: 250, animated: false });
          setActiveIndex(250);
        } else {
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setActiveIndex(nextIndex);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeIndex, heroData, loading]);

  const renderHeroItem = ({ item }: { item: Movie }) => (
    // ... same render item logic ...
    <TouchableOpacity
      activeOpacity={1}
      onPress={() =>
        router.push({
          pathname: "/movie/[id]",
          params: { id: item.id.toString() },
        })
      }
      style={{ width }}
    >
      <ImageBackground
        source={{
          uri: `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`,
        }}
        className="w-full h-[550px] justify-end"
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)", "#000000"]}
          className="absolute inset-x-0 bottom-0 h-[80%]"
        />
        <View className="p-6 mb-8">
          <View className="bg-red-600 self-start px-3 py-1 rounded-full mb-3">
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">
              Trending
            </Text>
          </View>
          <Text
            className="text-white text-4xl font-black mb-2"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            className="text-gray-300 text-sm mb-6 leading-5"
            numberOfLines={3}
          >
            {item.overview}
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/movie/[id]",
                  params: { id: item.id.toString() },
                })
              }
              className="bg-red-600 px-8 py-4 rounded-2xl flex-row items-center"
              style={{
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <Text className="text-white font-black text-base mr-2">
                Watch Now
              </Text>
              <Text className="text-white text-xl">▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        className="flex-1"
        style={{
          backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
        }}
      >
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View className="w-full h-[550px] bg-gray-200 dark:bg-zinc-900 animate-pulse" />
        <View className="p-4">
          <View className="h-8 w-48 bg-gray-200 dark:bg-zinc-900 rounded-lg mb-6" />
          <View className="flex-row">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="w-40 h-60 bg-gray-200 dark:bg-zinc-900 rounded-2xl mr-4"
              />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
      }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#ef4444"
          colors={["#ef4444"]}
        />
      }
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Hero Slider */}
      <View>
        <FlatList
          ref={flatListRef}
          data={heroData}
          renderItem={renderHeroItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={true}
        />
      </View>

      {/* Lists */}
      <SectionHeader
        title="Trending"
        onExploreAll={() => router.push("/movies/trending-movies")}
      />
      <FlatList
        data={trendingMovies.slice(5)}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mr-5"
            onPress={() =>
              router.push({
                pathname: "/movie/[id]",
                params: { id: item.id.toString() },
              })
            }
          >
            <View
              className="w-44 h-64 rounded-3xl overflow-hidden mb-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 8,
              }}
            >
              <Image
                source={{
                  uri: image500(item.poster_path) || fallbackMoviePoster,
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Text
              className="text-black dark:text-white font-bold text-base w-44"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
              {item.release_date?.split("-")[0]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <SectionHeader
        title="Top Rated"
        onExploreAll={() => router.push("/movies/top-rated-movies")}
      />
      <FlatList
        data={topRatedMovies}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mr-5"
            onPress={() =>
              router.push({
                pathname: "/movie/[id]",
                params: { id: item.id.toString() },
              })
            }
          >
            <View className="w-44 h-64 rounded-3xl overflow-hidden mb-3">
              <Image
                source={{
                  uri: image500(item.poster_path) || fallbackMoviePoster,
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Text
              className="text-black dark:text-white font-bold text-base w-44"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
              {item.release_date?.split("-")[0]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <SectionHeader
        title="Coming Soon"
        onExploreAll={() => router.push("/movies/upcoming-movies")}
      />
      <FlatList
        data={upcomingMovies}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mr-5"
            onPress={() =>
              router.push({
                pathname: "/movie/[id]",
                params: { id: item.id.toString() },
              })
            }
          >
            <View className="w-44 h-64 rounded-3xl overflow-hidden mb-3">
              <Image
                source={{
                  uri: image500(item.poster_path) || fallbackMoviePoster,
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Text
              className="text-black dark:text-white font-bold text-base w-44"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">
              {item.release_date?.split("-")[0]}
            </Text>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}
