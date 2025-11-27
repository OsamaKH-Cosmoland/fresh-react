export interface RitualStep {
  title: string;
  body: string;
}

export interface Ritual {
  id: string;
  title: string;
  focus: string;
  description: string;
  products: number[];
  steps: RitualStep[];
  tip: string;
}

export type RitualMap = Record<string, Ritual>;
