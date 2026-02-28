import { type RouteConfig, index } from "@react-router/dev/routes";

const routes: RouteConfig = [
	index("routes/home.tsx"),
	{ path: "tools", file: "routes/tools.tsx" },
	{ path: "curl", file: "routes/curl.tsx" },
];

export default routes;
