/**
 * API Service for TrendPulse Backend Integration
 * Connects React frontend to Python FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Export for use in components
export { API_BASE_URL };

// Backend API Response Types
interface BackendVideoMetrics {
  views_per_hour: number;
  engagement_rate: number;
  freshness_score: number;
  trend_score: number;
}

interface BackendVideo {
  video_id: string;
  title: string;
  description: string | null;
  channel_title: string;
  published_at: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  metrics: BackendVideoMetrics;
  cluster_id: number | null;
  cluster_label: string | null;
}

interface BackendTrendsResponse {
  videos: BackendVideo[];
  total: number;
  page: number;
  page_size: number;
}

interface BackendCluster {
  cluster_id: number;
  cluster_label: string;
  cluster_size: number;
  representative_video_id: string;
  avg_trend_score: number;
  created_at: string;
}

interface BackendClusterDetail {
  cluster_id: number;
  cluster_label: string;
  cluster_size: number;
  representative_video_id: string;
  avg_trend_score: number;
  videos: BackendVideo[];
}

// Frontend Types (from types.ts)
import { Video, TrendCluster } from '../types';

/**
 * Convert backend video to frontend video format
 */
function mapBackendVideoToFrontend(backendVideo: BackendVideo): Video {
  const videoId = backendVideo.video_id.replace('tiktok_', '');
  const isTikTok = backendVideo.video_id.startsWith('tiktok_');
  
  return {
    id: backendVideo.video_id,
    title: backendVideo.title,
    platform: isTikTok ? 'tiktok' : 'youtube',
    views: backendVideo.view_count,
    publishedAt: backendVideo.published_at,
    url: isTikTok 
      ? `https://www.tiktok.com/@user/video/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`,
    channelName: backendVideo.channel_title
  };
}

/**
 * Convert backend cluster to frontend TrendCluster format
 */
function mapBackendClusterToFrontend(
  cluster: BackendClusterDetail,
  videos: BackendVideo[]
): TrendCluster {
  // Calculate growth rate from trend scores (0-1 scale to percentage)
  const avgTrendScore = cluster.avg_trend_score;
  const growthRate = Math.round(avgTrendScore * 200); // Scale to 0-200%

  // Calculate total views from all videos
  const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0);

  // Calculate engagement score (0-100) from average engagement rate
  const avgEngagementRate = videos.reduce((sum, v) => sum + v.metrics.engagement_rate, 0) / videos.length;
  const engagementScore = Math.min(100, Math.round(avgEngagementRate * 1000)); // Scale to 0-100

  // Generate historical growth data (mock for now - could be enhanced with time-series data)
  const historicalGrowth = generateHistoricalGrowth(growthRate);

  // Determine category from cluster label
  const category = inferCategory(cluster.cluster_label);

  return {
    id: cluster.cluster_id.toString(),
    name: cluster.cluster_label,
    category,
    growthRate,
    totalViews,
    engagementScore,
    videos: videos.map(mapBackendVideoToFrontend),
    historicalGrowth,
  };
}

/**
 * Generate mock historical growth data based on current growth rate
 */
function generateHistoricalGrowth(currentGrowth: number): { day: string; value: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const growth: { day: string; value: number }[] = [];
  
  // Generate ascending trend leading to current growth
  for (let i = 0; i < 7; i++) {
    const progress = (i + 1) / 7;
    const value = Math.round(currentGrowth * progress * (0.5 + Math.random() * 0.5));
    growth.push({ day: days[i], value });
  }
  
  // Ensure last day matches current growth
  growth[6].value = currentGrowth;
  
  return growth;
}

/**
 * Infer category from cluster label
 */
