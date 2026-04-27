import { QuoteItem } from '@/types';

// Order of categories for Cost Sheet (Priority: 1.항공 > 2.숙박 > 3.식사 > 4.차량 > 5.가이드 > 6.관광 > 7.기타)
export const CATEGORY_ORDER = ['항공', '숙박', '식사', '차량', '가이드', '관광', '기타'];
export const NON_DAILY_CATEGORIES = ['항공', 'Hotel', '호텔', '숙박', '차량', '가이드', '기사', '기타', '보험', '인솔자'];

export interface GroupedCostItem {
    category: string;
    items: QuoteItem[];
    subtotal: number;
}

export function groupItemsByCategory(items: QuoteItem[]): GroupedCostItem[] {
    const groups: Record<string, GroupedCostItem> = {};

    // Initialize groups based on order
    CATEGORY_ORDER.forEach(cat => {
        groups[cat] = {
            category: cat,
            items: [],
            subtotal: 0
        };
    });

    // Distribute items
    items.forEach(item => {
        // Normalize: Map '호텔' to '숙박' to ensure it falls into the correct bucket
        let groupKey = item.category as string;
        if (groupKey === '호텔') groupKey = '숙박';

        if (!groups[groupKey]) {
            // Fallback to '기타' if category not found in predefined list
            if (!groups['기타']) groups['기타'] = { category: '기타', items: [], subtotal: 0 };
            groups['기타'].items.push(item);
            groups['기타'].subtotal += (item.totalPriceKrw || 0);
        } else {
            groups[groupKey].items.push(item);
            groups[groupKey].subtotal += (item.totalPriceKrw || 0);
        }
    });

    // Process priority groups
    return CATEGORY_ORDER
        .map(cat => groups[cat])
        .filter(group => group && group.items.length > 0)
        .map(group => {
            // Sort items within group: 1. Date (Asc), 2. Keep Input Order (Stable sort by default in JS)
            group.items.sort((a, b) => {
                const dateA = a.date || '9999-99-99';
                const dateB = b.date || '9999-99-99';
                return dateA.localeCompare(dateB);
            });
            return group;
        });
}

// ITINERARY UTILS

export interface ItineraryDay {
    date: string; // YYYY-MM-DD
    dayNumber: number; // 1, 2...
    weekday: string; // Mon, Tue...
    items: QuoteItem[];
    meals: {
        breakfast: string;
        lunch: string;
        dinner: string;
    };
    hotel?: string;
}

export function groupItemsByDate(items: QuoteItem[], startDateStr?: string): ItineraryDay[] {
    const days: Record<string, ItineraryDay> = {};

    const sortedItems = [...items].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
    });

    sortedItems.forEach(item => {
        const dateKey = item.date || 'Unscheduled';
        if (!days[dateKey]) {
            days[dateKey] = {
                date: dateKey,
                dayNumber: 0,
                weekday: '',
                items: [],
                meals: { breakfast: '', lunch: '', dinner: '' },
                hotel: ''
            };
        }

        // Categorize
        if (item.category === '식사') {
            const text = (item.name + (item.detail || '')).toLowerCase();

            // Helper to clean meal text
            const clean = (str: string, ...keywords: string[]) => {
                let s = str;
                keywords.forEach(k => {
                    // Remove [Key], (Key), Key:, Key-, or just Key at start
                    // Also handle ending " Key" cases carefully if needed, but start/wrapper is most common.
                    const pattern = new RegExp(`([\\[\\(]${k}[\\]\\)]|${k}\\s*[:\\-]?\\s*)`, 'gi');
                    s = s.replace(pattern, '');
                });
                const trimmed = s.trim();
                return trimmed === '' ? 'O' : trimmed;
            };

            if (text.includes('조식') || text.includes('breakfast')) {
                const val = clean(item.name, '조식', 'breakfast');
                days[dateKey].meals.breakfast = days[dateKey].meals.breakfast ? `${days[dateKey].meals.breakfast}, ${val}` : val;
            } else if (text.includes('중식') || text.includes('lunch')) {
                const val = clean(item.name, '중식', 'lunch');
                days[dateKey].meals.lunch = days[dateKey].meals.lunch ? `${days[dateKey].meals.lunch}, ${val}` : val;
            } else if (text.includes('석식') || text.includes('dinner')) {
                const val = clean(item.name, '석식', 'dinner');
                days[dateKey].meals.dinner = days[dateKey].meals.dinner ? `${days[dateKey].meals.dinner}, ${val}` : val;
            } else {
                days[dateKey].items.push(item);
            }
        } else {
            // Include Hotel and others in the main list
            if (item.category === '숙박' || (item.category as any) === '호텔') {
                days[dateKey].hotel = item.name;
            }
            days[dateKey].items.push(item);
        }
    });

    const result = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));

    result.forEach((day, idx) => {
        if (day.date !== 'Unscheduled') {
            day.dayNumber = idx + 1;
            const d = new Date(day.date);
            const week = ['일', '월', '화', '수', '목', '금', '토'];
            day.weekday = week[d.getDay()];
        } else {
            day.dayNumber = 0;
            day.weekday = '-';
        }
    });

    return result;
}
