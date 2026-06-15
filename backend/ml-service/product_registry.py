PRODUCT_REGISTRY = {
    "bose qc headphones": {
        "gtin": "00819264023910",
        "brand": "Bose Corporation",
        "ledger_hash": "0x8f3b2a91c4e7d0f1a2b3c4d5e6f70819264023910",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    },
    "essentials cotton hoodie": {
        "gtin": "00819264055221",
        "brand": "Essentials",
        "ledger_hash": "0x4a91c2d8e7f0b3a1926405522100abcdef12345678",
        "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
    },
    "black leather jacket": {
        "gtin": "00819264088945",
        "brand": "Urban Essentials",
        "ledger_hash": "0xjacket88945leather9876543210fedcba987654",
        "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        "product_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    },
    "iphone 14 pro max": {
        "gtin": "01942534023910",
        "brand": "Apple Inc.",
        "ledger_hash": "0xapple14promax01942534023910fedcba9876543210",
        "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    },
    "essentials denim jeans": {
        "gtin": "00819264077834",
        "brand": "Essentials",
        "ledger_hash": "0xjeans77834secondlife9876543210abcdef12",
        "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
    },
}


_KEYWORD_MAP = [
    (("bose", "headphone", "qc"), "bose qc headphones"),
    (("hoodie", "cotton"), "essentials cotton hoodie"),
    (("jacket", "leather", "black"), "black leather jacket"),
    (("iphone", "smartphone", "pro max"), "iphone 14 pro max"),
    (("jeans", "denim"), "essentials denim jeans"),
]


def lookup_product(product_id: str) -> dict:
    key = (product_id or "").lower().strip()
    for name, meta in PRODUCT_REGISTRY.items():
        if name in key or key in name:
            return {"product_name": name.title(), **meta}
    for keywords, registry_key in _KEYWORD_MAP:
        if any(kw in key for kw in keywords):
            meta = PRODUCT_REGISTRY[registry_key]
            return {"product_name": registry_key.title(), **meta}
    return {
        "product_name": product_id,
        "gtin": "00819264000000",
        "brand": "SecondLife Partner",
        "ledger_hash": "0xsecondlife00000000000000000000000000000001",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    }
