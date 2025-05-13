import { HeroSection } from "./components/sections/HeroSection"
import Navbar from "./components/sections/Navbar"
import { FeaturesSection } from "./components/sections/FeaturesSection"
import { Footer } from "./components/sections/Footer"
import { CategoriesSection } from "./components/sections/CategoriesSection"

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <CategoriesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}

export default App
