let menuToggle = document.getElementById("menuToggle");
let navLinks = document.getElementById("navLinks");
let contactForm = document.getElementById("contactForm");
let formStatus = document.getElementById("formStatus");
let messageInbox = document.getElementById("messageInbox");
let clearMessagesBtn = document.getElementById("clearMessagesBtn");
let deletePasswordModal = document.getElementById("deletePasswordModal");
let deletePasswordInput = document.getElementById("deletePasswordInput");
let toggleDeletePasswordBtn = document.getElementById(
  "toggleDeletePasswordBtn",
);
let confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
let cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
let deleteModalTitle = document.getElementById("deleteModalTitle");
let deleteModalDescription = document.getElementById("deleteModalDescription");
const storageKey = "portfolio-messages";
const deletePassword = "idriss2026";
const emailjsPublicKey = "DPjoBQNkGzYtckTHL";
const emailjsServiceId = "service_tw1cv5z";
const emailjsTemplateId = "template_mw0rm4d";

// Configurez ces valeurs avec votre projet Supabase.
const supabaseUrl = "https://nhyefzldxwfvqujbqraa.supabase.co";
const supabaseAnonKey = "sb_publishable_l_pP8NlpmspvF1GU6zodYQ_KAOpTUcG";
const supabaseTable = "messages";

const useSupabase =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes("YOUR_") &&
  !supabaseAnonKey.includes("YOUR_");

const supabaseClient = useSupabase
  ? supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

function getLocalMessages() {
  try {
    const saved = localStorage.getItem(storageKey);
    return normalizeMessages(saved ? JSON.parse(saved) : []);
  } catch (error) {
    console.error("Impossible de lire les messages locaux", error);
    return [];
  }
}

function saveLocalMessages(messages) {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

async function fetchMessagesFromSupabase() {
  if (!supabaseClient) {
    return getLocalMessages();
  }

  const { data, error } = await supabaseClient
    .from(supabaseTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Erreur Supabase lors de la récupération des messages",
      error,
    );
    return getLocalMessages();
  }

  return normalizeMessages(
    (data || []).map((message) => ({
      ...message,
      createdAt: message.created_at || message.createdAt,
    })),
  );
}

async function saveMessageToSupabase(message) {
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.from(supabaseTable).insert([
    {
      name: message.name,
      email: message.email,
      message: message.message,
      created_at: message.createdAt,
    },
  ]);

  if (error) {
    console.error("Erreur Supabase lors de l'enregistrement du message", error);
    throw error;
  }
}

async function deleteMessageFromSupabase(messageId) {
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient
    .from(supabaseTable)
    .delete()
    .eq("id", messageId);

  if (error) {
    console.error("Erreur Supabase lors de la suppression du message", error);
  }
}

