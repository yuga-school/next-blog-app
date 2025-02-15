"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
import type { Post } from "@/app/_types/Post";
import type { CoverImage } from "@/app/_types/CoverImage";
import { useAuth } from "@/app/_hooks/useAuth";

// カテゴリをフェッチしたときのレスポンスのデータ型
type CategoryApiResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};
type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
};

// 投稿記事の編集ページ
const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageURL, setNewCoverImageURL] = useState("");
  const [newCategory, setNewCategory] = useState<string[]>([]);
  const [keyword, setKeyword] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string[]>([]);
  const [categories, setcategories] = useState<string[] | null>(null);
  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const data = (await res.json()) as CategoryApiResponse[];
        setCheckableCategories(
          data.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          }))
        );
        setcategories(data.map((body) => body.name));
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setNewTitle(apiResBody.title);
        setNewContent(apiResBody.content);
        setNewCoverImageURL(apiResBody.coverImageURL);
        setNewCategory(apiResBody.categories.map((category) => category.name));
        setSearchQuery(apiResBody.categories.map((category) => category.name));
        setCheckableCategories(
          (prev) =>
            prev?.map((category) => ({
              ...category,
              isSelect: apiResBody.categories.some(
                (selectedCategory) => selectedCategory.id === category.id
              ),
            })) || null
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
    fetchPost();
  }, [id]);
  const getEditDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    const lowerA = a.toLowerCase();
    const lowerB = b.toLowerCase();

    for (let i = 0; i <= lowerA.length; i++) {
      for (let j = 0; j <= lowerB.length; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else if (j === 0) {
          matrix[i][j] = i;
        } else if (lowerA[i - 1] === lowerB[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            1 +
            Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }

    return matrix[lowerA.length][lowerB.length];
  };
  const getTopCategories = (searchQuery: string): string[] => {
    const queryWords = searchQuery;
    const categoryArray = categories;
    const categoryDistances: { category: string; distance: number }[] = [];
    categoryArray?.forEach((category) => {
      const distance = getEditDistance(queryWords, category);
      categoryDistances.push({
        category,
        distance: distance / Number(category.length),
      });
    });

    categoryDistances.sort((a, b) => a.distance - b.distance);

    return categoryDistances.slice(0, 10).map((item) => item.category);
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(e.target.value);
  };

  const updateNewCoverImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCoverImageURL(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      if (!token) {
        window.alert("予期せぬ動作：トークンが取得できません。");
        return;
      }
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageURL: newCoverImageURL,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      requestBody.categoryIds.reverse();
      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const postResponse = await res.json();
      setIsSubmitting(false);
      router.push(`/posts/${postResponse.id}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の更新に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("本当にこの投稿記事を削除しますか？")) return;

    setIsSubmitting(true);
    if (!token) {
      window.alert("予期せぬ動作：トークンが取得できません。");
      return;
    }
    try {
      const requestUrl = `/api/admin/posts/${id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      setIsSubmitting(false);
      router.push("/admin/posts");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の削除に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  const addKeyword = (keyword: string) => {
    setSearchQuery((prev) => {
      if (!prev?.includes(keyword)) {
        return prev ? [...prev, keyword] : [keyword];
      }
      return prev;
    });
    setCheckableCategories(
      (prev) =>
        prev?.map((category) =>
          category.name === keyword ? { ...category, isSelect: true } : category
        ) || null
    );
  };

  const removeKeyword = (keyword: string) => {
    setSearchQuery((prev) => prev?.filter((k) => k !== keyword) || []);
    setCheckableCategories(
      (prev) =>
        prev?.map((category) =>
          category.name === keyword
            ? { ...category, isSelect: false }
            : category
        ) || null
    );
  };

  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!checkableCategories) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">投稿記事の編集</div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newCoverImageURL}
            onChange={updateNewCoverImageURL}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="検索語句を入力"
          className="mr-2 border p-2"
        />
        <div className="mt-2">
          <div className="mb-2 font-bold">キーワード一覧</div>
          <div className="flex flex-wrap">
            {searchQuery.map((keyword, index) => (
              <div key={index} className="relative mb-2 mr-2">
                <span className="rounded bg-gray-200 px-2 py-1 text-sm">
                  {keyword}
                </span>
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="absolute right-0 top-0 -mr-1 -mt-1 rounded-full bg-red-500 p-1 text-xs text-white opacity-50 hover:bg-red-600 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <div className="mb-2 font-bold">カテゴリ候補</div>
          <div className="flex flex-wrap">
            {getTopCategories(keyword).map((category, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addKeyword(category)}
                className="mb-2 mr-2 rounded bg-blue-200 px-2 py-1 text-sm hover:bg-blue-300"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed"
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
              "disabled:cursor-not-allowed"
            )}
            disabled={isSubmitting}
          >
            記事を削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
