// AUTO-GENERATED from Real_Estate_Dynamic_Listing_Form_Specification.xlsx (v1.0).
// Do not edit by hand — regenerate with scripts/gen-listing-spec if the spec changes.
export type SpecOption = { value: string; label: string };
export type SpecField = { key: string; label: string; dataType: string; control: string; scope: string; required: string; format: string; options: SpecOption[]; validation: string; sensitive: string };
export type SpecCategory = { id: string; parent: string | null; level: number; name: string; slug: string; assetClass: string; typicalUse: string; note: string };
export type SpecMapEntry = { field: string; order: number; requiredOverride: string; show: string; section: string };
export type SpecRule = { id: string; priority: number; when: string; action: string; targets: string[]; message: string };

export const TAXONOMY: SpecCategory[] = [
 {
  "id": "RES",
  "parent": null,
  "level": 1,
  "name": "Residential",
  "slug": "residential",
  "assetClass": "built_property",
  "typicalUse": "living",
  "note": "Top-level asset class"
 },
 {
  "id": "RES_APT",
  "parent": "RES",
  "level": 2,
  "name": "Apartment / Flat",
  "slug": "apartment-flat",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Includes standard flats; subtype captured separately"
 },
 {
  "id": "RES_PENT",
  "parent": "RES",
  "level": 2,
  "name": "Penthouse",
  "slug": "penthouse",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Premium top-floor/multi-level unit; not separate asset class"
 },
 {
  "id": "RES_STUDIO",
  "parent": "RES",
  "level": 2,
  "name": "Studio Apartment",
  "slug": "studio-apartment",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Single-room compact unit"
 },
 {
  "id": "RES_DUPLEX",
  "parent": "RES",
  "level": 2,
  "name": "Duplex",
  "slug": "duplex",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Two internal levels"
 },
 {
  "id": "RES_TRIPLEX",
  "parent": "RES",
  "level": 2,
  "name": "Triplex",
  "slug": "triplex",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Three internal levels"
 },
 {
  "id": "RES_BUILDER",
  "parent": "RES",
  "level": 2,
  "name": "Builder Floor",
  "slug": "builder-floor",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Independent floor in low-rise building"
 },
 {
  "id": "RES_HOUSE",
  "parent": "RES",
  "level": 2,
  "name": "Independent House",
  "slug": "independent-house",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Standalone dwelling"
 },
 {
  "id": "RES_VILLA",
  "parent": "RES",
  "level": 2,
  "name": "Villa",
  "slug": "villa",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Detached/semi-detached premium home"
 },
 {
  "id": "RES_ROW",
  "parent": "RES",
  "level": 2,
  "name": "Row House / Townhouse",
  "slug": "row-house-townhouse",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Attached/terraced home"
 },
 {
  "id": "RES_BUNGALOW",
  "parent": "RES",
  "level": 2,
  "name": "Bungalow",
  "slug": "bungalow",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Standalone low-rise dwelling"
 },
 {
  "id": "RES_FARMHOUSE",
  "parent": "RES",
  "level": 2,
  "name": "Farmhouse",
  "slug": "farmhouse",
  "assetClass": "built_property",
  "typicalUse": "residential_or_agri",
  "note": "Capture land use and farm parcel separately"
 },
 {
  "id": "RES_COTTAGE",
  "parent": "RES",
  "level": 2,
  "name": "Cottage / Chalet",
  "slug": "cottage-chalet",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Regional/international subtype"
 },
 {
  "id": "RES_MANSION",
  "parent": "RES",
  "level": 2,
  "name": "Mansion / Estate Home",
  "slug": "mansion-estate",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Large luxury residence"
 },
 {
  "id": "RES_ROOM",
  "parent": "RES",
  "level": 2,
  "name": "Room / Portion",
  "slug": "room-portion",
  "assetClass": "built_property",
  "typicalUse": "residential",
  "note": "Room, floor portion, or shared accommodation"
 },
 {
  "id": "LAND",
  "parent": null,
  "level": 1,
  "name": "Land & Plots",
  "slug": "land-plots",
  "assetClass": "land",
  "typicalUse": "varied",
  "note": "Land parcel; do not assume buildable"
 },
 {
  "id": "LAND_RES",
  "parent": "LAND",
  "level": 2,
  "name": "Residential Plot",
  "slug": "residential-plot",
  "assetClass": "land",
  "typicalUse": "residential_development",
  "note": "Approved/regularized residential use"
 },
 {
  "id": "LAND_COMM",
  "parent": "LAND",
  "level": 2,
  "name": "Commercial Plot",
  "slug": "commercial-plot",
  "assetClass": "land",
  "typicalUse": "commercial_development",
  "note": "Commercial use as per sanctioned land use"
 },
 {
  "id": "LAND_INDUSTRIAL",
  "parent": "LAND",
  "level": 2,
  "name": "Industrial Plot",
  "slug": "industrial-plot",
  "assetClass": "land",
  "typicalUse": "industrial",
  "note": "Industrial use / estate plot"
 },
 {
  "id": "LAND_AGRI",
  "parent": "LAND",
  "level": 2,
  "name": "Agricultural Land",
  "slug": "agricultural-land",
  "assetClass": "land",
  "typicalUse": "agriculture",
  "note": "Capture state-specific restrictions and conversion status"
 },
 {
  "id": "LAND_FARM",
  "parent": "LAND",
  "level": 2,
  "name": "Farm Land",
  "slug": "farm-land",
  "assetClass": "land",
  "typicalUse": "agriculture_or_recreation",
  "note": "Farm parcel; distinguish farmhouse structure"
 },
 {
  "id": "LAND_MIXED",
  "parent": "LAND",
  "level": 2,
  "name": "Mixed-use Plot",
  "slug": "mixed-use-plot",
  "assetClass": "land",
  "typicalUse": "mixed",
  "note": "Use permitted uses field"
 },
 {
  "id": "LAND_INSTITUTIONAL",
  "parent": "LAND",
  "level": 2,
  "name": "Institutional Plot",
  "slug": "institutional-plot",
  "assetClass": "land",
  "typicalUse": "institutional",
  "note": "School, hospital, public/semi-public"
 },
 {
  "id": "LAND_WAREHOUSE",
  "parent": "LAND",
  "level": 2,
  "name": "Logistics / Warehouse Land",
  "slug": "logistics-land",
  "assetClass": "land",
  "typicalUse": "logistics",
  "note": "Large logistics/industrial land"
 },
 {
  "id": "LAND_REDEVELOP",
  "parent": "LAND",
  "level": 2,
  "name": "Redevelopment / Infill Land",
  "slug": "redevelopment-land",
  "assetClass": "land",
  "typicalUse": "redevelopment",
  "note": "Existing structures may exist"
 },
 {
  "id": "LAND_LEASEHOLD",
  "parent": "LAND",
  "level": 2,
  "name": "Leasehold Land Parcel",
  "slug": "leasehold-land",
  "assetClass": "land",
  "typicalUse": "varied",
  "note": "Tenure is also captured as separate field"
 },
 {
  "id": "COMM",
  "parent": null,
  "level": 1,
  "name": "Commercial Property",
  "slug": "commercial",
  "assetClass": "built_property_or_unit",
  "typicalUse": "business",
  "note": "Business-use property"
 },
 {
  "id": "COMM_OFFICE",
  "parent": "COMM",
  "level": 2,
  "name": "Office Space",
  "slug": "office-space",
  "assetClass": "unit",
  "typicalUse": "office",
  "note": "Private office, managed office, floor, etc."
 },
 {
  "id": "COMM_RETAIL",
  "parent": "COMM",
  "level": 2,
  "name": "Retail Shop / Showroom",
  "slug": "retail-shop-showroom",
  "assetClass": "unit",
  "typicalUse": "retail",
  "note": "Shop, showroom, high-street retail"
 },
 {
  "id": "COMM_SCO",
  "parent": "COMM",
  "level": 2,
  "name": "Shop-cum-Office (SCO)",
  "slug": "sco",
  "assetClass": "unit",
  "typicalUse": "mixed_commercial",
  "note": "Common Indian market format"
 },
 {
  "id": "COMM_FOOD",
  "parent": "COMM",
  "level": 2,
  "name": "Restaurant / Cafe Space",
  "slug": "restaurant-cafe",
  "assetClass": "unit",
  "typicalUse": "food_service",
  "note": "Capture exhaust, gas, kitchen provisions"
 },
 {
  "id": "COMM_CLINIC",
  "parent": "COMM",
  "level": 2,
  "name": "Clinic / Healthcare Space",
  "slug": "clinic-healthcare",
  "assetClass": "unit",
  "typicalUse": "healthcare",
  "note": "Medical/clinic fit-out"
 },
 {
  "id": "COMM_HOTEL",
  "parent": "COMM",
  "level": 2,
  "name": "Hotel / Hospitality Property",
  "slug": "hotel-hospitality",
  "assetClass": "building_or_business",
  "typicalUse": "hospitality",
  "note": "Whole asset or unit"
 },
 {
  "id": "COMM_MALL",
  "parent": "COMM",
  "level": 2,
  "name": "Mall / Shopping Centre",
  "slug": "mall-shopping-centre",
  "assetClass": "building",
  "typicalUse": "retail",
  "note": "Asset-level"
 },
 {
  "id": "COMM_COWORK",
  "parent": "COMM",
  "level": 2,
  "name": "Co-working / Managed Office",
  "slug": "coworking-managed-office",
  "assetClass": "unit_or_business",
  "typicalUse": "office",
  "note": "Capture seat count if applicable"
 },
 {
  "id": "COMM_BUILDING",
  "parent": "COMM",
  "level": 2,
  "name": "Commercial Building",
  "slug": "commercial-building",
  "assetClass": "building",
  "typicalUse": "commercial",
  "note": "Whole building"
 },
 {
  "id": "COMM_MIXED",
  "parent": "COMM",
  "level": 2,
  "name": "Mixed-use Building",
  "slug": "mixed-use-building",
  "assetClass": "building",
  "typicalUse": "mixed",
  "note": "Multiple use components"
 },
 {
  "id": "IND",
  "parent": null,
  "level": 1,
  "name": "Industrial & Logistics",
  "slug": "industrial-logistics",
  "assetClass": "built_property",
  "typicalUse": "industrial",
  "note": ""
 },
 {
  "id": "IND_FACTORY",
  "parent": "IND",
  "level": 2,
  "name": "Factory / Manufacturing Unit",
  "slug": "factory",
  "assetClass": "building",
  "typicalUse": "manufacturing",
  "note": "Power, clear height, floor loading"
 },
 {
  "id": "IND_WAREHOUSE",
  "parent": "IND",
  "level": 2,
  "name": "Warehouse / Godown",
  "slug": "warehouse-godown",
  "assetClass": "building",
  "typicalUse": "storage",
  "note": "Warehouse specifications"
 },
 {
  "id": "IND_COLD",
  "parent": "IND",
  "level": 2,
  "name": "Cold Storage",
  "slug": "cold-storage",
  "assetClass": "building",
  "typicalUse": "cold_chain",
  "note": "Temperature range and capacity"
 },
 {
  "id": "IND_WORKSHOP",
  "parent": "IND",
  "level": 2,
  "name": "Industrial Shed / Workshop",
  "slug": "industrial-shed-workshop",
  "assetClass": "building",
  "typicalUse": "industrial",
  "note": ""
 },
 {
  "id": "IND_LOGISTICS",
  "parent": "IND",
  "level": 2,
  "name": "Logistics Park / Distribution Centre",
  "slug": "logistics-park",
  "assetClass": "campus",
  "typicalUse": "logistics",
  "note": ""
 },
 {
  "id": "IND_DATA",
  "parent": "IND",
  "level": 2,
  "name": "Data Centre",
  "slug": "data-centre",
  "assetClass": "building",
  "typicalUse": "technology",
  "note": "Power redundancy/cooling/security"
 },
 {
  "id": "AGRI",
  "parent": null,
  "level": 1,
  "name": "Agricultural & Rural Assets",
  "slug": "agricultural-rural",
  "assetClass": "land_or_built",
  "typicalUse": "agriculture",
  "note": ""
 },
 {
  "id": "AGRI_ORCHARD",
  "parent": "AGRI",
  "level": 2,
  "name": "Orchard / Plantation",
  "slug": "orchard-plantation",
  "assetClass": "land",
  "typicalUse": "agriculture",
  "note": "Crop/tree inventory"
 },
 {
  "id": "AGRI_DAIRY",
  "parent": "AGRI",
  "level": 2,
  "name": "Dairy / Livestock Farm",
  "slug": "dairy-livestock-farm",
  "assetClass": "land_and_facility",
  "typicalUse": "agriculture",
  "note": "Livestock capacity and facilities"
 },
 {
  "id": "AGRI_POULTRY",
  "parent": "AGRI",
  "level": 2,
  "name": "Poultry Farm",
  "slug": "poultry-farm",
  "assetClass": "land_and_facility",
  "typicalUse": "agriculture",
  "note": "Shed capacity and biosecurity"
 },
 {
  "id": "AGRI_AQUA",
  "parent": "AGRI",
  "level": 2,
  "name": "Aquaculture / Fish Farm",
  "slug": "aquaculture-fish-farm",
  "assetClass": "land_and_facility",
  "typicalUse": "aquaculture",
  "note": "Water source and ponds"
 },
 {
  "id": "SPECIAL",
  "parent": null,
  "level": 1,
  "name": "Special-purpose & Institutional",
  "slug": "special-purpose",
  "assetClass": "built_property",
  "typicalUse": "specialized",
  "note": ""
 },
 {
  "id": "SPEC_SCHOOL",
  "parent": "SPECIAL",
  "level": 2,
  "name": "School / Education Campus",
  "slug": "school-education",
  "assetClass": "campus",
  "typicalUse": "education",
  "note": ""
 },
 {
  "id": "SPEC_HOSPITAL",
  "parent": "SPECIAL",
  "level": 2,
  "name": "Hospital / Medical Facility",
  "slug": "hospital-medical",
  "assetClass": "building",
  "typicalUse": "healthcare",
  "note": ""
 },
 {
  "id": "SPEC_RELIGIOUS",
  "parent": "SPECIAL",
  "level": 2,
  "name": "Religious Property",
  "slug": "religious-property",
  "assetClass": "building",
  "typicalUse": "religious",
  "note": "Check transfer/ownership restrictions"
 },
 {
  "id": "SPEC_SPORTS",
  "parent": "SPECIAL",
  "level": 2,
  "name": "Sports / Recreation Facility",
  "slug": "sports-recreation",
  "assetClass": "facility",
  "typicalUse": "recreation",
  "note": ""
 },
 {
  "id": "SPEC_CINEMA",
  "parent": "SPECIAL",
  "level": 2,
  "name": "Cinema / Entertainment Venue",
  "slug": "cinema-entertainment",
  "assetClass": "building",
  "typicalUse": "entertainment",
  "note": ""
 },
 {
  "id": "SPEC_GOVT",
  "parent": "SPECIAL",
  "level": 2,
  "name": "Government / Civic Asset",
  "slug": "government-civic",
  "assetClass": "building_or_land",
  "typicalUse": "civic",
  "note": "May not be privately transferable"
 },
 {
  "id": "HOSP",
  "parent": null,
  "level": 1,
  "name": "Hospitality & Short-stay",
  "slug": "hospitality",
  "assetClass": "built_property_or_unit",
  "typicalUse": "hospitality",
  "note": ""
 },
 {
  "id": "HOSP_RESORT",
  "parent": "HOSP",
  "level": 2,
  "name": "Resort / Holiday Home",
  "slug": "resort-holiday-home",
  "assetClass": "building_or_unit",
  "typicalUse": "hospitality",
  "note": ""
 },
 {
  "id": "HOSP_SERVAPT",
  "parent": "HOSP",
  "level": 2,
  "name": "Serviced Apartment",
  "slug": "serviced-apartment",
  "assetClass": "unit",
  "typicalUse": "hospitality",
  "note": ""
 },
 {
  "id": "HOSP_HOMESTAY",
  "parent": "HOSP",
  "level": 2,
  "name": "Homestay / Guest House",
  "slug": "homestay-guest-house",
  "assetClass": "building",
  "typicalUse": "hospitality",
  "note": ""
 },
 {
  "id": "PARKING",
  "parent": null,
  "level": 1,
  "name": "Parking & Storage",
  "slug": "parking-storage",
  "assetClass": "ancillary",
  "typicalUse": "storage",
  "note": "Can be standalone listing where legally transferable"
 },
 {
  "id": "PARK_SPACE",
  "parent": "PARKING",
  "level": 2,
  "name": "Car Parking Space",
  "slug": "car-parking",
  "assetClass": "ancillary",
  "typicalUse": "parking",
  "note": ""
 },
 {
  "id": "PARK_GARAGE",
  "parent": "PARKING",
  "level": 2,
  "name": "Garage",
  "slug": "garage",
  "assetClass": "ancillary",
  "typicalUse": "parking_storage",
  "note": ""
 },
 {
  "id": "PARK_LOCKER",
  "parent": "PARKING",
  "level": 2,
  "name": "Storage Unit / Locker",
  "slug": "storage-unit-locker",
  "assetClass": "ancillary",
  "typicalUse": "storage",
  "note": ""
 }
];