async function clearMessagesFromSupabase() {
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient
    .from(supabaseTable)
    .delete()
    .neq("id", "");

  if (error) {
    console.error(
      "Erreur Supabase lors de la suppression de tous les messages",
      error,
    );
  }
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("active");
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMessages(messages) {
  return (Array.isArray(messages) ? messages : []).map((message) => ({
    ...message,
    id:
      message.id ||
      `${message.createdAt || new Date().toISOString()}-${message.email || ""}-${message.name || ""}`,
  }));
}

function createMessageCard(message) {
  const card = document.createElement("article");
  card.className = "message-card";

  const header = document.createElement("div");
  header.className = "message-card-header";

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const sender = document.createElement("span");
  sender.textContent = `De : ${message.name}`;

  const email = document.createElement("span");
  email.textContent = `Email : ${message.email}`;

  const time = document.createElement("span");
  time.textContent = `Reçu le ${formatDate(message.createdAt)}`;

  meta.append(sender, email, time);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-message-btn";
  deleteButton.textContent = "Supprimer";
  deleteButton.addEventListener("click", () =>
    openDeleteModal("single", message.id),
  );

  header.append(meta, deleteButton);

  const text = document.createElement("p");
  text.className = "message-text";
  text.textContent = message.message;

  card.append(header, text);

  return card;
}

function renderMessages(messages) {
  if (!messageInbox) {
    return;
  }

  messageInbox.innerHTML = "";

  if (!messages.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Aucun message reçu pour le moment.";
    messageInbox.appendChild(emptyState);
    return;
  }

  const list = document.createElement("div");
  list.className = "message-list";

  messages
    .slice()
    .reverse()
    .forEach((message) => list.appendChild(createMessageCard(message)));

  messageInbox.appendChild(list);
}

async function loadMessages() {
  try {
    const messages = useSupabase
      ? await fetchMessagesFromSupabase()
      : getLocalMessages();

    if (!useSupabase) {
      saveLocalMessages(messages);
    }

    renderMessages(messages);
  } catch (error) {
    console.error("Impossible de charger les messages", error);
    renderMessages([]);
  }
}

function saveMessages(messages) {
  if (!useSupabase) {
    saveLocalMessages(messages);
  }
}

function closeDeleteModal() {
  if (deletePasswordModal) {
    deletePasswordModal.classList.add("hidden");
    deletePasswordModal.setAttribute("aria-hidden", "true");
  }

  if (deletePasswordInput) {
    deletePasswordInput.value = "";
    deletePasswordInput.type = "password";
  }

  if (toggleDeletePasswordBtn) {
    toggleDeletePasswordBtn.textContent = "Afficher";
  }
}

function openDeleteModal(mode, messageId = null) {
  if (
    !deletePasswordModal ||
    !deletePasswordInput ||
    !toggleDeletePasswordBtn
  ) {
    return;
  }

  deletePasswordModal.classList.remove("hidden");
  deletePasswordModal.setAttribute("aria-hidden", "false");
  deletePasswordInput.value = "";
  deletePasswordInput.type = "password";
  toggleDeletePasswordBtn.textContent = "Afficher";

  if (mode === "single") {
    deleteModalTitle.textContent = "Autorisation de suppression";
    deleteModalDescription.textContent =
      "Entrez le mot de passe pour supprimer ce message.";
    confirmDeleteBtn.dataset.mode = "single";
    confirmDeleteBtn.dataset.messageId = messageId;
  } else {
    deleteModalTitle.textContent = "Autorisation de suppression";
    deleteModalDescription.textContent =
      "Entrez le mot de passe pour supprimer tous les messages.";
    confirmDeleteBtn.dataset.mode = "all";
    confirmDeleteBtn.dataset.messageId = "";
  }
}

function authorizeDeletion() {
  if (!deletePasswordInput) {
    return false;
  }

  if (deletePasswordInput.value !== deletePassword) {
    if (formStatus) {
      formStatus.textContent =
        "Accès refusé. Seul l'administrateur peut supprimer des messages.";
    }
    return false;
  }

  return true;
}

async function deleteMessage(messageId) {
  if (useSupabase) {
    await deleteMessageFromSupabase(messageId);
  } else {
    const normalizedMessages = normalizeMessages(getLocalMessages());
    const nextMessages = normalizedMessages.filter(
      (message) => message.id !== messageId,
    );

    saveLocalMessages(nextMessages);
  }

  await loadMessages();

  if (formStatus) {
    formStatus.textContent = "Message supprimé.";
  }
}

async function clearMessages() {
  if (useSupabase) {
    await clearMessagesFromSupabase();
  } else {
    localStorage.removeItem(storageKey);
  }

  await loadMessages();

  if (formStatus) {
    formStatus.textContent = "Tous les messages ont été supprimés.";
  }
}

async function sendContactMessage(name, email, message) {
  const hasMissingConfig =
    !emailjsPublicKey ||
    !emailjsServiceId ||
    !emailjsTemplateId ||
    emailjsPublicKey.includes("YOUR_") ||
    emailjsServiceId.includes("YOUR_") ||
    emailjsTemplateId.includes("YOUR_");

  if (hasMissingConfig) {
    throw new Error(
      "EmailJS n'est pas configuré correctement. Vérifie les clés dans le fichier script.js.",
    );
  }

  emailjs.init({ publicKey: emailjsPublicKey });

  await emailjs.send(emailjsServiceId, emailjsTemplateId, {
    from_name: name,
    from_email: email,
    message,
    reply_to: email,
  });
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("senderName")?.value.trim() || "";
    const email = document.getElementById("senderEmail")?.value.trim() || "";
    const message =
      document.getElementById("senderMessage")?.value.trim() || "";

    if (!name || !email || !message) {
      if (formStatus) {
        formStatus.textContent =
          "Veuillez remplir tous les champs avant d'envoyer votre message.";
      }
      return;
    }

    const submitButton = contactForm.querySelector("button[type='submit']");
    const originalButtonText = submitButton?.textContent || "Envoyer";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours...";
    }

    if (formStatus) {
      formStatus.textContent = "Envoi du message en cours...";
    }

    const newMessage = {
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };

    let emailError = null;
    let savedOnSupabase = false;

    // Enregistrer le message dans Supabase en PRIORITE
    if (useSupabase) {
      try {
        await saveMessageToSupabase(newMessage);
        savedOnSupabase = true;
      } catch (error) {
        console.warn("Impossible d'enregistrer sur Supabase", error);
      }
    }

    // Fallback: sauvegarder localement si Supabase a échoué
    if (!savedOnSupabase) {
      const messages = getLocalMessages();
      messages.push({ ...newMessage, status: "local-only" });
      saveLocalMessages(messages);
    }

    // Essayer d'envoyer l'email (optionnel)
    try {
      await sendContactMessage(name, email, message);
    } catch (error) {
      emailError = error;
      console.warn("L'envoi par email a échoué", error);
    }

    await loadMessages();
    contactForm.reset();

    if (formStatus) {
      const baseMessage = savedOnSupabase
        ? "Votre message a été partagé avec tous!"
        : "Message enregistré localement.";
      formStatus.textContent = emailError
        ? baseMessage + " (Email non envoyé)"
        : baseMessage;
    }

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

if (clearMessagesBtn) {
  clearMessagesBtn.addEventListener("click", () => {
    if (!useSupabase) {
      const savedMessages = localStorage.getItem(storageKey);

      if (!savedMessages) {
        if (formStatus) {
          formStatus.textContent = "Aucun message à supprimer.";
        }
        return;
      }
    }

    openDeleteModal("all");
  });
}

if (toggleDeletePasswordBtn && deletePasswordInput) {
  toggleDeletePasswordBtn.addEventListener("click", () => {
    const isPasswordHidden = deletePasswordInput.type === "password";
    deletePasswordInput.type = isPasswordHidden ? "text" : "password";
    toggleDeletePasswordBtn.textContent = isPasswordHidden
      ? "Masquer"
      : "Afficher";
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!authorizeDeletion()) {
      return;
    }

    const mode = confirmDeleteBtn.dataset.mode;

    if (mode === "single") {
      await deleteMessage(confirmDeleteBtn.dataset.messageId);
    } else {
      await clearMessages();
    }

    closeDeleteModal();
  });
}

window.addEventListener("scroll", () => {
  const cards = document.querySelectorAll(".skill-card, .project-card");

  cards.forEach((card) => {
    const cardTop = card.getBoundingClientRect().top;

    if (cardTop < window.innerHeight - 100) {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }
  });
});

// Charger les messages au démarrage
loadMessages();

// Rafraîchir les messages toutes les 2 secondes pour afficher les nouveaux en temps réel
if (useSupabase) {
  setInterval(() => {
    loadMessages();
  }, 2000);
}
