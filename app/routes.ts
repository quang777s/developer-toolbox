import { type RouteConfig, index } from "@react-router/dev/routes";

const routes: RouteConfig = [
	index("routes/home.tsx"),
	{ path: "template-studio", file: "routes/tools.tsx" },
	{ path: "tools", file: "routes/tools-redirect.tsx" },
	{ path: "profit-calculator", file: "routes/pnl.tsx" },
	{ path: "curl", file: "routes/curl.tsx" },
];

export default routes;
