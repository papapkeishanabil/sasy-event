import Papa from 'papaparse';
import { Guest } from '../types';

export interface ParsedGuest {
  id?: string;
  name?: string;
  category?: string;
  email?: string;
  phone?: string;
  // Allow other property names for CSV flexibility
  [key: string]: string | undefined;
}

/**
 * Parse CSV file and convert to Guest array
 */
export const parseCSV = (file: File): Promise<Guest[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const guests = processCSVData(results.data as ParsedGuest[]);
          resolve(guests);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Process CSV data and convert to Guest objects
 */
const processCSVData = (data: ParsedGuest[]): Guest[] => {
  const guests: Guest[] = [];
  const usedIds = new Set<number>();

  data.forEach((row, index) => {
    // Extract and validate name
    const name = row.name?.trim() || row.Name?.trim() || row['Guest Name']?.trim();
    if (!name) {
      console.warn(`Skipping row ${index + 1}: No name found`);
      return;
    }

    // Extract category
    const categoryRaw = row.category?.trim() || row.Category?.trim() || 'Regular';
    const category = normalizeCategory(categoryRaw);

    // Extract optional fields
    const email = row.email?.trim() || row.Email?.trim();
    const phone = row.phone?.trim() || row.Phone?.trim();

    // Handle ID - either from CSV or generated
    let id: number;
    if (row.id && !isNaN(Number(row.id))) {
      id = Number(row.id);
      if (usedIds.has(id)) {
        console.warn(`Duplicate ID ${id} found, generating new ID`);
        id = generateUniqueId(usedIds);
      }
    } else {
      id = generateUniqueId(usedIds);
    }
    usedIds.add(id);

    guests.push({
      id,
      name,
      category,
      status: 'not_checked_in',
      email,
      phone,
    });
  });

  // Sort alphabetically by name
  guests.sort((a, b) => a.name.localeCompare(b.name));

  return guests;
};

/**
 * Normalize category string to valid category
 */
const normalizeCategory = (category: string): Guest['category'] => {
  const normalized = category.toLowerCase();
  if (normalized.includes('vip')) return 'VIP';
  if (normalized.includes('media') || normalized.includes('press')) return 'Media';
  if (normalized.includes('speaker') || normalized.includes('host')) return 'Speaker';
  return 'Regular';
};

/**
 * Generate unique ID not in used set
 */
const generateUniqueId = (usedIds: Set<number>): number => {
  let id = 1;
  while (usedIds.has(id)) {
    id++;
  }
  return id;
};

/**
 * Export guest data to CSV
 */
export const exportToCSV = (guests: Guest[]): string => {
  const csv = Papa.unparse(guests.map(g => ({
    ID: g.id,
    Name: g.name,
    Category: g.category,
    Status: g.status === 'checked_in' ? 'Checked In' : 'Not Checked In',
    'Check-in Time': g.checkInTime || '',
    Email: g.email || '',
    Phone: g.phone || '',
  })));

  return csv;
};

/**
 * Download CSV file
 */
export const downloadCSV = (guests: Guest[], filename = 'guest-data.csv') => {
  const csv = exportToCSV(guests);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
