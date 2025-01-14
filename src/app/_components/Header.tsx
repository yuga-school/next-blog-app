"use client";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import {
  faFish,
  faMagnifyingGlass,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { supabase } from "@/utils/supabase"; // ◀ 追加
import { useAuth } from "@/app/_hooks/useAuth"; // ◀ 追加
import { useRouter } from "next/navigation"; // ◀ 追加
const Header: React.FC = () => {
  const [form, setform] = useState("");
  const router = useRouter();
  const { isLoading, session } = useAuth();
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };
  return (
    <header>
      <div className="bg-slate-800 py-2">
        <div
          className={twMerge(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
          <div>
            <FontAwesomeIcon icon={faFish} className="mr-1" />
            Header
          </div>
          <div className="flex items-center space-x-6">
            {!isLoading &&
              (session ? (
                <button onClick={logout}>Logout</button>
              ) : (
                <Link href="/login">Login</Link>
              ))}
            <div id="searchForm" className="hidden">
              <input
                type="text"
                placeholder="Search..."
                className="mt-2 p-1 text-black"
                onChange={(e) => {
                  const query = e.target.value;
                  // Fetch and display search suggestions based on the query
                  console.log(query);
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Search..."
                className="mt-2 mr-2 p-1 text-black"
                id="searchInput"
                onChange={(e) => setform(e.target.value)}
              />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-1" />
              <Link href={`/${form}`}>検索</Link>
            </div>
            <div>
              <FontAwesomeIcon icon={faUser} className="mr-1" />
              <Link href="/about">About</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
