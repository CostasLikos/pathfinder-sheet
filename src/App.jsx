import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import CharacterPage from './pages/CharacterPage'
import { useThemeStore, applyTheme } from './store/themeStore'

export default function App() {
  const { activeTheme } = useThemeStore()

  useEffect(() => {
    applyTheme(activeTheme)
  }, [activeTheme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/character/:id" element={<CharacterPage />} />
      </Routes>
    </BrowserRouter>
  )
}
