const form = document.getElementById("vacancy-form");
const generateBtn = document.getElementById("generate-btn");
const regenerateBtn = document.getElementById("regenerate-btn");
const copyBtn = document.getElementById("copy-btn");
const copyConfirm = document.getElementById("copy-confirm");
const errorEl = document.getElementById("error");
const resultSection = document.getElementById("result-section");
const resultText = document.getElementById("result-text");

function getFormData() {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function validateRequired(data) {
  const required = { role: "Название роли", tasks: "Задачи", requirements: "Требования" };
  const missing = Object.entries(required)
    .filter(([key]) => !data[key] || !data[key].trim())
    .map(([, label]) => label);
  return missing;
}

async function generate(data, triggerBtn) {
  clearError();
  triggerBtn.disabled = true;
  const originalLabel = triggerBtn.textContent;
  triggerBtn.textContent = "Генерация...";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json();

    if (!response.ok) {
      showError(payload.error || "Не удалось сгенерировать текст.");
      return;
    }

    resultText.value = payload.text;
    resultSection.hidden = false;
  } catch (err) {
    showError("Ошибка сети. Проверьте подключение и попробуйте снова.");
  } finally {
    triggerBtn.disabled = false;
    triggerBtn.textContent = originalLabel;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getFormData();
  const missing = validateRequired(data);
  if (missing.length) {
    showError(`Заполните обязательные поля: ${missing.join(", ")}`);
    return;
  }
  generate(data, generateBtn);
});

regenerateBtn.addEventListener("click", () => {
  const data = getFormData();
  const missing = validateRequired(data);
  if (missing.length) {
    showError(`Заполните обязательные поля: ${missing.join(", ")}`);
    return;
  }
  generate(data, regenerateBtn);
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    copyConfirm.hidden = false;
    setTimeout(() => {
      copyConfirm.hidden = true;
    }, 1500);
  } catch (err) {
    showError("Не удалось скопировать текст.");
  }
});
