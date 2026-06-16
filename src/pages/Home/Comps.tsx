import { useState } from "react";
import mFetch from "@/utils/fetch";

const Comps = ({ text }: any) => {
  const [a, v] = useState("");
  console.log(text,'text2')
  return <div>{typeof text === 'object' ? JSON.stringify(text) : text}
  </div>;
};

export default Comps;
