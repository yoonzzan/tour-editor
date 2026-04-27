
import ExcelJS from 'exceljs';
import { QuoteItem, QuoteMeta } from '@/types';
import { groupItemsByDate } from '@/lib/export-utils';
import { saveAs } from 'file-saver';
import { fetchCroppedImage, generateSafeFilename } from './common';

/**
 * Generates and downloads the Itinerary (일정표) - Explicitly Matching React UI with Professional Excel Layout
 */
export async function downloadItineraryExcel(items: QuoteItem[], partnerName: string = '하나투어', city: string = '', meta?: QuoteMeta, quoteTitle?: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('여행일정표', {
        pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });

    // --- 9-Column Grid System ---
    // Total Width: 9 * 13 = 117 (A4 Friendly)
    // Mapping:
    // Itinerary: [Date:1][Loc:1][Trans:1][Time:1][Detail:3][Meal:2]
    // Summary:   [Label:1][Val:1][Label:1][Val:1][Label:2][Val:3] -> Perfect Ratio!
    sheet.columns = Array(9).fill(null).map((_, i) => ({ key: `c${i + 1}`, width: 13 }));

    // --- Styles Constants ---
    const FONT_FAMILY = 'Malgun Gothic';
    const BORDER_COLOR = 'FFD1D5DB'; // Light Gray reflecting Web UI
    const HEADER_BG = 'FF5E27A5'; // Brand Purple
    const LABEL_BG = 'FFF3E8FF'; // Light Purple

    const baseFont = { name: FONT_FAMILY, size: 10 };
    const boldFont = { name: FONT_FAMILY, size: 10, bold: true };
    const purpleFont = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: HEADER_BG } };
    const whiteFont = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

    const centerStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center', wrapText: true };
    const leftStyle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };

    const thinBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } }
    };

    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
    const labelFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LABEL_BG } };
    const whiteFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    // --- Helper to Apply Style ---
    const applyCellStyle = (cell: ExcelJS.Cell, styleType: 'label' | 'value' | 'header' | 'normal') => {
        if (styleType === 'label') {
            cell.fill = labelFill;
            cell.font = purpleFont;
            cell.alignment = centerStyle;
        } else if (styleType === 'header') {
            cell.fill = headerFill;
            cell.font = whiteFont;
            cell.alignment = centerStyle;
        } else if (styleType === 'value') {
            cell.fill = whiteFill;
            cell.font = baseFont;
            cell.alignment = centerStyle;
        } else {
            cell.font = baseFont;
            cell.alignment = centerStyle;
        }
        cell.border = thinBorder;
    };

    // Helper to merge and style a range
    const mergeAndStyle = (row: number, startCol: number, endCol: number, type: 'label' | 'value' | 'header' | 'normal', text: any) => {
        if (endCol > startCol) {
            sheet.mergeCells(row, startCol, row, endCol);
        }
        const cell = sheet.getCell(row, startCol);
        cell.value = text;
        applyCellStyle(cell, type);

        // Apply borders to all included cells
        for (let c = startCol; c <= endCol; c++) {
            sheet.getCell(row, c).border = thinBorder;
        }
        return cell;
    };

    // --- 1. Header Section ---
    sheet.getRow(1).height = 35;
    sheet.getRow(2).height = 35;

    // Logo: A1:B2 (2 cols)
    sheet.mergeCells('A1:B2');

    // Title: C1:G2 (5 cols) -> Center (2:5:2 Balance)
    sheet.mergeCells('C1:G2');

    // Date: H1:I2 (2 cols) -> Right
    sheet.mergeCells('H1:I2');

    // Logo
    try {
        const logoUrl = '/images/hanatour_logo.png';
        const { buffer: logoBuffer, width: imgW, height: imgH } = await fetchCroppedImage(logoUrl);
        const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });

        let w = 160, h = 40;
        if (imgW > 0 && imgH > 0) { const r = imgW / imgH; h = w / r; }

        sheet.addImage(logoId, {
            tl: { col: 0.1, row: 0.15 },
            ext: { width: w, height: h },
            editAs: 'oneCell'
        });
    } catch (e) { }

    // Title
    const titleCell = sheet.getCell('C1');
    titleCell.value = quoteTitle || meta?.title || `${city} 여행 견적`;
    titleCell.font = { name: FONT_FAMILY, size: 20, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Date
    const dateCell = sheet.getCell('H1');
    dateCell.value = { richText: [{ text: `견적 작성일: ${new Date().toLocaleDateString()}`, font: { name: FONT_FAMILY, size: 10 } }] };
    dateCell.alignment = { vertical: 'middle', horizontal: 'right' };

    sheet.getRow(3).height = 15; // Spacer
    let r = 4;

    // Helper to draw thick outer border
    const drawOuterBorder = (startR: number, endR: number) => {
        const mediumStyle = 'medium';
        // Top
        for (let c = 1; c <= 9; c++) {
            const cell = sheet.getCell(startR, c);
            cell.border = { ...cell.border, top: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
        // Bottom
        for (let c = 1; c <= 9; c++) {
            const cell = sheet.getCell(endR, c);
            cell.border = { ...cell.border, bottom: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
        // Left (Col 1)
        for (let r = startR; r <= endR; r++) {
            const cell = sheet.getCell(r, 1);
            cell.border = { ...cell.border, left: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
        // Right (Col 9)
        for (let r = startR; r <= endR; r++) {
            const cell = sheet.getCell(r, 9);
            cell.border = { ...cell.border, right: { style: mediumStyle, color: { argb: 'FF000000' } } };
        }
    };

    // --- 2. Summary Table ---
    const summaryStartRow = r;
    // Row 4: Info header and values
    // [1:Label][2:Val][3:Label][4:Val][5-6:Label][7-9:Val]
    sheet.getRow(r).height = 22;
    mergeAndStyle(r, 1, 1, 'label', '수 신');
    mergeAndStyle(r, 2, 2, 'value', meta?.recipient || '-');
    mergeAndStyle(r, 3, 3, 'label', '여행도시');
    mergeAndStyle(r, 4, 4, 'value', city || '-');
    mergeAndStyle(r, 5, 6, 'label', '여행기간');
    mergeAndStyle(r, 7, 9, 'value', (meta?.startDate && meta?.endDate) ? `${meta.startDate} ~ ${meta.endDate}` : '-');
    r++;

    // Row 5: Pax
    // [1:Label][2-4:Val][5-6:Leader][7-9:Single]
    const totalAdults = meta?.adultPax ?? (items[0]?.qtyAdult || 0);
    const totalChildren = meta?.childPax ?? 0;
    const totalInfants = meta?.infantPax ?? 0;
    const paxString = `성인 ${totalAdults}, 아동 ${totalChildren}, 유아 ${totalInfants}`;

    sheet.getRow(r).height = 22;
    mergeAndStyle(r, 1, 1, 'label', '인 원');
    mergeAndStyle(r, 2, 4, 'value', paxString);

    // Leader (with override for background if needed, but 'value' style does white fill)
    const leaderCell = mergeAndStyle(r, 5, 6, 'value', {
        richText: [{ text: '인솔자: ', font: purpleFont }, { text: `${meta?.leaderCount || 0}명`, font: baseFont }]
    });

    // Single Room
    const singleCell = mergeAndStyle(r, 7, 9, 'value', {
        richText: [{ text: '1인실: ', font: purpleFont }, { text: meta?.singleRoomCost ? `W ${parseInt(String(meta.singleRoomCost).replace(/,/g, '')).toLocaleString()}` : '-', font: baseFont }]
    });
    r++;

    // Row 6: Price Headers
    // [1:Label][2:A][3:C][4:I][5-6:Total][7-9:Card]
    sheet.getRow(r).height = 22;
    mergeAndStyle(r, 1, 1, 'label', '여행 요금');
    mergeAndStyle(r, 2, 2, 'label', '성인 인당');
    mergeAndStyle(r, 3, 3, 'label', '아동 인당');
    mergeAndStyle(r, 4, 4, 'label', '유아 인당');
    mergeAndStyle(r, 5, 6, 'label', '총 금액');
    mergeAndStyle(r, 7, 9, 'label', '카드 결제 시 금액');
    // Reduce font size for headers if needed
    [2, 3, 4].forEach(c => sheet.getCell(r, c).font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: HEADER_BG } });
    r++;

    // Row 7: Price Values
    const parsePrice = (v: any) => v ? parseInt(String(v).replace(/,/g, '') || '0') : 0;
    const priceAdultVal = meta?.priceAdult ? parsePrice(meta.priceAdult) : 0;
    const priceChildVal = meta?.priceChild ? parsePrice(meta.priceChild) : 0;
    const priceInfantVal = meta?.priceInfant ? parsePrice(meta.priceInfant) : 0;
    const grandTotal = (priceAdultVal * totalAdults) + (priceChildVal * totalChildren) + (priceInfantVal * totalInfants);
    const displayTotal = meta?.priceAdult || meta?.priceChild || meta?.priceInfant ? grandTotal : 0;

    sheet.getRow(r).height = 22;
    // Merge Label Vertical (Voyage Fee Label from prev row)
    sheet.mergeCells(r - 1, 1, r, 1);

    mergeAndStyle(r, 2, 2, 'value', `W ${priceAdultVal.toLocaleString()}`);
    mergeAndStyle(r, 3, 3, 'value', priceChildVal > 0 ? `W ${priceChildVal.toLocaleString()}` : '-');
    mergeAndStyle(r, 4, 4, 'value', priceInfantVal > 0 ? `W ${priceInfantVal.toLocaleString()}` : '-');
    mergeAndStyle(r, 5, 6, 'value', `W ${displayTotal.toLocaleString()}`);
    mergeAndStyle(r, 7, 9, 'value', meta?.priceCardTotal ? `W ${parseInt(String(meta.priceCardTotal).replace(/,/g, '')).toLocaleString()}` : '-');

    r++;
    drawOuterBorder(summaryStartRow, r - 1); // Draw border for Summary Table

    sheet.getRow(r).height = 8; r++; // Spacer

    // --- 3. Details Table ---
    const detailsStartRow = r;
    // [1:Label][2-7:Content][8-9:Remark]
    sheet.getRow(r).height = 20; // Reduced Header Height
    mergeAndStyle(r, 1, 1, 'header', '구 분');
    mergeAndStyle(r, 2, 7, 'header', '내 용');
    mergeAndStyle(r, 8, 9, 'header', '비 고');
    r++;

    const addDetailRow = (label: string, content: string, remark: string = '') => {
        const row = sheet.getRow(r);
        const lineCount = content.split('\n').length;
        // Tight Fit: Base 15, Line 12.5
        if (lineCount > 1 || content.length > 50) row.height = Math.max(15, lineCount * 12.5 + 2);
        else row.height = 15;

        mergeAndStyle(r, 1, 1, 'label', label);

        const cContent = mergeAndStyle(r, 2, 7, 'value', content);
        cContent.alignment = leftStyle;

        const remarkCell = mergeAndStyle(r, 8, 9, 'normal', remark);
        remarkCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }; // Left Align
        r++;
    };

    const flightText = `[출발] ${meta?.flightDeparture || '-'} ${meta?.flightDepartureTime || ''}\n[도착] ${meta?.flightReturn || '-'} ${meta?.flightReturnTime || ''}\n[현지차량] ${meta?.vehicleType || '-'}`;
    addDetailRow('항공/차량', flightText, meta?.flightRemarks);
    const hotelText = `[호텔] ${meta?.hotelName || '-'}\n[등급] ${meta?.hotelGrade || '-'}   [이용인원] ${meta?.hotelRoomStd || '-'}`;
    addDetailRow('숙박', hotelText, meta?.hotelRemarks);
    addDetailRow('포함사항', meta?.included || '', meta?.includedRemarks);
    addDetailRow('불포함사항', meta?.excluded || '', meta?.excludedRemarks);
    addDetailRow('선택관광', meta?.optionalTour || '', meta?.optionalTourRemarks);
    addDetailRow('쇼핑센터', meta?.shoppingCenter || '', meta?.shoppingCenterRemarks);
    addDetailRow('유의사항', meta?.remarks || '', '');

    drawOuterBorder(detailsStartRow, r - 1); // Draw border for Details Table

    sheet.getRow(r).height = 10; r++; // Single Spacer

    // --- 4. Itinerary Table ---
    const itineraryStartRow = r;
    // [1:Date][2:Loc][3:Trans][4:Time][5-7:Detail][8-9:Meal]
    sheet.getRow(r).height = 20; // Reduced Header Height
    mergeAndStyle(r, 1, 1, 'header', '일자');
    mergeAndStyle(r, 2, 2, 'header', '지역');
    mergeAndStyle(r, 3, 3, 'header', '교통편');
    mergeAndStyle(r, 4, 4, 'header', '시간');
    mergeAndStyle(r, 5, 7, 'header', '세부일정');
    mergeAndStyle(r, 8, 9, 'header', '식사');

    // Draw lighter border for header grid
    for (let c = 1; c <= 9; c++) sheet.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: '50FFFFFF' } },
        left: { style: 'thin', color: { argb: '50FFFFFF' } },
        bottom: { style: 'thin', color: { argb: '50FFFFFF' } },
        right: { style: 'thin', color: { argb: '50FFFFFF' } }
    };
    r++;

    const groupedDays = groupItemsByDate(items);

    groupedDays.forEach((day, dIdx) => {
        const startRow = r;
        const dayItems = day.items.filter(i => !['숙박', '식사', '호텔'].includes(i.category) && i.name !== '자유식' && i.name !== '현지식');
        if (dayItems.length === 0) dayItems.push({ name: '전일 자유 일정', category: '기타' } as any);

        dayItems.forEach((item, idx) => {
            const row = sheet.getRow(r);

            // 2-7: Detail Logic (Merge 5-7)
            const detailLines = item.detail ? item.detail.split('\n').length : 0;

            // Tight Layout Calculation
            if (detailLines > 0) {
                // (Title + Details) * line-height + minimal padding
                row.height = Math.max(15, (1 + detailLines) * 12.5 + 2);
            } else {
                row.height = 15; // Standard Single Line Height
            }

            // 1: Date (Merged later)
            sheet.getCell(r, 1).border = thinBorder;

            // 2: Location
            // Only show location if explicitly set on the item
            sheet.getCell(r, 2).value = item.location || '';
            applyCellStyle(sheet.getCell(r, 2), 'normal');

            // 3: Transport
            let transport = item.transport || '';
            // if (!transport && item.category === '항공') transport = '항공이동';
            // else if (!transport && item.category === '차량') transport = '전용차량';
            sheet.getCell(r, 3).value = transport;
            applyCellStyle(sheet.getCell(r, 3), 'normal');

            // 4: Time
            sheet.getCell(r, 4).value = (item as any).time || '';
            applyCellStyle(sheet.getCell(r, 4), 'normal');

            // 5-7: Detail
            const richText: any[] = [{ text: item.name, font: { name: FONT_FAMILY, bold: true, size: 10 } }];
            if (item.detail) richText.push({ text: `\n${item.detail}`, font: { name: FONT_FAMILY, size: 9, color: { argb: 'FF555555' } } });

            const detailCell = mergeAndStyle(r, 5, 7, 'normal', { richText });
            detailCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left', indent: 1 };

            // 8-9: Meal (Merged later) - DO NOT MERGE HERE
            // Just apply borders to keep grid consistent visually until merged later
            sheet.getCell(r, 8).border = thinBorder;
            sheet.getCell(r, 9).border = thinBorder;

            r++;
        });

        // Hotel Row
        if (day.hotel) {
            const hRow = sheet.getRow(r);
            hRow.height = 18; // Reduced to 18

            // Style cells blank first
            for (let c = 1; c <= 9; c++) {
                hRow.getCell(c).border = thinBorder;
                hRow.getCell(c).fill = whiteFill; // Clear
            }

            // Cell 5 (Detail Area) with Badge Look
            const badgeCell = hRow.getCell(5);
            sheet.mergeCells(r, 5, r, 7);
            badgeCell.value = {
                richText: [
                    { text: ' [숙박] ', font: { name: FONT_FAMILY, bold: true, color: { argb: 'FF5E27A5' } } }, // Purple Text
                    { text: ` ${day.hotel}`, font: { name: FONT_FAMILY, bold: true, size: 10 } }
                ]
            };
            badgeCell.fill = labelFill; // Light Purple Background
            badgeCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            badgeCell.border = thinBorder;

            // 8-9: Meal consistency (DO NOT MERGE HERE)
            sheet.getCell(r, 8).border = thinBorder;
            sheet.getCell(r, 9).border = thinBorder;

            r++;
        }

        const endRow = r - 1;
        if (endRow >= startRow) {
            // Merge C1 (Date)
            if (endRow > startRow) sheet.mergeCells(startRow, 1, endRow, 1);
            const dateCell = sheet.getCell(startRow, 1);
            dateCell.value = {
                richText: [
                    { text: `제 ${day.dayNumber} 일\n`, font: { name: FONT_FAMILY, bold: true, size: 11 } },
                    { text: `${day.date}\n`, font: { name: FONT_FAMILY, size: 9, color: { argb: 'FF555555' } } },
                    { text: `(${day.weekday})`, font: { name: FONT_FAMILY, size: 9, color: { argb: 'FF555555' } } }
                ]
            };
            applyCellStyle(dateCell, 'normal');
            dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Light Gray like Web
            dateCell.alignment = centerStyle;

            // Merge C8-C9 (Meals)
            sheet.mergeCells(startRow, 8, endRow, 9);
            const mealCell = sheet.getCell(startRow, 8);
            mealCell.value = {
                richText: [
                    { text: '조식  ', font: { bold: true } }, { text: `${day.meals.breakfast || 'X'}\n` },
                    { text: '중식  ', font: { bold: true } }, { text: `${day.meals.lunch || 'X'}\n` },
                    { text: '석식  ', font: { bold: true } }, { text: `${day.meals.dinner || 'X'}` }
                ]
            };
            applyCellStyle(mealCell, 'normal');
            mealCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Light Gray like Web
            mealCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };

            // Re-apply borders to merged meal cells to be safe
            for (let rr = startRow; rr <= endRow; rr++) {
                sheet.getCell(rr, 8).border = thinBorder;
                sheet.getCell(rr, 9).border = thinBorder;
            }

            // Day Separator: Thick Bottom Border across ALL columns (1-9)
            // Use explicit loop because .eachCell skips empty cells, causing broken lines
            for (let c = 1; c <= 9; c++) {
                const cell = sheet.getCell(endRow, c);
                const existing = cell.border || {};
                cell.border = {
                    top: existing.top || thinBorder.top,
                    left: existing.left || thinBorder.left,
                    right: existing.right || thinBorder.right,
                    bottom: { style: 'medium', color: { argb: 'FF000000' } }
                };
            }
        }
    });

    // Outer Border for Itinerary Table
    drawOuterBorder(itineraryStartRow, r - 1);

    // --- 5. Footer Section (웹 출력과 동일) ---
    r += 2; // Spacer

    // 1. 문구: 상기 일정은 항공 및 현지 사정에 의해 다소 변경될 수 있습니다.
    sheet.mergeCells(r, 1, r, 9);
    const disclaimerCell = sheet.getCell(r, 1);
    disclaimerCell.value = '상기 일정은 항공 및 현지 사정에 의해 다소 변경될 수 있습니다.';
    disclaimerCell.font = { name: FONT_FAMILY, size: 10 };
    disclaimerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    r++;

    sheet.getRow(r).height = 12; // 문구와 날짜 사이 여백
    r++;

    // 2. 오늘 날짜 (웹과 동일: 한국어 긴 형식)
    sheet.mergeCells(r, 1, r, 9);
    const footerDateCell = sheet.getCell(r, 1);
    footerDateCell.value = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    footerDateCell.font = { name: FONT_FAMILY, size: 11 };
    footerDateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    r++;

    // 3. (주) 하나투어
    sheet.mergeCells(r, 1, r, 9);
    const companyCell = sheet.getCell(r, 1);
    companyCell.value = '(주) 하나투어';
    companyCell.font = { name: FONT_FAMILY, size: 14, bold: true };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- 6. Save ---
    const buffer = await workbook.xlsx.writeBuffer();
    // Convert to Uint8Array to handle Node Buffer vs ArrayBuffer environments correctly
    const blob = new Blob([new Uint8Array(buffer as any)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Standardized Filename
    const fileName = generateSafeFilename('여행일정표', quoteTitle || meta?.title);
    saveAs(blob, fileName);
}
