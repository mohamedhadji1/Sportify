import Container from "../ui/Container"
import SectionHeading from "../ui/SectionHeading"
import SportCard from "../ui/SportCard"

const CategoriesSection = () => {
  const categories = [
    {
      title: "Padel",
      description: "Book courts and join matches with other padel enthusiasts.",
      href: "#padel",
    },
    {
      title: "Football",
      description: "Find teams, book pitches, and organize football matches.",
      href: "#football",
    },
    {
      title: "Basketball",
      description: "Join basketball games and book courts for your team.",
      href: "#basketball",
    },
    {
      title: "Tennis",
      description: "Book tennis courts and find partners to play with.",
      href: "#tennis",
    },
  ]

  return (
    <section className="py-20 bg-black">
      <Container>
        <SectionHeading
          title="Sports Categories"
          subtitle="Explore different sports activities available on our platform"
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {categories.map((category) => (
            <SportCard
              key={category.title}
              title={category.title}
              description={category.description}
              href={category.href}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}

export default CategoriesSection
