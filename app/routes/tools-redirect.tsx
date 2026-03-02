import { redirect } from "react-router";

export async function loader() {
  throw redirect("/template-studio");
}

export default function ToolsRedirect() {
  return null;
}