export const FIELDS: Record<string, SpecField> = {
 "listing_intent": {
  "key": "listing_intent",
  "label": "Listing intent",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "sale|rent|lease|lease_out|auction|joint_venture",
  "options": [
   {
    "value": "sale",
    "label": "For sale"
   },
   {
    "value": "rent",
    "label": "For rent"
   },
   {
    "value": "lease_out",
    "label": "For lease"
   },
   {
    "value": "lease",
    "label": "Leasehold interest / take on lease"
   },
   {
    "value": "auction",
    "label": "Auction"
   },
   {
    "value": "joint_venture",
    "label": "Joint venture / development partnership"
   }
  ],
  "validation": "Exactly one primary intent; support secondary intent only if product requires",
  "sensitive": ""
 },
 "asset_category_id": {
  "key": "asset_category_id",
  "label": "Property category",
  "dataType": "category_ref",
  "control": "cascading_select",
  "scope": "common",
  "required": "yes",
  "format": "taxonomy.category_id",
  "options": [],
  "validation": "Must reference active leaf category",
  "sensitive": ""
 },
 "property_subtype": {
  "key": "property_subtype",
  "label": "Property subtype",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "conditional",
  "format": "",
  "options": [
   {
    "value": "standard",
    "label": "Standard"
   },
   {
    "value": "penthouse",
    "label": "Penthouse"
   },
   {
    "value": "duplex",
    "label": "Duplex"
   },
   {
    "value": "triplex",
    "label": "Triplex"
   },
   {
    "value": "serviced",
    "label": "Serviced"
   }
  ],
  "validation": "Options depend on category; penthouse/duplex etc.",
  "sensitive": ""
 },
 "listing_title": {
  "key": "listing_title",
  "label": "Listing title",
  "dataType": "string",
  "control": "text",
  "scope": "common",
  "required": "yes",
  "format": "max 120 chars",
  "options": [],
  "validation": "Trim; 10-120 chars; prohibit misleading claims",
  "sensitive": ""
 },
 "description": {
  "key": "description",
  "label": "Description",
  "dataType": "text",
  "control": "textarea",
  "scope": "common",
  "required": "yes",
  "format": "max 5000 chars",
  "options": [],
  "validation": "Min 50 chars suggested; sanitize HTML",
  "sensitive": ""
 },
 "country_code": {
  "key": "country_code",
  "label": "Country",
  "dataType": "string",
  "control": "country_select",
  "scope": "common",
  "required": "yes",
  "format": "ISO-3166-1 alpha-2",
  "options": [],
  "validation": "Valid ISO code",
  "sensitive": ""
 },
 "state_code": {
  "key": "state_code",
  "label": "State / province",
  "dataType": "string",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "ISO-3166-2 where available",
  "options": [],
  "validation": "Must belong to country",
  "sensitive": ""
 },
 "city_id": {
  "key": "city_id",
  "label": "City",
  "dataType": "reference",
  "control": "autocomplete",
  "scope": "common",
  "required": "yes",
  "format": "",
  "options": [],
  "validation": "Resolve canonical place ID",
  "sensitive": ""
 },
 "locality": {
  "key": "locality",
  "label": "Locality / neighbourhood",
  "dataType": "string",
  "control": "autocomplete",
  "scope": "common",
  "required": "yes",
  "format": "",
  "options": [],
  "validation": "Autocomplete + free text fallback",
  "sensitive": ""
 },
 "sub_locality": {
  "key": "sub_locality",
  "label": "Sub-locality / sector",
  "dataType": "string",
  "control": "text",
  "scope": "common",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "Optional; normalize where possible",
  "sensitive": ""
 },
 "address_line": {
  "key": "address_line",
  "label": "Address",
  "dataType": "string",
  "control": "text",
  "scope": "common",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "Privacy control: exact address may be hidden publicly",
  "sensitive": ""
 },
 "postal_code": {
  "key": "postal_code",
  "label": "Postal code",
  "dataType": "string",
  "control": "text",
  "scope": "common",
  "required": "conditional",
  "format": "country-specific",
  "options": [],
  "validation": "Country-specific regex; preserve leading zero",
  "sensitive": ""
 },
 "latitude": {
  "key": "latitude",
  "label": "Latitude",
  "dataType": "decimal",
  "control": "geo",
  "scope": "common",
  "required": "no",
  "format": "-90..90",
  "options": [],
  "validation": "Range check; reverse geocode",
  "sensitive": ""
 },
 "longitude": {
  "key": "longitude",
  "label": "Longitude",
  "dataType": "decimal",
  "control": "geo",
  "scope": "common",
  "required": "no",
  "format": "-180..180",
  "options": [],
  "validation": "Range check; reverse geocode",
  "sensitive": ""
 },
 "map_visibility": {
  "key": "map_visibility",
  "label": "Map visibility",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "exact|approximate|hidden",
  "options": [
   {
    "value": "exact",
    "label": "Exact"
   },
   {
    "value": "approximate",
    "label": "Approximate"
   },
   {
    "value": "hidden",
    "label": "Hidden"
   }
  ],
  "validation": "Default approximate for occupied homes if privacy requested",
  "sensitive": ""
 },
 "asking_price": {
  "key": "asking_price",
  "label": "Asking price",
  "dataType": "money",
  "control": "currency_input",
  "scope": "common",
  "required": "conditional",
  "format": "currency_code + amount",
  "options": [],
  "validation": "Positive; decimal precision by currency",
  "sensitive": ""
 },
 "monthly_rent": {
  "key": "monthly_rent",
  "label": "Monthly rent",
  "dataType": "money",
  "control": "currency_input",
  "scope": "common",
  "required": "conditional",
  "format": "currency_code + amount",
  "options": [],
  "validation": "Required for rent intent; positive",
  "sensitive": ""
 },
 "security_deposit": {
  "key": "security_deposit",
  "label": "Security deposit",
  "dataType": "money",
  "control": "currency_input",
  "scope": "common",
  "required": "no",
  "format": "currency_code + amount",
  "options": [],
  "validation": "Non-negative; explain months or amount",
  "sensitive": ""
 },
 "price_negotiable": {
  "key": "price_negotiable",
  "label": "Price negotiable",
  "dataType": "boolean",
  "control": "toggle",
  "scope": "common",
  "required": "no",
  "format": "true|false",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "maintenance_amount": {
  "key": "maintenance_amount",
  "label": "Maintenance / service charge",
  "dataType": "money",
  "control": "currency_input",
  "scope": "common",
  "required": "no",
  "format": "amount + billing_period",
  "options": [],
  "validation": "Non-negative; require billing period when set",
  "sensitive": ""
 },
 "currency_code": {
  "key": "currency_code",
  "label": "Currency",
  "dataType": "string",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "ISO-4217",
  "options": [],
  "validation": "Default INR for India; do not hardcode globally",
  "sensitive": ""
 },
 "area_value": {
  "key": "area_value",
  "label": "Primary area value",
  "dataType": "decimal",
  "control": "number",
  "scope": "common",
  "required": "yes",
  "format": "positive decimal",
  "options": [],
  "validation": "Positive; precision 2-3 decimals",
  "sensitive": ""
 },
 "area_unit": {
  "key": "area_unit",
  "label": "Area unit",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "sqft|sqm|sqyd|acre|hectare|cent|gunta|bigha|kanal|marla",
  "options": [
   {
    "value": "sqft",
    "label": "Sqft"
   },
   {
    "value": "sqm",
    "label": "Sqm"
   },
   {
    "value": "sqyd",
    "label": "Sqyd"
   },
   {
    "value": "acre",
    "label": "Acre"
   },
   {
    "value": "hectare",
    "label": "Hectare"
   },
   {
    "value": "cent",
    "label": "Cent"
   },
   {
    "value": "gunta",
    "label": "Gunta"
   },
   {
    "value": "bigha",
    "label": "Bigha"
   },
   {
    "value": "kanal",
    "label": "Kanal"
   },
   {
    "value": "marla",
    "label": "Marla"
   }
  ],
  "validation": "Unit conversions must be locale-aware; bigha varies by state",
  "sensitive": ""
 },
 "area_basis": {
  "key": "area_basis",
  "label": "Area basis",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "carpet|built_up|super_built_up|plot|site|gross_internal|net_development|land_ownership",
  "options": [
   {
    "value": "carpet",
    "label": "Carpet"
   },
   {
    "value": "built_up",
    "label": "Built Up"
   },
   {
    "value": "super_built_up",
    "label": "Super Built Up"
   },
   {
    "value": "plot",
    "label": "Plot"
   },
   {
    "value": "site",
    "label": "Site"
   },
   {
    "value": "gross_internal",
    "label": "Gross Internal"
   },
   {
    "value": "net_development",
    "label": "Net Development"
   },
   {
    "value": "land_ownership",
    "label": "Land Ownership"
   }
  ],
  "validation": "Do not mix bases; retain original basis",
  "sensitive": ""
 },
 "furnishing_status": {
  "key": "furnishing_status",
  "label": "Furnishing",
  "dataType": "enum",
  "control": "select",
  "scope": "residential_unit",
  "required": "conditional",
  "format": "unfurnished|semi_furnished|fully_furnished",
  "options": [
   {
    "value": "unfurnished",
    "label": "Unfurnished"
   },
   {
    "value": "semi_furnished",
    "label": "Semi-furnished"
   },
   {
    "value": "fully_furnished",
    "label": "Fully furnished"
   }
  ],
  "validation": "Show only for occupiable units",
  "sensitive": ""
 },
 "bedrooms": {
  "key": "bedrooms",
  "label": "Bedrooms",
  "dataType": "integer",
  "control": "stepper",
  "scope": "residential_unit",
  "required": "conditional",
  "format": "0..50",
  "options": [],
  "validation": "Allow 0 for studio; integer",
  "sensitive": ""
 },
 "bathrooms": {
  "key": "bathrooms",
  "label": "Bathrooms",
  "dataType": "decimal",
  "control": "stepper",
  "scope": "residential_unit",
  "required": "conditional",
  "format": "0..50",
  "options": [],
  "validation": "Allow half baths; non-negative",
  "sensitive": ""
 },
 "balconies": {
  "key": "balconies",
  "label": "Balconies",
  "dataType": "integer",
  "control": "stepper",
  "scope": "residential_unit",
  "required": "no",
  "format": "0..30",
  "options": [],
  "validation": "Non-negative integer",
  "sensitive": ""
 },
 "floor_number": {
  "key": "floor_number",
  "label": "Floor number",
  "dataType": "integer",
  "control": "number",
  "scope": "unit",
  "required": "conditional",
  "format": "-5..300",
  "options": [],
  "validation": "Ground floor encoded as 0; basement negative",
  "sensitive": ""
 },
 "total_floors": {
  "key": "total_floors",
  "label": "Total floors",
  "dataType": "integer",
  "control": "number",
  "scope": "building_or_unit",
  "required": "conditional",
  "format": "1..300",
  "options": [],
  "validation": "Must be >= floor_number where applicable",
  "sensitive": ""
 },
 "facing_direction": {
  "key": "facing_direction",
  "label": "Facing direction",
  "dataType": "enum",
  "control": "select",
  "scope": "unit_or_plot",
  "required": "no",
  "format": "N|NE|E|SE|S|SW|W|NW",
  "options": [
   {
    "value": "N",
    "label": "North"
   },
   {
    "value": "NE",
    "label": "North-East"
   },
   {
    "value": "E",
    "label": "East"
   },
   {
    "value": "SE",
    "label": "South-East"
   },
   {
    "value": "S",
    "label": "South"
   },
   {
    "value": "SW",
    "label": "South-West"
   },
   {
    "value": "W",
    "label": "West"
   },
   {
    "value": "NW",
    "label": "North-West"
   }
  ],
  "validation": "Use compass enum",
  "sensitive": ""
 },
 "possession_status": {
  "key": "possession_status",
  "label": "Possession status",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "ready|under_construction|new_launch|resale|vacant_land|leased|occupied",
  "options": [
   {
    "value": "ready",
    "label": "Ready to move"
   },
   {
    "value": "under_construction",
    "label": "Under construction"
   },
   {
    "value": "new_launch",
    "label": "New launch"
   },
   {
    "value": "resale",
    "label": "Resale"
   },
   {
    "value": "vacant_land",
    "label": "Vacant land"
   },
   {
    "value": "leased",
    "label": "Leased"
   },
   {
    "value": "occupied",
    "label": "Occupied"
   }
  ],
  "validation": "Category-aware; vacant_land for land",
  "sensitive": ""
 },
 "possession_date": {
  "key": "possession_date",
  "label": "Expected possession date",
  "dataType": "date",
  "control": "date_picker",
  "scope": "under_construction",
  "required": "conditional",
  "format": "YYYY-MM-DD",
  "options": [],
  "validation": "Must be future at publish time unless completed",
  "sensitive": ""
 },
 "year_built": {
  "key": "year_built",
  "label": "Year built",
  "dataType": "integer",
  "control": "number",
  "scope": "building",
  "required": "no",
  "format": "1800..current_year+2",
  "options": [],
  "validation": "Reject implausible values",
  "sensitive": ""
 },
 "age_years": {
  "key": "age_years",
  "label": "Property age",
  "dataType": "integer",
  "control": "number",
  "scope": "building",
  "required": "no",
  "format": "0..250",
  "options": [],
  "validation": "Avoid requiring both age and year_built",
  "sensitive": ""
 },
 "parking_count": {
  "key": "parking_count",
  "label": "Parking spaces",
  "dataType": "integer",
  "control": "number",
  "scope": "unit_or_building",
  "required": "no",
  "format": "0..5000",
  "options": [],
  "validation": "Non-negative integer",
  "sensitive": ""
 },
 "lift_available": {
  "key": "lift_available",
  "label": "Lift available",
  "dataType": "boolean",
  "control": "toggle",
  "scope": "building",
  "required": "no",
  "format": "true|false",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "power_backup": {
  "key": "power_backup",
  "label": "Power backup",
  "dataType": "enum",
  "control": "select",
  "scope": "building",
  "required": "no",
  "format": "none|partial|common_areas|full",
  "options": [
   {
    "value": "none",
    "label": "None"
   },
   {
    "value": "partial",
    "label": "Partial"
   },
   {
    "value": "common_areas",
    "label": "Common Areas"
   },
   {
    "value": "full",
    "label": "Full"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "water_source": {
  "key": "water_source",
  "label": "Water source",
  "dataType": "multi_enum",
  "control": "multiselect",
  "scope": "building_or_land",
  "required": "no",
  "format": "municipal|borewell|tanker|river|rainwater|other",
  "options": [
   {
    "value": "municipal",
    "label": "Municipal"
   },
   {
    "value": "borewell",
    "label": "Borewell"
   },
   {
    "value": "tanker",
    "label": "Tanker"
   },
   {
    "value": "river",
    "label": "River"
   },
   {
    "value": "rainwater",
    "label": "Rainwater"
   },
   {
    "value": "other",
    "label": "Other"
   }
  ],
  "validation": "At least one if set",
  "sensitive": ""
 },
 "ownership_type": {
  "key": "ownership_type",
  "label": "Ownership / tenure",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "yes",
  "format": "freehold|leasehold|cooperative|condominium|government_lease|customary|other",
  "options": [
   {
    "value": "freehold",
    "label": "Freehold"
   },
   {
    "value": "leasehold",
    "label": "Leasehold"
   },
   {
    "value": "cooperative",
    "label": "Co-operative / society share"
   },
   {
    "value": "condominium",
    "label": "Condominium / strata"
   },
   {
    "value": "government_lease",
    "label": "Government lease"
   }
  ],
  "validation": "Require supporting document details; jurisdiction-specific",
  "sensitive": "legal"
 },
 "ownership_share": {
  "key": "ownership_share",
  "label": "Ownership share",
  "dataType": "decimal",
  "control": "number",
  "scope": "common",
  "required": "no",
  "format": "0..100 percent",
  "options": [],
  "validation": "0<value<=100; if joint owners",
  "sensitive": "legal"
 },
 "occupancy_status": {
  "key": "occupancy_status",
  "label": "Occupancy",
  "dataType": "enum",
  "control": "select",
  "scope": "common",
  "required": "conditional",
  "format": "owner_occupied|tenant_occupied|vacant|partially_occupied|under_construction",
  "options": [
   {
    "value": "owner_occupied",
    "label": "Owner Occupied"
   },
   {
    "value": "tenant_occupied",
    "label": "Tenant Occupied"
   },
   {
    "value": "vacant",
    "label": "Vacant"
   },
   {
    "value": "partially_occupied",
    "label": "Partially Occupied"
   },
   {
    "value": "under_construction",
    "label": "Under Construction"
   }
  ],
  "validation": "Show for built property; align with possession status",
  "sensitive": ""
 },
 "available_from": {
  "key": "available_from",
  "label": "Available from",
  "dataType": "date",
  "control": "date_picker",
  "scope": "rent_or_lease",
  "required": "conditional",
  "format": "YYYY-MM-DD",
  "options": [],
  "validation": "Future or current date",
  "sensitive": ""
 },
 "lease_term_months": {
  "key": "lease_term_months",
  "label": "Lease term",
  "dataType": "integer",
  "control": "number",
  "scope": "rent_or_lease",
  "required": "no",
  "format": "1..600",
  "options": [],
  "validation": "Require for long lease if specified",
  "sensitive": ""
 },
 "rera_applicable": {
  "key": "rera_applicable",
  "label": "RERA applicable",
  "dataType": "enum",
  "control": "select",
  "scope": "india_project",
  "required": "conditional",
  "format": "yes|no|not_sure|not_applicable",
  "options": [
   {
    "value": "yes",
    "label": "Yes"
   },
   {
    "value": "no",
    "label": "No"
   },
   {
    "value": "not_sure",
    "label": "Not Sure"
   },
   {
    "value": "not_applicable",
    "label": "Not Applicable"
   }
  ],
  "validation": "Never infer only from category; route to jurisdiction rules",
  "sensitive": "legal"
 },
 "rera_registration_number": {
  "key": "rera_registration_number",
  "label": "RERA registration number",
  "dataType": "string",
  "control": "text",
  "scope": "india_project",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "Validate against state authority where integration exists",
  "sensitive": "legal"
 },
 "rera_authority_state": {
  "key": "rera_authority_state",
  "label": "RERA authority state",
  "dataType": "string",
  "control": "select",
  "scope": "india_project",
  "required": "conditional",
  "format": "state_code",
  "options": [],
  "validation": "Must match project location",
  "sensitive": "legal"
 },
 "project_name": {
  "key": "project_name",
  "label": "Project / society name",
  "dataType": "string",
  "control": "autocomplete",
  "scope": "project_linked",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "Link to canonical Project entity when possible",
  "sensitive": ""
 },
 "developer_id": {
  "key": "developer_id",
  "label": "Developer",
  "dataType": "reference",
  "control": "autocomplete",
  "scope": "project_linked",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "Required for developer-created project listing",
  "sensitive": ""
 },
 "project_phase": {
  "key": "project_phase",
  "label": "Project phase / tower",
  "dataType": "string",
  "control": "text",
  "scope": "project_linked",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "plot_length": {
  "key": "plot_length",
  "label": "Plot length",
  "dataType": "decimal",
  "control": "number",
  "scope": "land",
  "required": "conditional",
  "format": "positive + dimension_unit",
  "options": [],
  "validation": "Positive; require width when rectangular dimensions used",
  "sensitive": ""
 },
 "plot_width": {
  "key": "plot_width",
  "label": "Plot width",
  "dataType": "decimal",
  "control": "number",
  "scope": "land",
  "required": "conditional",
  "format": "positive + dimension_unit",
  "options": [],
  "validation": "Positive; length x width need not equal stated area; flag variance",
  "sensitive": ""
 },
 "dimension_unit": {
  "key": "dimension_unit",
  "label": "Dimension unit",
  "dataType": "enum",
  "control": "select",
  "scope": "land",
  "required": "conditional",
  "format": "ft|m|yd",
  "options": [
   {
    "value": "ft",
    "label": "Ft"
   },
   {
    "value": "m",
    "label": "M"
   },
   {
    "value": "yd",
    "label": "Yd"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "plot_shape": {
  "key": "plot_shape",
  "label": "Plot shape",
  "dataType": "enum",
  "control": "select",
  "scope": "land",
  "required": "no",
  "format": "rectangular|square|irregular|corner|triangular|other",
  "options": [
   {
    "value": "rectangular",
    "label": "Rectangular"
   },
   {
    "value": "square",
    "label": "Square"
   },
   {
    "value": "irregular",
    "label": "Irregular"
   },
   {
    "value": "corner",
    "label": "Corner"
   },
   {
    "value": "triangular",
    "label": "Triangular"
   },
   {
    "value": "other",
    "label": "Other"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "road_width": {
  "key": "road_width",
  "label": "Abutting road width",
  "dataType": "decimal",
  "control": "number",
  "scope": "land",
  "required": "no",
  "format": "value + dimension_unit",
  "options": [],
  "validation": "Positive; record frontage separately",
  "sensitive": ""
 },
 "plot_frontage": {
  "key": "plot_frontage",
  "label": "Plot frontage",
  "dataType": "decimal",
  "control": "number",
  "scope": "land",
  "required": "no",
  "format": "value + dimension_unit",
  "options": [],
  "validation": "Positive",
  "sensitive": ""
 },
 "corner_plot": {
  "key": "corner_plot",
  "label": "Corner plot",
  "dataType": "boolean",
  "control": "toggle",
  "scope": "land",
  "required": "no",
  "format": "true|false",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "plot_level": {
  "key": "plot_level",
  "label": "Plot level",
  "dataType": "enum",
  "control": "select",
  "scope": "land",
  "required": "no",
  "format": "below_road|road_level|above_road|sloped|uneven",
  "options": [
   {
    "value": "below_road",
    "label": "Below Road"
   },
   {
    "value": "road_level",
    "label": "Road Level"
   },
   {
    "value": "above_road",
    "label": "Above Road"
   },
   {
    "value": "sloped",
    "label": "Sloped"
   },
   {
    "value": "uneven",
    "label": "Uneven"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "land_use_zoning": {
  "key": "land_use_zoning",
  "label": "Land use / zoning",
  "dataType": "enum",
  "control": "select",
  "scope": "land",
  "required": "yes",
  "format": "residential|commercial|industrial|agricultural|institutional|mixed_use|recreational|green_belt|other|unknown",
  "options": [
   {
    "value": "residential",
    "label": "Residential"
   },
   {
    "value": "commercial",
    "label": "Commercial"
   },
   {
    "value": "industrial",
    "label": "Industrial"
   },
   {
    "value": "agricultural",
    "label": "Agricultural"
   },
   {
    "value": "institutional",
    "label": "Institutional / public-semi-public"
   },
   {
    "value": "mixed_use",
    "label": "Mixed use"
   },
   {
    "value": "recreational",
    "label": "Recreational / open space"
   },
   {
    "value": "green_belt",
    "label": "Green belt / restricted"
   }
  ],
  "validation": "Must be sourced from sanctioned plan / authority, not marketing label",
  "sensitive": "legal"
 },
 "land_conversion_status": {
  "key": "land_conversion_status",
  "label": "Land conversion status",
  "dataType": "enum",
  "control": "select",
  "scope": "agricultural_land",
  "required": "conditional",
  "format": "not_required|converted|conversion_applied|not_converted|unknown",
  "options": [
   {
    "value": "not_required",
    "label": "Not Required"
   },
   {
    "value": "converted",
    "label": "Converted"
   },
   {
    "value": "conversion_applied",
    "label": "Conversion Applied"
   },
   {
    "value": "not_converted",
    "label": "Not Converted"
   },
   {
    "value": "unknown",
    "label": "Unknown"
   }
  ],
  "validation": "State-specific rules; do not assume transferable/buildable",
  "sensitive": "legal"
 },
 "layout_approval_status": {
  "key": "layout_approval_status",
  "label": "Layout approval status",
  "dataType": "enum",
  "control": "select",
  "scope": "land",
  "required": "conditional",
  "format": "approved|provisional|pending|not_approved|not_required|unknown",
  "options": [
   {
    "value": "approved",
    "label": "Approved"
   },
   {
    "value": "provisional",
    "label": "Provisional"
   },
   {
    "value": "pending",
    "label": "Applied / pending"
   },
   {
    "value": "not_approved",
    "label": "Not approved"
   },
   {
    "value": "not_required",
    "label": "Not required"
   },
   {
    "value": "unknown",
    "label": "Unknown / not verified"
   }
  ],
  "validation": "Capture authority + number + date",
  "sensitive": "legal"
 },
 "layout_approval_authority": {
  "key": "layout_approval_authority",
  "label": "Approval authority",
  "dataType": "string",
  "control": "text",
  "scope": "land",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "Required if approval status approved/provisional",
  "sensitive": "legal"
 },
 "layout_approval_number": {
  "key": "layout_approval_number",
  "label": "Approval number",
  "dataType": "string",
  "control": "text",
  "scope": "land",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "land_parcel_id": {
  "key": "land_parcel_id",
  "label": "Khasra / survey / parcel number",
  "dataType": "string",
  "control": "text",
  "scope": "land",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "May be multiple; support array",
  "sensitive": "legal"
 },
 "village_mauza": {
  "key": "village_mauza",
  "label": "Village / mauza",
  "dataType": "string",
  "control": "text",
  "scope": "land",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "Often critical for land records",
  "sensitive": ""
 },
 "tehsil_taluk": {
  "key": "tehsil_taluk",
  "label": "Tehsil / taluk",
  "dataType": "string",
  "control": "text",
  "scope": "land",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "district": {
  "key": "district",
  "label": "District",
  "dataType": "string",
  "control": "text",
  "scope": "common",
  "required": "yes",
  "format": "",
  "options": [],
  "validation": "Canonical district",
  "sensitive": ""
 },
 "approach_road_type": {
  "key": "approach_road_type",
  "label": "Access road type",
  "dataType": "enum",
  "control": "select",
  "scope": "land",
  "required": "no",
  "format": "public_road|private_road|right_of_way|no_direct_access|proposed_road",
  "options": [
   {
    "value": "public_road",
    "label": "Public Road"
   },
   {
    "value": "private_road",
    "label": "Private Road"
   },
   {
    "value": "right_of_way",
    "label": "Right Of Way"
   },
   {
    "value": "no_direct_access",
    "label": "No Direct Access"
   },
   {
    "value": "proposed_road",
    "label": "Proposed Road"
   }
  ],
  "validation": "If private/ROW, collect easement evidence",
  "sensitive": "legal"
 },
 "waterfront_type": {
  "key": "waterfront_type",
  "label": "Waterfront type",
  "dataType": "enum",
  "control": "select",
  "scope": "land_or_building",
  "required": "no",
  "format": "sea|lake|river|canal|none",
  "options": [
   {
    "value": "sea",
    "label": "Sea"
   },
   {
    "value": "lake",
    "label": "Lake"
   },
   {
    "value": "river",
    "label": "River"
   },
   {
    "value": "canal",
    "label": "Canal"
   },
   {
    "value": "none",
    "label": "None"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "penthouse_level": {
  "key": "penthouse_level",
  "label": "Penthouse configuration",
  "dataType": "enum",
  "control": "select",
  "scope": "penthouse",
  "required": "yes",
  "format": "single_level|duplex|triplex|multi_level",
  "options": [
   {
    "value": "single_level",
    "label": "Single-level penthouse"
   },
   {
    "value": "duplex",
    "label": "Duplex penthouse"
   },
   {
    "value": "triplex",
    "label": "Triplex penthouse"
   },
   {
    "value": "multi_level",
    "label": "Other multi-level"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "penthouse_floor_position": {
  "key": "penthouse_floor_position",
  "label": "Penthouse floor position",
  "dataType": "enum",
  "control": "select",
  "scope": "penthouse",
  "required": "yes",
  "format": "top_floor|top_two_floors|roof_level|other",
  "options": [
   {
    "value": "top_floor",
    "label": "Top floor"
   },
   {
    "value": "top_two_floors",
    "label": "Top two floors"
   },
   {
    "value": "roof_level",
    "label": "Roof level"
   },
   {
    "value": "other",
    "label": "Other"
   }
  ],
  "validation": "",
  "sensitive": ""
 },
 "private_terrace_area": {
  "key": "private_terrace_area",
  "label": "Private terrace area",
  "dataType": "decimal",
  "control": "number",
  "scope": "penthouse",
  "required": "no",
  "format": "area + area_unit",
  "options": [],
  "validation": "Distinguish exclusive terrace from common roof",
  "sensitive": ""
 },
 "terrace_rights": {
  "key": "terrace_rights",
  "label": "Terrace rights",
  "dataType": "enum",
  "control": "select",
  "scope": "penthouse",
  "required": "conditional",
  "format": "deeded_exclusive|exclusive_use|common_area|not_included|unknown",
  "options": [
   {
    "value": "deeded_exclusive",
    "label": "Deeded / title-backed exclusive ownership"
   },
   {
    "value": "exclusive_use",
    "label": "Exclusive use right"
   },
   {
    "value": "common_area",
    "label": "Common area"
   },
   {
    "value": "not_included",
    "label": "Not included"
   },
   {
    "value": "unknown",
    "label": "Unknown / unverified"
   }
  ],
  "validation": "Never imply ownership from access alone; document evidence",
  "sensitive": "legal"
 },
 "private_pool": {
  "key": "private_pool",
  "label": "Private pool",
  "dataType": "boolean",
  "control": "toggle",
  "scope": "penthouse",
  "required": "no",
  "format": "true|false",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "private_lift_lobby": {
  "key": "private_lift_lobby",
  "label": "Private lift lobby",
  "dataType": "boolean",
  "control": "toggle",
  "scope": "penthouse",
  "required": "no",
  "format": "true|false",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "double_height": {
  "key": "double_height",
  "label": "Double-height living area",
  "dataType": "boolean",
  "control": "toggle",
  "scope": "penthouse",
  "required": "no",
  "format": "true|false",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "ceiling_height": {
  "key": "ceiling_height",
  "label": "Ceiling height",
  "dataType": "decimal",
  "control": "number",
  "scope": "penthouse_or_premium",
  "required": "no",
  "format": "metres",
  "options": [],
  "validation": "Positive",
  "sensitive": ""
 },
 "view_type": {
  "key": "view_type",
  "label": "View",
  "dataType": "multi_enum",
  "control": "multiselect",
  "scope": "unit",
  "required": "no",
  "format": "city|park|garden|sea|river|lake|golf|mountain|pool|other",
  "options": [
   {
    "value": "city",
    "label": "City"
   },
   {
    "value": "park",
    "label": "Park"
   },
   {
    "value": "garden",
    "label": "Garden"
   },
   {
    "value": "sea",
    "label": "Sea"
   },
   {
    "value": "river",
    "label": "River"
   },
   {
    "value": "lake",
    "label": "Lake"
   },
   {
    "value": "golf",
    "label": "Golf"
   },
   {
    "value": "mountain",
    "label": "Mountain"
   },
   {
    "value": "pool",
    "label": "Pool"
   },
   {
    "value": "other",
    "label": "Other"
   }
  ],
  "validation": "Do not promise permanent view",
  "sensitive": ""
 },
 "building_name": {
  "key": "building_name",
  "label": "Building / tower",
  "dataType": "string",
  "control": "text",
  "scope": "unit",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "unit_number": {
  "key": "unit_number",
  "label": "Unit number",
  "dataType": "string",
  "control": "text",
  "scope": "unit",
  "required": "no",
  "format": "",
  "options": [],
  "validation": "Mask publicly if needed",
  "sensitive": ""
 },
 "total_units": {
  "key": "total_units",
  "label": "Total units in project",
  "dataType": "integer",
  "control": "number",
  "scope": "project",
  "required": "no",
  "format": "1..1000000",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "available_units": {
  "key": "available_units",
  "label": "Available units",
  "dataType": "integer",
  "control": "number",
  "scope": "project",
  "required": "no",
  "format": "0..total_units",
  "options": [],
  "validation": "Must be <= total_units",
  "sensitive": ""
 },
 "commercial_frontage": {
  "key": "commercial_frontage",
  "label": "Commercial frontage",
  "dataType": "decimal",
  "control": "number",
  "scope": "commercial_unit",
  "required": "no",
  "format": "metres or feet",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "clear_height": {
  "key": "clear_height",
  "label": "Clear height",
  "dataType": "decimal",
  "control": "number",
  "scope": "industrial",
  "required": "no",
  "format": "metres",
  "options": [],
  "validation": "Positive",
  "sensitive": ""
 },
 "floor_loading": {
  "key": "floor_loading",
  "label": "Floor loading capacity",
  "dataType": "decimal",
  "control": "number",
  "scope": "industrial",
  "required": "no",
  "format": "tonnes_per_sqm",
  "options": [],
  "validation": "Positive; source required",
  "sensitive": ""
 },
 "power_load": {
  "key": "power_load",
  "label": "Sanctioned power load",
  "dataType": "decimal",
  "control": "number",
  "scope": "commercial_or_industrial",
  "required": "no",
  "format": "kW|kVA",
  "options": [],
  "validation": "Positive; unit explicit",
  "sensitive": ""
 },
 "dock_count": {
  "key": "dock_count",
  "label": "Loading docks",
  "dataType": "integer",
  "control": "number",
  "scope": "warehouse",
  "required": "no",
  "format": "0..10000",
  "options": [],
  "validation": "",
  "sensitive": ""
 },
 "temperature_range": {
  "key": "temperature_range",
  "label": "Temperature range",
  "dataType": "string",
  "control": "text",
  "scope": "cold_storage",
  "required": "conditional",
  "format": "°C min..max",
  "options": [],
  "validation": "Min must be <= max",
  "sensitive": ""
 },
 "clear_title_claim": {
  "key": "clear_title_claim",
  "label": "Seller title declaration",
  "dataType": "boolean",
  "control": "checkbox",
  "scope": "seller",
  "required": "yes",
  "format": "true|false",
  "options": [],
  "validation": "Not title verification; display disclaimer",
  "sensitive": "legal"
 },
 "exclusive_mandate": {
  "key": "exclusive_mandate",
  "label": "Exclusive listing mandate",
  "dataType": "boolean",
  "control": "checkbox",
  "scope": "agent",
  "required": "conditional",
  "format": "true|false",
  "options": [],
  "validation": "Require mandate evidence where applicable",
  "sensitive": "legal"
 },
 "seller_entity_name": {
  "key": "seller_entity_name",
  "label": "Seller / entity name",
  "dataType": "string",
  "control": "text",
  "scope": "seller",
  "required": "yes",
  "format": "",
  "options": [],
  "validation": "Match KYC/entity records",
  "sensitive": "personal"
 },
 "seller_role": {
  "key": "seller_role",
  "label": "Listing party role",
  "dataType": "enum",
  "control": "select",
  "scope": "seller",
  "required": "yes",
  "format": "owner|co_owner|developer|builder|authorized_signatory|agent|broker|power_of_attorney_holder|auctioneer",
  "options": [
   {
    "value": "owner",
    "label": "Owner"
   },
   {
    "value": "co_owner",
    "label": "Co Owner"
   },
   {
    "value": "developer",
    "label": "Developer"
   },
   {
    "value": "builder",
    "label": "Builder"
   },
   {
    "value": "authorized_signatory",
    "label": "Authorized Signatory"
   },
   {
    "value": "agent",
    "label": "Agent"
   },
   {
    "value": "broker",
    "label": "Broker"
   },
   {
    "value": "power_of_attorney_holder",
    "label": "Power Of Attorney Holder"
   },
   {
    "value": "auctioneer",
    "label": "Auctioneer"
   }
  ],
  "validation": "Role-specific evidence requirements",
  "sensitive": "personal"
 },
 "agent_rera_number": {
  "key": "agent_rera_number",
  "label": "Agent RERA registration number",
  "dataType": "string",
  "control": "text",
  "scope": "agent_india",
  "required": "conditional",
  "format": "",
  "options": [],
  "validation": "State-specific validation; verify with authority",
  "sensitive": "legal"
 },
 "contact_phone": {
  "key": "contact_phone",
  "label": "Contact phone",
  "dataType": "phone",
  "control": "phone_input",
  "scope": "seller",
  "required": "yes",
  "format": "E.164",
  "options": [],
  "validation": "OTP verification; store normalized E.164",
  "sensitive": "personal"
 },
 "contact_email": {
  "key": "contact_email",
  "label": "Contact email",
  "dataType": "email",
  "control": "email_input",
  "scope": "seller",
  "required": "no",
  "format": "RFC email",
  "options": [],
  "validation": "Verification recommended",
  "sensitive": "personal"
 },
 "media_photos": {
  "key": "media_photos",
  "label": "Property photos",
  "dataType": "file_array",
  "control": "uploader",
  "scope": "common",
  "required": "yes",
  "format": "jpg|jpeg|png|webp; max 20MB each",
  "options": [],
  "validation": "At least 5 recommended; validate MIME and malware scan",
  "sensitive": ""
 },
 "media_video": {
  "key": "media_video",
  "label": "Property video",
  "dataType": "url_or_file",
  "control": "uploader",
  "scope": "common",
  "required": "no",
  "format": "mp4|mov or URL",
  "options": [],
  "validation": "Max duration/size configurable",
  "sensitive": ""
 },
 "floor_plan": {
  "key": "floor_plan",
  "label": "Floor plan",
  "dataType": "file",
  "control": "uploader",
  "scope": "unit_or_project",
  "required": "no",
  "format": "pdf|jpg|png",
  "options": [],
  "validation": "Optional; label as illustrative if not approved",
  "sensitive": ""
 },
 "site_plan": {
  "key": "site_plan",
  "label": "Site / plot plan",
  "dataType": "file",
  "control": "uploader",
  "scope": "land",
  "required": "conditional",
  "format": "pdf|jpg|png",
  "options": [],
  "validation": "Required for plotted development where available",
  "sensitive": "legal"
 },
 "ownership_document": {
  "key": "ownership_document",
  "label": "Ownership proof",
  "dataType": "file_array",
  "control": "secure_uploader",
  "scope": "seller",
  "required": "conditional",
  "format": "pdf|jpg|png",
  "options": [],
  "validation": "Private; access-controlled; not publicly downloadable by default",
  "sensitive": "legal"
 },
 "approval_documents": {
  "key": "approval_documents",
  "label": "Approvals / sanctions",
  "dataType": "file_array",
  "control": "secure_uploader",
  "scope": "developer_or_land",
  "required": "conditional",
  "format": "pdf|jpg|png",
  "options": [],
  "validation": "Document type metadata + issuing authority",
  "sensitive": "legal"
 },
 "identity_verification_status": {
  "key": "identity_verification_status",
  "label": "KYC status",
  "dataType": "enum",
  "control": "system_status",
  "scope": "seller",
  "required": "system",
  "format": "pending|verified|rejected|expired",
  "options": [
   {
    "value": "pending",
    "label": "Pending"
   },
   {
    "value": "verified",
    "label": "Verified"
   },
   {
    "value": "rejected",
    "label": "Rejected"
   },
   {
    "value": "expired",
    "label": "Expired"
   }
  ],
  "validation": "System-controlled, never seller-editable",
  "sensitive": "sensitive"
 },
 "listing_status": {
  "key": "listing_status",
  "label": "Listing status",
  "dataType": "enum",
  "control": "system_status",
  "scope": "system",
  "required": "system",
  "format": "draft|submitted|under_review|published|rejected|paused|sold|rented|expired",
  "options": [
   {
    "value": "draft",
    "label": "Draft"
   },
   {
    "value": "submitted",
    "label": "Submitted"
   },
   {
    "value": "under_review",
    "label": "Under Review"
   },
   {
    "value": "published",
    "label": "Published"
   },
   {
    "value": "rejected",
    "label": "Rejected"
   },
   {
    "value": "paused",
    "label": "Paused"
   },
   {
    "value": "sold",
    "label": "Sold"
   },
   {
    "value": "rented",
    "label": "Rented"
   },
   {
    "value": "expired",
    "label": "Expired"
   }
  ],
  "validation": "System-controlled",
  "sensitive": ""
 }
};

export const CATEGORY_FIELD_MAP: Record<string, SpecMapEntry[]> = {
 "RES": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "LAND": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "COMM": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "IND": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "AGRI": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "SPECIAL": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "HOSP": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "PARKING": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Details"
  }
 ],
 "RES_APT": [
  {
   "field": "property_subtype",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bedrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "balconies",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_number",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 11,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "project_name",
   "order": 12,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "building_name",
   "order": 13,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "unit_number",
   "order": 14,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "facing_direction",
   "order": 15,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 16,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_APT'",
   "section": "Category-specific"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_PENT": [
  {
   "field": "property_subtype",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bedrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "balconies",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_number",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "penthouse_level",
   "order": 11,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "penthouse_floor_position",
   "order": 12,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "private_terrace_area",
   "order": 13,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "terrace_rights",
   "order": 14,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "private_pool",
   "order": 15,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "private_lift_lobby",
   "order": 16,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "double_height",
   "order": 17,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ceiling_height",
   "order": 18,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "view_type",
   "order": 19,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "project_name",
   "order": 20,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "building_name",
   "order": 21,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 22,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_PENT'",
   "section": "Category-specific"
  }
 ],
 "RES_STUDIO": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_STUDIO'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_STUDIO'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_number",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_STUDIO'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_STUDIO'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_STUDIO'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_STUDIO'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_DUPLEX": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_number",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "property_subtype",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_DUPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_TRIPLEX": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_number",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "property_subtype",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_TRIPLEX'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_BUILDER": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_number",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUILDER'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_HOUSE": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "balconies",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "facing_direction",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_HOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_VILLA": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "balconies",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "private_pool",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "view_type",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_VILLA'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_ROW": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROW'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROW'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROW'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROW'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROW'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROW'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_BUNGALOW": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUNGALOW'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUNGALOW'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUNGALOW'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUNGALOW'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUNGALOW'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_BUNGALOW'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_FARMHOUSE": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 5,
   "requiredOverride": "yes",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_length",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_FARMHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_ROOM": [
  {
   "field": "bedrooms",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROOM'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "bathrooms",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROOM'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROOM'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROOM'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "available_from",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'RES_ROOM'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_RES": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_shape",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "road_width",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_frontage",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "corner_plot",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_level",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 9,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_status",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_authority",
   "order": 11,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_number",
   "order": 12,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_parcel_id",
   "order": 13,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 14,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "tehsil_taluk",
   "order": 15,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "approach_road_type",
   "order": 16,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "facing_direction",
   "order": 17,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "site_plan",
   "order": 18,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 19,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_RES'",
   "section": "Category-specific"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_COMM": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_shape",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "road_width",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_frontage",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "corner_plot",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 8,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_status",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_authority",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_number",
   "order": 11,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_parcel_id",
   "order": 12,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "approach_road_type",
   "order": 13,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 14,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "site_plan",
   "order": 15,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 16,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_COMM'",
   "section": "Category-specific"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_INDUSTRIAL": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_shape",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "road_width",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_frontage",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 7,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_status",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_authority",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_parcel_id",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "approach_road_type",
   "order": 11,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 12,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "site_plan",
   "order": 13,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 14,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INDUSTRIAL'",
   "section": "Category-specific"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_AGRI": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_shape",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 5,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_conversion_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_parcel_id",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "tehsil_taluk",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "approach_road_type",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 11,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 12,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_AGRI'",
   "section": "Category-specific"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_FARM": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_conversion_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_parcel_id",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_FARM'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_MIXED": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_authority",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_number",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_INSTITUTIONAL": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "layout_approval_authority",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_INSTITUTIONAL'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_WAREHOUSE": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "approach_road_type",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_REDEVELOP": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_REDEVELOP'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_REDEVELOP'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_REDEVELOP'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'LAND_REDEVELOP'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_REDEVELOP'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_REDEVELOP'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "LAND_LEASEHOLD": [
  {
   "field": "plot_length",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_LEASEHOLD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "plot_width",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_LEASEHOLD'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dimension_unit",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_LEASEHOLD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_LEASEHOLD'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_document",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'LAND_LEASEHOLD'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_OFFICE": [
  {
   "field": "floor_number",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "commercial_frontage",
   "order": 8,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 9,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "project_name",
   "order": 10,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_OFFICE'",
   "section": "Category-specific"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_RETAIL": [
  {
   "field": "floor_number",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "commercial_frontage",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_RETAIL'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_SCO": [
  {
   "field": "floor_number",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_SCO'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_SCO'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "commercial_frontage",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_SCO'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_SCO'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_SCO'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_SCO'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_FOOD": [
  {
   "field": "floor_number",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_FOOD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_FOOD'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "commercial_frontage",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_FOOD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_FOOD'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_FOOD'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_FOOD'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_CLINIC": [
  {
   "field": "floor_number",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_CLINIC'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_CLINIC'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "furnishing_status",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_CLINIC'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_CLINIC'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_CLINIC'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_CLINIC'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_HOTEL": [
  {
   "field": "year_built",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_HOTEL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_HOTEL'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_HOTEL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_HOTEL'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_units",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_HOTEL'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_HOTEL'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_MALL": [
  {
   "field": "year_built",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MALL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MALL'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MALL'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MALL'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_units",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MALL'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "available_units",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MALL'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_COWORK": [
  {
   "field": "floor_number",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_COWORK'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_COWORK'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_COWORK'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_COWORK'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_units",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_COWORK'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "available_units",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_COWORK'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_BUILDING": [
  {
   "field": "total_floors",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_units",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_BUILDING'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "COMM_MIXED": [
  {
   "field": "total_floors",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "lift_available",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "occupancy_status",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'COMM_MIXED'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "IND_FACTORY": [
  {
   "field": "clear_height",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_loading",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dock_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 7,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_FACTORY'",
   "section": "Category-specific"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "IND_WAREHOUSE": [
  {
   "field": "clear_height",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_loading",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dock_count",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 6,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WAREHOUSE'",
   "section": "Category-specific"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "IND_COLD": [
  {
   "field": "clear_height",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_COLD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_loading",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_COLD'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "temperature_range",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_COLD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_COLD'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dock_count",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_COLD'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "IND_WORKSHOP": [
  {
   "field": "clear_height",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WORKSHOP'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_loading",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WORKSHOP'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WORKSHOP'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "parking_count",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_WORKSHOP'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "IND_LOGISTICS": [
  {
   "field": "clear_height",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_LOGISTICS'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "floor_loading",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_LOGISTICS'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "dock_count",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_LOGISTICS'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_LOGISTICS'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "total_floors",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_LOGISTICS'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "IND_DATA": [
  {
   "field": "clear_height",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_DATA'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_load",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_DATA'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "power_backup",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_DATA'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "year_built",
   "order": 4,
   "requiredOverride": "conditional",
   "show": "category_id == 'IND_DATA'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "AGRI_ORCHARD": [
  {
   "field": "land_parcel_id",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_ORCHARD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_ORCHARD'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_ORCHARD'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'AGRI_ORCHARD'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_conversion_status",
   "order": 5,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_ORCHARD'",
   "section": "Category-specific"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "AGRI_DAIRY": [
  {
   "field": "land_parcel_id",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_DAIRY'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_DAIRY'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_DAIRY'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'AGRI_DAIRY'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "AGRI_POULTRY": [
  {
   "field": "land_parcel_id",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_POULTRY'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_POULTRY'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_POULTRY'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'AGRI_POULTRY'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "AGRI_AQUA": [
  {
   "field": "land_parcel_id",
   "order": 1,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_AQUA'",
   "section": "Category-specific"
  },
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "village_mauza",
   "order": 2,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_AQUA'",
   "section": "Category-specific"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "water_source",
   "order": 3,
   "requiredOverride": "conditional",
   "show": "category_id == 'AGRI_AQUA'",
   "section": "Category-specific"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "land_use_zoning",
   "order": 4,
   "requiredOverride": "yes",
   "show": "category_id == 'AGRI_AQUA'",
   "section": "Category-specific"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_COTTAGE": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "RES_MANSION": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "SPEC_SCHOOL": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "SPEC_HOSPITAL": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "SPEC_RELIGIOUS": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "SPEC_SPORTS": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "SPEC_CINEMA": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "SPEC_GOVT": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "HOSP_RESORT": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "HOSP_SERVAPT": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "HOSP_HOMESTAY": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "PARK_SPACE": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "PARK_GARAGE": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ],
 "PARK_LOCKER": [
  {
   "field": "listing_intent",
   "order": 1,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asset_category_id",
   "order": 2,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "listing_title",
   "order": 3,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "description",
   "order": 4,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "country_code",
   "order": 5,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "state_code",
   "order": 6,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "city_id",
   "order": 7,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "locality",
   "order": 8,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "district",
   "order": 9,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "currency_code",
   "order": 10,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "asking_price",
   "order": 11,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_value",
   "order": 12,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_unit",
   "order": 13,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "area_basis",
   "order": 14,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "possession_status",
   "order": 15,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "ownership_type",
   "order": 16,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_role",
   "order": 17,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "seller_entity_name",
   "order": 18,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "contact_phone",
   "order": 19,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "media_photos",
   "order": 20,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  },
  {
   "field": "clear_title_claim",
   "order": 21,
   "requiredOverride": "inherit",
   "show": "always",
   "section": "Basics"
  }
 ]
};

export const CONDITIONAL_RULES: SpecRule[] = [
 {
  "id": "R001",
  "priority": 10,
  "when": "listing_intent == 'sale'",
  "action": "show",
  "targets": [
   "asking_price"
  ],
  "message": "Show sale price"
 },
 {
  "id": "R002",
  "priority": 10,
  "when": "listing_intent in ['rent','lease_out']",
  "action": "show_and_require",
  "targets": [
   "monthly_rent"
  ],
  "message": "Show rent/lease amount"
 },
 {
  "id": "R003",
  "priority": 10,
  "when": "asset_category_id starts_with 'RES_' OR asset_category_id in residential_unit_ids",
  "action": "show",
  "targets": [
   "bedrooms",
   "bathrooms",
   "furnishing_status"
  ],
  "message": "Residential unit attributes"
 },
 {
  "id": "R004",
  "priority": 10,
  "when": "asset_category_id starts_with 'LAND_'",
  "action": "show_and_require",
  "targets": [
   "land_use_zoning"
  ],
  "message": "Show land-use and require declared zoning"
 },
 {
  "id": "R005",
  "priority": 10,
  "when": "asset_category_id starts_with 'LAND_'",
  "action": "show",
  "targets": [
   "plot_length",
   "plot_width",
   "plot_shape",
   "road_width",
   "plot_frontage",
   "corner_plot",
   "plot_level"
  ],
  "message": "Plot parcel dimensions and access"
 },
 {
  "id": "R006",
  "priority": 10,
  "when": "asset_category_id == 'LAND_AGRI' OR asset_category_id == 'LAND_FARM'",
  "action": "show",
  "targets": [
   "land_conversion_status"
  ],
  "message": "Show agricultural conversion status"
 },
 {
  "id": "R007",
  "priority": 10,
  "when": "asset_category_id == 'RES_PENT' OR property_subtype == 'penthouse'",
  "action": "show_and_require",
  "targets": [
   "penthouse_level",
   "penthouse_floor_position"
  ],
  "message": "Penthouse-specific configuration"
 },
 {
  "id": "R008",
  "priority": 10,
  "when": "asset_category_id == 'RES_PENT'",
  "action": "show",
  "targets": [
   "private_terrace_area",
   "terrace_rights",
   "private_pool",
   "private_lift_lobby",
   "double_height",
   "ceiling_height",
   "view_type"
  ],
  "message": "Premium penthouse features"
 },
 {
  "id": "R009",
  "priority": 10,
  "when": "terrace_rights in ['deeded_exclusive','exclusive_use']",
  "action": "require",
  "targets": [
   "ownership_document"
  ],
  "message": "Require evidence for terrace claim"
 },
 {
  "id": "R010",
  "priority": 10,
  "when": "possession_status == 'under_construction' OR possession_status == 'new_launch'",
  "action": "show",
  "targets": [
   "possession_date",
   "project_name",
   "developer_id",
   "rera_applicable",
   "rera_registration_number"
  ],
  "message": "Under-construction/project fields"
 },
 {
  "id": "R011",
  "priority": 10,
  "when": "rera_applicable == 'yes'",
  "action": "require",
  "targets": [
   "rera_registration_number",
   "rera_authority_state"
  ],
  "message": "Require RERA identifiers"
 },
 {
  "id": "R012",
  "priority": 10,
  "when": "seller_role == 'developer' OR seller_role == 'builder'",
  "action": "show",
  "targets": [
   "developer_id",
   "project_name",
   "project_phase",
   "approval_documents"
  ],
  "message": "Developer/project section"
 },
 {
  "id": "R013",
  "priority": 10,
  "when": "seller_role in ['agent','broker']",
  "action": "show_and_require",
  "targets": [
   "agent_rera_number",
   "exclusive_mandate"
  ],
  "message": "Agent credentials and authority"
 },
 {
  "id": "R014",
  "priority": 10,
  "when": "seller_role in ['co_owner','authorized_signatory','power_of_attorney_holder']",
  "action": "show_and_require",
  "targets": [
   "ownership_share",
   "ownership_document"
  ],
  "message": "Authority to list / ownership evidence"
 },
 {
  "id": "R015",
  "priority": 10,
  "when": "asset_category_id starts_with 'COMM_'",
  "action": "show",
  "targets": [
   "commercial_frontage",
   "power_load",
   "occupancy_status"
  ],
  "message": "Commercial-unit fields"
 },
 {
  "id": "R016",
  "priority": 10,
  "when": "asset_category_id starts_with 'IND_'",
  "action": "show",
  "targets": [
   "clear_height",
   "floor_loading",
   "power_load",
   "dock_count"
  ],
  "message": "Industrial specifications"
 },
 {
  "id": "R017",
  "priority": 10,
  "when": "listing_intent in ['rent','lease_out']",
  "action": "show",
  "targets": [
   "security_deposit",
   "available_from",
   "lease_term_months"
  ],
  "message": "Rental / lease terms"
 },
 {
  "id": "R018",
  "priority": 10,
  "when": "latitude is not null AND longitude is not null",
  "action": "validate",
  "targets": [
   "latitude",
   "longitude"
  ],
  "message": "Coordinates must be valid"
 },
 {
  "id": "R019",
  "priority": 10,
  "when": "ownership_type == 'leasehold' OR ownership_type == 'government_lease'",
  "action": "show_and_require",
  "targets": [
   "ownership_document"
  ],
  "message": "Tenure document required"
 },
 {
  "id": "R020",
  "priority": 10,
  "when": "asset_category_id == 'RES_FARMHOUSE'",
  "action": "show",
  "targets": [
   "land_use_zoning",
   "plot_length",
   "plot_width",
   "land_conversion_status"
  ],
  "message": "Farmhouse land and structure attributes"
 },
 {
  "id": "R021",
  "priority": 10,
  "when": "listing_intent == 'auction'",
  "action": "show",
  "targets": [
   "auction_reserve_price",
   "auction_start_at",
   "auction_end_at",
   "auctioneer_details"
  ],
  "message": "Auction extension fields"
 },
 {
  "id": "R022",
  "priority": 10,
  "when": "listing_intent == 'joint_venture'",
  "action": "show",
  "targets": [
   "development_potential",
   "permitted_fsi_far",
   "landowner_share",
   "developer_share"
  ],
  "message": "JV extension fields"
 },
 {
  "id": "R023",
  "priority": 10,
  "when": "media_photos count < 5",
  "action": "warn",
  "targets": [
   "media_photos"
  ],
  "message": "Recommend at least five images"
 },
 {
  "id": "R024",
  "priority": 10,
  "when": "area_basis == 'plot' AND asset_category_id not starts_with 'LAND_'",
  "action": "warn",
  "targets": [
   "area_basis"
  ],
  "message": "Plot basis selected for non-land asset"
 },
 {
  "id": "R025",
  "priority": 10,
  "when": "total_floors is not null AND floor_number > total_floors",
  "action": "block",
  "targets": [
   "floor_number"
  ],
  "message": "Unit floor cannot exceed total floors"
 },
 {
  "id": "R026",
  "priority": 10,
  "when": "available_units > total_units",
  "action": "block",
  "targets": [
   "available_units"
  ],
  "message": "Available units cannot exceed total units"
 },
 {
  "id": "R027",
  "priority": 10,
  "when": "land_conversion_status == 'not_converted' AND land_use_zoning != 'agricultural'",
  "action": "warn",
  "targets": [
   "land_conversion_status"
  ],
  "message": "Potential inconsistency: conversion and zoning"
 },
 {
  "id": "R028",
  "priority": 10,
  "when": "map_visibility == 'exact'",
  "action": "show",
  "targets": [
   "address_line"
  ],
  "message": "Exact address visibility selected"
 }
];
