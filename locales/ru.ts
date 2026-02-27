export const ru = {
    // General
    appName: 'TrendPulse',

    // Navigation
    nav: {
        dashboard: 'Главная',
        savedIdeas: 'Сохранённые',
        analytics: 'Аналитика',
        settings: 'Настройки',
    },

    // Backend status
    status: {
        backendConnected: 'Бэкенд подключён',
        usingMockData: 'Демо-данные',
    },

    // Dashboard
    dashboard: {
        liveClusters: 'Живые кластеры',
        activeClusters: 'Активные кластеры',
        refreshData: 'Обновить данные с API',
        loadingTrends: 'Загрузка трендов...',
        loadingDataPipeline: 'Загрузка данных из API... Пайплайн может ещё работать.',
        noClustersFound: 'Кластеры не найдены. Возможно, бэкенду нужны данные.',
        failedToConnect: 'Не удалось подключиться к бэкенду. Используются демо-данные.',
        failedToRefresh: 'Не удалось обновить данные. Попробуйте ещё раз.',
        views: 'просмотров',
        mViews: 'М просм.',
        kViews: 'тыс. просм.',
        growth: 'Рост',
    },

    // Trend Detail
    trendDetail: {
        totalVolume: 'Общий объём на всех платформах:',
        analyzeWithAI: 'Анализ с ИИ',
        generateIdeas: 'Сгенерировать идеи',
        analyzingSemantics: 'Анализ семантики кластера...',
        unlockAIInsights: 'Разблокируйте ИИ-анализ',
        unlockDescription: 'Бесплатный ИИ проанализирует заголовки, скорость роста и вовлечённость, чтобы объяснить, почему это в тренде.',
        whyTrending: 'Почему в тренде',
        winningHooks: 'Лучшие хуки',
        audience: 'Аудитория',
        velocityTrack: 'Динамика роста (7д)',
        topPerformingVideos: 'Лучшие видео',
        failedToAnalyze: 'Не удалось проанализировать тренд. Попробуйте ещё раз.',
        failedToGenerate: 'Не удалось сгенерировать идеи.',
    },

    // Content Ideas
    ideas: {
        tailoredContentIdeas: 'Персонализированные идеи контента',
        generatedByAI: 'Сгенерированы ИИ на основе данных трендов',
        theHook: 'ХУК',
        outline: 'ПЛАН',
        saveIdea: 'Сохранить идею',
        saved: 'Сохранено!',
    },

    // Saved Ideas Page
    savedIdeas: {
        title: 'Сохранённые идеи',
        ideaCount: (count: number) => {
            if (count === 0) return '0 идей сохранено';
            if (count === 1) return '1 идея сохранена';
            if (count >= 2 && count <= 4) return `${count} идеи сохранено`;
            return `${count} идей сохранено`;
        },
        export: 'Экспорт',
        clearAll: 'Очистить всё',
        confirmClear: 'Вы уверены, что хотите удалить все сохранённые идеи?',
        noSavedIdeas: 'Пока нет сохранённых идей',
        noSavedIdeasDescription: 'Сохраняйте идеи контента с главной страницы, чтобы они были доступны здесь',
        fromTrend: 'Из:',
        copy: 'Копировать',
        copied: 'Скопировано!',
        deleteIdea: 'Удалить идею',
        savedOn: 'Сохранено',
    },

    // Analytics Page
    analyticsPage: {
        title: 'Аналитика',
        overview: 'Обзор эффективности трендового контента',
        noData: 'Нет данных',
        noDataDescription: 'Загрузите данные трендов с главной страницы, чтобы увидеть аналитику',
        total: 'ИТОГО',
        videosTracked: 'Видео отслеживается',
        viewsLabel: 'ПРОСМОТРЫ',
        totalViews: 'Всего просмотров',
        growthLabel: 'РОСТ',
        avgGrowthRate: 'Средний рост',
        engagementLabel: 'ВОВЛЕЧЁННОСТЬ',
        avgScore: 'Средний балл',
        topGrowingTrends: 'Топ по росту',
        mostEngagingTrends: 'Самые вовлекающие',
        categoryBreakdown: 'По категориям',
        trends: (count: number) => {
            if (count === 1) return '1 тренд';
            if (count >= 2 && count <= 4) return `${count} тренда`;
            return `${count} трендов`;
        },
        trendingUp: 'РАСТЁТ',
        stable: 'СТАБИЛЬНО',
        slowing: 'ЗАМЕДЛЯЕТСЯ',
        growthAbove50: 'Рост > 50%',
        growth2050: '20–50% рост',
        growthBelow20: 'Рост < 20%',
        engagement: 'вовлечённость',
        views: 'просмотров',
    },

    // Settings Modal
    settings: {
        title: 'Настройки API',
        subtitle: 'Настройки ключей YouTube и TikTok API',
        apiKeysActive: 'API-ключи активны',
        youtubeDataAPI: 'YouTube Data API v3',
        tiktokScraptik: 'TikTok (Scraptik / RapidAPI)',
        builtIn: 'Встроенный',
        custom: 'Пользовательский',
        builtInKeysNote: 'Приложение включает встроенные ключи. Если они истекут, введите свои ниже.',
        runFullPipeline: 'Запустить полный пайплайн',
        runningPipeline: 'Пайплайн запущен...',
        pipelineInfo: 'Запуск пайплайна... Это может занять 2-3 минуты.',
        useYourOwnKeys: 'Использовать свои API-ключи',
        overrideNote: 'Если встроенные ключи истекли или достигли лимитов, введите свои ключи ниже.',
        youtubeAPILabel: 'YouTube Data API v3 —',
        rapidAPILabel: 'RapidAPI (TikTok Scraptik) —',
        getFreeKey: 'Получить бесплатный ключ',
        yourYoutubeKey: 'Ваш YouTube API-ключ...',
        yourRapidAPIKey: 'Ваш RapidAPI-ключ...',
        save: 'Сохранить',
        enterYoutubeKey: 'Введите YouTube-ключ',
        enterRapidAPIKey: 'Введите RapidAPI-ключ',
        failedToConnect: 'Не удалось подключиться к бэкенду. Убедитесь, что сервер запущен.',
        failedToPipeline: 'Не удалось запустить пайплайн. Проверьте логи бэкенда.',
        securityNote: '🔒 Пользовательские ключи хранятся только в оперативной памяти (удаляются при перезагрузке).',
        quotaNote: '⚡ YouTube: 10 000 бесплатных единиц/день | TikTok Scraptik: бесплатный тариф на RapidAPI',
        language: 'Язык',
        languageRussian: 'Русский',
        languageEnglish: 'English',
    },

    // Formats
    formats: {
        short: 'Короткий',
        longForm: 'Длинный',
        carousel: 'Карусель',
    },
};

