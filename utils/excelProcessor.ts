
import * as XLSX from 'xlsx';
import { CustomerData, LoyalCustomer, MatchResult, ColumnMapping } from '../types.ts';
import { SYNONYMS, STATUS_VALUES } from '../constants.tsx';

/**
 * Normalizes contact string by removing non-numeric characters
 */
export const normalizeContact = (contact: any): string => {
  if (!contact) return '';
  return String(contact).replace(/[^0-9]/g, '');
};

/**
 * Formats various date inputs (JS Date, Excel Serial, or String) to YYYY/MM/DD
 */
export const formatDate = (val: any): string => {
  if (!val) return '-';
  
  let date: Date;

  if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    // Excel serial date to JS date
    date = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else {
    // Try parsing string
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      date = d;
    } else {
      return String(val); // Return as is if unparseable
    }
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
};

/**
 * Checks if two names have at least 2 characters in common
 */
export const hasNameOverlap = (name1: string, name2: string): boolean => {
  if (!name1 || !name2) return false;
  const n1 = name1.trim();
  const n2 = name2.trim();
  
  // Basic check for subset
  if (n1.includes(n2) || n2.includes(n1)) {
    return n1.length >= 2 && n2.length >= 2;
  }

  // Count common characters (simple overlap logic)
  let commonCount = 0;
  const chars1 = new Set(n1.split(''));
  for (const char of n2) {
    if (chars1.has(char)) commonCount++;
  }
  
  return commonCount >= 2;
};

/**
 * Detects column mapping based on header names
 */
export const detectMapping = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = { name: '', contact: '', status: '', roomName: '', checkIn: '', checkOut: '' };
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().replace(/\s/g, '');
    
    if (SYNONYMS.name.some(s => lowerHeader.includes(s.toLowerCase().replace(/\s/g, '')))) {
      if (!mapping.name) mapping.name = header;
    }
    if (SYNONYMS.contact.some(s => lowerHeader.includes(s.toLowerCase().replace(/\s/g, '')))) {
      if (!mapping.contact) mapping.contact = header;
    }
    if (SYNONYMS.status.some(s => lowerHeader.includes(s.toLowerCase().replace(/\s/g, '')))) {
      if (!mapping.status) mapping.status = header;
    }
    if (SYNONYMS.roomName.some(s => lowerHeader.includes(s.toLowerCase().replace(/\s/g, '')))) {
      if (!mapping.roomName) mapping.roomName = header;
    }
    if (SYNONYMS.checkIn.some(s => lowerHeader.includes(s.toLowerCase().replace(/\s/g, '')))) {
      if (!mapping.checkIn) mapping.checkIn = header;
    }
    if (SYNONYMS.checkOut.some(s => lowerHeader.includes(s.toLowerCase().replace(/\s/g, '')))) {
      if (!mapping.checkOut) mapping.checkOut = header;
    }
  });
  
  return mapping;
};

/**
 * Parses Excel file and returns array of objects
 */
export const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // We use cellDates: true to handle Excel dates correctly
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Analyzes the loyalty data
 */
export const analyzeLoyalty = (
  historyData: any[],
  todayData: any[],
  threshold: number
): MatchResult[] => {
  if (!historyData.length || !todayData.length) return [];

  const historyHeaders = Object.keys(historyData[0]);
  const todayHeaders = Object.keys(todayData[0]);

  const historyMap = detectMapping(historyHeaders);
  const todayMap = detectMapping(todayHeaders);

  // 1. Process History
  const visits: Record<string, { name: string; count: number; history: { checkIn: string; checkOut: string; roomName: string }[] }> = {};
  
  historyData.forEach(row => {
    const status = String(row[historyMap.status] || '');
    const isCompleted = STATUS_VALUES.CHECKED_IN.some(v => status.includes(v));
    
    if (isCompleted) {
      const contact = normalizeContact(row[historyMap.contact]);
      const name = String(row[historyMap.name] || '');
      
      if (contact) {
        if (!visits[contact]) {
          visits[contact] = { name, count: 0, history: [] };
        }
        visits[contact].count += 1;
        visits[contact].history.push({
          checkIn: formatDate(row[historyMap.checkIn]),
          checkOut: formatDate(row[historyMap.checkOut]),
          roomName: historyMap.roomName ? String(row[historyMap.roomName] || '-') : '-'
        });
      }
    }
  });

  // Filter Loyal Customers (threshold N)
  const loyalCustomers: Record<string, { name: string; count: number; history: { checkIn: string; checkOut: string; roomName: string }[] }> = {};
  Object.entries(visits).forEach(([contact, data]) => {
    if (data.count >= threshold) {
      loyalCustomers[contact] = data;
    }
  });

  // 2. Process Today
  const results: MatchResult[] = [];
  todayData.forEach(row => {
    const status = String(row[todayMap.status] || '');
    const isTarget = STATUS_VALUES.PENDING.some(v => status.includes(v)) || 
                     STATUS_VALUES.PAID.some(v => status.includes(v));
    
    if (isTarget) {
      const contact = normalizeContact(row[todayMap.contact]);
      const name = String(row[todayMap.name] || '');
      
      // Match by contact
      if (contact && loyalCustomers[contact]) {
        const loyalInfo = loyalCustomers[contact];
        // Secondary check: Name overlap (at least 2 chars)
        if (hasNameOverlap(name, loyalInfo.name)) {
          results.push({
            customerName: name,
            contact: row[todayMap.contact],
            totalVisits: loyalInfo.count,
            todayStatus: status,
            todayRoomName: todayMap.roomName ? String(row[todayMap.roomName] || '-') : '-',
            checkInDate: formatDate(row[todayMap.checkIn]),
            checkOutDate: formatDate(row[todayMap.checkOut]),
            history: loyalInfo.history
          });
        }
      }
    }
  });

  return results;
};
