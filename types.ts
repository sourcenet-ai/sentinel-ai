
export interface Advisory {
  id: string;
  title: string;
  link: string;
  summary: string;
  content: string;
  published: Date;
  updated: Date;
  source: string;
  author: string;
  category: 'intel' | 'news' | 'breaches' | 'ransomware';
}

export interface FetchError {
  source: string;
  message: string;
}

export interface FilterState {
  keyword: string;
  source: string;
  startDate: string;
  endDate: string;
}

export interface AIAnalysis {
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  topRecommendations: string[];
}

export interface AlertProfile {
  id: string;
  email: string;
  keywords: string[]; // List of products/keywords
  source: string;
  isActive: boolean;
  createdAt: number;
}