function inferCategory(label: string): string {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('tech') || lowerLabel.includes('ai') || lowerLabel.includes('software')) {
    return 'Tech & Productivity';
  }
  if (lowerLabel.includes('game') || lowerLabel.includes('gaming')) {
    return 'Gaming & Hobby';
  }
  if (lowerLabel.includes('food') || lowerLabel.includes('recipe') || lowerLabel.includes('cooking')) {
    return 'Food';
  }
  if (lowerLabel.includes('lifestyle') || lowerLabel.includes('vlog') || lowerLabel.includes('daily')) {
    return 'Lifestyle';
  }
  if (lowerLabel.includes('fitness') || lowerLabel.includes('workout') || lowerLabel.includes('health')) {
    return 'Health & Fitness';
  }
  if (lowerLabel.includes('music') || lowerLabel.includes('song')) {
    return 'Music';
  }
  if (lowerLabel.includes('education') || lowerLabel.includes('tutorial') || lowerLabel.includes('learn')) {
    return 'Education';
  }
  
  return 'General';
}

/**
 * Fetch all trend clusters from backend
 */
export async function fetchTrendClusters(): Promise<TrendCluster[]> {
  try {
    // Fetch clusters list
    const clustersResponse = await fetch(`${API_BASE_URL}/clusters`);
    if (!clustersResponse.ok) {
      throw new Error(`Failed to fetch clusters: ${clustersResponse.statusText}`);
    }
    
    const clustersData: { clusters: BackendCluster[]; total_clusters: number } = await clustersResponse.json();
    
    // Fetch detailed data for each cluster
    const clusterPromises = clustersData.clusters.map(async (cluster) => {
      const detailResponse = await fetch(`${API_BASE_URL}/clusters/${cluster.cluster_id}`);
      if (!detailResponse.ok) {
        console.warn(`Failed to fetch cluster ${cluster.cluster_id}`);
        return null;
      }
      const detailData: BackendClusterDetail = await detailResponse.json();
      return mapBackendClusterToFrontend(detailData, detailData.videos);
    });
    
    const clusters = await Promise.all(clusterPromises);
    
    // Filter out failed requests and sort by growth rate
    return clusters
      .filter((c): c is TrendCluster => c !== null)
      .sort((a, b) => b.growthRate - a.growthRate);
    
  } catch (error) {
    console.error('Error fetching trend clusters:', error);
    throw error;
  }
}

/**
 * Fetch trending videos (alternative to clusters)
 */
export async function fetchTrendingVideos(
  page: number = 1,
  pageSize: number = 20,
  minTrendScore: number = 0.3
): Promise<BackendVideo[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/trends?page=${page}&page_size=${pageSize}&min_trend_score=${minTrendScore}&sort_by=trend_score`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trends: ${response.statusText}`);
    }
    
    const data: BackendTrendsResponse = await response.json();
    return data.videos;
    
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }
}

/**
 * Fetch single video details
 */
export async function fetchVideoDetail(videoId: string): Promise<BackendVideo> {
  try {
    const response = await fetch(`${API_BASE_URL}/trend/${videoId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error fetching video detail:', error);
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Create clusters from unclustered videos (for demo purposes)
 * Groups videos by category when no ML clusters exist
 */
export async function createFallbackClusters(videos: BackendVideo[]): Promise<TrendCluster[]> {
  // Group videos by cluster_label or create generic clusters
  const clusterMap = new Map<string, BackendVideo[]>();
  
  videos.forEach(video => {
    const label = video.cluster_label || 'Unclustered';
    if (!clusterMap.has(label)) {
      clusterMap.set(label, []);
    }
    clusterMap.get(label)!.push(video);
  });
  
  // Convert to TrendCluster format
  const clusters: TrendCluster[] = [];
  let clusterId = 1;
  
  clusterMap.forEach((videos, label) => {
    const avgTrendScore = videos.reduce((sum, v) => sum + v.metrics.trend_score, 0) / videos.length;
    const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0);
    const avgEngagementRate = videos.reduce((sum, v) => sum + v.metrics.engagement_rate, 0) / videos.length;
    
    clusters.push({
      id: clusterId.toString(),
      name: label,
      category: inferCategory(label),
      growthRate: Math.round(avgTrendScore * 200),
      totalViews,
      engagementScore: Math.min(100, Math.round(avgEngagementRate * 1000)),
      videos: videos.map(mapBackendVideoToFrontend),
      historicalGrowth: generateHistoricalGrowth(Math.round(avgTrendScore * 200)),
    });
    
    clusterId++;
  });
  
  return clusters.sort((a, b) => b.growthRate - a.growthRate);
}
