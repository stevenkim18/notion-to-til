// app/api/github-upload/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { githubUsername, githubToken, githubRepo, path, filename, content } =
      await request.json();

    // 필수 필드 검증
    if (!githubToken || !githubRepo || !filename || !content) {
      return NextResponse.json(
        { message: "GitHub 토큰, 레포지토리, 파일명, 컨텐츠는 필수입니다." },
        { status: 400 }
      );
    }

    // 파일 경로 구성 (끝에 슬래시가 있는지 확인)
    const filePath = path
      ? path.endsWith("/")
        ? path + filename
        : path + "/" + filename
      : filename;

    // GitHub API URL
    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    // 파일이 이미 존재하는지 확인하고 존재한다면 SHA 가져오기
    let existingSha;
    try {
      const checkResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Notion-to-GitHub-App",
        },
      });

      if (checkResponse.status === 200) {
        const fileData = await checkResponse.json();
        existingSha = fileData.sha;
      }
    } catch (error) {
      // 파일이 존재하지 않는 경우 무시
    }

    // GitHub API 요청 본문
    const requestBody: any = {
      message: `Update ${filename} from Notion`,
      content: Buffer.from(content).toString("base64"),
      branch: "main", // 대상 브랜치, 필요시 파라미터로 받아서 변경 가능
    };

    // 기존 파일이 있으면 SHA 포함
    if (existingSha) {
      requestBody.sha = existingSha;
    }

    // GitHub API 호출
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Notion-to-GitHub-App",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("GitHub API 오류:", errorData);

      return NextResponse.json(
        {
          message: `GitHub API 오류: ${errorData.message || "알 수 없는 오류"}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    return NextResponse.json({
      message: "파일이 성공적으로 업로드되었습니다.",
      url: responseData.content?.html_url || responseData.html_url,
    });
  } catch (error) {
    console.error("GitHub 업로드 처리 오류:", error);

    return NextResponse.json(
      { message: "GitHub 업로드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
