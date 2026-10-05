from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query


router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


NOMINATIM_URL = (
    "https://nominatim.openstreetmap.org/search"
)


# =========================================================
# SEARCH SUPPLIERS / BUSINESSES
# =========================================================

@router.get("/search")
async def search_suppliers(
    q: str = Query(
        ...,
        min_length=2,
        max_length=100,
        description="Producto o tipo de negocio que se desea buscar"
    ),
    location: str = Query(
        "Campeche, Mexico",
        min_length=2,
        max_length=100,
        description="Ubicación donde buscar"
    ),
) -> dict[str, Any]:

    query = f"{q}, {location}"

    params = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": 1,
        "extratags": 1,
        "namedetails": 1,
        "limit": 10,
        "countrycodes": "mx",
        "layer": "poi",
        "accept-language": "es",
    }

    headers = {
        "User-Agent": (
            "Collectify/1.0 "
            "(Hacktoberfest 2026 project)"
        ),
        "Accept": "application/json",
    }

    try:

        async with httpx.AsyncClient(
            timeout=15.0,
            headers=headers
        ) as client:

            response = await client.get(
                NOMINATIM_URL,
                params=params
            )

    except httpx.RequestError as error:

        raise HTTPException(
            status_code=503,
            detail=(
                "No fue posible consultar el "
                "servicio de búsqueda."
            )
        ) from error

    if response.status_code != 200:

        raise HTTPException(
            status_code=502,
            detail=(
                "El servicio de búsqueda "
                "respondió con un error."
            )
        )

    try:

        data = response.json()

    except ValueError as error:

        raise HTTPException(
            status_code=502,
            detail="Respuesta inválida del servicio de búsqueda."
        ) from error


    suppliers = []

    for place in data:

        address = place.get(
            "address",
            {}
        )

        extratags = place.get(
            "extratags",
            {}
        )

        name = (
            place.get("name")
            or place.get("display_name", "").split(",")[0]
            or "Negocio sin nombre"
        )

        latitude = place.get("lat")
        longitude = place.get("lon")

        google_maps_url = None

        if latitude and longitude:

            google_maps_url = (
                "https://www.google.com/maps/search/?api=1"
                f"&query={latitude},{longitude}"
            )

        suppliers.append({

            "id": (
                f"{place.get('osm_type', '')}"
                f"{place.get('osm_id', '')}"
            ),

            "name": name,

            "display_name": place.get(
                "display_name"
            ),

            "category": place.get(
                "category"
            ),

            "type": place.get(
                "type"
            ),

            "address": (
                place.get("display_name")
                or ""
            ),

            "city": (
                address.get("city")
                or address.get("town")
                or address.get("municipality")
                or address.get("village")
            ),

            "state": (
                address.get("state")
            ),

            "country": (
                address.get("country")
            ),

            "postcode": (
                address.get("postcode")
            ),

            "latitude": latitude,

            "longitude": longitude,

            "phone": (
                extratags.get("phone")
                or extratags.get("contact:phone")
            ),

            "website": (
                extratags.get("website")
                or extratags.get("contact:website")
            ),

            "opening_hours": (
                extratags.get("opening_hours")
            ),

            "google_maps_url": google_maps_url,

            "osm_url": (
                "https://www.openstreetmap.org/"
                f"{place.get('osm_type', '').lower()}/"
                f"{place.get('osm_id', '')}"
            ),
        })


    return {

        "query": q,

        "location": location,

        "count": len(suppliers),

        "data": suppliers,

        "source": "OpenStreetMap / Nominatim",

        "attribution": (
            "Data © OpenStreetMap contributors"
        ),

    }