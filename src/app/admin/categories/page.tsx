"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch categories from your API or data source
    const fetchCategories = async () => {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    };

    fetchCategories();
  }, []);

  const handleEdit = (id: number) => {
    // Navigate to the edit page
    router.push(`/admin/categories/${id}`);
  };

  const handleDelete = async (c: Category) => {
    // prettier-ignore
    if (!window.confirm(`カテゴリ「${c.name}」を本当に削除しますか？`)) {
      return;
    }
    try {
      const requestUrl = `/api/admin/categories/${c.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      // カテゴリの一覧ページを更新
      setCategories(categories.filter((category) => category.id !== c.id));
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    }
  };
  return (
    <div>
      <h1 style={{ fontSize: "2em", fontWeight: "bold" }}>カテゴリ一覧</h1>
      <div className="mb-4">
        <div className="flex justify-end">
          <Link
            href="/admin/categories/new"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            新規作成
          </Link>
        </div>
      </div>
      <ul>
        {categories.length === 0 ? (
          <div className="text-gray-500">
            （カテゴリは1個も作成されていません）
          </div>
        ) : (
          categories.map((category: Category) => (
            <li key={category.id} style={{ margin: "10px 0" }}>
              <div
                style={{
                  border: "1px solid #000",
                  borderRadius: "5px",
                  padding: "10px",
                  fontSize: "1em",
                }}
              >
                {category.name}
              </div>
              <button
                onClick={() => handleEdit(category.id)}
                style={{
                  marginRight: "5px",
                  padding: "3px 5px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.8em",
                  marginTop: "5px",
                }}
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(category)}
                style={{
                  padding: "3px 5px",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.8em",
                  marginTop: "5px",
                }}
              >
                削除
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default CategoriesPage;
