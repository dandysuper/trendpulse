export interface Video {
  id: string;
  title: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  views: number;
  publishedAt: string;
  url?: string; // Video URL
  channelName?: string; // Channel/creator name
}

export interface TrendCluster {
  id: string;
  name: string;
  category: string;
  growthRate: number; // Percentage
  totalViews: number;
  engagementScore: number; // 0-100
  videos: Video[];
  historicalGrowth: { day: string; value: number }[];
}

export interface TrendInsight {
  whyTrending: string;
  hooks: string[];
  structure: string;
  audience: string;
}

export interface ContentIdea {
  title: string;
  hook: string;
  outline: string;
  format: 'Short' | 'Long-form' | 'Carousel';
}

export interface GeneratedIdeasResponse {
  ideas: ContentIdea[];
}