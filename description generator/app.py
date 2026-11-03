import os
import sys

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

from prompts import build_prompt

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "openai/gpt-5-mini")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.proxyapi.ru/v1")

if not OPENAI_API_KEY:
    sys.exit(
        "OPENAI_API_KEY не задан. Скопируйте .env.example в .env "
        "и укажите свой ключ ProxyAPI."
    )

from openai import OpenAI  # noqa: E402

client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

app = Flask(__name__)

REQUIRED_FIELDS = ["role", "tasks", "requirements"]
VALID_PLATFORMS = {"hh", "telegram", "website"}
VALID_STYLES = {"business", "neutral", "friendly"}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}

    missing = [field for field in REQUIRED_FIELDS if not str(data.get(field, "")).strip()]
    if missing:
        return jsonify({"error": f"Заполните обязательные поля: {', '.join(missing)}"}), 400

    platform = data.get("platform", "hh")
    if platform not in VALID_PLATFORMS:
        return jsonify({"error": "Неизвестная площадка публикации"}), 400

    text_style = data.get("text_style", "neutral")
    if text_style not in VALID_STYLES:
        return jsonify({"error": "Неизвестный стиль текста"}), 400

    system_prompt, user_prompt = build_prompt(data)

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            max_completion_tokens=1500,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        generated_text = response.choices[0].message.content.strip()
    except Exception as exc:
        return jsonify({"error": f"Не удалось сгенерировать текст: {exc}"}), 502

    return jsonify({"text": generated_text})


if __name__ == "__main__":
    app.run(debug=True)
