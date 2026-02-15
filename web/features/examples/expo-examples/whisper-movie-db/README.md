# Whisper - Movie & TV Show Discovery App 🎬

![Whisper Banner](https://img.shields.io/badge/Status-Active-success?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square) ![Expo](https://img.shields.io/badge/Expo-52.0.0-black?logo=expo&style=flat-square)

**Whisper** is a modern, fast, and beautiful mobile application built with **React Native**, **Expo**, and **Tailwind CSS (NativeWind)**. It leverages the **TMDB (The Movie Database) API** to provide users with a comprehensive and immersive movie discovery experience.

## 📱 App Demo

<p align="center">
  <img src="./assets/demo1.jpg" width="18%" alt="App Demo 1" />
  <img src="./assets/demo2.jpg" width="18%" alt="App Demo 2" />
  <img src="./assets/demo3.jpg" width="18%" alt="App Demo 3" />
  <img src="./assets/demo4.jpg" width="18%" alt="App Demo 4" />
  <img src="./assets/demo5.jpg" width="18%" alt="App Demo 5" />
</p>

## ✨ Features

- **🎬 Trending & Popular**: Discover what's hot right now in movies and TV.
- **🔍 Advanced Search**: Find movies, TV shows, and people with instant search and history.
- **📱 Modern UI/UX**:
  - Fully responsive and pixel-perfect design.
  - Smooth animations using `react-native-reanimated`.
  - Dark Mode & Light Mode support.
  - Immersive Onboarding experience.
- **ℹ️ Detailed Info**:
  - Full movie/person details.
  - Watch dynamic trailers directly in the app.
  - View cast, crew, production companies, and similar movies.
- **❤️ Favorites**: Mark movies as favorites and manage your watchlist.
- **⚡ Performance**: Optimized list virtualization and image caching.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo (SDK 52)](https://expo.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Icons**: [Expo Vector Icons](https://icons.expo.fyi/)
- **Data Source**: [TMDB API](https://www.themoviedb.org/documentation/api)
- **State Management**: React Context / Zustand (for Onboarding)
- **Storage**: Expo Secure Store / Async Storage

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- [Bun](https://bun.sh/) (Recommended) or npm/yarn
- Expo Go app on your physical device or an Android/iOS Simulator.

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/lwshakib/whisper-movie-db.git
    cd whisper-movie-db
    ```

2.  **Install dependencies**

    ```bash
    bun install
    # or
    npm install
    ```

3.  **Configure Environment Variables**

    Create a `.env` file in the root directory and add your TMDB API Key:

    ```env
    EXPO_PUBLIC_MOVIE_DB_API_KEY=your_tmdb_api_key_here
    ```

    > **Note**: You can get a free API key from [The Movie Database](https://www.themoviedb.org/settings/api).

4.  **Run the App**

    ```bash
    npx expo start
    ```

    - Scan the QR code with **Expo Go** (Android/iOS).
    - Press `w` to run on Web.
    - Press `a` to run on Android Emulator.
    - Press `i` to run on iOS Simulator.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author

**lwshakib**

- GitHub: [@lwshakib](https://github.com/lwshakib)

---

<p align="center">
  Made with ❤️ by lwshakib
</p>
