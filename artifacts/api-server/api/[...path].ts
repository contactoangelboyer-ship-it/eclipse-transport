// The Vercel build generates this bundled entry before type-checking the function.
// @ts-expect-error The generated .mjs bundle intentionally has no declaration file.
import app from "../dist/vercel.mjs";

export default app;
