# SIMAS Gereja (Church Asset Management) - Features Documentation

SIMAS (Sistem Informasi Manajemen Aset) Gereja is a modern web-based application designed for church asset and inventory management. It is built to assist the parish team in tracking asset conditions, calculating depreciations, and managing both movable and immovable assets efficiently.

## 1. Role-Based Access Control (RBAC) & Authentication
- **Secure Login:** Dedicated login portal with a parish-themed background.
- **Multi-Role Access:** Three distinct access levels:
  - **Super Admin (SUPER):** Full control over all modules (Dashboard, Asset Registry, Master Data, User Management). Can perform CRUD operations on all data and modify access rights.
  - **Team Coordinator (TIM):** Operational access to manage assets, print QR codes, perform bulk imports, and use the scanner. Cannot manage user accounts.
  - **Viewer (VIEWER):** Read-only access to dashboards, asset lists, and asset details. Cannot add, edit, or delete data.
- **Session Operator Switch:** (Demo/Dev feature) A quick role-switching dropdown in the sidebar footer, exclusively visible to Super Admins.

## 2. Executive Dashboard
Real-time analytics panel for monitoring the health and composition of parish assets:
- **Key Performance Indicators (KPIs):**
  - Total Asset Units
  - Total Original Value (Acquisition Cost)
  - Total Current Book Value
  - Current Year Depreciation Expense
- **Data Visualizations:**
  - Asset Category Distribution (Land, Building, Vehicles, Equipment, etc.) by count and value.
  - Asset Condition Chart (Good, Light Damage, Heavy Damage) for maintenance planning.
  - Asset Allocation by Parish Ministry/Commission.
- **Alerts Table:** Highlights assets that are nearing or have reached the end of their useful life.

## 3. Asset & Inventory Registry
The core module for comprehensive asset tracking, split into two tabs: **Movable Assets** (Equipment) and **Immovable Assets** (Land/Buildings).
- **Interactive DataGrid:** Displays asset records with built-in Pagination, Sorting, and Filtering by asset type, room, usage, condition, and ministry.
- **Automated Serial Code Generation:** Automatically generates standard hierarchical codes `[Type]-[Year]-[Territory]-[Room]-[Sequence]-[ItemCode]` upon asset creation.
- **Comprehensive Record Form:** Captures essential data including Item Name, Acquisition Year, Price, Useful Life, Person in Charge, Brand/Type, and physical photo evidence.
- **Automated Depreciation Calculation:** Systematically applies the Straight-Line Depreciation method with a residual value of zero, ensuring book value reaches Rp0 at the end of its useful life.
- **QR Code Label Printing:** Generates printable QR codes for individual or multiple assets, formatted for sticker printing.
- **Data Export:** Capability to download the entire asset database into Excel (.xlsx) or CSV formats.
- **Maintenance & Mutation Logs:** Tracks the history of room transfers (mutations) and maintenance/repair services.

## 4. QR Scanner & Stock Opname
- **Built-in Scanner:** Utilizes device cameras (laptop, tablet, smartphone) to scan QR labels attached to physical inventory.
- **Quick Lookup:** Instantly retrieves asset details, current book value, location, and condition with a single scan.
- **Quick Condition Update:** Allows operators to rapidly report changes in asset condition (e.g., from "Good" to "Light Damage") directly from the scanner interface during field audits.

## 5. Bulk Data Import
- **Spreadsheet Templates:** Provides downloadable CSV templates for users to fill in legacy asset data.
- **Smart Data Mapping:** Automatically validates and maps Indonesian text labels for "Room", "Asset Type", and "Ministry" into corresponding hierarchical system codes before database insertion.
- **Rapid Import Wizard:** Processes hundreds of rows of Excel data into validated, sequentially numbered asset records in seconds.

## 6. Master Data Management (Hierarchy Dictionary)
Manages the Catholic church standard hierarchical codes. The Master Data module allows the Super Admin to:
- Add, edit, or remove standard references such as:
  - Asset Categories (Land, Electronics, Furniture)
  - Parish Territory / Station Locations
  - Asset Usage & Rooms (Altar, Sacristy, Secretariat)
  - Specific Item Names & Codes
  - Ministries / Commissions List
- All codes registered here dynamically populate the dropdown menus during asset data entry.

## 7. User Account Management
- **Operator Roster:** Displays profiles of all registered users, active status, emails, and operational departments.
- **Administrator Actions:**
  - Modify user role permissions.
  - Update user information or passwords.
  - Revoke access for inactive or former staff members.

## 8. Modern User Interface (UI/UX)
- **Persistent Dark Mode Sidebar:** A sleek, modern sidebar that maintains a premium dark aesthetic across both light and dark modes.
- **Auto Light/Dark Mode:** Adapts to the user's system preferences for the main content area, designed with a carefully calibrated color palette to reduce eye strain.
- **Responsive Design (Mobile-first):** Optimizes layout across mobile phones, tablets, and high-resolution desktop monitors, ensuring accessibility anywhere.
- **Fluid Animations:** Features smooth tab transitions, fade-ins, hover states, and interactive toast notifications, delivering a polished and premium user experience.
