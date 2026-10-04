from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from app.supabase import supabase


def read_all_rows(table_name: str, columns: str):
    rows = []
    offset = 0
    while True:
        response = supabase.table(table_name).select(columns).order("id").range(offset, offset + 499).execute()
        page = response.data or []
        if not page:
            break
        rows.extend(page)
        offset += len(page)
    return rows


def to_decimal(value):
    return Decimal(str(value)) if value is not None else Decimal("0")


def money(value):
    return float(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def build_earnings():
    """Agrupa por socio y estima costos con products.cost actual."""
    sales = read_all_rows("sales", "id, partner_id, total, created_at")
    items = read_all_rows("sale_items", "id, sale_id, owner_id, quantity, unit_price, subtotal, product_id")
    partners = read_all_rows("partners", "id, name, email, is_active")
    products = read_all_rows("products", "id, cost")
    sale_map = {str(s["id"]): s for s in sales}
    costs = {str(p["id"]): to_decimal(p["cost"]) if p.get("cost") is not None else None for p in products}
    groups = {}

    def group_for(partner_id):
        key = str(partner_id) if partner_id is not None else None
        if key not in groups:
            groups[key] = {"sales": Decimal("0"), "cost": Decimal("0"), "products_sold": 0, "transactions": set()}
        return groups[key]

    for partner in partners:
        group_for(partner["id"])
    details = {}
    for item in items:
        sid = str(item["sale_id"])
        if sid not in sale_map:
            raise HTTPException(status_code=409, detail=f"Existe un detalle de venta sin una venta consultable: {sid}.")
        details.setdefault(sid, []).append(item)
    total_sales = Decimal("0")
    total_cost = Decimal("0")
    total_quantity = 0
    for sale in sales:
        sid = str(sale["id"])
        amount = to_decimal(sale.get("total"))
        partner_id = sale.get("partner_id")
        sale_items = details.get(sid, [])
        if not sale_items:
            raise HTTPException(status_code=409, detail=f"La venta {sid} no tiene detalles. Completa o corrige esa venta antes de calcular las ganancias.")
        total_sales += amount
        detail_total = Decimal("0")
        legacy_partners = set()
        if partner_id is not None:
            group = group_for(partner_id)
            group["sales"] += amount
            group["transactions"].add(sid)
        for item in sale_items:
            quantity = int(item.get("quantity") or 0)
            subtotal = to_decimal(item.get("subtotal"))
            pid = str(item.get("product_id"))
            unit_cost = costs.get(pid)
            if unit_cost is None:
                raise HTTPException(status_code=409, detail=f"No hay un costo disponible para el producto {pid} de la venta {sid}.")
            item_cost = unit_cost * quantity
            detail_total += subtotal
            total_cost += item_cost
            total_quantity += quantity
            owner = partner_id if partner_id is not None else item.get("owner_id")
            group = group_for(owner)
            group["cost"] += item_cost
            group["products_sold"] += quantity
            group["transactions"].add(sid)
            if partner_id is None:
                group["sales"] += subtotal
                legacy_partners.add(str(owner) if owner is not None else None)
        if partner_id is None and amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) != detail_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP):
            if len(legacy_partners) == 1:
                group_for(next(iter(legacy_partners)))["sales"] += amount - detail_total
            else:
                raise HTTPException(status_code=409, detail=f"La venta {sid} no tiene partner_id y su total difiere de sus detalles. No se puede distribuir entre socios.")
    partner_map = {str(p["id"]): p for p in partners}
    result = []
    for partner_id, group in groups.items():
        partner = partner_map.get(partner_id)
        result.append({
            "partner_id": partner_id,
            "partner_name": partner["name"] if partner else ("Sin socio" if partner_id is None else "Socio no disponible"),
            "email": partner.get("email") if partner else None,
            "is_active": partner.get("is_active", True) if partner else False,
            "products_sold": group["products_sold"],
            "sales": money(group["sales"]), "cost": money(group["cost"]),
            "profit": money(group["sales"] - group["cost"]),
            "total_transactions": len(group["transactions"]),
        })
    result.sort(key=lambda p: p["partner_name"].casefold())
    return {
        "summary": {"total_sales": money(total_sales), "total_cost": money(total_cost), "total_profit": money(total_sales - total_cost), "total_transactions": len(sales), "total_items_sold": total_quantity},
        "partners": result,
        "calculation": {"cost_basis": "current_product_cost", "is_estimate": True, "partner_basis": "sales.partner_id", "legacy_partner_fallback": "sale_items.owner_id"},
    }
