"use strict";

const chatWidget = document.querySelector("[data-chat-widget]");

if (chatWidget) {
  const panel = chatWidget.querySelector(".chat-panel");
  const launcher = chatWidget.querySelector(".chat-launcher");
  const closeButton = chatWidget.querySelector(".chat-panel__close");
  const messagesElement = chatWidget.querySelector(".chat-messages");
  const suggestions = chatWidget.querySelector(".chat-suggestions");
  const form = chatWidget.querySelector(".chat-form");
  const input = chatWidget.querySelector("#chat-input");
  const sendButton = chatWidget.querySelector(".chat-form__send");
  const status = chatWidget.querySelector(".chat-status");
  const conversation = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let requestInFlight = false;

  const setOpen = (open) => {
    chatWidget.classList.toggle("chat-widget--open", open);
    launcher.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    panel.inert = !open;
    document.body.classList.toggle(
      "chat-is-open",
      open && window.innerWidth <= 430,
    );

    if (open) {
      window.requestAnimationFrame(() => input.focus());
    } else {
      launcher.focus();
    }
  };

  const addMessage = (role, text, section = "") => {
    const message = document.createElement("div");
    message.className = `chat-message chat-message--${role}`;

    const label = document.createElement("span");
    label.className = "chat-message__label";
    label.setAttribute("aria-hidden", "true");
    label.textContent = role === "assistant" ? "RT / AI" : "YOU";

    const speaker = document.createElement("span");
    speaker.className = "visually-hidden";
    speaker.textContent = role === "assistant" ? "Assistant: " : "You: ";

    const content = document.createElement("p");
    content.append(speaker, text);
    message.append(label, content);

    if (section) {
      const sectionLink = document.createElement("a");
      sectionLink.className = "chat-message__link";
      sectionLink.href = `#${section}`;
      sectionLink.textContent = `View ${section} →`;
      sectionLink.addEventListener("click", () => setOpen(false));
      message.append(sectionLink);
    }

    messagesElement.append(message);
    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
    return message;
  };

  const setLoading = (loading) => {
    requestInFlight = loading;
    input.disabled = loading;
    sendButton.disabled = loading;
    messagesElement.setAttribute("aria-busy", String(loading));
    status.textContent = loading
      ? "Searching Reid’s portfolio…"
      : "AI answers are grounded in this portfolio.";
  };

  const ask = async (question) => {
    const trimmed = question.trim();
    if (!trimmed || requestInFlight) return;

    addMessage("user", trimmed);
    conversation.push({ role: "user", content: trimmed });
    suggestions.hidden = true;
    input.value = "";
    input.style.height = "";
    setLoading(true);

    const typing = document.createElement("div");
    typing.className =
      "chat-message chat-message--assistant chat-message--typing";
    typing.setAttribute("aria-label", "Portfolio assistant is responding");
    typing.innerHTML = "<span></span><span></span><span></span>";
    messagesElement.append(typing);
    messagesElement.scrollTop = messagesElement.scrollHeight;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation.slice(-8) }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.answer)
        throw new Error(data.error || "Request failed");

      typing.remove();
      addMessage("assistant", data.answer, data.section);
      conversation.push({ role: "assistant", content: data.answer });
    } catch (error) {
      typing.remove();
      // Roll back the unanswered user turn so history stays alternating and
      // the next question doesn't send two consecutive user roles (400).
      if (conversation[conversation.length - 1]?.role === "user") {
        conversation.pop();
      }
      const message =
        error.name === "AbortError"
          ? "That took too long. Please try the question again."
          : "The portfolio assistant is unavailable right now. You can still explore the sections or contact Reid directly.";
      addMessage("assistant", message, "contact");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      if (chatWidget.classList.contains("chat-widget--open")) input.focus();
    }
  };

  launcher.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));
  window.addEventListener("portfolio:open-chat", () => setOpen(true));

  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-question]");
    if (button) ask(button.dataset.question);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = chatWidget.classList.contains("chat-widget--open");
    if (event.key === "Escape" && isOpen) {
      setOpen(false);
      return;
    }

    if (event.key === "Tab" && isOpen) {
      const focusable = [
        ...panel.querySelectorAll(
          "button:not([disabled]), textarea:not([disabled]), a[href]",
        ),
      ].filter((element) => !element.closest("[hidden]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  window.addEventListener(
    "resize",
    () => {
      const isOpen = chatWidget.classList.contains("chat-widget--open");
      document.body.classList.toggle(
        "chat-is-open",
        isOpen && window.innerWidth <= 430,
      );
    },
    { passive: true },
  );
}
