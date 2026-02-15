import axios from "axios";

const MOVIE_DB_API_BASE_URL = "https://api.themoviedb.org/3";
const MOVIE_DB_API_KEY = process.env.EXPO_PUBLIC_MOVIE_DB_API_KEY;

const trendingMoviesEndpoint = `${MOVIE_DB_API_BASE_URL}/trending/movie/day?api_key=${MOVIE_DB_API_KEY}`;
const upcomingMoviesEndpoint = `${MOVIE_DB_API_BASE_URL}/movie/upcoming?api_key=${MOVIE_DB_API_KEY}`;
const topRatedMoviesEndpoint = `${MOVIE_DB_API_BASE_URL}/movie/top_rated?api_key=${MOVIE_DB_API_KEY}`;
const searchMoviesEndpoint = `${MOVIE_DB_API_BASE_URL}/search/movie?api_key=${MOVIE_DB_API_KEY}`;

const movieDetailsEndpoint = (id: string) =>
  `${MOVIE_DB_API_BASE_URL}/movie/${id}?api_key=${MOVIE_DB_API_KEY}`;
const movieCreditsEndpoint = (id: string) =>
  `${MOVIE_DB_API_BASE_URL}/movie/${id}/credits?api_key=${MOVIE_DB_API_KEY}`;
const similarMoviesEndpoint = (id: string) =>
  `${MOVIE_DB_API_BASE_URL}/movie/${id}/similar?api_key=${MOVIE_DB_API_KEY}`;
// person
const personDetailsEndpoint = (id: string) =>
  `${MOVIE_DB_API_BASE_URL}/person/${id}?api_key=${MOVIE_DB_API_KEY}`;
const personMoviesEndpoint = (id: string) =>
  `${MOVIE_DB_API_BASE_URL}/person/${id}/movie_credits?api_key=${MOVIE_DB_API_KEY}`;

export const image500 = (posterPath: string) =>
  posterPath ? "https://image.tmdb.org/t/p/w500" + posterPath : null;
export const image342 = (posterPath: string) =>
  posterPath ? "https://image.tmdb.org/t/p/w342" + posterPath : null;
export const image185 = (posterPath: string) =>
  posterPath ? "https://image.tmdb.org/t/p/w185" + posterPath : null;

export const fallbackMoviePoster =
  "https://img.myloview.com/stickers/whitelaptop-screen-with-hd-video-technology-icon-isolated-on-grey-background-abstractcircle-random-dots-vector-illustration-400-176057922.jpg";

export const fallbackPersonImage =
  "https://img.freepik.com/free-vector/isolated-young-handsome-man-different-poses-white-background-illustration_632498-855.jpg";

const apiCall = async (endpoint: string, params?: object) => {
  const options = {
    method: "GET",
    url: endpoint,
    params: params ? params : {},
  };
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.log("error: ", error);
    return {};
  }
};

export const fetchTrendingMovies = (page?: number) => {
  return apiCall(trendingMoviesEndpoint + (page ? "&page=" + page : ""));
};
export const fetchUpcomingMovies = (page?: number) => {
  return apiCall(upcomingMoviesEndpoint + (page ? "&page=" + page : ""));
};
export const fetchTopRatedMovies = (page?: number) => {
  return apiCall(topRatedMoviesEndpoint + (page ? "&page=" + page : ""));
};

export const searchMovies = (params: { [key: string]: string | number }) => {
  return apiCall(searchMoviesEndpoint, params);
};

export const fetchMovieDetails = (id: number | string) => {
  return apiCall(movieDetailsEndpoint(String(id)));
};
export const fetchMovieCredits = (movieId: number | string) => {
  return apiCall(movieCreditsEndpoint(String(movieId)));
};
export const fetchSimilarMovies = (movieId: number | string) => {
  return apiCall(similarMoviesEndpoint(String(movieId)));
};
// person screen apis
export const fetchPersonDetails = (personId: number | string) => {
  return apiCall(personDetailsEndpoint(String(personId)));
};
export const fetchPersonMovies = (personId: number | string) => {
  return apiCall(personMoviesEndpoint(String(personId)));
};

const movieVideosEndpoint = (id: string) =>
  `${MOVIE_DB_API_BASE_URL}/movie/${id}/videos?api_key=${MOVIE_DB_API_KEY}`;

export const fetchMovieVideos = (movieId: number | string) => {
  return apiCall(movieVideosEndpoint(String(movieId)));
};
