import Container from "../ui/Container"
import SectionHeading from "../ui/SectionHeading"
import FeatureCard from "../ui/FeatureCard"
import { CheckCircleIcon } from "../ui/Icons"

const FeaturesSection = () => {
  const playerFeatures = [
    "Book courts and facilities",
    "Join teams and matches",
    "Track your performance",
    "Connect with other players",
  ]

  const managerFeatures = [
    "Manage facilities and bookings",
    "Organize tournaments and events",
    "Track team performance",
    "Handle payments and memberships",
  ]

  return (
    <section className="py-20 bg-gray-900">
      <Container>
        <SectionHeading
          title="Platform Features"
          subtitle="Our platform offers specialized features for both players and managers"
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <FeatureCard title="For Players">
            <ul className="space-y-4">
              {playerFeatures.map((feature) => (
                <li key={feature} className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-white mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </FeatureCard>

          <FeatureCard title="For Managers">
            <ul className="space-y-4">
              {managerFeatures.map((feature) => (
                <li key={feature} className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-white mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </FeatureCard>
        </div>
      </Container>
    </section>
  )
}

export default FeaturesSection
