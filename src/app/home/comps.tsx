"use client";

import { useState } from "react";
import mFetch from "@/utils/fetch";

const Comps = ({ text }: any) => {
  const [a, v] = useState("");
  // mFetch.get('https://api.oick.cn/api/bing')
  console.log(text,'text2')
  return <div>{text}</div>;
};

export default Comps;
