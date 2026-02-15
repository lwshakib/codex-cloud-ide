import {
  fallbackMoviePoster,
  fallbackPersonImage,
  fetchMovieCredits,
  fetchMovieDetails,
  fetchMovieVideos,
  fetchSimilarMovies,
  image185,
  image500,
} from "@/TMDB/config";
import FloatingBackButton from "@/components/FloatingBackButton";
import { useFavorites } from "@/context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import YoutubePlayer from "react-native-youtube-iframe";

const { width, height } = Dimensions.get("window");

const MovieInfoItem = ({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) => (
  <View className="mb-4 w-[48%] bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border-0">
    <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
      {title}
    </Text>
    <Text className="text-gray-900 dark:text-gray-100 font-bold text-sm">
      {value || "N/A"}
    </Text>
  </View>
);

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function MovieDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [movie, setMovie] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [similar, setSimilar] = useState<any>(null);
  const [videos, setVideos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.includes(id as string);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchMovieDetails(id as string),
      fetchMovieCredits(id as string),
      fetchSimilarMovies(id as string),
      fetchMovieVideos(id as string),
    ]).then(([movieRes, creditsRes, similarRes, videosRes]) => {
      setMovie(movieRes);
      setCredits(creditsRes);
      setSimilar(similarRes);
      setVideos(videosRes);

      // Find official trailer
      const trailer = videosRes?.results?.find(
        (v: any) => v.site === "YouTube" && v.type === "Trailer"
      );
      // Fallback to Teaser or any video if trailer not found
      const fallbackVideo = videosRes?.results?.find(
        (v: any) => v.site === "YouTube"
      );

      setTrailerKey(trailer?.key || fallbackVideo?.key || null);

      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-black p-4 items-center justify-center">
        {/* Simple loading state or continue with skeleton if preferred, specifically user asked for data so cleaner loading is fine */}
        <View className="w-full h-full justify-center items-center">
          <View className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </View>
      </View>
    );
  }

  if (!movie) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-lg text-gray-700 dark:text-gray-200">
          Movie not found.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000000" : "#ffffff",
      }}
    >
      <FloatingBackButton />
      <TouchableOpacity
        onPress={() => toggleFavorite(id as string)}
        className="absolute top-12 right-4 z-50 bg-white/20 backdrop-blur-md p-3 rounded-full"
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={28}
          color={isFavorite ? "#ef4444" : "#fff"}
        />
      </TouchableOpacity>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar hidden />

        {/* Header Image Section */}
        <View className="w-full h-[500px] relative">
          <Image
            source={{ uri: image500(movie.poster_path) || fallbackMoviePoster }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", isDark ? "#000000" : "#ffffff"]}
            style={{
              width: width,
              height: height * 0.4,
              position: "absolute",
              bottom: 0,
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        {/* Title & Tagline */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="px-4 -mt-12 space-y-3"
        >
          <Text className="text-3xl font-black text-center text-gray-900 dark:text-white shadow-sm">
            {movie.title}
          </Text>
          {movie.tagline ? (
            <Text className="text-gray-500 dark:text-gray-400 font-medium text-sm text-center italic">
              "{movie.tagline}"
            </Text>
          ) : null}

          {/* Genres */}
          <View className="flex-row justify-center mx-4 flex-wrap mt-2">
            {movie.genres?.map((g: any, index: number) => (
              <View
                key={index}
                className="px-4 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 mr-2 mb-2"
              >
                <Text className="text-gray-600 dark:text-gray-300 text-xs font-semibold">
                  {g.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Overview */}
          <Text className="text-gray-600 dark:text-neutral-300 font-normal leading-6 text-base text-center mt-2 mx-2">
            {movie.overview}
          </Text>
        </Animated.View>

        {/* Trailer */}
        {trailerKey && (
          <View className="mt-8 px-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Official Trailer
            </Text>
            <View className="rounded-2xl overflow-hidden bg-black shadow-lg">
              <YoutubePlayer height={220} play={false} videoId={trailerKey} />
            </View>
          </View>
        )}

        {/* Info Grid */}
        <View className="mt-8 px-4">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Information
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <MovieInfoItem title="Status" value={movie.status} />
            <MovieInfoItem
              title="Release Date"
              value={movie.release_date?.split("-").reverse().join("/")}
            />
            <MovieInfoItem title="Runtime" value={`${movie.runtime} min`} />
            <MovieInfoItem
              title="Rating"
              value={`${movie.vote_average?.toFixed(1)} / 10`}
            />
            <MovieInfoItem
              title="Budget"
              value={
                movie.budget > 0
                  ? currencyFormatter.format(movie.budget)
                  : "Unknown"
              }
            />
            <MovieInfoItem
              title="Revenue"
              value={
                movie.revenue > 0
                  ? currencyFormatter.format(movie.revenue)
                  : "Unknown"
              }
            />
            <MovieInfoItem
              title="Original Language"
              value={movie.original_language?.toUpperCase()}
            />
            <MovieInfoItem
              title="Popularity"
              value={movie.popularity?.toFixed(0)}
            />
          </View>
        </View>

        {/* Production Companies */}
        {movie.production_companies?.length > 0 && (
          <View className="mt-4 px-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Production
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pl-1"
            >
              {movie.production_companies.map((pc: any) => (
                <View key={pc.id} className="mr-6 items-center">
                  <View className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl justify-center items-center p-2 mb-2">
                    <Image
                      source={{
                        uri: image185(pc.logo_path) || fallbackMoviePoster,
                      }}
                      className="w-16 h-16"
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    className="text-xs text-gray-500 dark:text-gray-400 w-20 text-center font-medium"
                    numberOfLines={2}
                  >
                    {pc.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cast */}
        {credits?.cast?.length > 0 && (
          <View className="mt-8">
            <Text className="text-xl font-bold text-gray-900 dark:text-white px-4 mb-4">
              Top Cast
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {credits.cast.map((actor: any, index: number) => (
                <TouchableOpacity
                  key={`${actor.id}-${index}`}
                  className="mr-4 items-center"
                  onPress={() =>
                    router.push({
                      pathname: "/person/[id]",
                      params: { id: actor.id },
                    })
                  }
                >
                  <View className="rounded-full mb-2">
                    <Image
                      source={{
                        uri:
                          image185(actor.profile_path) || fallbackPersonImage,
                      }}
                      className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-800"
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    className="text-xs font-bold text-gray-900 dark:text-white w-24 text-center"
                    numberOfLines={1}
                  >
                    {actor.name}
                  </Text>
                  <Text
                    className="text-[10px] text-gray-500 w-24 text-center"
                    numberOfLines={1}
                  >
                    {actor.character}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Similar Movies */}
        {similar?.results?.length > 0 && (
          <View className="mt-8 mb-8">
            <Text className="text-xl font-bold text-gray-900 dark:text-white px-4 mb-4">
              You might also like
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {similar.results.map((m: any, index: number) => (
                <TouchableOpacity
                  key={`${m.id}-${index}`}
                  className="mr-4 w-32"
                  onPress={() =>
                    router.push({
                      pathname: "/movie/[id]",
                      params: { id: m.id },
                    })
                  }
                >
                  <Image
                    source={{
                      uri: image185(m.poster_path) || fallbackMoviePoster,
                    }}
                    className="w-32 h-48 rounded-xl mb-2 bg-gray-800"
                    resizeMode="cover"
                  />
                  <Text
                    className="text-xs font-bold text-gray-900 dark:text-white"
                    numberOfLines={1}
                  >
                    {m.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
