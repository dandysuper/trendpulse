import { TrendCluster } from './types';

export const MOCK_TRENDS: TrendCluster[] = [
  {
    id: '1',
    name: 'AI Workflow Automation',
    category: 'Tech & Productivity',
    growthRate: 145,
    totalViews: 2500000,
    engagementScore: 88,
    videos: [
      { id: 'dQw4w9WgXcQ', title: 'How I Automated My Job with Gemini 1.5', platform: 'youtube', views: 450000, publishedAt: '2023-10-25', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channelName: 'Tech Automation' },
      { id: 'tiktok_7123456789', title: 'Stop doing this manually! AI agents explained', platform: 'tiktok', views: 890000, publishedAt: '2023-10-26', url: 'https://www.tiktok.com/@techcreator/video/7123456789', channelName: '@techcreator' },
      { id: 'jNQXAC9IVRw', title: 'The Ultimate AI Stack for 2024', platform: 'youtube', views: 320000, publishedAt: '2023-10-24', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', channelName: 'AI Explained' },
    ],
    historicalGrowth: [
      { day: 'Mon', value: 20 },
      { day: 'Tue', value: 35 },
      { day: 'Wed', value: 45 },
      { day: 'Thu', value: 80 },
      { day: 'Fri', value: 120 },
      { day: 'Sat', value: 135 },
      { day: 'Sun', value: 145 },
    ]
  },
  {
    id: '2',
    name: 'Sustainable "Quiet" Living',
    category: 'Lifestyle',
    growthRate: 85,
    totalViews: 1200000,
    engagementScore: 92,
    videos: [
      { id: 'ZXsQAXx_ao0', title: 'Why I Quit the City for a Cabin', platform: 'youtube', views: 600000, publishedAt: '2023-10-20', url: 'https://www.youtube.com/watch?v=ZXsQAXx_ao0', channelName: 'Minimalist Living' },
      { id: 'tiktok_7234567890', title: 'Slow mornings routine aesthetic', platform: 'instagram', views: 300000, publishedAt: '2023-10-22', url: 'https://www.instagram.com/reel/abc123/', channelName: '@slowliving' },
    ],
    historicalGrowth: [
      { day: 'Mon', value: 40 },
      { day: 'Tue', value: 45 },
      { day: 'Wed', value: 42 },
      { day: 'Thu', value: 55 },
      { day: 'Fri', value: 65 },
      { day: 'Sat', value: 75 },
      { day: 'Sun', value: 85 },
    ]
  },
  {
    id: '3',
    name: 'Retro Gaming Restoration',
    category: 'Gaming & Hobby',
    growthRate: 210,
    totalViews: 5600000,
    engagementScore: 95,
    videos: [
      { id: 'v6', title: 'Restoring a Yellowed GameBoy', platform: 'youtube', views: 1200000, publishedAt: '2023-10-26' },
      { id: 'v7', title: 'Found this in a dumpster! PS2 Restoration', platform: 'youtube', views: 2400000, publishedAt: '2023-10-25' },
    ],
    historicalGrowth: [
      { day: 'Mon', value: 10 },
      { day: 'Tue', value: 25 },
      { day: 'Wed', value: 80 },
      { day: 'Thu', value: 150 },
      { day: 'Fri', value: 180 },
      { day: 'Sat', value: 200 },
      { day: 'Sun', value: 210 },
    ]
  },
   {
    id: '4',
    name: 'High Protein Budget Meals',
    category: 'Food',
    growthRate: 65,
    totalViews: 3100000,
    engagementScore: 78,
    videos: [
      { id: 'v8', title: '150g Protein for $5?', platform: 'tiktok', views: 1500000, publishedAt: '2023-10-26' },
      { id: 'v9', title: 'Meal prep for gains on a budget', platform: 'youtube', views: 800000, publishedAt: '2023-10-25' },
    ],
    historicalGrowth: [
      { day: 'Mon', value: 50 },
      { day: 'Tue', value: 52 },
      { day: 'Wed', value: 55 },
      { day: 'Thu', value: 58 },
      { day: 'Fri', value: 60 },
      { day: 'Sat', value: 62 },
      { day: 'Sun', value: 65 },
    ]
  },
];