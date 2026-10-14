
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8000/api";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function request(url, options = {}, authToken = token) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API}${url}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loadPosts() {
    try {
      const data = await request("/posts", {}, "");
      setPosts(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setMessage("You have logged out.");
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;

    request("/auth/me", {}, token)
      .then(data => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) logout();
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint =
        mode === "register" ? "/auth/register" : "/auth/login";

      const payload =
        mode === "register"
          ? form
          : { email: form.email, password: form.password };

      const data = await request(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        ""
      );

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setForm({ username: "", email: "", password: "" });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPost(e) {
    e.preventDefault();

    if (!user) {
      setMessage("Please login to create a post.");
      return;
    }

    try {
      await request("/posts", {
        method: "POST",
        body: JSON.stringify({ content })
      });

      setContent("");
      setMessage("");
      await loadPosts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleLike(postId) {
    if (!user) {
      setMessage("Please login to like posts.");
      return;
    }

    try {
      await request(`/posts/${postId}/like`, {
        method: "POST",
        body: JSON.stringify({})
      });

      await loadPosts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addComment(e, postId) {
    e.preventDefault();

    if (!user) {
      setMessage("Please login to comment.");
      return;
    }

    try {
      await request(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: comments[postId] || "" })
      });

      setComments(prev => ({ ...prev, [postId]: "" }));
      await loadPosts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2>ConnectFeed</h2>

        {user ? (
          <div className="nav-user">
            <span>@{user.username}</span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <span>Share your world 🌎</span>
        )}
      </nav>

      <main className="container">
        <h1>Social Media Feed</h1>
        <p className="subtitle">
          Connect, share and discover.
        </p>

        {message && (
          <div className="message" role="status">
            {message}
          </div>
        )}

        {!user && (
          <section className="auth-card">
            <h2>
              {mode === "register" ? "Create Account" : "Welcome Back"}
            </h2>

            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                Login
              </button>

              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setMessage("");
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth}>
              {mode === "register" && (
                <input
                  placeholder="Username"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  required
                  value={form.username}
                  onChange={e =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
                value={form.email}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                minLength={mode === "register" ? 8 : undefined}
                required
                value={form.password}
                onChange={e =>
                  setForm({ ...form, password: e.target.value })
                }
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "register"
                  ? "Create Account"
                  : "Login"}
              </button>
            </form>
          </section>
        )}

        {user && (
          <form className="create-post" onSubmit={createPost}>
            <h3>What's on your mind, {user.username}?</h3>

            <textarea
              placeholder="Share something with the community..."
              maxLength={2000}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
            />

            <button type="submit">Create Post</button>
          </form>
        )}

        <h2 className="feed-title">Latest Posts</h2>

        {posts.length === 0 && (
          <p className="empty">No posts yet. Be the first!</p>
        )}

        {posts.map(post => (
          <article className="post" key={post._id}>
            <div className="post-header">
              <div className="avatar">
                {post.username.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{post.username}</strong>
                <p className="date">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="post-content">{post.content}</p>

            <button
              className="like-button"
              onClick={() => toggleLike(post._id)}
            >
              ❤️ {post.likes} Likes
            </button>

            <div className="comments">
              <h4>Comments ({post.comments.length})</h4>

              {post.comments.map((comment, index) => (
                <p className="comment" key={index}>
                  <strong>{comment.username}:</strong> {comment.text}
                </p>
              ))}

              {user ? (
                <form
                  className="comment-form"
                  onSubmit={e => addComment(e, post._id)}
                >
                  <input
                    placeholder="Write a comment..."
                    maxLength={500}
                    required
                    value={comments[post._id] || ""}
                    onChange={e =>
                      setComments(prev => ({
                        ...prev,
                        [post._id]: e.target.value
                      }))
                    }
                  />

                  <button type="submit">Send</button>
                </form>
              ) : (
                <p className="login-hint">
                  Login to like and comment.
                </p>
              )}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

export default App;
