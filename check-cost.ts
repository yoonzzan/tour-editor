import { generateCostWorkbook } from './src/lib/excel/generateCostSheet.ts';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const quote = {
  header: { writtenAt: '2026-05-01' },
  items: [
    { id: '1', category: 'HOTEL', region: '-', date: '2026-05-01', description: '마리나베이샌즈', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '2', category: 'HOTEL', region: '-', date: '2026-05-02', description: '마리나베이샌즈', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '3', category: 'HOTEL', region: '-', date: '2026-05-03', description: '마리나베이샌즈 연박', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '4', category: 'HOTEL', region: '-', date: '2026-05-04', description: '마리나베이샌즈 연박', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '5', category: 'MEAL', region: '-', date: '2026-05-01', description: '조식', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '6', category: 'MEAL', region: '-', date: '2026-05-02', description: '조식 (호텔)', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '7', category: 'MEAL', region: '도쿄', date: '2026-05-01', description: '조식 조식22', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '8', category: 'SIGHTSEEING', region: '인천', date: '2026-05-01', description: '인천공항 출발', quantity: 1, unitPrice: 0, subtotal: 0 },
    { id: '9', category: 'SIGHTSEEING', region: '-', date: '2026-05-02', description: '센토사섬 관광', quantity: 1, unitPrice: 0, subtotal: 0 },
  ],
  summary: {
    subtotal: 0,
    agencyFee: 0,
    vat: 0,
    total: 0,
  },
};

const buf = await generateCostWorkbook(quote as any, { productName: '테스트', bidCode: 'TEST' });
const out = '/tmp/costtest.xlsx';
fs.writeFileSync(out, Buffer.from(buf));
const xml = execSync(`unzip -p ${out} xl/worksheets/sheet1.xml`).toString();
const merges = [...xml.matchAll(/<mergeCell ref="([^"]+)"/g)].map((m) => m[1]);
console.log(merges.join('\n'));
