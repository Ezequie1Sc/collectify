import os
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv()


class AIService:

    def __init__(self):

        self.api_key = os.getenv("OPENROUTER_API_KEY")

        self.model = os.getenv(
            "OPENROUTER_MODEL",
            "google/gemma-3-12b-it"
        )

        self.url = "https://openrouter.ai/api/v1/chat/completions"


    # =========================================================
    # BUILD PROMPT
    # =========================================================

    def build_prompt(
        self,
        question: str,
        products: list[dict[str, Any]],
        sales: list[dict[str, Any]]
    ) -> str:

        products_text = "\n".join(

            f"- Nombre: {product.get('name')}\n"
            f"  Categoría: {product.get('category')}\n"
            f"  Precio: ${product.get('price')}\n"
            f"  Costo: ${product.get('cost')}\n"
            f"  Stock: {product.get('stock')}\n"

            for product in products

        )


        sales_text = "\n".join(

            f"- Producto: {sale.get('product_name')}\n"
            f"  Cantidad vendida: {sale.get('quantity')}\n"
            f"  Precio unitario: ${sale.get('unit_price')}\n"
            f"  Subtotal: ${sale.get('subtotal')}\n"

            for sale in sales

        )


        return f"""
Eres Collectify AI, un asistente especializado
en análisis de inventario y ventas.

Analiza únicamente la información proporcionada
por Collectify.

PRODUCTOS:

{products_text}


VENTAS:

{sales_text}


PREGUNTA DEL USUARIO:

{question}


INSTRUCCIONES:

1. Analiza los datos disponibles.
2. Identifica patrones relevantes.
3. Da una respuesta concreta.
4. Si detectas un problema de inventario,
   explícalo.
5. Si puedes hacer una recomendación,
   hazla.
6. No inventes datos que no estén disponibles.
7. Responde en español.
8. Sé claro y breve.


RESPUESTA:
"""


    # =========================================================
    # ANALYZE
    # =========================================================

    async def analyze(
        self,
        prompt: str
    ) -> str:

        if not self.api_key:

            raise RuntimeError(
                "Falta OPENROUTER_API_KEY en el archivo .env"
            )


        headers = {

            "Authorization":
                f"Bearer {self.api_key}",

            "Content-Type":
                "application/json",

            "HTTP-Referer":
                "http://localhost:4200",

            "X-Title":
                "Collectify"

        }


        payload = {

            "model": self.model,

            "messages": [

                {
                    "role": "system",
                    "content":
                        "Eres Collectify AI, "
                        "un asistente experto "
                        "en inventario y ventas."
                },

                {
                    "role": "user",
                    "content": prompt
                }

            ],

            "temperature": 0.2,

            "max_tokens": 500

        }


        async with httpx.AsyncClient(
            timeout=60.0
        ) as client:

            response = await client.post(

                self.url,

                headers=headers,

                json=payload

            )


        if response.status_code != 200:

            raise RuntimeError(

                f"OpenRouter respondió "
                f"{response.status_code}: "
                f"{response.text}"

            )


        data = response.json()


        try:

            return (
                data["choices"][0]
                ["message"]["content"]
                .strip()
            )

        except (
            KeyError,
            IndexError,
            TypeError
        ) as error:

            raise RuntimeError(

                f"Respuesta inesperada de "
                f"OpenRouter: {data}"

            ) from error


# =========================================================
# SERVICE INSTANCE
# =========================================================

ai_service = AIService()