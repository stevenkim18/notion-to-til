"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  // 노션 관련 상태
  const [message, setMessage] = useState(
    "Notion 페이지를 마크다운으로 변환하세요!"
  );
  const [notionAPIKey, setNotionAPIKey] = useState("");
  const [notionURL, setNotionURL] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // GitHub 관련 상태
  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubPath, setGithubPath] = useState("");
  const [filename, setFilename] = useState("");

  // 노션 페이지를 마크다운으로 변환 요청
  const requestNotionToMD = async () => {
    if (!notionAPIKey || !notionURL) {
      setMessage("Notion API 키와 URL을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("변환 중...");
    setUploadSuccess(false);

    try {
      const res = await fetch("/api/notion-to-md", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notionAPIKey,
          notionURL,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage(`요청 실패: ${errorData.message || "알 수 없는 오류"}`);
        setMarkdown("");
        return;
      }

      const data = await res.json();
      setMessage(data.message);
      setMarkdown(data.markdown || "");

      // 파일명이 비어있다면 기본값 설정
      if (!filename) {
        // Notion URL에서 페이지 이름을 추출해 기본 파일명으로 사용
        try {
          const urlPath = new URL(notionURL).pathname;
          const pathSegments = urlPath.split("/").filter((s) => s);
          const lastSegment = pathSegments[pathSegments.length - 1] || "";
          const defaultName =
            lastSegment.split("-").slice(0, -1).join("-") || "notion-page";
          setFilename(`${defaultName}.md`);
        } catch {
          setFilename("notion-page.md");
        }
      }
    } catch (err) {
      console.error("에러:", err);
      setMessage("요청 중 오류가 발생했습니다.");
      setMarkdown("");
    } finally {
      setLoading(false);
    }
  };

  // 마크다운을 GitHub에 업로드 요청
  const uploadToGithub = async () => {
    if (
      !githubUsername ||
      !githubToken ||
      !githubRepo ||
      !githubPath ||
      !filename ||
      !markdown
    ) {
      setMessage(
        "GitHub 정보와 파일명, 그리고 마크다운 내용이 모두 필요합니다."
      );
      return;
    }

    setGithubLoading(true);
    setMessage("GitHub에 업로드 중...");
    setUploadSuccess(false);

    try {
      const res = await fetch("/api/upload-to-github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubUsername,
          githubToken,
          githubRepo,
          path: githubPath,
          filename,
          content: markdown,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage(
          `GitHub 업로드 실패: ${errorData.message || "알 수 없는 오류"}`
        );
        return;
      }

      const data = await res.json();
      setMessage(`GitHub 업로드 성공: ${data.message}`);
      setUploadSuccess(true);
    } catch (err) {
      console.error("GitHub 업로드 에러:", err);
      setMessage("GitHub 업로드 중 오류가 발생했습니다.");
    } finally {
      setGithubLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-screen py-8 px-4 mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">
        Notion to GitHub 마크다운 변환기
      </h1>
      <p
        className={`text-center ${
          message.includes("실패") || message.includes("오류")
            ? "text-red-500"
            : message.includes("성공")
            ? "text-green-500"
            : ""
        }`}
      >
        {message}
      </p>

      {/* 탭 */}
      <Tabs defaultValue="notion" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="notion">Notion 변환</TabsTrigger>
          <TabsTrigger value="github" disabled={!markdown}>
            GitHub 업로드
          </TabsTrigger>
        </TabsList>

        {/* 노션 -> 마크다운 변환 탭 */}
        <TabsContent value="notion" className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm mb-1">
              Notion API 키
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
              value={notionAPIKey}
              onChange={(e) => setNotionAPIKey(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="notionUrl" className="block text-sm mb-1">
              Notion URL
            </label>
            <Input
              id="notionUrl"
              type="text"
              placeholder="https://www.notion.so/..."
              value={notionURL}
              onChange={(e) => setNotionURL(e.target.value)}
            />
          </div>

          <Button
            onClick={requestNotionToMD}
            disabled={loading || !notionAPIKey || !notionURL}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                변환 중...
              </>
            ) : (
              "마크다운으로 변환"
            )}
          </Button>

          {markdown && (
            <div className="mt-4">
              <label htmlFor="filename" className="block text-sm mb-1">
                파일명
              </label>
              <Input
                id="filename"
                type="text"
                placeholder="README.md"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
          )}

          {markdown && (
            <div>
              <label htmlFor="markdown" className="block text-sm mb-1">
                변환된 마크다운
              </label>
              <Textarea
                id="markdown"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="h-64 font-mono text-sm"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(markdown);
                  setMessage("마크다운이 클립보드에 복사되었습니다!");
                }}
                variant="outline"
                className="mt-2"
              >
                클립보드에 복사
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 마크다운 -> GitHub 업로드 탭 */}
        <TabsContent value="github" className="space-y-4">
          <div>
            <label htmlFor="githubUsername" className="block text-sm mb-1">
              GitHub 아이디
            </label>
            <Input
              id="githubUsername"
              type="text"
              placeholder="github-username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="githubToken" className="block text-sm mb-1">
              GitHub 토큰 (Personal Access Token)
            </label>
            <Input
              id="githubToken"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <p className="text-xs mt-1 text-gray-500">
              저장소에 쓰기 권한이 있는 토큰이 필요합니다. (repo 스코프)
            </p>
          </div>

          <div>
            <label htmlFor="githubRepo" className="block text-sm mb-1">
              GitHub 레포 (형식: 사용자명/레포지토리명)
            </label>
            <Input
              id="githubRepo"
              type="text"
              placeholder="username/repository"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="githubPath" className="block text-sm mb-1">
              GitHub 레포 내 경로 (예: docs/)
            </label>
            <Input
              id="githubPath"
              type="text"
              placeholder="폴더 경로 (비워두면 루트에 저장)"
              value={githubPath}
              onChange={(e) => setGithubPath(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="filenameFinal" className="block text-sm mb-1">
              파일명
            </label>
            <Input
              id="filenameFinal"
              type="text"
              placeholder="README.md"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <Button
            onClick={uploadToGithub}
            disabled={
              githubLoading ||
              !githubUsername ||
              !githubToken ||
              !githubRepo ||
              !filename ||
              !markdown
            }
            className="w-full"
          >
            {githubLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                GitHub에 업로드 중...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                업로드 완료!
              </>
            ) : (
              "GitHub에 업로드"
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
