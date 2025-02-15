import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@prisma/client";
import { supabase } from "@/utils/supabase";

type RequestBody = {
  name: string;
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const token = req.headers.get("Authorization") ?? "";
  console.log("Token:", token);

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error("認証エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  try {
    const id = params.id;
    console.log("カテゴリID:", id);

    const { name }: RequestBody = await req.json();
    console.log("新しいカテゴリ名:", name);

    const category: Category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("カテゴリ更新エラー:", error);
    return NextResponse.json(
      { error: "カテゴリの名前変更に失敗しました" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const token = req.headers.get("Authorization") ?? "";
  console.log("Token:", token);

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error("認証エラー:", error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  try {
    const id = params.id;
    console.log("削除するカテゴリID:", id);

    const category: Category = await prisma.category.delete({ where: { id } });
    return NextResponse.json({ msg: `「${category.name}」を削除しました。` });
  } catch (error) {
    console.error("カテゴリ削除エラー:", error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 }
    );
  }
};
