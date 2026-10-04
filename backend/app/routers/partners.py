from fastapi import APIRouter, HTTPException
from app.models import PartnerCreate, PartnerUpdate
from app.supabase import supabase

router = APIRouter(prefix="/partners", tags=["Partners"])

@router.get("")
def get_all_partners():
    try:
        response = (supabase.table("partners").select("*").eq("is_active", True).order("name").execute())
        return {"data": response.data or []}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron cargar los socios: {error}") from error

@router.post("")
def create_partner(partner: PartnerCreate):
    data = partner.model_dump(mode="json")
    data["is_active"] = True
    try:
        response = supabase.table("partners").insert(data).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo crear el socio: {error}") from error
    if not response.data:
        raise HTTPException(status_code=500, detail="No se pudo crear el socio.")
    return {"data": response.data[0]}

@router.patch("/{partner_id}")
def update_partner(partner_id: str, partner: PartnerUpdate):
    data = partner.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar.")
    try:
        response = supabase.table("partners").update(data).eq("id", partner_id).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo actualizar el socio: {error}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Socio no encontrado.")
    return {"data": response.data[0]}

@router.delete("/{partner_id}")
def delete_partner(partner_id: str):
    try:
        response = supabase.table("partners").select("*").eq("id", partner_id).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo consultar el socio: {error}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Socio no encontrado.")
    record = response.data[0]
    if not record.get("is_active", True):
        raise HTTPException(status_code=400, detail="El socio ya está inactivo.")
    try:
        related_response = supabase.table("products").select("id").eq("owner_id", partner_id).limit(1).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron comprobar las asociaciones del socio: {error}") from error
    has_related = bool(related_response.data)
    try:
        if has_related:
            response = supabase.table("partners").update({"is_active": False}).eq("id", partner_id).execute()
        else:
            response = supabase.table("partners").delete().eq("id", partner_id).execute()
    except Exception as error:
        action = "desactivar" if has_related else "eliminar"
        raise HTTPException(status_code=500, detail=f"No se pudo {action} el socio: {error}") from error
    if not response.data:
        raise HTTPException(status_code=500, detail="No se pudo completar la operación del socio.")
    return {
        "message": "El socio tiene productos asociados y fue desactivado." if has_related else "Socio eliminado correctamente.",
        "deleted": not has_related,
        "deactivated": has_related,
        "data": response.data[0],
    }
