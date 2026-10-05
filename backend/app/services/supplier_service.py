import os
from typing import Any

from dotenv import load_dotenv
from tavily import TavilyClient


load_dotenv()


class SupplierService:

    def __init__(self):

        self.api_key = os.getenv("TAVILY_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "Falta TAVILY_API_KEY en las variables de entorno."
            )

        self.client = TavilyClient(
            api_key=self.api_key
        )


    async def search_suppliers(
        self,
        product: str,
        category: str | None = None,
        location: str | None = None
    ) -> dict[str, Any]:

        product = product.strip()

        if not product:
            raise ValueError(
                "El producto es obligatorio."
            )


        # =====================================================
        # CONSTRUIR CONSULTA
        # =====================================================

        query_parts = [
            product,
            "proveedor",
            "mayoreo",
            "distribuidor"
        ]


        if category:
            query_parts.append(category)


        if location:
            query_parts.append(location)


        query = " ".join(query_parts)


        # =====================================================
        # BÚSQUEDA WEB
        # =====================================================

        response = self.client.search(
            query=query,
            topic="general",
            search_depth="advanced",
            max_results=8,
            include_answer=True
        )


        results = []


        for item in response.get("results", []):

            results.append({

                "title":
                    item.get("title"),

                "url":
                    item.get("url"),

                "content":
                    item.get("content"),

                "score":
                    item.get("score"),

                "source":
                    item.get("url", "").split("/")[2]
                    if item.get("url")
                    else None

            })


        return {

            "product": product,

            "category": category,

            "location": location,

            "query": query,

            "total_results": len(results),

            "answer":
                response.get("answer"),

            "results": results

        }


supplier_service = SupplierService()