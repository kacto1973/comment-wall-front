const API_URL = "https://comment-wall-api.vercel.app/comments";

const form = document.getElementById("comment-form");
const usernameInput = document.getElementById("username");
const messageInput = document.getElementById("message");
const commentsList = document.getElementById("comments-list");
const emptyState = document.getElementById("empty-state");
const errorMsg = document.getElementById("error-msg");

const api = {
  async getComments() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Error al cargar");
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async createComment(data) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al crear");
    return await response.json();
  },

  async deleteComment(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al eliminar");
    return true;
  },
};

const ui = {
  timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "Hace unos segundos";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? "s" : ""}`;
  },

  showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  },

  renderComments(comments) {
    commentsList.innerHTML = "";

    if (comments.length === 0) {
      emptyState.classList.remove("hidden");
      commentsList.classList.add("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    commentsList.classList.remove("hidden");

    comments.forEach((comment) => {
      const card = document.createElement("div");
      card.className = "comment-card";

      card.innerHTML = `
                <div class="comment-header">
                    <span class="comment-username">${comment.username}</span>
                    <span class="comment-date">${ui.timeAgo(comment.date)}</span>
                </div>
                <p class="comment-message">${comment.message}</p>
                <button class="delete-btn" data-id="${comment._id}">Eliminar</button>
            `;

      commentsList.appendChild(card);
    });
  },
};

async function initApp() {
  const comments = await api.getComments();
  ui.renderComments(comments);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.add("hidden");

  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();

  if (!username) return ui.showError("Ingresa un nombre de usuario.");
  if (message.length < 5)
    return ui.showError("El mensaje es muy corto (min. 5 caracteres).");

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.textContent = "Publicando...";

  try {
    await api.createComment({
      username,
      message,
      date: new Date().toISOString(),
    });
    form.reset();
    await initApp();
  } catch (error) {
    ui.showError("Fallo de conexión. Intenta de nuevo.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Publicar";
  }
});

commentsList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.getAttribute("data-id");

    if (confirm("¿Seguro que quieres borrar este comentario?")) {
      const originalText = e.target.textContent;
      e.target.textContent = "Borrando...";

      try {
        await api.deleteComment(id);
        await initApp(); // recargar la lista
      } catch (error) {
        alert("No se pudo borrar el comentario.");
        e.target.textContent = originalText;
      }
    }
  }
});

initApp();
