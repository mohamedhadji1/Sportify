import Button from "../ui/Button"
import Container from "../ui/Container"

const HeroSection = () => {
  return (
    <section className="py-20 bg-gray-900">
      <Container>
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-5xl font-bold mb-4">Your Ultimate Sports Platform</h1>
            <p className="text-gray-400 text-lg mb-8">
              Book courts, join teams, and manage sports activities all in one place. From padel to football, we've got
              you covered.
            </p>
            <div className="flex space-x-4">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Explore Sports
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-200 rounded-lg w-full aspect-video flex items-center justify-center">
              <span className="text-gray-500">Sports Hero Image</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default HeroSection
