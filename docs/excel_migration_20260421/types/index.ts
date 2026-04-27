
export interface QuoteItem {
  id: string;
  category: '숙박' | '차량' | '관광' | '식사' | '가이드' | '기사' | '항공' | '기타';
  name: string;
  detail?: string;
  date: string;
  day?: number; // Added to fix lint errors, represents Day Number (e.g. 1, 2)
  time?: string; // HH:mm format for itinerary sorting
  location?: string; // e.g. Singapore, Sentosa
  transport?: string; // e.g. Private Van, MRT
  currency: string;
  exchangeRate?: number; // Optional: 이제 Global Rate만 사용 (참고용으로만 저장)

  // Consolidated Pricing Fields
  priceAdult: number;
  qtyAdult: number;
  priceChild: number;
  qtyChild: number;
  priceInfant: number;
  qtyInfant: number;

  totalPriceKrw: number;
  note?: string;
  // Cost Data for Dynamic Pricing (Phase 2)
  costData?: HotelCost | TourCost | MealCost | VehicleCost | GuideCost | DriverCost | MiscCost | FlightCost; // 원가 시트 행 참조
  pricingType?: 'hotel' | 'tour' | 'standard' | 'manual';
  // AI Reasoning
  reasoning?: string;
  isAiGenerated?: boolean;
}

export interface QuoteMeta {
  title: string;
  recipient: string; // 수신
  leaderCount: string; // 인솔자 인원
  singleRoomCost: string; // 1인실 비용

  // Manual Pricing Overrides (String to allow formatting like '1,500,000')
  priceAdult: string;
  priceChild: string;
  priceInfant: string;
  priceCardTotal?: string; // 카드 결제 시 총액
  cardCommissionRate?: string; // 카드 수수료율 (%)

  included: string; // 포함사항
  includedRemarks?: string;
  excluded: string; // 불포함사항
  excludedRemarks?: string;
  remarks: string; // 유의사항

  // Additional Info
  optionalTour: string;
  optionalTourRemarks?: string;
  shoppingCenter: string; // Replaces 'shopping'
  shoppingCenterRemarks?: string;

  // Flight Info
  flightDeparture: string;
  flightDepartureTime?: string; // e.g. 09:00
  flightReturn: string;
  flightReturnTime?: string; // e.g. 23:00
  flightRemarks: string;

  // Hotel Info
  hotelName: string;
  hotelGrade: string;
  hotelRoomStd: string;
  hotelRemarks: string;

  startDate?: string;
  endDate?: string;
  adultPax?: number;
  childPax?: number;
  infantPax?: number;
  focPax?: number;

  // Vehicle Info
  vehicleType: string;

  // Cost Sheet Meta
  commission: string; // 여행사 수수료
  vat: string; // VAT

  // Manager Info
  managerName?: string;
  managerContact?: string;

  // Additional Fields for AI Mapping and Hints
  otherRequests: string;
  country: string;
  city: string;
  requiredHintFlight?: string;
  requiredHintHotel?: string;
  requiredHintMeal?: string;
  requiredHintGuideTip?: string;
  requiredHintVehicle?: string;
  requiredHintShopping?: string;
}

export interface SheetRow {
  [key: string]: string | number | boolean | undefined | null;
}

export interface FlightCost extends SheetRow {
  airline: string;
  flightNumber: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  priceAdult: number;
  priceChild: number;
  priceInfant: number;
  tax: number;
  currency: string;
}

export interface HotelCost extends SheetRow {
  hotelNameKo: string;
  hotelNameEn: string;
  roomType: string;
  priceMon: number;
  priceTue: number;
  priceWed: number;
  priceThu: number;
  priceFri: number;
  priceSat: number;
  priceSun: number;
  priceBreakfastAdult: number;
  priceExtraBed: number;
  validFrom: string;
  validUntil: string;
  currency: string;
}

export interface TourCost extends SheetRow {
  tourNameKo: string;
  tourNameEn: string;
  tourType: string; // Ticket, PrivateTour, GroupTour
  priceAdult: number;
  priceChild: number;
  priceInfant: number;
  currency: string;
  minPax?: number;
  duration?: string;
}

export interface MealCost extends SheetRow {
  restaurantName: string;
  menuName: string;
  mealType: 'Lunch' | 'Dinner';
  priceAdult: number;
  priceChild: number;
  currency: string;
  minPax?: number;
}

export interface GuideCost extends SheetRow {
  guideType: string; // Korean, Local
  serviceType: string; // FullDay
  price: number;
  priceOvertimePerHour?: number;
  surchargeNight?: number;
  priceAccommodation?: number;
  priceMeal?: number;
  currency: string;
}

export interface DriverCost extends SheetRow {
  driverType: string; // GuideDriver, LocalDriver
  serviceType: string;
  price: number;
  priceOvertimePerHour?: number;
  surchargeNight?: number;
  priceAccommodation?: number;
  priceMeal?: number;
  currency: string;
}

export interface VehicleCost extends SheetRow {
  vehicleType: string;
  maxPax: number;
  serviceType: string;
  price: number;
  priceOvertimePerHour?: number;
  surchargeNight?: number;
  currency: string;
}

export interface MiscCost extends SheetRow {
  category: string; // Insurance, Visa, Sim, Etc
  itemName: string;
  priceAdult: number;
  priceChild: number;
  unit: string; // PerPerson, PerDay, PerTrip
  currency: string;
}

export interface SheetData {
  basicInfo: SheetRow[];
  flights: FlightCost[];
  hotels: HotelCost[];
  tours: TourCost[];
  meals: MealCost[];
  guides: GuideCost[];
  drivers: DriverCost[];
  vehicles: VehicleCost[];
  misc: MiscCost[];
  exchangeRates: SheetRow[];
}

export interface Partner {
  partner_code: string;
  partner_name: string;
  sheet_id: string;
  is_active: boolean;
}
