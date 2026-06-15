"""
SecondLife Commerce — QR Code & NFC Tag Generator
=================================================
Generates physical product identifiers for Digital Product Passports:
- QR codes (printable on packaging)
- NFC data URLs (for tag programming)
- Deep links to DPP pages
"""

import qrcode
import io
import base64
import json
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

class QRNFCGenerator:
    """
    Generate QR codes and NFC URLs for product traceability.
    """
    
    def __init__(self, base_url: str = "https://secondlife.amazon.com"):
        self.base_url = base_url
    
    def generate_dpp_qr_code(
        self, 
        listing_id: str, 
        format: str = "png",
        size: int = 300,
        include_logo: bool = False
    ) -> Dict[str, Any]:
        """
        Generate QR code linking to Digital Product Passport.
        
        Args:
            listing_id: Unique listing identifier
            format: "png" | "svg" | "base64"
            size: QR code size in pixels
            include_logo: Add Amazon/SecondLife logo in center
        
        Returns:
            {
                "qr_code_data": str (base64 or file path),
                "dpp_url": str,
                "format": str,
                "size": int
            }
        """
        # Construct DPP URL
        dpp_url = f"{self.base_url}/dpp/{listing_id}"
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,  # Auto-adjust size
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction (allows logo)
            box_size=10,
            border=4,
        )
        
        qr.add_data(dpp_url)
        qr.make(fit=True)
        
        # Generate image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Resize to requested size
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Optionally add logo in center
        if include_logo:
            img = self._add_logo_to_qr(img)
        
        # Convert to requested format
        if format == "base64":
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            qr_data = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
        elif format == "svg":
            # Generate SVG QR code
            import qrcode.image.svg
            factory = qrcode.image.svg.SvgPathImage
            qr_svg = qrcode.QRCode(image_factory=factory)
            qr_svg.add_data(dpp_url)
            qr_svg.make(fit=True)
            
            svg_buffer = io.BytesIO()
            qr_svg.make_image().save(svg_buffer)
            qr_data = svg_buffer.getvalue().decode()
        else:  # png
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            qr_data = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "qr_code_data": qr_data,
            "dpp_url": dpp_url,
            "format": format,
            "size": size,
            "listing_id": listing_id
        }
    
    def generate_nfc_data_url(self, listing_id: str) -> Dict[str, Any]:
        """
        Generate NFC Data URL for tag programming.
        
        NFC tags can store URLs that open when tapped with smartphones.
        This follows NFC Forum Type 2 Tag specification.
        
        Returns:
            {
                "nfc_url": str (URL to write to NFC tag),
                "ndef_record": dict (NFC Data Exchange Format),
                "tag_capacity_required": int (bytes),
                "compatible_tag_types": List[str]
            }
        """
        dpp_url = f"{self.base_url}/dpp/{listing_id}"
        
        # Calculate required NFC tag capacity
        # NFC Type 2 tags: typically 48-888 bytes
        url_bytes = len(dpp_url.encode('utf-8'))
        header_bytes = 7  # NFC NDEF header
        total_bytes = url_bytes + header_bytes
        
        # Determine compatible tag types
        compatible_tags = []
        if total_bytes <= 48:
            compatible_tags.append("NTAG210")  # 48 bytes
        if total_bytes <= 144:
            compatible_tags.append("NTAG213")  # 144 bytes
        if total_bytes <= 504:
            compatible_tags.append("NTAG215")  # 504 bytes
        if total_bytes <= 888:
            compatible_tags.append("NTAG216")  # 888 bytes
        
        # NDEF (NFC Data Exchange Format) record structure
        ndef_record = {
            "record_type": "URI",
            "uri": dpp_url,
            "encoding": "UTF-8",
            "tnf": "0x01",  # TNF = Well-known type
            "type": "U",     # URI record
            "id": "",
            "payload": dpp_url
        }
        
        return {
            "nfc_url": dpp_url,
            "ndef_record": ndef_record,
            "tag_capacity_required": total_bytes,
            "compatible_tag_types": compatible_tags,
            "programming_instructions": self._get_nfc_programming_guide()
        }
    
    def generate_package_label(
        self,
        listing_id: str,
        product_name: str,
        condition_grade: str,
        price: float,
        qr_size: int = 200
    ) -> str:
        """
        Generate complete printable package label with QR code.
        
        Returns: base64 encoded PNG image
        """
        # Create label image (4x6 inch shipping label at 300 DPI)
        width, height = 1200, 1800
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to load font (fallback to default if not available)
        try:
            title_font = ImageFont.truetype("arial.ttf", 60)
            body_font = ImageFont.truetype("arial.ttf", 40)
            small_font = ImageFont.truetype("arial.ttf", 30)
        except:
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Header
        draw.rectangle([(0, 0), (width, 150)], fill='#232F3E')  # Amazon dark blue
        draw.text((50, 50), "SecondLife Commerce", fill='white', font=title_font)
        
        # Product info
        y_offset = 200
        draw.text((50, y_offset), product_name[:40], fill='black', font=body_font)
        y_offset += 80
        
        # Condition badge
        badge_color = {
            'A': '#00A651',  # Green
            'B': '#FFA500',  # Orange
            'C': '#FF6B6B',  # Red
            'D': '#888888'   # Gray
        }.get(condition_grade, '#888888')
        
        draw.rectangle([(50, y_offset), (300, y_offset + 70)], fill=badge_color)
        draw.text((60, y_offset + 10), f"Grade {condition_grade}", fill='white', font=body_font)
        
        # Price
        draw.text((350, y_offset + 10), f"₹{int(price)}", fill='black', font=body_font)
        y_offset += 120
        
        # Generate and embed QR code
        qr_result = self.generate_dpp_qr_code(listing_id, format="png", size=qr_size)
        qr_data = base64.b64decode(qr_result["qr_code_data"])
        qr_img = Image.open(io.BytesIO(qr_data))
        
        # Center QR code
        qr_x = (width - qr_size) // 2
        img.paste(qr_img, (qr_x, y_offset))
        y_offset += qr_size + 50
        
        # QR code instructions
        instruction = "Scan for Product History & Authenticity"
        draw.text((width//2 - 300, y_offset), instruction, fill='black', font=body_font)
        y_offset += 80
        
        # Listing ID and URL
        dpp_url = f"{self.base_url}/dpp/{listing_id}"
        draw.text((50, y_offset), f"Listing: {listing_id}", fill='#666666', font=small_font)
        y_offset += 50
        draw.text((50, y_offset), dpp_url, fill='#666666', font=small_font)
        
        # Footer
        y_offset = height - 150
        draw.rectangle([(0, y_offset), (width, height)], fill='#EEEEEE')
        draw.text(
            (50, y_offset + 40),
            "Certified Authentic • AI-Verified Condition • Carbon Neutral",
            fill='#666666',
            font=small_font
        )
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    
    def _add_logo_to_qr(self, qr_image: Image.Image) -> Image.Image:
        """
        Add small logo in center of QR code.
        QR codes have error correction, so small center area can be obscured.
        """
        # Create simple logo (would use actual logo file in production)
        logo_size = qr_image.size[0] // 5
        logo = Image.new('RGB', (logo_size, logo_size), color='#FF9900')  # Amazon orange
        draw = ImageDraw.Draw(logo)
        
        # Draw simple 'S' for SecondLife
        try:
            font = ImageFont.truetype("arial.ttf", logo_size // 2)
        except:
            font = ImageFont.load_default()
        
        draw.text((logo_size//4, logo_size//4), "S", fill='white', font=font)
        
        # Add white border
        bordered_logo = Image.new('RGB', (logo_size + 20, logo_size + 20), color='white')
        bordered_logo.paste(logo, (10, 10))
        
        # Paste onto QR code
        qr_copy = qr_image.copy()
        logo_pos = ((qr_image.size[0] - bordered_logo.size[0]) // 2,
                    (qr_image.size[1] - bordered_logo.size[1]) // 2)
        qr_copy.paste(bordered_logo, logo_pos)
        
        return qr_copy
    
    def _get_nfc_programming_guide(self) -> Dict[str, Any]:
        """
        Return step-by-step NFC tag programming instructions.
        """
        return {
            "hardware_required": [
                "NFC-enabled smartphone (iPhone XS+ or Android with NFC)",
                "NFC Type 2 tags (NTAG213/215/216 recommended)",
                "NFC programming app (NFC Tools, TagWriter, or similar)"
            ],
            "steps": [
                "1. Open NFC programming app on smartphone",
                "2. Select 'Write' mode",
                "3. Choose 'Add a record' → 'URL/URI'",
                "4. Paste the DPP URL provided",
                "5. Tap 'Write' and hold phone near NFC tag",
                "6. Wait for confirmation beep/vibration",
                "7. Test by tapping tag with phone (should open DPP page)"
            ],
            "best_practices": [
                "Use NTAG213 or higher for durability",
                "Enable 'Lock tag' after writing to prevent tampering",
                "Place tag on non-metallic surface for best performance",
                "Test tag before applying to product packaging"
            ],
            "troubleshooting": {
                "tag_not_detected": "Ensure phone NFC is enabled in settings",
                "write_failed": "Tag may be locked or damaged - try new tag",
                "url_too_long": "Use shorter listing ID or URL shortener"
            }
        }


if __name__ == "__main__":
    generator = QRNFCGenerator(base_url="https://secondlife.amazon.com")
    
    # Test Case 1: Generate QR code
    print("=== Test 1: QR Code Generation ===")
    qr_result = generator.generate_dpp_qr_code("LST-001", format="base64", size=300)
    print(f"DPP URL: {qr_result['dpp_url']}")
    print(f"QR Data Length: {len(qr_result['qr_code_data'])} chars")
    print(f"Format: {qr_result['format']}")
    
    # Test Case 2: NFC data
    print("\n=== Test 2: NFC Data URL ===")
    nfc_result = generator.generate_nfc_data_url("LST-001")
    print(f"NFC URL: {nfc_result['nfc_url']}")
    print(f"Tag Capacity Required: {nfc_result['tag_capacity_required']} bytes")
    print(f"Compatible Tags: {', '.join(nfc_result['compatible_tag_types'])}")
    
    # Test Case 3: Package label
    print("\n=== Test 3: Package Label Generation ===")
    label = generator.generate_package_label(
        listing_id="LST-001",
        product_name="Bose QuietComfort Headphones",
        condition_grade="B",
        price=5999
    )
    print(f"Label Generated: {len(label)} chars (base64 PNG)")
    print("Label includes: Product name, condition badge, price, QR code, instructions")
