"""
One-time script to fix negative quantities in the database
Run this once: python fix_negative_quantities.py
"""

from database.database import SessionLocal, init_db
from models.models import FoodItem

def fix_negative_quantities():
    init_db()
    db = SessionLocal()
    
    try:
        # Find all items with negative or zero quantity
        items = db.query(FoodItem).filter(FoodItem.quantity < 0).all()
        
        if not items:
            print("✅ No items with negative quantities found!")
            return
        
        print(f"Found {len(items)} items with negative quantities:")
        
        for item in items:
            print(f"  - {item.title}: quantity = {item.quantity}")
            item.quantity = 0
            item.is_available = 0
        
        db.commit()
        print(f"\n✅ Fixed {len(items)} items! All quantities set to 0 and marked unavailable.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_negative_quantities()
