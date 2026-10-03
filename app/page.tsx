import { redirect } from "next/navigation";

// The site starts on /page1
export default function Home() {
	redirect("/page1");
}
