import json
import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()


OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY"
)

OPENROUTER_URL = (
    "https://openrouter.ai/api/v1/chat/completions"
)


# =========================================================
# MODEL
# =========================================================

# Router gratuito de OpenRouter.
#
# OpenRouter selecciona un modelo gratuito
# compatible con las capacidades necesarias.
#
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "openrouter/free"
)


# =========================================================
# AI SERVICE
# =========================================================

class AIService:

    # =====================================================
    # HEADERS
    # =====================================================

    def _headers(self) -> dict[str, str]:

        if not OPENROUTER_API_KEY:

            raise RuntimeError(
                "OPENROUTER_API_KEY no está configurada."
            )

        return {
            "Authorization":
                f"Bearer {OPENROUTER_API_KEY}",

            "Content-Type":
                "application/json",

            "HTTP-Referer":
                "http://localhost:4200",

            "X-Title":
                "Collectify"
        }


    # =====================================================
    # NORMALIZE RESPONSE
    # =====================================================

    def _extract_content(
        self,
        data: dict[str, Any]
    ) -> str:

        try:

            content = (
                data
                ["choices"]
                [0]
                ["message"]
                ["content"]
            )

        except (
            KeyError,
            IndexError,
            TypeError
        ) as error:

            raise RuntimeError(
                f"Respuesta inesperada de OpenRouter: {data}"
            ) from error


        if isinstance(content, str):

            return content.strip()


        if isinstance(content, list):

            parts: list[str] = []

            for item in content:

                if isinstance(item, dict):

                    text = item.get(
                        "text"
                    )

                    if text:

                        parts.append(
                            str(text)
                        )

            return "\n".join(parts).strip()


        return str(content).strip()


    # =====================================================
    # GENERIC AI
    # =====================================================

    async def analyze(
        self,
        prompt: str
    ) -> str:

        payload = {

            "model":
                OPENROUTER_MODEL,

            "messages": [

                {
                    "role":
                        "user",

                    "content":
                        prompt
                }

            ],

            "temperature":
                0.2

        }


        async with httpx.AsyncClient(
            timeout=90.0
        ) as client:

            response = await client.post(

                OPENROUTER_URL,

                headers=self._headers(),

                json=payload

            )


        if response.status_code >= 400:

            raise RuntimeError(
                "OpenRouter respondió "
                f"{response.status_code}: "
                f"{response.text}"
            )


        data = response.json()

        return self._extract_content(
            data
        )


    # =====================================================
    # SUPPLIER SEARCH
    # =====================================================

    async def search_suppliers(
        self,
        product: str,
        category: str | None = None,
        location: str | None = None
    ) -> dict[str, Any]:

        category_text = (
            category
            if category
            else "no especificada"
        )

        location_text = (
            location
            if location
            else "México"
        )


        # -------------------------------------------------
        # PROMPT
        # -------------------------------------------------

        prompt = f"""
Eres Collectify AI, un asistente especializado
en ayudar a pequeños negocios a encontrar
proveedores y distribuidores.

Debes buscar proveedores REALES utilizando
la búsqueda web disponible.

PRODUCTO:
{product}

CATEGORÍA:
{category_text}

UBICACIÓN:
{location_text}

OBJETIVO:

Encuentra negocios, distribuidores, mayoristas,
importadores o proveedores que puedan vender
el producto solicitado.

IMPORTANTE:

1. Busca negocios reales.
2. No inventes empresas.
3. No inventes sitios web.
4. Utiliza únicamente información encontrada
   mediante la búsqueda web.
5. Prioriza proveedores de México cuando
   la ubicación sea México.
6. Si encuentras un sitio web oficial,
   proporciona esa URL.
7. Si no puedes verificar un dato,
   utiliza null.
8. No confundas marketplaces con proveedores
   cuando exista un distribuidor especializado.
9. Devuelve máximo 8 resultados.
10. Ordena los resultados por relevancia.

FORMATO OBLIGATORIO:

Devuelve ÚNICAMENTE JSON válido.

No utilices Markdown.

No utilices ```json.

La estructura debe ser exactamente:

{{
  "answer": "Resumen breve de la búsqueda.",
  "results": [
    {{
      "name": "Nombre real del negocio",
      "description": "Descripción breve",
      "category": "Categoría",
      "location": "Ubicación",
      "website": "https://sitio-real.com",
      "rating": 0,
      "relevance": 0,
      "verified": false,
      "tags": [
        "tag1",
        "tag2"
      ]
    }}
  ]
}}

REGLAS PARA LOS CAMPOS:

name:
Nombre real encontrado.

description:
Descripción basada en la información encontrada.

category:
Tipo de proveedor o categoría.

location:
Ciudad y país si están disponibles.

website:
URL real encontrada.
Si no existe o no puede verificarse:
null.

rating:
Usa una valoración solamente si existe
una valoración pública fiable.
Si no existe:
0.

relevance:
Número entre 0 y 100 indicando qué tan
relevante es el proveedor para el producto.

verified:
true solamente si existe suficiente evidencia
para considerar que el negocio es real y la
información fue encontrada en una fuente fiable.
De lo contrario false.

tags:
Entre 1 y 5 etiquetas relevantes.

Si no encuentras proveedores adecuados,
devuelve:

{{
  "answer": "No encontré proveedores suficientemente relevantes para esta búsqueda.",
  "results": []
}}
"""


        # -------------------------------------------------
        # REQUEST
        # -------------------------------------------------

        payload = {

            "model":
                OPENROUTER_MODEL,

            "messages": [

                {
                    "role":
                        "system",

                    "content":
                        (
                            "Eres Collectify AI. "
                            "Debes realizar búsquedas "
                            "web y devolver información "
                            "estructurada y verificable."
                        )
                },

                {
                    "role":
                        "user",

                    "content":
                        prompt
                }

            ],

            # ------------------------------------------------
            # WEB SEARCH
            # ------------------------------------------------

            "plugins": [

                {
                    "id":
                        "web",

                    "max_results":
                        8,

                    "search_prompt":
                        (
                            "Busca proveedores, "
                            "distribuidores y mayoristas "
                            "reales relacionados con "
                            "el producto solicitado. "
                            "Prioriza México y fuentes "
                            "oficiales o comerciales."
                        )
                }

            ],

            "temperature":
                0.1

        }


        # -------------------------------------------------
        # OPENROUTER
        # -------------------------------------------------

        try:

            async with httpx.AsyncClient(
                timeout=120.0
            ) as client:

                response = await client.post(

                    OPENROUTER_URL,

                    headers=self._headers(),

                    json=payload

                )

        except httpx.TimeoutException as error:

            raise RuntimeError(
                "OpenRouter tardó demasiado "
                "en responder."
            ) from error

        except httpx.RequestError as error:

            raise RuntimeError(
                f"No se pudo conectar con OpenRouter: {error}"
            ) from error


        # -------------------------------------------------
        # HTTP ERROR
        # -------------------------------------------------

        if response.status_code >= 400:

            raise RuntimeError(
                "OpenRouter respondió "
                f"{response.status_code}: "
                f"{response.text}"
            )


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        try:

            data = response.json()

        except ValueError as error:

            raise RuntimeError(
                "OpenRouter devolvió una respuesta "
                "que no es JSON."
            ) from error


        content = self._extract_content(
            data
        )


        # -------------------------------------------------
        # PARSE AI JSON
        # -------------------------------------------------

        parsed = self._parse_json(
            content
        )


        # -------------------------------------------------
        # NORMALIZE
        # -------------------------------------------------

        results = parsed.get(
            "results",
            []
        )

        if not isinstance(
            results,
            list
        ):

            results = []


        normalized_results = []


        for item in results:

            if not isinstance(
                item,
                dict
            ):

                continue


            name = str(
                item.get(
                    "name",
                    ""
                )
            ).strip()


            if not name:

                continue


            tags = item.get(
                "tags",
                []
            )


            if not isinstance(
                tags,
                list
            ):

                tags = []


            normalized_results.append({

                "name":
                    name,

                "description":
                    str(
                        item.get(
                            "description",
                            ""
                        )
                    ),

                "category":
                    str(
                        item.get(
                            "category",
                            category_text
                        )
                    ),

                "location":
                    str(
                        item.get(
                            "location",
                            location_text
                        )
                    ),

                "website":
                    item.get(
                        "website"
                    ),

                "rating":
                    self._safe_number(
                        item.get(
                            "rating",
                            0
                        )
                    ),

                "relevance":
                    self._safe_number(
                        item.get(
                            "relevance",
                            0
                        )
                    ),

                "verified":
                    bool(
                        item.get(
                            "verified",
                            False
                        )
                    ),

                "tags":
                    [
                        str(tag)
                        for tag in tags
                    ]

            })


        # -------------------------------------------------
        # ANSWER
        # -------------------------------------------------

        answer = str(
            parsed.get(
                "answer",
                ""
            )
        ).strip()


        if not answer:

            if normalized_results:

                answer = (
                    f"Encontré "
                    f"{len(normalized_results)} "
                    f"proveedores relacionados con "
                    f"{product}."
                )

            else:

                answer = (
                    "No encontré proveedores "
                    "suficientemente relevantes "
                    "para esta búsqueda."
                )


        return {

            "answer":
                answer,

            "results":
                normalized_results

        }


    # =====================================================
    # PARSE JSON
    # =====================================================

    def _parse_json(
        self,
        content: str
    ) -> dict[str, Any]:

        text = content.strip()


        # -------------------------------------------------
        # DIRECT JSON
        # -------------------------------------------------

        try:

            parsed = json.loads(
                text
            )

            if isinstance(
                parsed,
                dict
            ):

                return parsed

        except json.JSONDecodeError:

            pass


        # -------------------------------------------------
        # REMOVE MARKDOWN
        # -------------------------------------------------

        text = re.sub(
            r"```json\s*",
            "",
            text,
            flags=re.IGNORECASE
        )

        text = re.sub(
            r"```\s*",
            "",
            text
        ).strip()


        # -------------------------------------------------
        # SECOND ATTEMPT
        # -------------------------------------------------

        try:

            parsed = json.loads(
                text
            )

            if isinstance(
                parsed,
                dict
            ):

                return parsed

        except json.JSONDecodeError:

            pass


        # -------------------------------------------------
        # FIND JSON OBJECT
        # -------------------------------------------------

        start = text.find(
            "{"
        )

        end = text.rfind(
            "}"
        )


        if (
            start >= 0 and
            end > start
        ):

            possible_json = text[
                start:end + 1
            ]

            try:

                parsed = json.loads(
                    possible_json
                )

                if isinstance(
                    parsed,
                    dict
                ):

                    return parsed

            except json.JSONDecodeError:

                pass


        # -------------------------------------------------
        # FALLBACK
        # -------------------------------------------------

        return {

            "answer":
                content,

            "results":
                []

        }


    # =====================================================
    # SAFE NUMBER
    # =====================================================

    def _safe_number(
        self,
        value: Any
    ) -> float:

        try:

            number = float(
                value
            )

            return number

        except (
            ValueError,
            TypeError
        ):

            return 0


    # =====================================================
    # EXISTING PROMPT
    # =====================================================

    def build_prompt(
        self,
        question: str,
        products: list[dict[str, Any]],
        sales: list[dict[str, Any]]
    ) -> str:

        return f"""
Eres Collectify AI.

Analiza los datos del inventario y las ventas
del negocio.

PREGUNTA:

{question}

PRODUCTOS:

{json.dumps(
    products,
    ensure_ascii=False,
    indent=2
)}

VENTAS:

{json.dumps(
    sales,
    ensure_ascii=False,
    indent=2
)}

Proporciona un análisis claro,
útil y orientado al negocio.
"""


# =========================================================
# INSTANCE
# =========================================================

ai_service = AIService()
