const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("kereview_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error("Can't reach the KeReview server. Is the backend running?");
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // auth
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  updateProfile: (payload) => request("/auth/me", { method: "PUT", body: payload }),

  // movies
  getMovies: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return request(`/movies${qs ? `?${qs}` : ""}`);
  },
  getGenres: () => request("/movies/genres"),
  getMovie: (idOrSlug) => request(`/movies/${idOrSlug}`),
  createMovie: (payload) => request("/movies", { method: "POST", body: payload }),
  updateMovie: (id, payload) => request(`/movies/${id}`, { method: "PUT", body: payload }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: "DELETE" }),

  // reviews
  getReviews: (movieId) => request(`/movies/${movieId}/reviews`, { auth: false }),
  submitReview: (movieId, payload) =>
    request(`/movies/${movieId}/reviews`, { method: "POST", body: payload }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: "DELETE" }),

  // watchlist
  getWatchlist: () => request("/watchlist"),
  addToWatchlist: (movieId) => request(`/watchlist/${movieId}`, { method: "POST" }),
  removeFromWatchlist: (movieId) => request(`/watchlist/${movieId}`, { method: "DELETE" }),

  // my list (currently watching / reading tracker)
  getMyList: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return request(`/my-list${qs ? `?${qs}` : ""}`);
  },
  addMyListItem: (payload) => request("/my-list", { method: "POST", body: payload }),
  updateMyListItem: (id, payload) => request(`/my-list/${id}`, { method: "PUT", body: payload }),
  deleteMyListItem: (id) => request(`/my-list/${id}`, { method: "DELETE" }),

  // AI discovery
  aiStatus: () => request("/ai/status"),
  aiDiscover: (topic) => request("/ai/discover", { method: "POST", body: { topic } }),
  aiImport: (movies) => request("/ai/import", { method: "POST", body: { movies } }),
};

export { getToken };
