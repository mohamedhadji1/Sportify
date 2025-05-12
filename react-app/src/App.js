import Navbar from "./components/Navbar";
import { HeroSection } from "./components/HeroSection"
import { CategoriesSection } from "./components/CategoriesSection"
import { FeaturesSection } from "./components/FeaturesSection"
import { Footer } from "./components/Footer"

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
