import { NextRequest, NextResponse } from "next/server";
import { FeedArticle, Topic, TopicResponse } from "@/lib/types";
import {
  enrichArticlesWithTopics,
  extractTrendingTerms,
  detectEmergingSignals,
} from "@/lib/topic-matcher";
import { defaultTopics } from "@/lib/default-topics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles, topics } = body as {
      articles: FeedArticle[];
      topics?: Topic[];
    };

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "articles must be an array" },
        { status: 400 }
      );
    }

    const activeTopics = (topics || defaultTopics).filter((t) => t.enabled);
    const enrichedArticles = enrichArticlesWithTopics(articles, activeTopics);
    const trendingTerms = extractTrendingTerms(articles);
    const emergingSignals = detectEmergingSignals(articles);

    const response: TopicResponse = {
      articles: enrichedArticles,
      trendingTerms,
      emergingSignals,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Topic matching error:", error);
    return NextResponse.json(
      { error: "Failed to process topics" },
      { status: 500 }
    );
  }
}
