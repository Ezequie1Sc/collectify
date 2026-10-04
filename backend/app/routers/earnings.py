from fastapi import APIRouter, HTTPException
from app.services.earnings_service import build_earnings

router = APIRouter(prefix="/earnings", tags=["Earnings"])

@router.get("")
def get_earnings():
    try:
        return build_earnings()
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron calcular las ganancias: {error}") from error

@router.get("/partners")
def get_partner_earnings():
    try:
        earnings = build_earnings()
        return {
            "data": [{
                "partner": {"id": p["partner_id"], "name": p["partner_name"], "email": p["email"], "is_active": p["is_active"]},
                "summary": {"products_sold": p["products_sold"], "sales": p["sales"], "cost": p["cost"], "profit": p["profit"], "total_transactions": p["total_transactions"]},
            } for p in earnings["partners"]],
            "calculation": earnings["calculation"],
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron obtener las ganancias por socio: {error}") from error
