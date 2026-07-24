import { Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { routes } from "./pages.config.ts"

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Routes>
          {routes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
