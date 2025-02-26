// app/api/notion-to-md/route.ts
import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

export async function POST(request: Request) {
  try {
    const { notionAPIKey, notionURL } = await request.json();

    // API 키 또는 URL이 없는 경우 에러 처리
    if (!notionAPIKey || !notionURL) {
      return NextResponse.json(
        { message: "Notion API 키와 URL이 필요합니다." },
        { status: 400 }
      );
    }

    // Notion 페이지 ID 추출
    const pageId = extractPageIdFromUrl(notionURL);
    if (!pageId) {
      return NextResponse.json(
        { message: "유효한 Notion URL이 아닙니다." },
        { status: 400 }
      );
    }

    // Notion 클라이언트 초기화
    const notion = new Client({ auth: notionAPIKey });

    // NotionToMarkdown 인스턴스 생성
    const n2m = new NotionToMarkdown({ notionClient: notion });

    // 페이지 블록 가져오기
    const mdBlocks = await n2m.pageToMarkdown(pageId);

    // 마크다운으로 변환
    const mdString = n2m.toMarkdownString(mdBlocks);

    return NextResponse.json({
      message: "성공적으로 변환되었습니다!",
      markdown: mdString.parent,
    });
  } catch (error) {
    console.error("Notion to Markdown 변환 오류:", error);
    return NextResponse.json(
      { message: "Notion 페이지 변환 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// Notion URL에서 페이지 ID 추출하는 함수
function extractPageIdFromUrl(url: string): string | null {
  // Notion URL 형식: https://www.notion.so/{workspace}/{page-id}
  // 또는: https://www.notion.so/{page-id}

  try {
    // URL이 유효한지 확인
    const urlObj = new URL(url);

    // notion.so 도메인인지 확인
    if (!urlObj.hostname.includes("notion.so")) {
      return null;
    }

    // 경로에서 마지막 세그먼트를 가져옴
    const pathSegments = urlObj.pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    // 마지막 세그먼트가 페이지 ID
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];

      // 하이픈이 포함된 형식인 경우 (일반적인 Notion 페이지 ID 형식)
      if (lastSegment.includes("-")) {
        return lastSegment.split("-").pop() || null;
      }

      // 하이픈이 없는 경우 (이미 ID만 있는 경우)
      return lastSegment;
    }

    return null;
  } catch (error) {
    return null;
  }
}
