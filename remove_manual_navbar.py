#!/usr/bin/env python3
import os
import re
import glob

def remove_manual_navbar_from_file(file_path):
    """Remove manual Navbar and TopBar imports and usage from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove Navbar and TopBar imports
        content = re.sub(r'import Navbar from "@/components/Navbar";\n?', '', content)
        content = re.sub(r'import { TopBar } from "@/components/TopBar";\n?', '', content)
        content = re.sub(r'import TopBar from "@/components/TopBar";\n?', '', content)
        
        # Remove isCollapsed and setIsCollapsed from interface
        content = re.sub(r'interface \w+Props \{\s*isCollapsed: boolean;\s*setIsCollapsed: \(value: boolean\) => void;\s*\}', '', content)
        
        # Remove props from function parameters
        content = re.sub(r'\(\{ isCollapsed, setIsCollapsed \}: \w+Props\)', '()', content)
        content = re.sub(r'\(\{ isCollapsed, setIsCollapsed \}\)', '()', content)
        
        # Remove manual layout wrapper
        # Pattern: <div className="min-h-screen bg-gray-50 flex"> or similar
        content = re.sub(r'<div className="min-h-screen[^"]*flex[^"]*">\s*<Navbar[^>]*/>', '', content)
        content = re.sub(r'<div className="min-h-screen[^"]*bg-gradient[^"]*flex[^"]*">\s*<Navbar[^>]*/>', '', content)
        
        # Remove main wrapper with margin classes
        content = re.sub(r'<main[^>]*className="[^"]*ml-\[60px\][^"]*"[^>]*>\s*<TopBar[^>]*/>', '', content)
        content = re.sub(r'<main[^>]*className="[^"]*ml-64[^"]*"[^>]*>\s*<TopBar[^>]*/>', '', content)
        
        # Remove TopBar components
        content = re.sub(r'<TopBar[^>]*/>', '', content)
        
        # Remove closing main and div tags
        content = re.sub(r'\s*</main>\s*</div>\s*$', '', content)
        content = re.sub(r'\s*</div>\s*$', '', content)
        
        # Clean up extra whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {file_path}")
            return True
        else:
            print(f"No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    # Files that need manual navbar removal
    files_to_process = [
        "/Users/emreaydin/pafta/ngs/src/pages/templates/PdfTemplateEditor.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/CreateSalesInvoice.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/InvoiceManagement.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/CashAccountDetail.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/PartnerAccountDetail.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/CreditCardDetail.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/BankAccountDetail.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/vehicles/VehicleMaintenance.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/vehicles/VehicleList.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/vehicles/VehicleDetails.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/OtherActivitiesManagement.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/InvestmentManagement.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/FinancingManagement.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/ExpenseManagement.tsx",
        "/Users/emreaydin/pafta/ngs/src/pages/CustomerForm.tsx"
    ]
    
    updated_count = 0
    
    for file_path in files_to_process:
        if os.path.exists(file_path):
            if remove_manual_navbar_from_file(file_path):
                updated_count += 1
        else:
            print(f"File not found: {file_path}")
    
    print(f"\nTotal files updated: {updated_count}")

if __name__ == "__main__":
    main()
