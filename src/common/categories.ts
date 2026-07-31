export const CATEGORIES = {
  FIXED: {
    housing: ['Affitto/Mutuo', 'Condominio', 'Utenze fisse'],
    insurance: ['Assicurazione auto', 'Assicurazione casa', 'Assicurazione vita'],
    vehicle: ['Rata auto', 'Bollo'],
    subscriptions: ['Abbonamenti (Netflix, Spotify...)', 'Palestra / Cross Training'],
    professional: ['Commercialista', 'Software / licenze'],
  },
  VARIABLE: {
    food: ['Spesa', 'Ristoranti', 'Bar/Caffè'],
    transport: ['Benzina', 'Parcheggi', 'Manutenzione auto'],
    entertainment: ['Cinema', 'Hobby', 'Airsoft/A-Team'],
    shopping: ['Vestiti', 'Materiali 3D printing', 'Elettronica'],
    health: ['Farmacia', 'Visite mediche'],
    other: ['Regali', 'Varie'],
  },
} as const;

// Utility per validare che categoria/sottocategoria esistano davvero
export function isValidCategory(
  type: 'FIXED' | 'VARIABLE',
  category: string,
): boolean {
  return Object.keys(CATEGORIES[type]).includes(category);
}