export interface Translations {
    appName: string;
    nav: {
        dashboard: string;
        savedIdeas: string;
        analytics: string;
        settings: string;
    };
    status: {
        backendConnected: string;
        usingMockData: string;
    };
    dashboard: {
        liveClusters: string;
        activeClusters: string;
        refreshData: string;
        loadingTrends: string;
        loadingDataPipeline: string;
        noClustersFound: string;
        failedToConnect: string;
        failedToRefresh: string;
        views: string;
        mViews: string;
        kViews: string;
        growth: string;
    };
    trendDetail: {
        totalVolume: string;
        analyzeWithAI: string;
        generateIdeas: string;
        analyzingSemantics: string;
        unlockAIInsights: string;
        unlockDescription: string;
        whyTrending: string;
        winningHooks: string;
        audience: string;
        velocityTrack: string;
        topPerformingVideos: string;
        failedToAnalyze: string;
        failedToGenerate: string;
    };
    ideas: {
        tailoredContentIdeas: string;
        generatedByAI: string;
        theHook: string;
        outline: string;
        saveIdea: string;
        saved: string;
    };
    savedIdeas: {
        title: string;
        ideaCount: (count: number) => string;
        export: string;
        clearAll: string;
        confirmClear: string;
        noSavedIdeas: string;
        noSavedIdeasDescription: string;
        fromTrend: string;
        copy: string;
        copied: string;
        deleteIdea: string;
        savedOn: string;
    };
    analyticsPage: {
        title: string;
        overview: string;
        noData: string;
        noDataDescription: string;
        total: string;
        videosTracked: string;
        viewsLabel: string;
        totalViews: string;
        growthLabel: string;
        avgGrowthRate: string;
        engagementLabel: string;
        avgScore: string;
        topGrowingTrends: string;
        mostEngagingTrends: string;
        categoryBreakdown: string;
        trends: (count: number) => string;
        trendingUp: string;
        stable: string;
        slowing: string;
        growthAbove50: string;
        growth2050: string;
        growthBelow20: string;
        engagement: string;
        views: string;
    };
    settings: {
        title: string;
        subtitle: string;
        apiKeysActive: string;
        youtubeDataAPI: string;
        tiktokScraptik: string;
        builtIn: string;
        custom: string;
        builtInKeysNote: string;
        runFullPipeline: string;
        runningPipeline: string;
        pipelineInfo: string;
        useYourOwnKeys: string;
        overrideNote: string;
        youtubeAPILabel: string;
        rapidAPILabel: string;
        getFreeKey: string;
        yourYoutubeKey: string;
        yourRapidAPIKey: string;
        save: string;
        enterYoutubeKey: string;
        enterRapidAPIKey: string;
        failedToConnect: string;
        failedToPipeline: string;
        securityNote: string;
        quotaNote: string;
        language: string;
        languageRussian: string;
        languageEnglish: string;
    };
    formats: {
        short: string;
        longForm: string;
        carousel: string;
    };
}
